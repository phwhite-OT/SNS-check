/**
 * Todo機能の業務ロジックを担当するサービス層。
 * - 入力値を検証し、不正ならHTTPエラーを投げる
 * - repository層でDB操作し、modelでレスポンス形式へ変換
 */
const { httpError } = require('../utils/httpError');
const todosRepository = require('../repositories/todosRepository');
const profilesRepository = require('../repositories/profilesRepository');
const { mapTodoRowToResponse, mapTodoPatchToUpdate } = require('../models/todoModel');

async function trackTodoProgressSafely(userId, options) {
    try {
        await profilesRepository.incrementTodoProgress(userId, options);
    } catch (error) {
        console.error('Failed to update todo progress stats:', error?.message || error);
    }
}

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

    // 新規ユーザーなどの場合、プロフィールの存在を確約する（FK違反防止）
    await profilesRepository.ensureProfile(userId);

    // モデル層の変換ロジックを利用してDB用のオブジェクトを作成
    const updatePayload = mapTodoPatchToUpdate({
        ...todoData,
        title
    });

    const row = await todosRepository.createTodo(userId, updatePayload);

    await trackTodoProgressSafely(userId, {
        createdDelta: 1,
        completedDelta: row.status === 'done' ? 1 : 0,
        minimumCreated: 1,
        minimumCompleted: row.status === 'done' ? 1 : 0,
    });

    return mapTodoRowToResponse(row);
}

// 既存のTodoを更新
async function editTodo(userId, id, patch) {
    const update = mapTodoPatchToUpdate(patch || {});
    if (Object.keys(update).length === 0) {
        throw httpError(400, 'No update fields provided');
    }

    const existing = await todosRepository.findTodoById(userId, id);
    if (!existing) {
        throw httpError(404, 'Todo not found');
    }

    const row = await todosRepository.updateTodo(userId, id, update);

    const didCompleteNow = existing.status !== 'done' && row.status === 'done';
    if (didCompleteNow) {
        await trackTodoProgressSafely(userId, {
            completedDelta: 1,
            minimumCreated: 1,
            minimumCompleted: 1,
        });
    }

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
