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
const profilesRepository = require('../repositories/profilesRepository');
const { buildAssetMetrics } = require('./assetValuationService');

function toSafeGoal(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
}

function resolveGoalTargets() {
    const primary = toSafeGoal(env.SCORE_FIXED_GOAL_PRIMARY, 3);
    const secondary = toSafeGoal(env.SCORE_FIXED_GOAL_SECONDARY, 5);
    const sorted = [primary, secondary].sort((a, b) => a - b);

    if (sorted[0] === sorted[1]) {
        return [sorted[0], sorted[0] + 2];
    }
    return sorted;
}

function buildGoalState(completedLifetime, target) {
    const progress = Math.min(100, Math.round((completedLifetime / Math.max(target, 1)) * 100));
    return {
        target,
        progress,
        achieved: completedLifetime >= target,
    };
}

// ダッシュボード表示に必要なデータをまとめて取得する関数
async function getDashboard(userId) {
    const [todos, blacklist, sessions] = await Promise.all([
        todosService.getTodos(userId),
        blacklistService.getBlacklist(userId),
        tabSessionsRepository.listTabSessionsByUser(userId),
    ]);

    const timeData = sessions.reduce((acc, row) => {
        const key = row.domain;
        const value = Number(row.duration_sec || 0);
        acc[key] = (acc[key] || 0) + value;
        return acc;
    }, {});

    const totalTimeSeconds = Object.values(timeData).reduce((sum, sec) => sum + sec, 0);
    const currentCreatedCount = todos.length;
    const currentCompletedCount = todos.filter((todo) => todo.completed).length;

    const todoProgress = await profilesRepository.getTodoProgressStats(userId, {
        minimumCreated: currentCreatedCount,
        minimumCompleted: currentCompletedCount,
    });

    const completedLifetime = todoProgress.completedCount;
    const createdLifetime = Math.max(todoProgress.createdCount, completedLifetime);

    const [goalPrimary, goalSecondary] = resolveGoalTargets();
    const activeTarget = completedLifetime < goalPrimary ? goalPrimary : goalSecondary;
    const activeProgress = Math.min(100, Math.round((completedLifetime / Math.max(activeTarget, 1)) * 100));

    const fixedGoalBonusMultiplier = completedLifetime >= goalSecondary
        ? 2
        : completedLifetime >= goalPrimary
            ? 1
            : 0;

    const scoreRaw =
        env.DEFAULT_SCORE_BASE +
        completedLifetime * env.SCORE_RECOVERY_PER_DONE_TODO +
        createdLifetime * env.SCORE_BONUS_PER_CREATED_TODO +
        fixedGoalBonusMultiplier * env.SCORE_RECOVERY_PER_DONE_TODO -
        totalTimeSeconds * env.SCORE_PENALTY_PER_SECOND;

    const score = Math.max(0, Math.round(scoreRaw));

    let assets;
    try {
        assets = await buildAssetMetrics(userId, totalTimeSeconds);
    } catch (error) {
        console.error('Failed to build asset metrics:', error);
        const fallbackJpy = Math.floor((totalTimeSeconds / 3600) * env.HOURLY_WAGE_JPY);
        assets = {
            jpy: fallbackJpy,
            btc: 0,
            btcPriceJpy: null,
            btcPriceSource: 'unavailable',
            btcPriceFetchedAt: null,
        };
    }

    const siteBreakdown = Object.entries(timeData).map(([domain, seconds]) => ({
        domain,
        timeSpent: Math.floor(seconds / 60)
    }));

    return {
        score,
        history: [{ timestamp: Date.now(), score }],
        todos,
        missionProgress: {
            goals: [goalPrimary, goalSecondary],
            activeTarget,
            activeProgress,
            createdLifetime,
            completedLifetime,
            persistence: todoProgress.persistence,
            byGoal: [
                buildGoalState(completedLifetime, goalPrimary),
                buildGoalState(completedLifetime, goalSecondary),
            ],
        },
        blacklist,
        timeData,
        siteBreakdown,
        totalTimeSeconds,
        assets,
    };
}

module.exports = {
    getDashboard,
};
