/**
 * Todo機能の業務ロジックを担当するサービス層。
 * - 入力値を検証し、不正ならHTTPエラーを投げる
 * - repository層でDB操作し、modelでレスポンス形式へ変換
 */
const { httpError } = require('../utils/httpError');
const todosRepository = require('../repositories/todosRepository');
const { mapTodoRowToResponse, mapTodoPatchToUpdate } = require('../models/todoModel');

async function getTodos(userId) {
    const rows = await todosRepository.listTodosByUser(userId);
    return rows.map(mapTodoRowToResponse);
}

async function addTodo(userId, title) {
    const value = String(title || '').trim();
    if (!value) {
        throw httpError(400, 'Title is required');
    }

    const row = await todosRepository.createTodo(userId, value);
    return mapTodoRowToResponse(row);
}

async function editTodo(userId, id, patch) {
    const update = mapTodoPatchToUpdate(patch || {});
    if (Object.keys(update).length === 0) {
        throw httpError(400, 'No update fields provided');
    }

    const row = await todosRepository.updateTodo(userId, id, update);
    return mapTodoRowToResponse(row);
}

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
