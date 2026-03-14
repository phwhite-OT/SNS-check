# Hack Todo List に必要なデータベース

## 結論
- 必須DBは **Supabase PostgreSQL**（1つ）で十分。
- 認証は Supabase Auth、業務データは PostgreSQL テーブルで管理する。

## 必須テーブル一覧

### 1. profiles
- 目的: ユーザーの追加情報と設定管理
- 役割: Supabase Auth の `auth.users` をアプリ側で補完するプロフィール基盤
- 説明: ログイン情報そのものは `auth.users` にあり、表示名・タイムゾーンなどアプリ独自情報をこのテーブルで保持する。
- 主なカラム:
	- id (uuid, PK, auth.users.id と同一)
	- display_name (text)
	- timezone (text)
	- created_at (timestamptz)

### 2. todos
- 目的: Todo管理
- 役割: 日々のタスクを保存し、完了状況や優先度を管理する中核データ
- 説明: フロントエンドのTodo一覧・進捗表示の元データ。`due_date` と `status` を使って未完了タスクや期限超過を判定する。
- 主なカラム:
	- id (uuid, PK)
	- user_id (uuid, FK -> profiles.id)
	- title (text)
	- description (text)
	- due_date (date)
	- status (text: todo / doing / done)
	- priority (smallint)
	- created_at (timestamptz)
	- updated_at (timestamptz)

### 3. calendar_events
- 目的: カレンダー機能・日付管理
- 役割: 予定や締切を時系列で可視化するカレンダーのイベントデータ
- 説明: 予定の開始/終了時刻を保持し、カレンダーUIや日別表示のデータソースとして利用する。`all_day` で終日イベントにも対応する。
- 主なカラム:
	- id (uuid, PK)
	- user_id (uuid, FK -> profiles.id)
	- title (text)
	- start_at (timestamptz)
	- end_at (timestamptz)
	- all_day (boolean)
	- created_at (timestamptz)

### 4. tab_sessions
- 目的: タブ滞在ログの保存（拡張機能から送信）
- 役割: 「どのURLに何秒いたか」を記録する行動ログの事実テーブル
- 説明: Chrome拡張機能から送られる滞在情報を時系列保存し、浪費時間グラフ・警告判定・金額換算の一次データとして使う。
- 主なカラム:
	- id (bigserial, PK)
	- user_id (uuid, FK -> profiles.id)
	- domain (text)
	- url (text)
	- tab_title (text)
	- started_at (timestamptz)
	- ended_at (timestamptz)
	- duration_sec (integer)
	- is_waste (boolean)
	- created_at (timestamptz)

### 5. alert_rules
- 目的: 「一定時間超過で巨大警告」の条件管理
- 役割: ドメインごとの警告ポリシー（しきい値）を管理する設定テーブル
- 説明: 例として `youtube.com` を 900 秒に設定すると、滞在がしきい値を超えた時に拡張機能側でオーバーレイ警告を出す。
- 主なカラム:
	- id (uuid, PK)
	- user_id (uuid, FK -> profiles.id)
	- target_domain (text)
	- threshold_sec (integer)
	- enabled (boolean)
	- created_at (timestamptz)

### 6. btc_price_history
- 目的: BTC価格履歴（換算の再現性確保）
- 役割: 時点ごとのBTC価格を保存する参照データ
- 説明: 「その時点の価格で換算した結果」を後から再計算・検証できるようにする。外部API障害時のキャッシュとしても機能する。
- 主なカラム:
	- id (bigserial, PK)
	- source (text)
	- price_jpy (numeric)
	- fetched_at (timestamptz)

### 7. waste_cost_snapshots
- 目的: 浪費時間を金額換算した集計結果
- 役割: グラフ表示向けの集計済みKPIデータ
- 説明: 生ログ (`tab_sessions`) から計算した「浪費秒数」「換算金額」を期間単位で保持し、ダッシュボードを高速表示する。
- 主なカラム:
	- id (bigserial, PK)
	- user_id (uuid, FK -> profiles.id)
	- period_start (timestamptz)
	- period_end (timestamptz)
	- wasted_seconds (integer)
	- btc_price_jpy (numeric)
	- lost_amount_jpy (numeric)
	- created_at (timestamptz)

## インデックス（最低限）
- tab_sessions(user_id, started_at)
- todos(user_id, due_date)
- calendar_events(user_id, start_at)
- waste_cost_snapshots(user_id, period_start)

## セキュリティ
- Supabase RLS を有効化する。
- すべてのユーザーデータ系テーブルは「自分の user_id のみ SELECT/INSERT/UPDATE/DELETE 可」にする。

## 補足（任意）
- 将来データ量が増えたら tab_sessions を月単位でパーティション化。
- 高速通知やレート制御が必要なら Redis を追加検討。


## カラムの意味（わかりやすい説明）

この設計では、認証・Todo・カレンダー・タブ監視・警告・BTC換算をそれぞれ別テーブルで管理します。

- `profiles` はユーザーの基本設定
- `todos` はタスク本体
- `calendar_events` は予定・日付管理
- `tab_sessions` はブラウザ滞在ログ
- `alert_rules` は警告条件
- `btc_price_history` はBTC価格の履歴
- `waste_cost_snapshots` は浪費時間の金額換算結果

### 1. profiles のカラム説明
- `id`: ユーザー本人を識別するID。認証基盤と紐づく主キー
- `display_name`: 画面に表示するユーザー名
- `timezone`: 日時表示の基準となるタイムゾーン
- `created_at`: ユーザー登録日時

### 2. todos のカラム説明
- `id`: Todoの一意ID
- `user_id`: どのユーザーのTodoかを示す外部キー
- `title`: タスク名
- `description`: タスクの詳細説明
- `due_date`: 締切日
- `status`: 進捗状態。`todo` / `doing` / `done`
- `priority`: 優先度。数値で高低を管理
- `created_at`: Todo作成日時
- `updated_at`: Todo更新日時

### 3. calendar_events のカラム説明
- `id`: 予定の一意ID
- `user_id`: どのユーザーの予定かを示す外部キー
- `title`: 予定名
- `start_at`: 開始日時
- `end_at`: 終了日時
- `all_day`: 終日予定かどうか
- `created_at`: 予定の登録日時

### 4. tab_sessions のカラム説明
- `id`: タブ滞在ログの一意ID
- `user_id`: どのユーザーの行動ログかを示す外部キー
- `domain`: `youtube.com` や `google.com` などのドメイン名
- `url`: 実際に開いていたページのURL
- `tab_title`: タブに表示されるページタイトル
- `started_at`: 滞在開始時刻
- `ended_at`: 滞在終了時刻
- `duration_sec`: 滞在秒数
- `is_waste`: その滞在を浪費時間として扱うかどうか
- `created_at`: ログ保存日時

### 5. alert_rules のカラム説明
- `id`: 警告ルールの一意ID
- `user_id`: どのユーザー向けの設定かを示す外部キー
- `target_domain`: 監視対象ドメイン
- `threshold_sec`: 警告を出す秒数のしきい値
- `enabled`: ルールが有効か無効か
- `created_at`: ルール登録日時

### 6. btc_price_history のカラム説明
- `id`: BTC価格履歴の一意ID
- `source`: 取得元のAPIやサービス名
- `price_jpy`: その時点のBTC価格（日本円）
- `fetched_at`: 価格を取得した時刻

### 7. waste_cost_snapshots のカラム説明
- `id`: 集計結果の一意ID
- `user_id`: どのユーザーの集計かを示す外部キー
- `period_start`: 集計開始時刻
- `period_end`: 集計終了時刻
- `wasted_seconds`: 浪費時間の合計秒数
- `btc_price_jpy`: 換算に使ったBTC価格
- `lost_amount_jpy`: 失った金額の計算結果
- `created_at`: 集計作成日時

## この設計で実現できること
- ログイン・登録: `profiles`
- Todo管理と締切表示: `todos`
- カレンダー表示: `calendar_events`
- タブごとの浪費時間グラフ: `tab_sessions`
- 一定時間超過の警告: `alert_rules`
- BTCや円換算の損失グラフ: `btc_price_history` と `waste_cost_snapshots`

