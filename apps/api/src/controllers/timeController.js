/**
 * 時間計測APIのcontroller。
 * - 拡張機能からの滞在時間を受信して保存
 * - 保存後に最新のスコアと時間集計を返してUI同期を容易にする
 */
const timeTrackingService = require('../services/timeTrackingService');
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
