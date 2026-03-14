function normalizeDomain(domain) {
    return String(domain || '').trim().toLowerCase();
}

function toSiteName(domain, name) {
    if (name && String(name).trim()) {
        return String(name).trim().toLowerCase();
    }
    const d = normalizeDomain(domain);
    return d.split('.')[0] || d;
}

function mapAlertRuleRowToBlacklistItem(row) {
    return {
        domain: row.target_domain,
        name: toSiteName(row.target_domain),
    };
}

module.exports = {
    normalizeDomain,
    toSiteName,
    mapAlertRuleRowToBlacklistItem,
};
