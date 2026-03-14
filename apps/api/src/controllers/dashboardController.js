/**
 * ダッシュボードAPIのcontroller。
 * - 集約済みダッシュボード情報をservice層から取得して返却する
 */
const dashboardService = require('../services/dashboardService');

// `x-user-id` ヘッダーからユーザーIDを取得。未指定の場合は `defaultUserId` を使用
function getUserId(req) {
    return req.header('x-user-id') || req.app.locals.defaultUserId;
}

// ダッシュボード情報を取得して返す
async function getDashboard(req, res) {
    const dashboard = await dashboardService.getDashboard(getUserId(req));
    res.json(dashboard);
}

module.exports = {
    getDashboard,
};
