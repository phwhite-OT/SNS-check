# Supabase 認証実装ガイド

このドキュメントは、SNS-Check アプリケーションに実装された Supabase 認証機能について説明します。

## 概要

メインのURLにアクセスした際に、保存されたログイン情報（セッション）を自動確認し：
- **セッションあり** → ダッシュボードを表示
- **セッションなし** → ログイン画面を表示

という一般的なログイン機能を実装しました。

## ファイル構成

### フロントエンド (Next.js)

#### 1. **app/page.js** - メインページ（セッション確認ロジック）
```javascript
- ページロード時に /api/auth/me でセッション確認
- ログイン状態に応じて画面を切り替え
- ローディング中は スピナー表示
```

#### 2. **components/LoginPage.js** - ログイン画面
```javascript
- メールアドレス・パスワード入力フォーム
- ログインボタン
- 新規登録ボタン
- エラーメッセージ表示
```

#### 3. **components/Dashboard.js** - ダッシュボード
```javascript
- 既存のタスク管理機能
- ユーザー情報表示（メールアドレス）
- ログアウトボタン
```

#### 4. **lib/supabase/client.js** - Supabase クライアント設定
```javascript
- ブラウザ環境用のクライアント初期化
```

#### 5. **lib/supabase/server.js** - Supabase サーバー設定
```javascript
- Server Component 用の設定
```

#### 6. **app/api/auth/*** - Next.js API ルート

| エンドポイント | 方法 | 説明 |
|---|---|---|
| `/api/auth/login` | POST | ログイン処理 |
| `/api/auth/signup` | POST | 新規登録処理 |
| `/api/auth/me` | GET | 現在のセッション確認 |
| `/api/auth/logout` | POST | ログアウト処理 |

### バックエンド (Node.js/Express)

#### 1. **src/services/authService.js** - 認証サービス
```javascript
- signup() - Supabase でユーザー登録
- login() - Supabase でログイン
- getUserFromToken() - トークン検証してユーザー情報取得
- sendPasswordResetEmail() - パスワードリセット
```

#### 2. **src/controllers/authController.js** - 認証コントローラ
```javascript
- signup ハンドラ
- login ハンドラ
- getMe ハンドラ（トークン検証）
- logout ハンドラ
```

#### 3. **src/routes/auth/index.js** - 認証ルート定義
```javascript
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
```

## 環境変数設定

### Web アプリ (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
# 任意: 外部APIを使う場合のみ設定
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### API サーバー (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
# API は 127.0.0.1:3001 で固定起動（PORT は Next.js 側で利用）
```

## セットアップ手順

### 1. Supabase プロジェクト作成
1. [supabase.com](https://supabase.com) にアクセス
2. 新規プロジェクト作成
3. API キーを取得（`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`）

### 2. 環境変数設定
```bash
# Web アプリ
cp apps/web/.env.example apps/web/.env.local
# 取得した API キーを入力

# API サーバー
cp apps/api/.env.example apps/api/.env
# 取得した API キーを入力
```

### 3. パッケージインストール
```bash
# Web アプリ
npm install -w apps/web

# API サーバー
npm install -w apps/api
```

### 4. アプリケーション起動
```bash
# ルートで API + Web を同時起動
npm run dev
```

## 認証フロー

### ログインフロー
```
1. ユーザーがログイン画面にメール・パスワース入力
         ↓
2. LoginPage.js が /api/auth/login に POST リクエスト
         ↓
3. Next.js API が Node.js API に POST リクエスト
         ↓
4. authService.signup/login が Supabase に認証リクエスト
         ↓
5. Supabase がユーザー作成・セッション返却
         ↓
6. Next.js API がセッションをクッキーに保存
         ↓
7. LoginPage が成功コールバック実行 → Dashboard 表示
```

### 自動ログイン フロー
```
1. ページロード時
         ↓
2. page.js が useEffect で /api/auth/me GET リクエスト
         ↓
3. Next.js API がクッキーからトークン取得
         ↓
4. Node.js API が Supabase に検証リクエスト
         ↓
5. トークン有効 → ユーザー情報返却
         ↓
6. Dashboard 表示
```

## セッション保存方式

- **保存場所**: ブラウザクッキー（httpOnly）
- **保存データ**: 
  - `supabase-token`: アクセストークン（Supabase 検証用）
  - `user-id`: ユーザー ID（ブラウザからアクセス可能）
- **有効期限**: 7日間
- **セキュリティ**: 
  - `httpOnly=true` （XSS 対策）
  - `sameSite=lax` （CSRF 対策）

## トラブルシューティング

### "ログインに失敗しました" エラー
- Supabase の API キーが正しいか確認
- ユーザーが Supabase（メール確認など）に登録されているか確認
- API サーバーが実行中か確認 (`npm run dev -w apps/api`)

### セッション確認がうまくいかない
1. ブラウザの開発者ツール → Application → Cookies を確認
2. `supabase-token` と `user-id` がセットされているか確認
3. コンソールエラーを確認

### CORS エラー
- まず Web 側からは `/api/*` の同一オリジン経由になっているか確認
- API サーバーで CORS が有効になっているか確認
- `apps/api/src/app.js` に `const cors = require('cors');` と `app.use(cors());` があるか確認

## API 仕様

### POST /api/auth/login
**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス (成功):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

### POST /api/auth/signup
**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### GET /api/auth/me
**ヘッダー:**
```
Authorization: Bearer <token>
```

**レスポンス (ログイン済み):**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**レスポンス (ログイン未実施):**
```json
{
  "authenticated": false,
  "user": null
}
```

### POST /api/auth/logout
**レスポンス:**
```json
{
  "message": "ログアウトしました"
}
```

## セキュリティに関する注意

1. **本番環境では HTTPS を使用してください**
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY は公開情報だが、セキュリティルールで保護すること**
3. **SUPABASE_SERVICE_ROLE_KEY は絶対に公開しないこと**
4. **クッキーの `secure` フラグは本番環境で true にすること**

## 今後の改善案

- [ ] メール確認機能の実装
- [ ] パスワードリセット機能
- [ ] 2段階認証（2FA）
- [ ] ソーシャルログイン（Google, GitHub など）
- [ ] ユーザー プロフィール編集機能
- [ ] セッション管理UI（複数デバイスログイン管理）
