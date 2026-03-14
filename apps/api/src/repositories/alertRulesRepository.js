/**
 * `alert_rules` テーブル専用のデータアクセス層(repository)。
 * - ブラックリスト設定の取得・追加・削除を担当
 * - `enabled=true` の条件を使って有効なルールのみ返す
 */
const { supabase } = require('../config/supabase');

// ユーザーのアラートルールを取得
async function listAlertRulesByUser(userId) {
    const { data, error } = await supabase
        .from('alert_rules')
        .select('id, target_domain, threshold_sec, enabled, created_at')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

// 新しいアラートルールを追加
async function insertAlertRule(userId, targetDomain, thresholdSec = 900) {
    const { data, error } = await supabase
        .from('alert_rules')
        .insert({
            user_id: userId,
            target_domain: targetDomain,
            threshold_sec: thresholdSec,
            enabled: true,
        })
        .select('id, target_domain, threshold_sec, enabled, created_at')
        .single();

    if (error) throw error;
    return data;
}

// アラートルールを削除(論理削除で `enabled=false` にする)
async function deleteAlertRuleByDomain(userId, targetDomain) {
    const { error } = await supabase
        .from('alert_rules')
        .update({ enabled: false })
        .eq('user_id', userId)
        .eq('target_domain', targetDomain);

    if (error) throw error;
}

module.exports = {
    listAlertRulesByUser,
    insertAlertRule,
    deleteAlertRuleByDomain,
};
