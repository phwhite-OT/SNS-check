/**
 * 環境変数を読み込み、アプリ全体で使う設定値を集約する。
 * - 文字列のままでは扱いづらい値を `Number(...)` で型変換
 * - デフォルト値をここで定義して、他ファイルの分岐を減らす
 *
 * 新しい設定を追加するときは、まずこのファイルに項目を追加する。
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
    PORT: Number(process.env.PORT || 3001),
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    DEFAULT_USER_ID: process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000',
    DEFAULT_SCORE_BASE: Number(process.env.DEFAULT_SCORE_BASE || 1000),
    SCORE_RECOVERY_PER_DONE_TODO: Number(process.env.SCORE_RECOVERY_PER_DONE_TODO || 50),
    SCORE_PENALTY_PER_SECOND: Number(process.env.SCORE_PENALTY_PER_SECOND || 1),
};

module.exports = { env };
