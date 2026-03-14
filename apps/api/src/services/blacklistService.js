const alertRulesRepository = require('../repositories/alertRulesRepository');
const { normalizeDomain, mapAlertRuleRowToBlacklistItem } = require('../models/blacklistModel');
const { httpError } = require('../utils/httpError');

const DEFAULT_BLACKLIST = [
    'youtube.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'tiktok.com',
];

async function ensureDefaultBlacklist(userId) {
    const current = await alertRulesRepository.listAlertRulesByUser(userId);
    const currentSet = new Set(current.map((item) => item.target_domain));
    const missing = DEFAULT_BLACKLIST.filter((domain) => !currentSet.has(domain));

    for (const domain of missing) {
        await alertRulesRepository.insertAlertRule(userId, domain, 900);
    }
}

async function getBlacklist(userId) {
    await ensureDefaultBlacklist(userId);
    const rows = await alertRulesRepository.listAlertRulesByUser(userId);
    return rows.map(mapAlertRuleRowToBlacklistItem);
}

async function addBlacklist(userId, domain) {
    const normalized = normalizeDomain(domain);
    if (!normalized) {
        throw httpError(400, 'Domain is required');
    }

    await alertRulesRepository.insertAlertRule(userId, normalized, 900);
    const rows = await alertRulesRepository.listAlertRulesByUser(userId);
    return { success: true, blacklist: rows.map(mapAlertRuleRowToBlacklistItem) };
}

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
