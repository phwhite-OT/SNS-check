/**
 * 非同期controller用のラッパー。
 * - `async` 関数内で発生した例外を `next(err)` へ確実に渡す
 * - 各controllerで毎回 `try/catch` を書かなくて済むようにする
 *
 * ルート定義側で `asyncHandler(controller)` として使用する。
 */
function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

module.exports = { asyncHandler };
