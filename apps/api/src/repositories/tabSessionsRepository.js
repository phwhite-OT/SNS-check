const { supabase } = require('../config/supabase');

async function insertTabSession(session) {
    const { data, error } = await supabase
        .from('tab_sessions')
        .insert(session)
        .select('id, domain, duration_sec, created_at')
        .single();

    if (error) throw error;
    return data;
}

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
