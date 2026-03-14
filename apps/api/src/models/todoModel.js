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
        completed: row.status === 'done',
    };
}

function mapTodoPatchToUpdate(patch) {
    const update = {};
    if (typeof patch.title === 'string') {
        update.title = patch.title.trim();
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
