/**
 * 滞在時間トラッキングの業務ロジックを担当するサービス層。
 * - `{ site, time }` のバリデーション
 * - `started_at` / `ended_at` を計算してセッションとして保存
 */
const { httpError } = require('../utils/httpError');
const tabSessionsRepository = require('../repositories/tabSessionsRepository');

async function addTime(userId, site, time) {
    const domain = String(site || '').trim().toLowerCase();
    const durationSec = Number(time || 0);

    if (!domain) {
        throw httpError(400, 'site is required');
    }
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
        throw httpError(400, 'time must be a positive number');
    }

    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - durationSec * 1000);

    await tabSessionsRepository.insertTabSession({
        user_id: userId,
        domain,
        duration_sec: Math.floor(durationSec),
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        is_waste: true,
    });

    return { success: true };
}

module.exports = {
    addTime,
};
