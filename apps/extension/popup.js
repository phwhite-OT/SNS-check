// APIサーバーからデータを取得するためのURL
const API_DASHBOARD = 'http://localhost:3001/api/dashboard';

// 「View Full Dashboard」ボタンがクリックされた時の処理
// 新しいタブでWebダッシュボード（localhost:3000）を開きます
document.getElementById('dashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
});

// 秒数を「○h ○m」のような分かりやすい時間フォーマットに変換する関数
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);           // 時間（1時間は3600秒）
    const m = Math.floor((seconds % 3600) / 60);    // 残りの秒数から分を計算

    // 1時間以上見ていれば「1h 30m」のように表示、それ以下なら「30m」のように表示
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// 🌐 APIにアクセスして最新のデータを取得する
fetch(API_DASHBOARD)
    .then(res => res.json()) // 帰ってきたデータをJSON形式に変換
    .then(data => {
        // データを書き込むためのHTMLの場所（<div id="stats">）を取得
        const statsDiv = document.getElementById('stats');

        // --- 1. データが空っぽ（0秒）の時の処理 ---
        // data.timeDataが無いか、全部合計しても0秒だった場合
        if (!data.timeData || Object.values(data.timeData).reduce((a, b) => a + b, 0) === 0) {
            statsDiv.innerHTML = '<p style="color:#aaa">No data yet. Go browse some SNS!</p>';
            return; // ここで処理を終了
        }

        // --- 2. データがある時の処理 ---
        let html = ''; // 画面に表示するHTMLを組み立てるための入れ物

        // サイトごとの内訳ループ（例: site="youtube", seconds=1200）
        for (const [site, seconds] of Object.entries(data.timeData)) {
            if (seconds > 0) {
                // サイトの頭文字を大文字にする（例：youtube → Youtube）
                const siteName = site.charAt(0).toUpperCase() + site.slice(1);

                // HTMLを組み立てて追加していく
                html += `
          <div class="stat-row">
            <span>${siteName}</span>
            <span>${formatTime(seconds)}</span>
          </div>
        `;
            }
        }

        // 最後に「損した金額💸」を赤色で強調して追加！
        html += `
      <div class="stat-row" style="margin-top: 15px; background: #331111;">
        <span style="color: #ffaaaa">Lost Value</span>
        <span style="color: #ff5555; font-weight: bold">¥${data.assets.jpy.toLocaleString()}</span>
      </div>
    `;

        // 組み立てたHTMLを画面（statsDiv）に流し込む！
        statsDiv.innerHTML = html;
    })
    .catch(err => {
        // もしAPIサーバーと通信できなかったら（サーバーが起動していないなど）
        // エラーメッセージを表示する
        document.getElementById('stats').innerHTML =
            '<p style="color: #ff5555">Cannot connect to backend... Is `npm run dev` running?</p>';
    });
