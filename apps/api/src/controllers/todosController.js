/**
 * Todo APIのcontroller。
 * - HTTPリクエストから必要値を取り出してserviceへ渡す
 * - serviceの結果をHTTPレスポンスとして返す
 * - `x-user-id` 未指定時は `defaultUserId` を使用
 */
const todosService = require('../services/todosService');
const { httpError } = require('../utils/httpError');

const INVALID_DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

function getUserId(req) {
    const userId = req.header('x-user-id') || req.app.locals.defaultUserId;
    if (!userId || userId === INVALID_DEFAULT_USER_ID) {
        throw httpError(401, 'x-user-id を指定してください（有効な profiles.id が必要です）');
    }
    return userId;
}

// TODOの一覧を取得
async function getTodos(req, res) {
    const todos = await todosService.getTodos(getUserId(req));
    res.json(todos);
}

// TODOを新規作成
async function createTodo(req, res) {
    const todo = await todosService.addTodo(getUserId(req), req.body?.title);
    res.json(todo);
}

// TODOを更新
async function updateTodo(req, res) {
    const todo = await todosService.editTodo(getUserId(req), req.params.id, req.body);
    res.json(todo);
}

// TODOを削除
async function deleteTodo(req, res) {
    const result = await todosService.removeTodo(getUserId(req), req.params.id);
    res.json(result);
}

module.exports = {
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo,
};
