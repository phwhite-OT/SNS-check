/**
 * アプリ全体の最終エラーハンドラ。
 * - 受け取ったErrorを `{ error: message }` 形式で返す
 * - `err.status` が無い場合は500を採用
 * - 500系のみサーバーログへ出力して調査可能にする
 */
function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    if (status >= 500) {
        console.error(err);
    }
    res.status(status).json({ error: message });
}

module.exports = { errorHandler };
