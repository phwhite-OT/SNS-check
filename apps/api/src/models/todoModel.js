/**
 * Todoデータの変換ルールを集約するモデル層。
 * - DB行(`status`) → APIレスポンス(`completed`) へ変換
 * - API更新値(`completed`) → DB更新値(`status`) へ変換
 *
 * 形式変換をこのファイルに寄せることで、service/controllerを簡潔に保つ。
 */

function mapDbPriorityToUi(priority) {
    const value = Number(priority);
    if (value === 1) return 'low';
    if (value === 3) return 'high';
    return 'medium';
}

function mapUiPriorityToDb(priority) {
    if (typeof priority === 'number' && Number.isFinite(priority)) {
        const rounded = Math.round(priority);
        if (rounded >= 1 && rounded <= 3) return rounded;
        return null;
    }

    if (typeof priority !== 'string') {
        return null;
    }

    const normalized = priority.trim().toLowerCase();
    if (!normalized) return null;

    if (normalized === 'low') return 1;
    if (normalized === 'medium') return 2;
    if (normalized === 'high') return 3;

    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) {
        const rounded = Math.round(numeric);
        if (rounded >= 1 && rounded <= 3) return rounded;
    }

    return null;
}

function mapTodoRowToResponse(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        tags: row.tags || [], // リポジトリで取得しない場合は空配列になる
        priority: mapDbPriorityToUi(row.priority),
        dueDate: row.due_date || null,
        completed: row.status === 'done',
        createdAt: row.created_at
    };
}

function mapTodoPatchToUpdate(patch) {
    const update = {};
    if (typeof patch.title === 'string') {
        update.title = patch.title.trim();
    }
    if (typeof patch.description === 'string') {
        update.description = patch.description.trim();
    }
    // データベースに tags カラムがない間は送信をスキップ
    /*
    if (Array.isArray(patch.tags)) {
        update.tags = patch.tags;
    }
    */
    if (patch.priority !== undefined) {
        const priority = mapUiPriorityToDb(patch.priority);
        if (priority !== null) {
            update.priority = priority;
        }
    }
    if (patch.dueDate !== undefined) {
        update.due_date = patch.dueDate;
    }
    if (typeof patch.completed === 'boolean') {
        update.status = patch.completed ? 'done' : 'todo';
    }
    return update;
}

module.exports = {
    mapTodoRowToResponse,
    mapTodoPatchToUpdate,
    mapUiPriorityToDb,
};
