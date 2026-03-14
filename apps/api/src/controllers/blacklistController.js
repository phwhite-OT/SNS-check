
/**
 * Blacklist APIのcontroller。
 * - 一覧取得・追加・削除のHTTP入出力を担当
 * - 実際の業務ロジックはservice層へ委譲
 */
const blacklistService = require('../services/blacklistService');

//  `x-user-id` ヘッダーからユーザーIDを取得。未指定の場合は `defaultUserId` を使用
function getUserId(req) {
    return req.header('x-user-id') || req.app.locals.defaultUserId;
}

// ブラックリストの一覧を取得
async function getBlacklist(req, res) {
    const data = await blacklistService.getBlacklist(getUserId(req));
    res.json(data);
}

// ブラックリストにドメインを追加
async function createBlacklist(req, res) {
    const result = await blacklistService.addBlacklist(getUserId(req), req.body?.domain);
    res.json(result);
}

// ブラックリストからドメインを削除
async function deleteBlacklist(req, res) {
    const result = await blacklistService.removeBlacklist(getUserId(req), req.params.domain);
    res.json(result);
}

module.exports = {
    getBlacklist,
    createBlacklist,
    deleteBlacklist,
};
