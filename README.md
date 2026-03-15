<div align="center">
  <h1>⏳ Time = Asset Dashboard</h1>
  <p><b>見えない SNS の浪費時間を可視化するプロジェクト</b></p>
</div>

<br />

## ⚙️ 1. システム構成 (モノレポ)
このリポジトリは3つのシステムが一つの場所にまとまっています。（`apps/` フォルダ内）

| フォルダ | 役割 | 技術スタック |
| :--- | :--- | :--- |
| **`apps/extension`** | SNSの視聴時間をバックグラウンドで計測します。 | Chrome Extension (JS/HTML/CSS) |
| **`apps/api`** | 時間を受け取り、現在のレートで「失った資産💰」を計算します。 | Node.js (Express) |
| **`apps/web`** | APIから計算結果を受け取り、綺麗に画面に表示します。 | Next.js (React) |

---

## 🚀 2. 開発環境のセットアップ (ハンズオン)

### ① パッケージのインストール
ターミナルを開き、この `dashboard` フォルダで以下のコマンドを入力して依存関係をインストールします。

```bash
npm install
```

### ② 開発用サーバーの起動 (API & Web)
以下のコマンド1つで、APIとWebダッシュボードの両方が立ち上がります。

```bash
npm run dev
```

- 🖥️ **Webダッシュボード**: [http://localhost:3000](http://localhost:3000)
- 🔌 **バックエンドAPI（内部）**: `http://127.0.0.1:3001`（通常は Web から `/api` 経由で利用）

*(※ 常にターミナルを開いたままにしておいてください。止める時は `Ctrl + C` を押します)*

### ③ Chrome拡張機能の読み込み
サーバーが立ち上がったら、Chromeにタイマーを追加します。

1. Chromeを開き、URLバーに `chrome://extensions/` と入力。
2. 画面右上の**「デベロッパー モード」**を**ON**にする。
3. 左上の**「パッケージ化されていない拡張機能を読み込む」**をクリック。
4. このプロジェクト内の **`apps/extension`** フォルダを選択。

これで導入完了です！あとは実際にYouTube等などを眺めると、[http://localhost:3000](http://localhost:3000) で失われた資産がリアルタイム（5秒ごと）で加算されていきます。

---

## 🛠️ 3. ハックするためのガイド (カスタマイズ)
それぞれ役割ごとに編集する場所が決まっています。

### 🎨 画面のデザインや文字を変えたい
Next.js側を編集します。保存するとブラウザが勝手にリロードされます。
- `apps/web/app/page.js` (ダッシュボードのメイン画面)
- `apps/web/app/globals.css` (色やCSSのルール)

### 💰 資産計算の式（時給やBTCレート）を変えたい
バックエンドAPIを編集します。※保存後はターミナルで `Ctrl + C` を押し、もう一度 `npm run dev` で再起動してください。
- `apps/api/index.js` (計算はすべてここで行われています)

### ⏱ 計測するSNS（例: Netflixなど）を追加したい
Chrome拡張機能を編集します。※保存後、`chrome://extensions/` 画面で「Time = Asset Dashboard」の更新ボタン（🔄）を押す必要があります。
- `apps/extension/background.js` (一番上の `TARGET_SITES` のリストに追加)
