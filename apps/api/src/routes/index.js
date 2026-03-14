/**
 * APIルーティング定義。
 * - URLとcontrollerを対応付ける
 * - 非同期controllerは `asyncHandler` でラップして例外を共通処理へ流す
 */
const express = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { getStatus } = require('../controllers/statusController');
const {
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo,
} = require('../controllers/todosController');
const {
    getBlacklist,
    createBlacklist,
    deleteBlacklist,
} = require('../controllers/blacklistController');
const { postTime } = require('../controllers/timeController');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/status', getStatus);

router.get('/todos', asyncHandler(getTodos));
router.post('/todos', asyncHandler(createTodo));
router.put('/todos/:id', asyncHandler(updateTodo));
router.delete('/todos/:id', asyncHandler(deleteTodo));

router.get('/blacklist', asyncHandler(getBlacklist));
router.post('/blacklist', asyncHandler(createBlacklist));
router.delete('/blacklist/:domain', asyncHandler(deleteBlacklist));

router.post('/time', asyncHandler(postTime));
router.get('/dashboard', asyncHandler(getDashboard));

module.exports = { apiRouter: router };
