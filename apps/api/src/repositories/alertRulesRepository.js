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

// ユーザーがルールを一度でも作成したことがあるかどうかを判定
async function hasAnyAlertRuleByUser(userId) {
    const { count, error } = await supabase
        .from('alert_rules')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', userId);

    if (error) throw error;
    return Number(count || 0) > 0;
}

// 新しいアラートルールを追加
async function insertAlertRule(userId, targetDomain, thresholdSec = 900) {
    // 既存の論理削除済みルールがあれば再有効化する
    const { data: updatedRows, error: updateError } = await supabase
        .from('alert_rules')
        .update({
            threshold_sec: thresholdSec,
            enabled: true,
        })
        .eq('user_id', userId)
        .eq('target_domain', targetDomain)
        .select('id, target_domain, threshold_sec, enabled, created_at')
        .order('created_at', { ascending: false });

    if (updateError) throw updateError;
    if (Array.isArray(updatedRows) && updatedRows.length > 0) {
        return updatedRows[0];
    }

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
    hasAnyAlertRuleByUser,
    insertAlertRule,
    deleteAlertRuleByDomain,
};
