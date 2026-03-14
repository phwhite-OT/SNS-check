const timeTrackingService = require('../services/timeTrackingService');
const dashboardService = require('../services/dashboardService');

function getUserId(req) {
    return req.header('x-user-id') || req.app.locals.defaultUserId;
}

async function postTime(req, res) {
    const userId = getUserId(req);
    await timeTrackingService.addTime(userId, req.body?.site, req.body?.time);

    const dashboard = await dashboardService.getDashboard(userId);
    res.json({ success: true, score: dashboard.score, timeData: dashboard.timeData });
}

module.exports = {
    postTime,
};
