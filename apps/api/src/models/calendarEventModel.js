/**
 * Calendar EventのDB形式とAPIレスポンス形式を相互変換するモデル層。
 */
function mapCalendarEventRowToResponse(row) {
    return {
        id: row.id,
        title: row.title,
        startAt: row.start_at,
        endAt: row.end_at,
        allDay: Boolean(row.all_day),
        createdAt: row.created_at,
    };
}

function mapCalendarEventPatchToUpdate(patch) {
    const update = {};

    if (typeof patch.title === 'string') {
        update.title = patch.title.trim();
    }
    if (patch.startAt !== undefined) {
        update.start_at = patch.startAt;
    }
    if (patch.endAt !== undefined) {
        update.end_at = patch.endAt;
    }
    if (patch.allDay !== undefined) {
        update.all_day = Boolean(patch.allDay);
    }

    return update;
}

module.exports = {
    mapCalendarEventRowToResponse,
    mapCalendarEventPatchToUpdate,
};
