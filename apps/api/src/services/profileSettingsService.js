/**
 * ユーザー設定（時給）を扱うサービス層。
 */
const { env } = require('../config/env');
const profilesRepository = require('../repositories/profilesRepository');
const { httpError } = require('../utils/httpError');

const HOURLY_WAGE_MIN = 1;
const HOURLY_WAGE_MAX = 1000000;

function normalizeHourlyWageInput(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;

    const rounded = Math.floor(parsed);
    if (rounded < HOURLY_WAGE_MIN || rounded > HOURLY_WAGE_MAX) {
        return null;
    }

    return rounded;
}

async function getHourlyWageSetting(userId) {
    const hourlyWageJpy = await profilesRepository.getHourlyWageJpy(userId, env.HOURLY_WAGE_JPY);
    return {
        hourlyWageJpy,
    };
}

async function updateHourlyWageSetting(userId, input) {
    const normalized = normalizeHourlyWageInput(input);
    if (!normalized) {
        throw httpError(400, `hourlyWageJpy は ${HOURLY_WAGE_MIN}〜${HOURLY_WAGE_MAX} の整数で指定してください`);
    }

    const hourlyWageJpy = await profilesRepository.setHourlyWageJpy(userId, normalized, env.HOURLY_WAGE_JPY);

    return {
        success: true,
        hourlyWageJpy,
    };
}

module.exports = {
    getHourlyWageSetting,
    updateHourlyWageSetting,
};
