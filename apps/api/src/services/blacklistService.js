/**
 * Blacklist機能の業務ロジックを担当するサービス層。
 * - 初回取得時にデフォルトドメインを補完
 * - 追加/削除時の入力検証と結果整形を実施
 */
const alertRulesRepository = require('../repositories/alertRulesRepository');
const { normalizeDomain, mapAlertRuleRowToBlacklistItem } = require('../models/blacklistModel');
const { httpError } = require('../utils/httpError');

// デフォルトでブラックリストに入れるドメイン
const DEFAULT_BLACKLIST = [
    'youtube.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'tiktok.com',
];

// ユーザーのブラックリストにデフォルトドメインが含まれているか確認し、なければ追加する
async function ensureDefaultBlacklist(userId) {
    const current = await alertRulesRepository.listAlertRulesByUser(userId);
    const currentSet = new Set(current.map((item) => item.target_domain));
    const missing = DEFAULT_BLACKLIST.filter((domain) => !currentSet.has(domain));

    for (const domain of missing) {
        await alertRulesRepository.insertAlertRule(userId, domain, 900);
    }
}


// ブラックリストの一覧を取得
async function getBlacklist(userId) {
    await ensureDefaultBlacklist(userId);
    const rows = await alertRulesRepository.listAlertRulesByUser(userId);
    return rows.map(mapAlertRuleRowToBlacklistItem);
}


// ブラックリストにドメインを追加
async function addBlacklist(userId, domain) {
    const normalized = normalizeDomain(domain);
    if (!normalized) {
        throw httpError(400, 'Domain is required');
    }

    await alertRulesRepository.insertAlertRule(userId, normalized, 900);
    const rows = await alertRulesRepository.listAlertRulesByUser(userId);
    return { success: true, blacklist: rows.map(mapAlertRuleRowToBlacklistItem) };
}

// ブラックリストからドメインを削除
async function removeBlacklist(userId, domain) {
    const normalized = normalizeDomain(domain);
    if (!normalized) {
        throw httpError(400, 'Domain is required');
    }

    await alertRulesRepository.deleteAlertRuleByDomain(userId, normalized);
    const rows = await alertRulesRepository.listAlertRulesByUser(userId);
    return { success: true, blacklist: rows.map(mapAlertRuleRowToBlacklistItem) };
}

module.exports = {
    getBlacklist,
    addBlacklist,
    removeBlacklist,
};
