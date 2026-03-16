/**
 * `profiles` テーブル専用のデータアクセス層(repository)。
 */
const { supabase } = require('../config/supabase');
const { env } = require('../config/env');

// スキーマ未適用環境でもスコア計算が壊れないように、メモリフォールバックを用意する
const todoProgressMemory = new Map();
const hourlyWageMemory = new Map();

function toSafeCounter(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
}

function toSafeHourlyWage(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return Math.max(1, Math.floor(Number(fallback) || Number(env.HOURLY_WAGE_JPY) || 1200));
    }
    return Math.max(1, Math.floor(parsed));
}

function readMemoryTodoProgress(userId) {
    return todoProgressMemory.get(userId) || {
        createdCount: 0,
        completedCount: 0,
    };
}

function writeMemoryTodoProgress(userId, createdCount, completedCount) {
    const safeCreated = toSafeCounter(createdCount);
    const safeCompleted = Math.min(toSafeCounter(completedCount), safeCreated);
    const safe = {
        createdCount: safeCreated,
        completedCount: safeCompleted,
    };
    todoProgressMemory.set(userId, safe);
    return safe;
}

function readMemoryHourlyWage(userId, fallback) {
    if (hourlyWageMemory.has(userId)) {
        return toSafeHourlyWage(hourlyWageMemory.get(userId), fallback);
    }
    return toSafeHourlyWage(fallback, env.HOURLY_WAGE_JPY);
}

function writeMemoryHourlyWage(userId, hourlyWageJpy, fallback) {
    const safe = toSafeHourlyWage(hourlyWageJpy, fallback);
    hourlyWageMemory.set(userId, safe);
    return safe;
}

function isMissingTodoStatsColumns(error) {
    if (!error) return false;

    const code = String(error.code || '');
    const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();

    return (
        code === '42703' || // undefined_column
        code === 'PGRST204' || // missing column in PostgREST schema cache
        message.includes('todo_created_count') ||
        message.includes('todo_completed_count')
    );
}

function isMissingHourlyWageColumn(error) {
    if (!error) return false;

    const code = String(error.code || '');
    const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();

    return (
        code === '42703' || // undefined_column
        code === 'PGRST204' || // missing column in PostgREST schema cache
        message.includes('hourly_wage_jpy')
    );
}

function normalizeTodoProgress(row) {
    const createdCount = toSafeCounter(row?.todo_created_count);
    const completedCount = Math.min(toSafeCounter(row?.todo_completed_count), createdCount);
    return { createdCount, completedCount };
}

async function getProfileById(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw error;
    }
    return data;
}

async function ensureProfile(userId) {
    const existing = await getProfileById(userId);
    if (!existing) {
        // もしプロフィールがなければ作成を試みる（FK違反を避けるため）
        let email = null;
        try {
            const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
            if (authError) throw authError;
            email = authData?.user?.email || null;
        } catch (error) {
            console.error('Failed to fetch auth user for profile bootstrap:', error.message);
        }

        if (!email) {
            console.error('Failed to create profile automatically: email is required but could not be resolved');
            return false;
        }

        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email,
                display_name: 'User', // 必須カラムへのデフォルト値
                timezone: 'UTC'       // 必須カラムへのデフォルト値
            })
            .select('id')
            .single();

        if (error) {
            console.error('Failed to create profile automatically:', error.message);
            return false;
        }
        return true;
    }
    return true;
}

// 累計の「作成数」「完了数」を取得する（必要に応じて最低値へ補正）
async function getTodoProgressStats(userId, options = {}) {
    const minimumCreated = toSafeCounter(options.minimumCreated);
    const minimumCompleted = toSafeCounter(options.minimumCompleted);

    try {
        await ensureProfile(userId);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, todo_created_count, todo_completed_count')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // プロフィール未作成時はメモリフォールバックで返す
                const memory = readMemoryTodoProgress(userId);
                const nextCreated = Math.max(memory.createdCount, minimumCreated, minimumCompleted);
                const nextCompleted = Math.max(memory.completedCount, minimumCompleted);
                return {
                    ...writeMemoryTodoProgress(userId, nextCreated, nextCompleted),
                    persistence: 'memory',
                };
            }
            throw error;
        }

        const fromDb = normalizeTodoProgress(data);
        const nextCreated = Math.max(fromDb.createdCount, minimumCreated, minimumCompleted);
        const nextCompleted = Math.max(fromDb.completedCount, minimumCompleted);

        if (nextCreated !== fromDb.createdCount || nextCompleted !== fromDb.completedCount) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    todo_created_count: Math.max(nextCreated, nextCompleted),
                    todo_completed_count: Math.min(nextCompleted, Math.max(nextCreated, nextCompleted)),
                })
                .eq('id', userId);

            if (updateError) throw updateError;
        }

        return {
            ...writeMemoryTodoProgress(userId, nextCreated, nextCompleted),
            persistence: 'database',
        };
    } catch (error) {
        if (!isMissingTodoStatsColumns(error)) {
            throw error;
        }

        // カラム未追加環境はメモリで単調増加を維持
        const memory = readMemoryTodoProgress(userId);
        const nextCreated = Math.max(memory.createdCount, minimumCreated, minimumCompleted);
        const nextCompleted = Math.max(memory.completedCount, minimumCompleted);

        return {
            ...writeMemoryTodoProgress(userId, nextCreated, nextCompleted),
            persistence: 'memory',
        };
    }
}

// 累計作成数/完了数を増加させる（減算は行わない）
async function incrementTodoProgress(userId, options = {}) {
    const createdDelta = toSafeCounter(options.createdDelta);
    const completedDelta = toSafeCounter(options.completedDelta);
    const minimumCreated = toSafeCounter(options.minimumCreated);
    const minimumCompleted = toSafeCounter(options.minimumCompleted);

    const current = await getTodoProgressStats(userId, {
        minimumCreated,
        minimumCompleted,
    });

    const nextCreated = Math.max(
        current.createdCount + createdDelta,
        minimumCreated,
        minimumCompleted
    );
    const nextCompleted = Math.max(
        current.completedCount + completedDelta,
        minimumCompleted
    );

    if (current.persistence === 'database') {
        try {
            const createdForStore = Math.max(nextCreated, nextCompleted);
            const completedForStore = Math.min(nextCompleted, createdForStore);

            const { error } = await supabase
                .from('profiles')
                .update({
                    todo_created_count: createdForStore,
                    todo_completed_count: completedForStore,
                })
                .eq('id', userId);

            if (error) throw error;

            return {
                ...writeMemoryTodoProgress(userId, createdForStore, completedForStore),
                persistence: 'database',
            };
        } catch (error) {
            if (!isMissingTodoStatsColumns(error)) {
                throw error;
            }
        }
    }

    return {
        ...writeMemoryTodoProgress(userId, nextCreated, nextCompleted),
        persistence: 'memory',
    };
}

// ユーザー時給を取得（カラム未適用時はメモリフォールバック）
async function getHourlyWageJpy(userId, fallbackHourlyWage = env.HOURLY_WAGE_JPY) {
    const fallback = toSafeHourlyWage(fallbackHourlyWage, env.HOURLY_WAGE_JPY);

    try {
        await ensureProfile(userId);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, hourly_wage_jpy')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return writeMemoryHourlyWage(userId, readMemoryHourlyWage(userId, fallback), fallback);
            }
            throw error;
        }

        return writeMemoryHourlyWage(userId, data?.hourly_wage_jpy, fallback);
    } catch (error) {
        if (!isMissingHourlyWageColumn(error)) {
            throw error;
        }

        return writeMemoryHourlyWage(userId, readMemoryHourlyWage(userId, fallback), fallback);
    }
}

// ユーザー時給を更新（カラム未適用時はメモリフォールバック）
async function setHourlyWageJpy(userId, hourlyWageJpy, fallbackHourlyWage = env.HOURLY_WAGE_JPY) {
    const fallback = toSafeHourlyWage(fallbackHourlyWage, env.HOURLY_WAGE_JPY);
    const next = toSafeHourlyWage(hourlyWageJpy, fallback);

    try {
        await ensureProfile(userId);

        const { error } = await supabase
            .from('profiles')
            .update({ hourly_wage_jpy: next })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        return writeMemoryHourlyWage(userId, next, fallback);
    } catch (error) {
        if (!isMissingHourlyWageColumn(error)) {
            throw error;
        }

        return writeMemoryHourlyWage(userId, next, fallback);
    }
}

module.exports = {
    getProfileById,
    ensureProfile,
    getTodoProgressStats,
    incrementTodoProgress,
    getHourlyWageJpy,
    setHourlyWageJpy,
};
