/**
 * ダッシュボードAPIのcontroller。
 * - 集約済みダッシュボード情報をservice層から取得して返却する
 */
const dashboardService = require('../services/dashboardService');
const { httpError } = require('../utils/httpError');

const INVALID_DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// `x-user-id` ヘッダーからユーザーIDを取得。未指定の場合は `defaultUserId` を使用
function getUserId(req) {
    const userId = req.header('x-user-id') || req.app.locals.defaultUserId;
    if (!userId || userId === INVALID_DEFAULT_USER_ID) {
        throw httpError(401, 'x-user-id を指定してください（有効な profiles.id が必要です）');
    }
    return userId;
}

// ダッシュボード情報を取得して返す
async function getDashboard(req, res) {
    const dashboard = await dashboardService.getDashboard(getUserId(req));
    res.json(dashboard);
}

module.exports = {
    getDashboard,
};
