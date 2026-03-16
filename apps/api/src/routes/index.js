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
const {
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
} = require('../controllers/calendarEventsController');
const { postTime } = require('../controllers/timeController');
const { postHistory } = require('../controllers/historyController');
const { getDashboard } = require('../controllers/dashboardController');
const { getFocusMode, setFocusMode } = require('../controllers/focusModeController');
const { postAnalyzeTask } = require('../controllers/aiController');
const { getHourlyWage, updateHourlyWage } = require('../controllers/profileSettingsController');
const authRouter = require('./auth');

const router = express.Router();

// 認証ルート（セッション不要）
router.use('/auth', authRouter);

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

// カレンダーイベントの一覧取得
router.get('/calendar-events', asyncHandler(getCalendarEvents));

// カレンダーイベントの新規作成
router.post('/calendar-events', asyncHandler(createCalendarEvent));

// カレンダーイベントの更新
router.put('/calendar-events/:id', asyncHandler(updateCalendarEvent));

// カレンダーイベントの削除
router.delete('/calendar-events/:id', asyncHandler(deleteCalendarEvent));

// 時間計測データの受信とダッシュボード情報の取得
router.post('/time', asyncHandler(postTime));

// 過去の閲覧履歴の受信
router.post('/history', asyncHandler(postHistory));

// ダッシュボード情報の取得
router.get('/dashboard', asyncHandler(getDashboard));

// 集中モード状態の取得
router.get('/focus-mode', asyncHandler(getFocusMode));

// 集中モード状態の更新
router.post('/focus-mode', asyncHandler(setFocusMode));

// ユーザー時給の取得
router.get('/settings/hourly-wage', asyncHandler(getHourlyWage));

// ユーザー時給の更新
router.put('/settings/hourly-wage', asyncHandler(updateHourlyWage));

// AIによるタスク分析
router.post('/ai/analyze-task', asyncHandler(postAnalyzeTask));
module.exports = { apiRouter: router };
