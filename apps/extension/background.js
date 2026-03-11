// 🎯 計測したい対象のSNSサイト一覧
// 'URLの一部': '保存する時のキー名'
const TARGET_SITES = {
    'youtube.com': 'youtube',
    'twitter.com': 'x',
    'x.com': 'x',
    'instagram.com': 'instagram',
    'tiktok.com': 'tiktok'
};

// 📡 APIサーバーの送信先アドレス
// [TODO]: 本番環境や別のPCで動かすときはここを変更します
const API_ENDPOINT = 'http://localhost:3001/api/time';

// --- 状態を管理するための変数 ---
let activeTabId = null; // 今見ているタブのID
let activeSite = null;  // 今見ているSNSの名前（TARGET_SITESのキー名）
let startTime = null;   // そのSNSを見始めた時間

// 1. タブが切り替わった時（別のタブを見始めた時）に実行される処理
chrome.tabs.onActivated.addListener((activeInfo) => {
    handleTabSwitch(activeInfo.tabId);
});

// 2. タブの中身が更新された時（URLが変わったなど）に実行される処理
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        handleTabSwitch(tabId);
    }
});

// 3. ブラウザのウィンドウ自体のフォーカス（選択状態）が変わった時に実行される処理
// （別のアプリを開いた時など、ブラウザを見ていない時間は計測から外すため）
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // ブラウザから離れた場合
        handleTabSwitch(null);
    } else {
        // ブラウザに再び戻ってきた場合、今アクティブなタブを探す
        chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
            if (tabs[0]) handleTabSwitch(tabs[0].id);
        });
    }
});

// ⏳ --- 時間の計測・計算を行うメインの関数 ---
function handleTabSwitch(tabId) {
    // もし今まで特定のSNSを見ていたなら、その時間を計算して保存する
    if (activeSite && startTime) {
        // (今 - 見始めた時間) / 1000 = 何秒見ていたか
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed > 0) {
            saveTime(activeSite, elapsed);
        }
    }

    // 次の計測のために状態を一度リセットする
    activeTabId = tabId;
    activeSite = null;
    startTime = null;

    // 新しく見始めたタブのURLをチェックする
    if (tabId) {
        chrome.tabs.get(tabId, (tab) => {
            // エラー時やURLが無いページ（設定画面など）は何もしない
            if (chrome.runtime.lastError || !tab.url) return;

            try {
                // URLを解析します
                const url = new URL(tab.url);
                // 計測したいサイト（TARGET_SITES）と一致するかパトロール
                for (const [domain, siteName] of Object.entries(TARGET_SITES)) {
                    if (url.hostname.includes(domain)) {
                        activeSite = siteName;    // ターゲット発見！サイト名を記録。
                        startTime = Date.now();   // 見始めた時間を記録。タイマースタート！
                        break;
                    }
                }
            } catch (e) {
                // 解読不能な特殊なURL（chrome://~ など）は無視する
            }
        });
    }
}

// 💾 --- ブラウザの中に時間を保存する関数 ---
function saveTime(site, seconds) {
    chrome.storage.local.get([site], (result) => {
        // 過去のデータがあればそれに足し、なければ0から足す
        const current = result[site] || 0;
        chrome.storage.local.set({ [site]: current + seconds });
    });
}

// ⏰ --- 定期的にバックエンド（API）にデータを送信する設定 ---
// 「1分ごと」にアラームをセットします
chrome.alarms.create('syncTime', { periodInMinutes: 1 });

// アラームが鳴ったら syncToApi() を実行する
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'syncTime') {
        syncToApi();
    }
});

// 🚀 --- バックエンド（API）にデータを送信する関数 ---
function syncToApi() {
    // もしまだ対象のSNSを見続けている最中なら、これまでの時間を一旦保存してタイマーをリセット
    if (activeSite && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        saveTime(activeSite, elapsed);
        startTime = Date.now(); // タイマーリスタート
    }

    // ブラウザに保存されているすべてのデータを取得
    chrome.storage.local.get(null, (items) => {
        // [サイト名, 閲覧時間] のペアを一つずつ取り出す
        Object.entries(items).forEach(([site, time]) => {
            // もし少しでも見ていた時間（1秒以上）があればAPIへ送る
            if (time > 0) {
                fetch(API_ENDPOINT, {
                    method: 'POST', // データを「送る」時はPOSTを使います
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ site, time })
                })
                    .then(response => {
                        // もし無事にAPIへ送信できたら、ブラウザの記録を0秒にリセットする
                        if (response.ok) {
                            chrome.storage.local.set({ [site]: 0 });
                        }
                    })
                    .catch(err => console.error('Time Sync failed', err)); // エラー表示
            }
        });
    });
}
