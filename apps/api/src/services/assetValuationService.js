/**
 * BTC価格取得と浪費時間の金額換算を担当するサービス層。
 */
const { env } = require('../config/env');
const btcPriceHistoryRepository = require('../repositories/btcPriceHistoryRepository');
const wasteCostSnapshotsRepository = require('../repositories/wasteCostSnapshotsRepository');
const profilesRepository = require('../repositories/profilesRepository');

async function fetchBtcJpyFromCoinGecko() {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=jpy');
    if (!res.ok) {
        throw new Error(`CoinGecko fetch failed: ${res.status}`);
    }

    const json = await res.json();
    const value = Number(json?.bitcoin?.jpy || 0);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error('Invalid BTC price from CoinGecko');
    }

    return value;
}

function isFreshEnough(isoDate, ttlMinutes) {
    if (!isoDate) return false;
    const fetchedAt = new Date(isoDate).getTime();
    if (!Number.isFinite(fetchedAt)) return false;
    const ageMs = Date.now() - fetchedAt;
    return ageMs <= ttlMinutes * 60 * 1000;
}

async function getBtcPriceJpy() {
    const latest = await btcPriceHistoryRepository.getLatestBtcPrice();

    if (latest && isFreshEnough(latest.fetched_at, env.BTC_PRICE_CACHE_MINUTES)) {
        return {
            source: latest.source,
            priceJpy: Number(latest.price_jpy),
            fetchedAt: latest.fetched_at,
        };
    }

    try {
        const fetchedPrice = await fetchBtcJpyFromCoinGecko();
        const fetchedAt = new Date().toISOString();
        const row = await btcPriceHistoryRepository.insertBtcPrice('coingecko', fetchedPrice, fetchedAt);
        return {
            source: row.source,
            priceJpy: Number(row.price_jpy),
            fetchedAt: row.fetched_at,
        };
    } catch (e) {
        if (latest) {
            return {
                source: `${latest.source}:stale-fallback`,
                priceJpy: Number(latest.price_jpy),
                fetchedAt: latest.fetched_at,
            };
        }
        throw e;
    }
}

function toSafeHourlyWage(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return Math.max(1, Math.floor(Number(fallback) || Number(env.HOURLY_WAGE_JPY) || 1200));
    }
    return Math.max(1, Math.floor(parsed));
}

async function buildAssetMetrics(userId, totalTimeSeconds, options = {}) {
    const resolvedHourlyWage = options.hourlyWageJpy !== undefined
        ? toSafeHourlyWage(options.hourlyWageJpy, env.HOURLY_WAGE_JPY)
        : await profilesRepository.getHourlyWageJpy(userId, env.HOURLY_WAGE_JPY);

    const hourlyWageJpy = toSafeHourlyWage(resolvedHourlyWage, env.HOURLY_WAGE_JPY);
    const lostAmountJpy = Math.floor((totalTimeSeconds / 3600) * hourlyWageJpy);

    const btc = await getBtcPriceJpy();
    const lostAmountBtc = btc.priceJpy > 0 ? Number((lostAmountJpy / btc.priceJpy).toFixed(8)) : 0;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const periodEnd = now.toISOString();

    const profileExists = await profilesRepository.ensureProfile(userId);
    if (profileExists) {
        await wasteCostSnapshotsRepository.insertWasteCostSnapshot({
            user_id: userId,
            period_start: periodStart,
            period_end: periodEnd,
            wasted_seconds: totalTimeSeconds,
            btc_price_jpy: btc.priceJpy,
            lost_amount_jpy: lostAmountJpy,
        });
    } else {
        console.warn(`Skipping waste cost snapshot for user ${userId} due to missing profile.`);
    }

    return {
        jpy: lostAmountJpy,
        btc: lostAmountBtc,
        btcPriceJpy: btc.priceJpy,
        btcPriceSource: btc.source,
        btcPriceFetchedAt: btc.fetchedAt,
        hourlyWageJpy,
    };
}

module.exports = {
    buildAssetMetrics,
};
