/**
 * 閲覧履歴データを処理するコントローラー。
 * - 拡張機能から送られてきた過去の履歴データをDB（tab_sessions）に保存する
 */
const tabSessionsRepository = require('../repositories/tabSessionsRepository');

async function postHistory(req, res) {
    const userId = req.header('x-user-id');
    const { history } = req.body;

    if (!userId || !Array.isArray(history)) {
        console.error('Invalid history payload:', { userId, isArray: Array.isArray(history) });
        return res.status(400).json({ error: 'invalid payload' });
    }

    console.log(`Processing ${history.length} history items for user ${userId}`);

    // 重複を避けるためのシンプルな処理
    const sessions = [];
    for (const item of history) {
        try {
            const url = new URL(item.url);
            sessions.push({
                user_id: userId,
                domain: url.hostname,
                url: item.url,
                tab_title: item.title,
                started_at: new Date(item.lastVisitTime).toISOString(),
                ended_at: new Date(item.lastVisitTime).toISOString(),
                duration_sec: 0, // 履歴データからは滞在時間は不明なため0
                is_waste: false, // 全ての履歴を浪費とは限らないためfalse
            });
        } catch (e) {
            // chrome:// などの特殊なURLはスキップ
            console.warn('Skipping invalid URL:', item.url);
        }
    }

    try {
        // 大量データを一括挿入（Supabase/PostgreSQLの機能を活用）
        // 現状の insertTabSession は single 向けなので、複数対応版をリポジトリで作るかループで回す
        // パフォーマンス優先で insertTabsSessionsBulk をリポジトリに追加する
        await tabSessionsRepository.insertTabSessionsBulk(sessions);
        
        res.json({ success: true, count: sessions.length });
    } catch (e) {
        console.error('Failed to save history:', e);
        res.status(500).json({ error: 'failed to save history' });
    }
}

module.exports = {
    postHistory,
};
