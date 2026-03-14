/**
 * Todo機能の業務ロジックを担当するサービス層。
 * - 入力値を検証し、不正ならHTTPエラーを投げる
 * - repository層でDB操作し、modelでレスポンス形式へ変換
 */
const { httpError } = require('../utils/httpError');
const todosRepository = require('../repositories/todosRepository');
const profilesRepository = require('../repositories/profilesRepository');
const { mapTodoRowToResponse, mapTodoPatchToUpdate } = require('../models/todoModel');

// ユーザーのTodo一覧を取得
async function getTodos(userId) {
    const rows = await todosRepository.listTodosByUser(userId);
    return rows.map(mapTodoRowToResponse);
}

// 新しいTodoを追加
async function addTodo(userId, todoData) {
    const title = String(todoData?.title || '').trim();
    if (!title) {
        throw httpError(400, 'Title is required');
    }

    const profileExists = await profilesRepository.ensureProfile(userId);
    if (!profileExists) {
        throw httpError(500, 'ユーザープロファイルの作成に失敗しました。再試行してください。');
    }

    const row = await todosRepository.createTodo(userId, {
        ...todoData,
        title
    });
    return mapTodoRowToResponse(row);
}

// 既存のTodoを更新
async function editTodo(userId, id, patch) {
    const update = mapTodoPatchToUpdate(patch || {});
    if (Object.keys(update).length === 0) {
        throw httpError(400, 'No update fields provided');
    }

    const row = await todosRepository.updateTodo(userId, id, update);
    return mapTodoRowToResponse(row);
}

// Todoを削除
async function removeTodo(userId, id) {
    await todosRepository.deleteTodo(userId, id);
    return { success: true };
}

module.exports = {
    getTodos,
    addTodo,
    editTodo,
    removeTodo,
};
