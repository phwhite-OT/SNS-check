/**
 * `todos` テーブル専用のデータアクセス層(repository)。
 * - SupabaseへのSELECT/INSERT/UPDATE/DELETEを担当
 * - `user_id` 条件を必ず付け、ユーザー単位のデータ境界を維持
 *
 * 業務ロジック(入力検証や計算)はここでは行わない。
 */
const { supabase } = require('../config/supabase');


// ユーザーのTODOリストを取得
async function listTodosByUser(userId) {
    const { data, error } = await supabase
        .from('todos')
        .select('id, title, status, created_at, description, priority, due_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

// 新しいTODOを作成
async function createTodo(userId, todoData) {
    const { title, description, priority, due_date, status } = todoData;
    
    const { data, error } = await supabase
        .from('todos')
        .insert({
            user_id: userId,
            title,
            description: description || '',
            priority: priority || 1,
            due_date: due_date || null,
            status: status || 'todo',
        })
        .select('id, title, status, created_at, description, priority, due_date')
        .single();

    if (error) throw error;
    return data;
}



// TODOを更新
async function updateTodo(userId, id, update) {
    const { data, error } = await supabase
        .from('todos')
        .update(update)
        .eq('user_id', userId)
        .eq('id', id)
        .select('id, title, status, created_at, description, priority, due_date')
        .single();

    if (error) throw error;
    return data;
}

// TODOを削除
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
