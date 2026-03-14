/**
 * `waste_cost_snapshots` テーブル専用のデータアクセス層(repository)。
 */
const { supabase } = require('../config/supabase');

async function insertWasteCostSnapshot(payload) {
    const { error } = await supabase
        .from('waste_cost_snapshots')
        .insert(payload);

    if (error) throw error;
}

module.exports = {
    insertWasteCostSnapshot,
};
