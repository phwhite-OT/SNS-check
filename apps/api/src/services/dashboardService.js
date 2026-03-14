const { env } = require('../config/env');
const todosService = require('./todosService');
const blacklistService = require('./blacklistService');
const tabSessionsRepository = require('../repositories/tabSessionsRepository');

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
    const doneCount = todos.filter((todo) => todo.completed).length;

    const score =
        env.DEFAULT_SCORE_BASE +
        doneCount * env.SCORE_RECOVERY_PER_DONE_TODO -
        totalTimeSeconds * env.SCORE_PENALTY_PER_SECOND;

    return {
        score,
        history: [{ timestamp: Date.now(), score }],
        todos,
        blacklist,
        timeData,
        totalTimeSeconds,
    };
}

module.exports = {
    getDashboard,
};
