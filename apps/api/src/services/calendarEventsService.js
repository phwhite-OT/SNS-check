/**
 * カレンダー機能の業務ロジックを担当するサービス層。
 */
const { httpError } = require('../utils/httpError');
const calendarEventsRepository = require('../repositories/calendarEventsRepository');
const {
    mapCalendarEventRowToResponse,
    mapCalendarEventPatchToUpdate,
} = require('../models/calendarEventModel');


// startAt と endAt の妥当性を検証。エラーがあれば httpError を投げる
function validateDateOrder(startAt, endAt) {
    if (!startAt || !endAt) {
        throw httpError(400, 'startAt and endAt are required');
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw httpError(400, 'startAt/endAt must be valid datetime');
    }

    if (start > end) {
        throw httpError(400, 'startAt must be before endAt');
    }
}

// ドメインに対する今日の利用時間とアラート状態を計算して返す
async function getCalendarEvents(userId, query = {}) {
    const rows = await calendarEventsRepository.listCalendarEventsByUser(userId, query.from, query.to);
    return rows.map(mapCalendarEventRowToResponse);
}

// 新しいカレンダーイベントを追加。入力の妥当性を検証し、作成後のイベント情報を返す
async function addCalendarEvent(userId, payload = {}) {
    const title = String(payload.title || '').trim();
    if (!title) {
        throw httpError(400, 'title is required');
    }

    validateDateOrder(payload.startAt, payload.endAt);

    const row = await calendarEventsRepository.createCalendarEvent(userId, {
        title,
        start_at: payload.startAt,
        end_at: payload.endAt,
        all_day: Boolean(payload.allDay),
    });

    return mapCalendarEventRowToResponse(row);
}


// ドメインに対する今日の利用時間とアラート状態を計算して返す
async function editCalendarEvent(userId, id, patch = {}) {
    const update = mapCalendarEventPatchToUpdate(patch);

    if (update.start_at !== undefined || update.end_at !== undefined) {
        const existing = await calendarEventsRepository.findCalendarEventById(userId, id);
        if (!existing) {
            throw httpError(404, 'Calendar event not found');
        }

        validateDateOrder(
            update.start_at ?? existing.start_at,
            update.end_at ?? existing.end_at
        );
    }

    if (Object.keys(update).length === 0) {
        throw httpError(400, 'No update fields provided');
    }

    const row = await calendarEventsRepository.updateCalendarEvent(userId, id, update);
    return mapCalendarEventRowToResponse(row);
}


// カレンダーイベントを削除
async function removeCalendarEvent(userId, id) {
    await calendarEventsRepository.deleteCalendarEvent(userId, id);
    return { success: true };
}

module.exports = {
    getCalendarEvents,
    addCalendarEvent,
    editCalendarEvent,
    removeCalendarEvent,
};
