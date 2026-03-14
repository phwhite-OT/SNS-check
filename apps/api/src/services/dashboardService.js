/**
 * ダッシュボード表示用データを集約するサービス層。
 * - Todo/Blacklist/TabSessionを並列取得
 * - `timeData` と `totalTimeSeconds` を集計
 * - 設定値に基づいてスコアを算出
 */
const { env } = require('../config/env');
const todosService = require('./todosService');
const blacklistService = require('./blacklistService');
const tabSessionsRepository = require('../repositories/tabSessionsRepository');
const { buildAssetMetrics } = require('./assetValuationService');

// ダッシュボード表示に必要なデータをまとめて取得する関数
async function getDashboard(userId) {
    const [todos, blacklist, sessions] = await Promise.all([
        todosService.getTodos(userId),
        blacklistService.getBlacklist(userId),
        tabSessionsRepository.listTabSessionsByUser(userId),
    ]);

    const timeData = sessions.reduce((acc, row) => {
        const key = row.domain;
        const value = Number(row.duration_sec || 0);
        acc[key] = (acc[key] || 0) + value;
        return acc;
    }, {});

    const totalTimeSeconds = Object.values(timeData).reduce((sum, sec) => sum + sec, 0);
    const doneCount = todos.filter((todo) => todo.completed).length;

    const score =
        env.DEFAULT_SCORE_BASE +
        doneCount * env.SCORE_RECOVERY_PER_DONE_TODO -
        totalTimeSeconds * env.SCORE_PENALTY_PER_SECOND;

    let assets;
    try {
        assets = await buildAssetMetrics(userId, totalTimeSeconds);
    } catch (error) {
        console.error('Failed to build asset metrics:', error);
        const fallbackJpy = Math.floor((totalTimeSeconds / 3600) * env.HOURLY_WAGE_JPY);
        assets = {
            jpy: fallbackJpy,
            btc: 0,
            btcPriceJpy: null,
            btcPriceSource: 'unavailable',
            btcPriceFetchedAt: null,
        };
    }

    const siteBreakdown = Object.entries(timeData).map(([domain, seconds]) => ({
        domain,
        timeSpent: Math.floor(seconds / 60)
    }));

    return {
        score,
        history: [{ timestamp: Date.now(), score }],
        todos,
        blacklist,
        timeData,
        siteBreakdown,
        totalTimeSeconds,
        assets,
    };
}

module.exports = {
    getDashboard,
};
