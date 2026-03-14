require('dotenv').config();

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
