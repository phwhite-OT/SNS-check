/**
 * HTTPステータス付きErrorを作るヘルパー。
 * - service層で `throw httpError(400, '...')` のように利用する
 * - statusとmessageを持ったErrorを共通エラーハンドラへ渡せる
 */
function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

module.exports = { httpError };
