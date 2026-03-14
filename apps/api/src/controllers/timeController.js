/**
 * 時間計測APIのcontroller。
 * - 拡張機能からの滞在時間を受信して保存
 * - 保存後に最新のスコアと時間集計を返してUI同期を容易にする
 */
const timeTrackingService = require('../services/timeTrackingService');
const dashboardService = require('../services/dashboardService');

// `x-user-id` ヘッダーからユーザーIDを取得。未指定の場合は `defaultUserId` を使用
function getUserId(req) {
    return req.header('x-user-id') || req.app.locals.defaultUserId;
}

// 時間計測データを受信して保存し、最新のダッシュボード情報を返す
async function postTime(req, res) {
    const userId = getUserId(req);
    await timeTrackingService.addTime(userId, req.body?.site, req.body?.time);

    const dashboard = await dashboardService.getDashboard(userId);
    res.json({ success: true, score: dashboard.score, timeData: dashboard.timeData });
}

module.exports = {
    postTime,
};
