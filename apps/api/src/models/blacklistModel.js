/**
 * Blacklistデータの整形ルールを集約するモデル層。
 * - ドメインをtrim + 小文字化して比較しやすくする
 * - `alert_rules` の行をAPIの `blacklist` 形式へ変換する
 * - 表示名(サイト名)の規約をここで統一する
 */
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
