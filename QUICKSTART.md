# 🚀 SNS-Check 認証機能 クイックスタートガイド

## 📋 前提条件

- Node.js 18+
- npm 9+
- Supabase アカウント

## 🔑 Step 1: Supabase セットアップ

### 1.1 Supabase プロジェクト作成
1. [supabase.com](https://supabase.com) にアクセス
2. 「New Project」をクリック
3. 以下を設定：
   - **Project Name**: `sns-check` (任意)
   - **Database Password**: 安全なパスワード設定
   - **Region**: Tokyo（または最寄り）
4. プロジェクト作成完了まで待機

### 1.2 API キー取得
1. 作成したプロジェクトを開く
2. 左サイドバー → **Settings** → **API**
3. 以下をコピー：
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 Step 2: 環境変数設定

### 2.1 Web アプリの設定
```bash
cd apps/web
cp .env.example .env.local
```

`.env.local` を編集：
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...（Supabase から取得）
# 任意: 外部APIを使う場合のみ設定
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2.2 API サーバーの設定
```bash
cd apps/api
cp .env.example .env
```

`.env` を編集：
```env
SUPABASE_URL=https://your-project-xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...（Supabase から取得）
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...（Supabase から取得）
# API は 127.0.0.1:3001 で固定起動（PORT は Next.js 側で利用）
DEFAULT_USER_ID=00000000-0000-0000-0000-000000000000
DEFAULT_SCORE_BASE=1000
SCORE_RECOVERY_PER_DONE_TODO=50
SCORE_PENALTY_PER_SECOND=1
```

## 🏃 Step 3: アプリケーション起動

### 3.1 API + Web を同時起動
```bash
npm run dev
```

✅ 以下のメッセージが出れば成功：
```
API Server running internally on http://127.0.0.1:3001
- Local:        http://localhost:3000
```

## 🧪 Step 4: 動作確認

### 4.1 ログイン画面を確認
1. ブラウザで http://localhost:3000 にアクセス
2. ログイン画面が表示されることを確認

### 4.2 新規登録をテスト
1. **新規登録**ボタンをクリック
2. テスト用メール・パスワードを入力：
   ```
   メール: test@example.com
   パスワード: TestPassword123!
   ```
3. 「確認メールを送信しました」と表示されることを確認

### 4.3 ログインをテスト
1. ログイン画面で登録したメール・パスワードを入力
2. ダッシュボードが表示されることを確認

### 4.4 セッション永続化をテスト
1. ログイン状態で F5 でページをリロード
2. ログイン画面を経由せずダッシュボードが表示されることを確認
3. ログイン情報が保持されていることが分かります

### 4.5 ログアウトをテスト
1. ダッシュボードのサイドバー下部「ログアウト」をクリック
2. ログイン画面に戻ることを確認

## 📞 トラブルシューティング

### ❌ "ログインに失敗しました" エラーの場合

**原因1: Supabase API キーが間違っている**
```bash
# .env.local と .env を確認
grep SUPABASE apps/web/.env.local
grep SUPABASE apps/api/.env
```

**原因2: API サーバーが起動していない**
```bash
npm run dev
```

**原因3: ユーザーが勝手に確認待ちの場合**
- Supabase ダッシュボード → Authentication → Users
- ユーザーの `email_confirmed_at` が NULL でないか確認

### ❌ "セッション確認エラー" が出る
1. ブラウザの開発者ツール (F12) を開く
2. Application → Cookies を確認
3. `supabase-token` クッキーが設定されているか確認

### ❌ CORS エラーが出る
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解決:**
- ルートで `npm run dev` を起動し、`API Server running internally on http://127.0.0.1:3001` が表示されるか確認
- `apps/api/src/app.js` に `app.use(cors());` があるか確認

## 📚 次のステップ

実装が完了しました！以下のドキュメントを参照してください：

- [認証実装の詳細ガイド](./AUTHENTICATION_GUIDE.md)
- [API 仕様書](./endpoint.md)

## ✨ 実装された機能

- ✅ メール・パスワード認証
- ✅ 自動ログイン（セッション保存）
- ✅ 新規登録機能
- ✅ ログアウト機能
- ✅ エラーハンドリング
- ✅ XSS/CSRF 対策

## 🔐 本番環境への注意

本番環境にデプロイする前に、以下を確認してください：

- [ ] HTTPS を有効化
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` は公開して OK（セキュリティルール保護）
- [ ] `SUPABASE_SERVICE_ROLE_KEY` は絶対に公開しない
- [ ] クッキーの `secure` フラグを有効化
- [ ] Supabase のセキュリティルールを設定
- [ ] 環境変数を本番環境に合わせて変更

## 💡 こんなときは?

**メール確認機能を有効化したい場合:**
- Supabase ダッシュボード → Authentication → Email → Confirm email
- メール設定を行う

**パスワードリセット機能を追加したい場合:**
- `authService.sendPasswordResetEmail()` は実装済み
- API エンドポイント `/api/auth/forgot-password` を追加して使用可能

**ソーシャルログインを追加したい場合:**
- Supabase が Google, GitHub, Discord 等をサポート
- `authService.js` に OAuth メソッド追加で実装可能

---

質問や問題がある場合は、コンソールのエラーメッセージを確認してください。
