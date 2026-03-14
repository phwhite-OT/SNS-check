# API構成ガイド（Express + Supabase）

このドキュメントは、現在の `apps/api` を **model / repository / service / controller / route** に分割した構成の説明と、各ファイルに書くコードの役割をまとめたものです。

---

## 1. フォルダ構造

```text
apps/api/
  index.js
  package.json
  .env                  # 新規作成（ローカル秘密情報）
  src/
    app.js
    config/
      env.js
      supabase.js
    controllers/
      statusController.js
      todosController.js
      blacklistController.js
      calendarEventsController.js
      timeController.js
      dashboardController.js
    middlewares/
      asyncHandler.js
      errorHandler.js
    models/
      todoModel.js
      blacklistModel.js
      calendarEventModel.js
    repositories/
      todosRepository.js
      alertRulesRepository.js
      tabSessionsRepository.js
      calendarEventsRepository.js
      btcPriceHistoryRepository.js
      wasteCostSnapshotsRepository.js
    routes/
      index.js
    services/
      todosService.js
      blacklistService.js
      timeTrackingService.js
      dashboardService.js
      calendarEventsService.js
      assetValuationService.js
    utils/
      httpError.js
```

---

## 2. レイヤーごとの責務

- **models**: DB行やリクエスト値を、APIレスポンス用データに変換する。
- **repositories**: SupabaseへのCRUDを担当する（SQL相当はここ）。
- **services**: 業務ロジック（バリデーション、計算、複数repositoryの組み合わせ）。
- **controllers**: HTTP入力（`req`）→ service呼び出し → HTTP出力（`res`）。
- **routes**: URLとcontrollerの対応を定義する。
- **middlewares**: 共通処理（asyncエラーハンドリング、最終エラー返却）。
- **config**: 環境変数とSupabaseクライアントの初期化。

処理の流れは以下で固定します。

`route -> controller -> service -> repository -> supabase`

---

## 3. 各ファイルに書くコード

## index.js
- サーバー起動のみ。
- `app` と `env.PORT` を読み込んで `listen()` する。

## src/app.js
- Expressアプリを作る。
- `cors`、`express.json()`、`/api` へのルーター、`errorHandler` を設定。
- `app.locals.defaultUserId` にデフォルトユーザーIDを設定。

## src/config/env.js
- `dotenv` で `.env` を読み込む。
- `PORT`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、スコア計算系の設定値を集約。
- 追加で `HOURLY_WAGE_JPY`、`BTC_PRICE_CACHE_MINUTES` を管理。

## src/config/supabase.js
- `createClient()` でSupabaseクライアントを作る。
- 必須環境変数未設定なら起動時エラーを投げる。

## src/utils/httpError.js
- `httpError(status, message)` ヘルパーを定義。
- serviceからHTTPステータス付きエラーを投げるために使う。

## src/middlewares/asyncHandler.js
- 非同期controllerをラップして `next(err)` に流す。

## src/middlewares/errorHandler.js
- 全体の例外を `res.status(...).json({ error })` で返す。
- 500系はログ出力する。

## src/models/todoModel.js
- `todos` テーブルの行をフロント互換形式に変換。
  - `status === 'done'` を `completed: true` に変換。
- PATCH内容（`title` / `completed`）をDB更新形式へマップ。

## src/models/blacklistModel.js
- ドメイン正規化（小文字・trim）。
- サイト名生成（`youtube.com` → `youtube`）。
- `alert_rules` の行を `blacklist` レスポンス形式へ変換。

## src/models/calendarEventModel.js
- `calendar_events` のDB行をAPI返却形式へ変換。
- PATCHデータをDB更新形式へ変換。

## src/repositories/todosRepository.js
- `todos` テーブルに対する `list/create/update/delete`。
- すべて `user_id` 条件を付与してユーザー分離。

## src/repositories/alertRulesRepository.js
- `alert_rules` テーブルの `list/insert/delete`。
- ブラックリストの永続化を担当。

## src/repositories/tabSessionsRepository.js
- `tab_sessions` への挿入。
- ダッシュボード集計用に `list` を提供。

## src/repositories/calendarEventsRepository.js
- `calendar_events` の `list/create/update/delete/find` を担当。
- `from/to` クエリ付き一覧取得に対応。

## src/repositories/btcPriceHistoryRepository.js
- `btc_price_history` から最新価格取得。
- BTC価格履歴のINSERTを担当。

## src/repositories/wasteCostSnapshotsRepository.js
- `waste_cost_snapshots` への集計結果INSERTを担当。

## src/services/todosService.js
- タイトル必須チェック。
- モデル変換を使ってAPIレスポンス形式に統一。

## src/services/blacklistService.js
- 初回時にデフォルトブラックリストを投入（`youtube.com` など）。
- 追加・削除のバリデーションと結果返却を担当。

## src/services/timeTrackingService.js
- 拡張機能から受けた `{ site, time }` を検証。
- `tab_sessions` に `started_at` / `ended_at` を計算して保存。

## src/services/dashboardService.js
- `todos` / `blacklist` / `tab_sessions` をまとめて取得。
- `timeData` 集計、`totalTimeSeconds` 算出、スコア計算を実施。
- 追加で `assetValuationService` を呼び、JPY/BTC換算を実価格ベースで返却。

## src/services/calendarEventsService.js
- カレンダーイベントのバリデーション（開始・終了日時）を実施。
- `list/create/update/delete` の業務ロジックを担当。

## src/services/assetValuationService.js
- CoinGeckoからBTC/JPYを取得（失敗時は履歴fallback）。
- `btc_price_history` に価格履歴保存。
- 浪費秒数をJPY/BTCへ換算し、`waste_cost_snapshots` に保存。

## src/controllers/statusController.js
- `GET /api/status` に `{"status":"ok"}` を返す。

## src/controllers/todosController.js
- `GET/POST/PUT/DELETE /api/todos` の入出力制御。
- `x-user-id` ヘッダー優先、なければ `app.locals.defaultUserId`。

## src/controllers/blacklistController.js
- `GET/POST/DELETE /api/blacklist` の入出力制御。

## src/controllers/calendarEventsController.js
- `GET/POST/PUT/DELETE /api/calendar-events` の入出力制御。

## src/controllers/timeController.js
- `POST /api/time` を処理。
- 保存後に最新ダッシュボードを取得し、`score` / `timeData` を返す。

## src/controllers/dashboardController.js
- `GET /api/dashboard` を返す。

## src/routes/index.js
- すべてのエンドポイントを定義。
- 非同期controllerは `asyncHandler()` でラップ。
- 追加で `calendar-events` 系エンドポイントを定義。

---

## 4. .env に書く内容

`apps/api/.env` を作成し、最低限以下を設定します。

```env
PORT=3001
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DEFAULT_USER_ID=00000000-0000-0000-0000-000000000000
DEFAULT_SCORE_BASE=1000
SCORE_RECOVERY_PER_DONE_TODO=50
SCORE_PENALTY_PER_SECOND=1
HOURLY_WAGE_JPY=3000
BTC_PRICE_CACHE_MINUTES=10
```

> 開発中は `DEFAULT_USER_ID` を固定で使えます。本番はJWTからユーザーIDを取り出す方式へ変更してください。

---

## 5. DBテーブル対応（database.mdとの対応）

- `todos` ← ToDo API
- `alert_rules` ← Blacklist API
- `tab_sessions` ← Timeトラッキング
- `calendar_events` ← カレンダーイベントAPI（実装済み）
- `btc_price_history` ← BTC価格履歴（実装済み）
- `waste_cost_snapshots` ← 浪費金額スナップショット（実装済み）

## 5.1 追加したエンドポイント（今回）

- `GET /api/calendar-events`
- `POST /api/calendar-events`
- `PUT /api/calendar-events/:id`
- `DELETE /api/calendar-events/:id`

既存エンドポイントの機能拡張:
- `POST /api/time` に `alert` を追加
- `GET /api/dashboard` に `assets`（BTC実価格ベース）を追加

---

## 6. 追加メモ（運用）

- `SERVICE_ROLE_KEY` はサーバー専用。フロントへ絶対に渡さない。
- 本番ではRLS + JWT認証前提で `x-user-id` 方式は廃止する。
- repository層は「DBアクセスのみ」に保つと保守しやすい。
