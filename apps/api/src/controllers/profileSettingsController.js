/**
 * ユーザー設定（時給）のAPI controller。
 */
const profileSettingsService = require('../services/profileSettingsService');
const { httpError } = require('../utils/httpError');

const INVALID_DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

function getUserId(req) {
    const userId = req.header('x-user-id') || req.app.locals.defaultUserId;
    if (!userId || userId === INVALID_DEFAULT_USER_ID) {
        throw httpError(401, 'x-user-id を指定してください（有効な profiles.id が必要です）');
    }
    return userId;
}

async function getHourlyWage(req, res) {
    const result = await profileSettingsService.getHourlyWageSetting(getUserId(req));
    res.json(result);
}

async function updateHourlyWage(req, res) {
    const result = await profileSettingsService.updateHourlyWageSetting(
        getUserId(req),
        req.body?.hourlyWageJpy
    );
    res.json(result);
}

module.exports = {
    getHourlyWage,
    updateHourlyWage,
};
