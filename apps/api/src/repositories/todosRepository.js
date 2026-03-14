const { supabase } = require('../config/supabase');

async function listTodosByUser(userId) {
    const { data, error } = await supabase
        .from('todos')
        .select('id, title, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

async function createTodo(userId, title) {
    const { data, error } = await supabase
        .from('todos')
        .insert({
            user_id: userId,
            title,
            status: 'todo',
        })
        .select('id, title, status, created_at')
        .single();

    if (error) throw error;
    return data;
}

async function updateTodo(userId, id, update) {
    const { data, error } = await supabase
        .from('todos')
        .update(update)
        .eq('user_id', userId)
        .eq('id', id)
        .select('id, title, status, created_at')
        .single();

    if (error) throw error;
    return data;
}

async function deleteTodo(userId, id) {
    const { error } = await supabase
        .from('todos')
        .delete()
        .eq('user_id', userId)
        .eq('id', id);

    if (error) throw error;
}

module.exports = {
    listTodosByUser,
    createTodo,
    updateTodo,
    deleteTodo,
};
