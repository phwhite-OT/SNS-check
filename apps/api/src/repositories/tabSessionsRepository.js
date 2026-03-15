/**
 * `tab_sessions` テーブル専用のデータアクセス層(repository)。
 * - 拡張機能から送られた滞在ログをINSERT
 * - ダッシュボード集計用にユーザー別セッションを取得
 */
const { supabase } = require('../config/supabase');


// 新しいタブセッションを記録
async function insertTabSession(session) {
    const { data, error } = await supabase
        .from('tab_sessions')
        .insert(session)
        .select('id, domain, duration_sec, started_at, created_at')
        .single();

    if (error) throw error;
    return data;
}
// 大量セッションを一括記録
async function insertTabSessionsBulk(sessions) {
    if (sessions.length === 0) return [];

    const { data, error } = await supabase
        .from('tab_sessions')
        .insert(sessions)
        .select();

    if (error) {
        console.error('Bulk insert failed:', error.message);
        throw error;
    }
    return data;
}

// ユーザーのタブセッションを取得
async function listTabSessionsByUser(userId) {
    const { data, error } = await supabase
        .from('tab_sessions')
        .select('domain, duration_sec, started_at, created_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

// 指定ユーザー・指定ドメインの「今日」の滞在秒数合計を取得
async function getTodayDurationByDomain(userId, domain, dayStartIso) {
    const { data, error } = await supabase
        .from('tab_sessions')
        .select('duration_sec')
        .eq('user_id', userId)
        .eq('domain', domain)
        .gte('started_at', dayStartIso);

    if (error) throw error;
    return (data || []).reduce((sum, row) => sum + Number(row.duration_sec || 0), 0);
}

module.exports = {
    insertTabSession,
    insertTabSessionsBulk,
    listTabSessionsByUser,
    getTodayDurationByDomain,
};
