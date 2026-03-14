/**
 * ダッシュボード表示用データを集約するサービス層。
 * - Todo/Blacklist/TabSessionを並列取得
 * - `timeData` と `totalTimeSeconds` を集計
 * - 設定値に基づいてスコアを算出
 */
const { env } = require('../config/env');
const todosService = require('./todosService');
const blacklistService = require('./blacklistService');
const tabSessionsRepository = require('../repositories/tabSessionsRepository');

const { mapTodoRowToResponse } = require('../models/todoModel');

async function getDashboard(userId) {
    const [todosRaw, blacklist, sessions] = await Promise.all([
        todosRepository.listTodosByUser(userId),
        blacklistService.getBlacklist(userId),
        tabSessionsRepository.listTabSessionsByUser(userId),
    ]);
    const todos = todosRaw.map(mapTodoRowToResponse);

    const timeData = sessions.reduce((acc, row) => {
        const key = row.domain;
        const value = Number(row.duration_sec || 0);
        acc[key] = (acc[key] || 0) + value;
        return acc;
    }, {});

    const totalTimeSeconds = Object.values(timeData).reduce((sum, sec) => sum + sec, 0);
    const doneCount = todos.filter((todo) => todo.completed).length;

    const score =
        env.DEFAULT_SCORE_BASE +
        doneCount * env.SCORE_RECOVERY_PER_DONE_TODO -
        totalTimeSeconds * env.SCORE_PENALTY_PER_SECOND;

    // 資産価値の計算（仮定：時給3000円）
    const MOCK_HOURLY_WAGE = 3000;
    const MOCK_BTC_JPY = 10000000;
    const lostValueJpy = Math.floor((totalTimeSeconds / 3600) * MOCK_HOURLY_WAGE);
    const lostValueBtc = (lostValueJpy / MOCK_BTC_JPY).toFixed(8);

    const siteBreakdown = Object.entries(timeData).map(([domain, seconds]) => ({
        domain,
        timeSpent: Math.floor(seconds / 60)
    }));

    return {
        score,
        history: [{ timestamp: Date.now(), score }],
        todos,
        blacklist,
        timeData,
        siteBreakdown,
        totalTimeSeconds,
        assets: {
            jpy: lostValueJpy,
            btc: Number(lostValueBtc) // Convert back to number for frontend flexibility
        }
    };
}

module.exports = {
    getDashboard,
};
