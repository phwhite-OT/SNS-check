/**
 * Calendar Events APIのcontroller。
 */
const calendarEventsService = require('../services/calendarEventsService');
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


// カレンダーイベントの一覧を取得
async function getCalendarEvents(req, res) {
    const data = await calendarEventsService.getCalendarEvents(getUserId(req), req.query);
    res.json(data);
}

// カレンダーイベントを追加
async function createCalendarEvent(req, res) {
    const event = await calendarEventsService.addCalendarEvent(getUserId(req), req.body);
    res.json(event);
}

// カレンダーイベントを更新
async function updateCalendarEvent(req, res) {
    const event = await calendarEventsService.editCalendarEvent(getUserId(req), req.params.id, req.body);
    res.json(event);
}


// カレンダーイベントを削除
async function deleteCalendarEvent(req, res) {
    const result = await calendarEventsService.removeCalendarEvent(getUserId(req), req.params.id);
    res.json(result);
}

module.exports = {
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
};
