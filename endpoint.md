# APIエンドポイント定義

このドキュメントは、現在の [apps/api/src/routes/index.js](apps/api/src/routes/index.js) に定義されているAPIの一覧です。

## 共通仕様

- ベースURL: `http://localhost:3001/api`
- Content-Type: `application/json`
- 認証（暫定）: `x-user-id` ヘッダー（任意）
  - 未指定時はサーバーの `defaultUserId` が使われます
- 認証系API: `/auth/*` は `x-user-id` 不要です
- エラーレスポンス形式: `{ "error": "メッセージ" }`

---

## エンドポイント一覧（早見表）

| Method | Path | 用途 |
|---|---|---|
| GET | `/status` | ヘルスチェック |
| POST | `/auth/signup` | ユーザー登録 |
| POST | `/auth/login` | ログイン |
| GET | `/auth/me` | 現在ユーザー取得 |
| POST | `/auth/logout` | ログアウト |
| GET | `/todos` | Todo一覧取得 |
| POST | `/todos` | Todo追加 |
| PUT | `/todos/:id` | Todo更新（完了状態・タイトル） |
| DELETE | `/todos/:id` | Todo削除 |
| GET | `/blacklist` | ブラックリスト一覧取得 |
| POST | `/blacklist` | ブラックリスト追加 |
| DELETE | `/blacklist/:domain` | ブラックリスト削除 |
| GET | `/calendar-events` | カレンダーイベント一覧取得 |
| POST | `/calendar-events` | カレンダーイベント作成 |
| PUT | `/calendar-events/:id` | カレンダーイベント更新 |
| DELETE | `/calendar-events/:id` | カレンダーイベント削除 |
| POST | `/time` | 滞在時間ログ送信 |
| GET | `/dashboard` | ダッシュボード集約データ取得 |

---

## 1) GET `/status`

### 説明
APIサーバーが起動しているかを確認するためのエンドポイントです。

### リクエスト
- Body: なし

### 返却データ
- `status`: APIの稼働状態

### レスポンス例
```json
{ "status": "ok" }
```

---

## 2) POST `/auth/signup`

### 説明
メールアドレスとパスワードで新規ユーザーを作成します。

### リクエスト例
```json
{ "email": "user@example.com", "password": "password123" }
```

### 返却データ
- `user.id`: 作成されたユーザーID
- `user.email`: 登録メールアドレス

### レスポンス例
```json
{
  "user": {
    "id": "40dfff13-18c7-4417-9c3a-726f505541f8",
    "email": "user@example.com"
  }
}
```

### 主なエラー
- `400`: メールアドレスまたはパスワード不足
- `400`: パスワードが6文字未満
- `409` 相当: 既存メールアドレス

---

## 3) POST `/auth/login`

### 説明
メールアドレスとパスワードでログインし、セッション情報を取得します。

### リクエスト例
```json
{ "email": "user@example.com", "password": "password123" }
```

### 返却データ
- `user.id`: ログインしたユーザーID
- `user.email`: ログインしたメールアドレス
- `session.access_token`: API認証に使うトークン
- `session.refresh_token`: トークン更新用
- `session.expires_at`: 有効期限

### レスポンス例
```json
{
  "user": {
    "id": "40dfff13-18c7-4417-9c3a-726f505541f8",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_at": 1773500000
  }
}
```

### 主なエラー
- `400`: メールアドレスまたはパスワード不足
- `401`: ログイン情報不正

---

## 4) GET `/auth/me`

### 説明
`Authorization: Bearer <token>` を使って、現在ログイン中のユーザー情報を取得します。

### リクエスト
- Header: `Authorization: Bearer <access_token>`

### 返却データ
- `user.id`: 現在ユーザーのID
- `user.email`: 現在ユーザーのメールアドレス

### レスポンス例
```json
{
  "user": {
    "id": "40dfff13-18c7-4417-9c3a-726f505541f8",
    "email": "user@example.com"
  }
}
```

### 主なエラー
- `401`: トークン未指定
- `401`: 無効なトークン

---

## 5) POST `/auth/logout`

### 説明
ログアウト完了レスポンスを返します。現在はサーバー側のセッション破棄処理はありません。

### リクエスト
- Body: なし

### 返却データ
- `message`: ログアウト完了メッセージ

### レスポンス例
```json
{ "message": "ログアウトしました" }
```

---

## 6) GET `/todos`

### 説明
指定ユーザーのTodo一覧を取得します。

### リクエスト
- Header（任意）: `x-user-id`
- Body: なし

### 返却データ
- `id`: Todo ID
- `title`: タイトル
- `description`: 説明文
- `tags`: タグ配列
- `priority`: 優先度
- `dueDate`: 期限日
- `completed`: 完了状態
- `createdAt`: 作成日時

### レスポンス例
```json
[
  {
    "id": "1",
    "title": "ダッシュボード改修",
    "description": "UIとAPIの接続",
    "tags": [],
    "priority": 1,
    "dueDate": null,
    "completed": false,
    "createdAt": "2026-03-15T09:00:00.000Z"
  },
  {
    "id": "2",
    "title": "拡張機能テスト",
    "description": "popup から送信確認",
    "tags": [],
    "priority": 1,
    "dueDate": null,
    "completed": true,
    "createdAt": "2026-03-15T10:00:00.000Z"
  }
]
```

---

## 7) POST `/todos`

### 説明
新しいTodoを作成します。

### リクエスト
```json
{
  "title": "新しいタスク",
  "description": "説明文",
  "priority": 1,
  "dueDate": null
}
```

### 返却データ
- 作成後のTodo 1件

### レスポンス例
```json
{
  "id": "1aa607b7-958f-498b-b295-6c0ea11cc2b1",
  "title": "新しいタスク",
  "description": "説明文",
  "tags": [],
  "priority": 1,
  "dueDate": null,
  "completed": false,
  "createdAt": "2026-03-15T10:30:00.000Z"
}
```

### 主なエラー
- `400`: `title` が空

---

## 8) PUT `/todos/:id`

### 説明
既存Todoを更新します。`title` と `completed` の両方または片方を更新できます。

### パスパラメータ
- `id`: Todo ID

### リクエスト例
```json
{ "completed": true }
```
または
```json
{ "title": "タイトル変更" }
```

### 返却データ
- 更新後のTodo 1件

### レスポンス例
```json
{
  "id": "1aa607b7-958f-498b-b295-6c0ea11cc2b1",
  "title": "タイトル変更",
  "description": "説明文",
  "tags": [],
  "priority": 1,
  "dueDate": null,
  "completed": true,
  "createdAt": "2026-03-15T10:30:00.000Z"
}
```

### 主なエラー
- `400`: 更新項目が空

---

## 9) DELETE `/todos/:id`

### 説明
指定したTodoを削除します。

### パスパラメータ
- `id`: Todo ID

### 返却データ
- `success`: 削除成功フラグ

### レスポンス例
```json
{ "success": true }
```

---

## 10) GET `/blacklist`

### 説明
ブラックリスト一覧を取得します。

### リクエスト
- Header（任意）: `x-user-id`

### 返却データ
- `domain`: 対象ドメイン
- `name`: 表示用の短い名前

### レスポンス例
```json
[
  { "domain": "youtube.com", "name": "youtube" },
  { "domain": "x.com", "name": "x" }
]
```

---

## 11) POST `/blacklist`

### 説明
ブラックリストにドメインを追加します。

### リクエスト例
```json
{ "domain": "netflix.com" }
```

### 返却データ
- `success`: 追加成功フラグ
- `blacklist`: 追加後のブラックリスト全件

### レスポンス例
```json
{
  "success": true,
  "blacklist": [
    { "domain": "youtube.com", "name": "youtube" },
    { "domain": "netflix.com", "name": "netflix" }
  ]
}
```

### 主なエラー
- `400`: `domain` が空

---

## 12) DELETE `/blacklist/:domain`

### 説明
ブラックリストから対象ドメインを削除します。

### パスパラメータ
- `domain`: 例 `youtube.com`

### 返却データ
- `success`: 削除成功フラグ
- `blacklist`: 削除後のブラックリスト全件

### レスポンス例
```json
{
  "success": true,
  "blacklist": [
    { "domain": "x.com", "name": "x" }
  ]
}
```

---

## 13) POST `/time`

### 説明
拡張機能から滞在時間を受け取り、`tab_sessions` に保存します。
保存後に最新の `score` / `timeData` と、しきい値超過判定 `alert` を返します。

### リクエスト例
```json
{ "site": "youtube", "time": 35 }
```

### 返却データ
- `success`: 保存成功フラグ
- `score`: 保存後の最新スコア
- `timeData`: ドメイン別滞在秒数
- `alert`: しきい値判定結果

### レスポンス例
```json
{
  "success": true,
  "score": 950,
  "timeData": {
    "youtube": 120,
    "x": 80
  },
  "alert": {
    "shouldAlert": false,
    "targetDomain": "youtube.com",
    "thresholdSec": 900,
    "todayDurationSec": 120,
    "exceededBySec": 0
  }
}
```

### 主なエラー
- `400`: `site` が空
- `400`: `time` が正の数でない

---

## 14) GET `/dashboard`

### 説明
ダッシュボード表示に必要な集約データをまとめて取得します。

### 取得できる主なデータ
- `score`: 現在のスコア
- `history`: スコア履歴（現状は最新1件のみ）
- `todos`: ユーザーのTodo一覧
- `blacklist`: ユーザーのブラックリスト一覧
- `timeData`: ドメインごとの滞在秒数
- `siteBreakdown`: ドメインごとの滞在時間を分で整形した配列
- `totalTimeSeconds`: 合計滞在秒数
- `assets`: 滞在時間から換算した損失額（円/BTC）

### レスポンス例
```json
{
  "score": 980,
  "history": [{ "timestamp": 1710000000000, "score": 980 }],
  "todos": [
    {
      "id": "1aa607b7-958f-498b-b295-6c0ea11cc2b1",
      "title": "DB保存確認タスク",
      "description": "save test",
      "tags": [],
      "priority": 1,
      "dueDate": null,
      "completed": false,
      "createdAt": "2026-03-14T14:49:24.246146+00:00"
    }
  ],
  "blacklist": [
    { "domain": "youtube.com", "name": "youtube" },
    { "domain": "x.com", "name": "x" }
  ],
  "timeData": {
    "youtube.com": 1200,
    "x.com": 300
  },
  "siteBreakdown": [
    { "domain": "youtube.com", "timeSpent": 20 },
    { "domain": "x.com", "timeSpent": 5 }
  ],
  "totalTimeSeconds": 1500,
  "assets": {
    "jpy": 1250,
    "btc": 0.00001105,
    "btcPriceJpy": 11308855,
    "btcPriceSource": "coingecko",
    "btcPriceFetchedAt": "2026-03-14T14:33:43.849+00:00"
  }
}
```

### 補足
- `timeData` は秒単位です
- `siteBreakdown.timeSpent` は分単位です
- `assets.jpy` の計算は `totalTimeSeconds / 3600 * HOURLY_WAGE_JPY` です
- `assets.btc` はその円損失額を取得時点のBTC価格で割って算出します

---

## 15) GET `/calendar-events`

### 説明
ユーザーのカレンダーイベント一覧を取得します。期間指定も可能です。

### クエリ（任意）
- `from`: 開始日時（ISO）
- `to`: 終了日時（ISO）

### 返却データ
- `id`: イベントID
- `title`: イベント名
- `startAt`: 開始日時
- `endAt`: 終了日時
- `allDay`: 終日フラグ
- `createdAt`: 作成日時

### レスポンス例
```json
[
  {
    "id": "...",
    "title": "開発ミーティング",
    "startAt": "2026-03-15T01:00:00.000Z",
    "endAt": "2026-03-15T02:00:00.000Z",
    "allDay": false,
    "createdAt": "2026-03-14T12:00:00.000Z"
  }
]
```

---

## 16) POST `/calendar-events`

### 説明
カレンダーイベントを新規作成します。

### リクエスト例
```json
{
  "title": "集中作業",
  "startAt": "2026-03-15T03:00:00.000Z",
  "endAt": "2026-03-15T05:00:00.000Z",
  "allDay": false
}
```

### 返却データ
- 作成後のイベント 1件

### レスポンス例
```json
{
  "id": "event-1",
  "title": "集中作業",
  "startAt": "2026-03-15T03:00:00.000Z",
  "endAt": "2026-03-15T05:00:00.000Z",
  "allDay": false,
  "createdAt": "2026-03-15T02:50:00.000Z"
}
```

### 主なエラー
- `400`: `title` が空
- `400`: `startAt/endAt` 不正

---

## 17) PUT `/calendar-events/:id`

### 説明
既存イベントを更新します。

### パスパラメータ
- `id`: イベントID

### リクエスト例
```json
{
  "title": "集中作業（更新）",
  "endAt": "2026-03-15T05:30:00.000Z"
}
```

### 返却データ
- 更新後のイベント 1件

### レスポンス例
```json
{
  "id": "event-1",
  "title": "集中作業（更新）",
  "startAt": "2026-03-15T03:00:00.000Z",
  "endAt": "2026-03-15T05:30:00.000Z",
  "allDay": false,
  "createdAt": "2026-03-15T02:50:00.000Z"
}
```

### 主なエラー
- `400`: 更新項目が空または不正

---

## 18) DELETE `/calendar-events/:id`

### 説明
指定イベントを削除します。

### パスパラメータ
- `id`: イベントID

### 返却データ
- `success`: 削除成功フラグ

### レスポンス例
```json
{ "success": true }
```

---

## 補足

- ルーティング定義: [apps/api/src/routes/index.js](apps/api/src/routes/index.js)
- controller実装:
  - [apps/api/src/controllers/statusController.js](apps/api/src/controllers/statusController.js)
  - [apps/api/src/controllers/todosController.js](apps/api/src/controllers/todosController.js)
  - [apps/api/src/controllers/blacklistController.js](apps/api/src/controllers/blacklistController.js)
  - [apps/api/src/controllers/calendarEventsController.js](apps/api/src/controllers/calendarEventsController.js)
  - [apps/api/src/controllers/timeController.js](apps/api/src/controllers/timeController.js)
  - [apps/api/src/controllers/dashboardController.js](apps/api/src/controllers/dashboardController.js)
