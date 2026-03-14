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
