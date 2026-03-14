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
        .select('id, domain, duration_sec, created_at')
        .single();

    if (error) throw error;
    return data;
}

// ユーザーのタブセッションを取得
async function listTabSessionsByUser(userId) {
    const { data, error } = await supabase
        .from('tab_sessions')
        .select('domain, duration_sec, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

module.exports = {
    insertTabSession,
    listTabSessionsByUser,
};
