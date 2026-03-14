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

// ヘルスチェック用エンドポイント
router.get('/status', getStatus);

// TODOの一覧取得
router.get('/todos', asyncHandler(getTodos));

// TODOの新規作成
router.post('/todos', asyncHandler(createTodo));

// TODOの更新
router.put('/todos/:id', asyncHandler(updateTodo));

// TODOの削除
router.delete('/todos/:id', asyncHandler(deleteTodo));

// ブラックリストの一覧取得
router.get('/blacklist', asyncHandler(getBlacklist));

// ブラックリストにドメインを追加
router.post('/blacklist', asyncHandler(createBlacklist));

// ブラックリストからドメインを削除
router.delete('/blacklist/:domain', asyncHandler(deleteBlacklist));

// 時間計測データの受信とダッシュボード情報の取得
router.post('/time', asyncHandler(postTime));

// ダッシュボード情報の取得
router.get('/dashboard', asyncHandler(getDashboard));

module.exports = { apiRouter: router };
