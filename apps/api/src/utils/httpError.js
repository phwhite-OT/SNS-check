/**
 * HTTPステータス付きErrorを作るヘルパー。
 * - service層で `throw new HttpError(400, '...')` のように利用する
 * - statusとmessageを持ったErrorを共通エラーハンドラへ渡せる
 */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

module.exports = { HttpError, httpError: (status, message) => new HttpError(status, message) };
