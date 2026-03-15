/**
 * 環境変数を読み込み、アプリ全体で使う設定値を集約する。
 * - 文字列のままでは扱いづらい値を `Number(...)` で型変換
 * - デフォルト値をここで定義して、他ファイルの分岐を減らす
 *
 * 新しい設定を追加するときは、まずこのファイルに項目を追加する。
 */
const path = require('path');
require('dotenv').config({ 
    path: path.resolve(__dirname, '../../.env'),
    override: true 
});

const env = {
    // 予備のデフォルト値（.envがない場合のフォールバック）
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://fcccnvzfiywlmiyyvlrb.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY2NudnpmaXl3bG1peXl2bHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQzNTk4MiwiZXhwIjoyMDg5MDExOTgyfQ.H_00TPMMwQe5CkxHBJpiIGXE4Cv6QvxZV3JwL0LSCu4',
    DEFAULT_USER_ID: process.env.DEFAULT_USER_ID || 'b186ec48-06dd-4844-b29d-ab987e2b5989',
    DEFAULT_SCORE_BASE: Number(process.env.DEFAULT_SCORE_BASE || 1000),
    SCORE_RECOVERY_PER_DONE_TODO: Number(process.env.SCORE_RECOVERY_PER_DONE_TODO || 50),
    SCORE_BONUS_PER_CREATED_TODO: Number(process.env.SCORE_BONUS_PER_CREATED_TODO || 10),
    SCORE_FIXED_GOAL_PRIMARY: Number(process.env.SCORE_FIXED_GOAL_PRIMARY || 3),
    SCORE_FIXED_GOAL_SECONDARY: Number(process.env.SCORE_FIXED_GOAL_SECONDARY || 5),
    SCORE_PENALTY_PER_SECOND: Number(process.env.SCORE_PENALTY_PER_SECOND || 1),
    HOURLY_WAGE_JPY: Number(process.env.HOURLY_WAGE_JPY || 1200),
    BTC_PRICE_CACHE_MINUTES: Number(process.env.BTC_PRICE_CACHE_MINUTES || 10),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
};

module.exports = { env };
