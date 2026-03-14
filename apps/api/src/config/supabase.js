/**
 * Supabaseクライアントの初期化専用ファイル。
 * - `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を使って接続を作成
 * - 認証セッション永続化を無効化してサーバー用途に最適化
 *
 * DBアクセスは repository 層からこの `supabase` を参照して行う。
 */
const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を .env に設定してください。');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

module.exports = { supabase };
