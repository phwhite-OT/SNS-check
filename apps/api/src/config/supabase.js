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
