/**
 * ダッシュボードAPIのcontroller。
 * - 集約済みダッシュボード情報をservice層から取得して返却する
 */
const dashboardService = require('../services/dashboardService');

function getUserId(req) {
    return req.header('x-user-id') || req.app.locals.defaultUserId;
}

async function getDashboard(req, res) {
    const dashboard = await dashboardService.getDashboard(getUserId(req));
    res.json(dashboard);
}

module.exports = {
    getDashboard,
};
