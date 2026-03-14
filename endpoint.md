# APIエンドポイント定義

このドキュメントは、現在の [apps/api/src/routes/index.js](apps/api/src/routes/index.js) に定義されているAPIの一覧です。

## 共通仕様

- ベースURL: `http://localhost:3001/api`
- Content-Type: `application/json`
- 認証（暫定）: `x-user-id` ヘッダー（任意）
  - 未指定時はサーバーの `defaultUserId` が使われます
- エラーレスポンス形式: `{ "error": "メッセージ" }`

---

## エンドポイント一覧（早見表）

| Method | Path | 用途 |
|---|---|---|
| GET | `/status` | ヘルスチェック |
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

### レスポンス例
```json
{ "status": "ok" }
```

---

## 2) GET `/todos`

### 説明
指定ユーザーのTodo一覧を取得します。

### リクエスト
- Header（任意）: `x-user-id`
- Body: なし

### レスポンス例
```json
[
  { "id": "...", "title": "ダッシュボード改修", "completed": false },
  { "id": "...", "title": "拡張機能テスト", "completed": true }
]
```

---

## 3) POST `/todos`

### 説明
新しいTodoを作成します。

### リクエスト
```json
{ "title": "新しいタスク" }
```

### レスポンス例
```json
{ "id": "...", "title": "新しいタスク", "completed": false }
```

### 主なエラー
- `400`: `title` が空

---

## 4) PUT `/todos/:id`

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

### レスポンス例
```json
{ "id": "...", "title": "タイトル変更", "completed": true }
```

### 主なエラー
- `400`: 更新項目が空

---

## 5) DELETE `/todos/:id`

### 説明
指定したTodoを削除します。

### パスパラメータ
- `id`: Todo ID

### レスポンス例
```json
{ "success": true }
```

---

## 6) GET `/blacklist`

### 説明
ブラックリスト一覧を取得します。

### リクエスト
- Header（任意）: `x-user-id`

### レスポンス例
```json
[
  { "domain": "youtube.com", "name": "youtube" },
  { "domain": "x.com", "name": "x" }
]
```

---

## 7) POST `/blacklist`

### 説明
ブラックリストにドメインを追加します。

### リクエスト例
```json
{ "domain": "netflix.com" }
```

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

## 8) DELETE `/blacklist/:domain`

### 説明
ブラックリストから対象ドメインを削除します。

### パスパラメータ
- `domain`: 例 `youtube.com`

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

## 9) POST `/time`

### 説明
拡張機能から滞在時間を受け取り、`tab_sessions` に保存します。
保存後に最新の `score` / `timeData` と、しきい値超過判定 `alert` を返します。

### リクエスト例
```json
{ "site": "youtube", "time": 35 }
```

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

## 10) GET `/dashboard`

### 説明
ダッシュボード表示に必要な集約データをまとめて取得します。

### レスポンス例
```json
{
  "score": 980,
  "history": [{ "timestamp": 1710000000000, "score": 980 }],
  "todos": [{ "id": "...", "title": "...", "completed": false }],
  "blacklist": [{ "domain": "youtube.com", "name": "youtube" }],
  "timeData": { "youtube": 120 },
  "siteBreakdown": [{ "domain": "youtube", "timeSpent": 2 }],
  "totalTimeSeconds": 120,
  "assets": {
    "jpy": 100,
    "btc": 0.000001,
    "btcPriceJpy": 10000000,
    "btcPriceSource": "coingecko",
    "btcPriceFetchedAt": "2026-03-14T10:00:00.000Z"
  }
}
```

---

## 11) GET `/calendar-events`

### 説明
ユーザーのカレンダーイベント一覧を取得します。期間指定も可能です。

### クエリ（任意）
- `from`: 開始日時（ISO）
- `to`: 終了日時（ISO）

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

## 12) POST `/calendar-events`

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

### 主なエラー
- `400`: `title` が空
- `400`: `startAt/endAt` 不正

---

## 13) PUT `/calendar-events/:id`

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

---

## 14) DELETE `/calendar-events/:id`

### 説明
指定イベントを削除します。

### パスパラメータ
- `id`: イベントID

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
