/**
 * ヘルスチェック用controller。
 * - APIサーバーが起動しているかを確認するための固定レスポンスを返す
 */
function getStatus(req, res) {
    res.json({ status: 'ok' });
}

module.exports = { getStatus };
