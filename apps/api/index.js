const express = require('express');
const cors = require('cors');

// Expressアプリケーションの作成（ここがサーバーの本体です）
const app = express();
// 起動するポート番号（環境変数があればそれ、なければ3001番ポートを使います）
const PORT = process.env.PORT || 3001;

// CORS（Cross-Origin Resource Sharing）の設定
// これがないと、Chrome拡張機能やNext.js（別のアドレス）からこのAPIを呼び出せません。
app.use(cors());

// 送られてきたJSONデータを受け取れるようにする設定
app.use(express.json());

// --- データ保存エリア ---
// MVP（最小構成）のため、今回はデータベース（MySQLやFirebaseなど）を使わず、
// サーバーのメモリ上に一時的にデータを保存します。（サーバーを再起動すると消えます）
let timeData = {
  youtube: 0,
  x: 0,
  instagram: 0,
  tiktok: 0
};

// --- 仮の仮想通貨レート ---
// 実際のCoinGecko APIは呼び出し回数制限（レートリミット）にかかりやすいため、
// ハッカソンの開発中は仮の固定レート（1BTC = 10,500,000円）を使用しています。
// [TODO]: 本番運用時はここを実際のAPIリクエストに書き換えてください！
const MOCK_BTC_JPY = 10500000;

// サーバーが生きているか確認するためのテスト用アドレス (http://localhost:3001/api/status)
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Chrome拡張機能から「これだけSNS見たよ！」という時間データを受け取るアドレス
app.post('/api/time', (req, res) => {
  // 送られてきたデータ（リクエストのボディ）から、サイト名（site）と時間（time）を取り出します
  const { site, time } = req.body;

  // もし知っているサイト名なら、そのサイトの合計時間に「time」を足す
  if (timeData.hasOwnProperty(site)) {
    timeData[site] += typeof time === 'number' ? time : 0;
  } else {
    // 知らないサイト名（新しく追加されたサイトなど）なら、新しく登録する
    timeData[site] = typeof time === 'number' ? time : 0;
  }

  // 「無事に受け取ったよ」という返事を返す
  res.json({ success: true, data: timeData });
});

// Next.js（Webダッシュボード）から「今のデータちょうだい！」と呼ばれるアドレス
app.get('/api/dashboard', (req, res) => {
  // すべてのSNSの閲覧時間を合計する（総消費時間: 秒）
  const totalSeconds = Object.values(timeData).reduce((a, b) => a + b, 0);

  // --- 💸 資産価値の計算ロジック ---
  // 仮の時給を1000円として計算します。（1時間は3600秒）
  // [TODO]: ゆくゆくはユーザーごとに時給を設定できるようにするのもアリ！
  const hourlyRateJpy = 1000;
  const lostValueJpy = (totalSeconds / 3600) * hourlyRateJpy;

  // 円をビットコイン（BTC）に換算します
  const lostValueBtc = lostValueJpy / MOCK_BTC_JPY;

  // 計算したすべての結果を、ダッシュボードに返してあげます
  res.json({
    totalTimeSeconds: totalSeconds, // 合計時間（秒）
    timeData,                       // サイトごとの内訳データ
    assets: {
      jpy: Math.floor(lostValueJpy), // 切り捨てた円の価値
      btc: lostValueBtc.toFixed(8)   // BTCは小数点第8位まで表示
    },
    rates: {
      btc: MOCK_BTC_JPY              // 現在計算に使ったレート
    }
  });
});

// 設定したポート（3001番）でサーバーを待ち受け（起動）状態にします
app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
