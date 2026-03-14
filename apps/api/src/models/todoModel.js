/**
 * Todoデータの変換ルールを集約するモデル層。
 * - DB行(`status`) → APIレスポンス(`completed`) へ変換
 * - API更新値(`completed`) → DB更新値(`status`) へ変換
 *
 * 形式変換をこのファイルに寄せることで、service/controllerを簡潔に保つ。
 */
function mapTodoRowToResponse(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        tags: row.tags || [],
        priority: row.priority || 'medium',
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
    if (Array.isArray(patch.tags)) {
        update.tags = patch.tags;
    }
    if (typeof patch.priority === 'string') {
        update.priority = patch.priority;
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
};
