/**
 * Todo APIのcontroller。
 * - HTTPリクエストから必要値を取り出してserviceへ渡す
 * - serviceの結果をHTTPレスポンスとして返す
 * - `x-user-id` 未指定時は `defaultUserId` を使用
 */
const todosService = require('../services/todosService');

function getUserId(req) {
    return req.header('x-user-id') || req.app.locals.defaultUserId;
}

async function getTodos(req, res) {
    const todos = await todosService.getTodos(getUserId(req));
    res.json(todos);
}

async function createTodo(req, res) {
    const todo = await todosService.addTodo(getUserId(req), req.body?.title);
    res.json(todo);
}

async function updateTodo(req, res) {
    const todo = await todosService.editTodo(getUserId(req), req.params.id, req.body);
    res.json(todo);
}

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
