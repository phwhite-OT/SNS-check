/**
 * `btc_price_history` テーブル専用のデータアクセス層(repository)。
 */
const { supabase } = require('../config/supabase');

async function getLatestBtcPrice() {
    const { data, error } = await supabase
        .from('btc_price_history')
        .select('id, source, price_jpy, fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data || null;
}

async function insertBtcPrice(source, priceJpy, fetchedAtIso) {
    const { data, error } = await supabase
        .from('btc_price_history')
        .insert({
            source,
            price_jpy: priceJpy,
            fetched_at: fetchedAtIso,
        })
        .select('id, source, price_jpy, fetched_at')
        .single();

    if (error) throw error;
    return data;
}

module.exports = {
    getLatestBtcPrice,
    insertBtcPrice,
};
