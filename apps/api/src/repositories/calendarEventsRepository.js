/**
 * `calendar_events` テーブル専用のデータアクセス層(repository)。
 */
const { supabase } = require('../config/supabase');

async function listCalendarEventsByUser(userId, from, to) {
    let query = supabase
        .from('calendar_events')
        .select('id, title, start_at, end_at, all_day, created_at')
        .eq('user_id', userId)
        .order('start_at', { ascending: true });

    if (from) {
        query = query.gte('start_at', from);
    }
    if (to) {
        query = query.lte('start_at', to);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

async function createCalendarEvent(userId, payload) {
    const { data, error } = await supabase
        .from('calendar_events')
        .insert({
            user_id: userId,
            title: payload.title,
            start_at: payload.start_at,
            end_at: payload.end_at,
            all_day: payload.all_day,
        })
        .select('id, title, start_at, end_at, all_day, created_at')
        .single();

    if (error) throw error;
    return data;
}

async function findCalendarEventById(userId, id) {
    const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, start_at, end_at, all_day, created_at')
        .eq('user_id', userId)
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data || null;
}

async function updateCalendarEvent(userId, id, update) {
    const { data, error } = await supabase
        .from('calendar_events')
        .update(update)
        .eq('user_id', userId)
        .eq('id', id)
        .select('id, title, start_at, end_at, all_day, created_at')
        .single();

    if (error) throw error;
    return data;
}

async function deleteCalendarEvent(userId, id) {
    const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('id', id);

    if (error) throw error;
}

module.exports = {
    listCalendarEventsByUser,
    createCalendarEvent,
    findCalendarEventById,
    updateCalendarEvent,
    deleteCalendarEvent,
};
