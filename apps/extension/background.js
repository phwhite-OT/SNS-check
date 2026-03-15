// 📡 APIサーバーの送信先アドレス
const API_BASE = 'http://localhost:3001/api';
const API_ENDPOINT = `${API_BASE}/time`;
// TODO: Supabaseの profiles.id（実在UUID）に置き換えてください。
const X_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

// API取得不可でも最低限ロックできるフォールバック
const FALLBACK_TARGET_SITES = {
    'youtube.com': 'YouTube',
    'x.com': 'X',
    'twitter.com': 'Twitter',
    'instagram.com': 'Instagram',
    'tiktok.com': 'TikTok',
};

// 動的なターゲットサイト一覧
let targetSites = { ...FALLBACK_TARGET_SITES };

// 🎯 集中モード（ONの時だけ即ロック）
let focusModeEnabled = false;

function loadFocusModeState() {
    chrome.storage.local.get(['focusModeEnabled'], (result) => {
        focusModeEnabled = !!result.focusModeEnabled;
    });
}

function setFocusModeEnabled(enabled) {
    focusModeEnabled = !!enabled;
    if (!focusModeEnabled) {
        // OFF時はロック履歴もクリアして誤挙動を防ぐ
        lockedTabs.clear();
    }
    chrome.storage.local.set({ focusModeEnabled });
}

// 🔒 すでにロック画面を表示したタブ（重複発動防止）
const lockedTabs = new Set();

// バックエンドからブラックリストを取得する関数
async function fetchBlacklist() {
    try {
        const res = await fetch(`${API_BASE}/blacklist`, {
            headers: {
                'x-user-id': X_USER_ID,
            },
        });
        if (res.ok) {
            const list = await res.json();
            const newSites = {};
            list.forEach(item => {
                newSites[item.domain] = item.name;
            });
            targetSites = Object.keys(newSites).length > 0 ? newSites : { ...FALLBACK_TARGET_SITES };
        }
    } catch (e) {
        targetSites = { ...FALLBACK_TARGET_SITES };
    }
}

// 起動時にブラックリストを取得
fetchBlacklist();
loadFocusModeState();
syncFocusModeFromApi();

// ダッシュボードの集中モード状態をAPIから同期
async function syncFocusModeFromApi() {
    try {
        const res = await fetch(`${API_BASE}/focus-mode`, {
            headers: {
                'x-user-id': X_USER_ID,
            },
        });
        if (!res.ok) return;

        const json = await res.json();
        // 休憩フェーズ中はロックしない
        const shouldLock = !!json.enabled && json.phase !== 'break';

        if (shouldLock !== focusModeEnabled) {
            setFocusModeEnabled(shouldLock);
            if (focusModeEnabled) {
                checkCurrentActiveTab();
            }
        }
    } catch (e) {
        // API停止時はローカル状態維持
    }
}

// --- 状態を管理するための変数 ---
let activeTabId = null; // 今見ているタブのID
let activeSite = null;  // 今見ているSNSの名前（TARGET_SITESのキー名）
let startTime = null;   // そのSNSを見始めた時間

function checkCurrentActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) return;
        if (tabs[0]?.id) handleTabSwitch(tabs[0].id);
    });
}

// 1. タブが切り替わった時（別のタブを見始めた時）に実行される処理
chrome.tabs.onActivated.addListener((activeInfo) => {
    syncFocusModeFromApi()
        .finally(() => {
            handleTabSwitch(activeInfo.tabId);
        });
});

// 2. タブの中身が更新された時（URLが変わったなど）に実行される処理
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && !changeInfo.url.includes('blocked.html')) {
        lockedTabs.delete(tabId);
    }

    if (changeInfo.url && tab?.active) {
        syncFocusModeFromApi()
            .finally(() => {
                handleTabSwitch(tabId);
            });
        return;
    }

    if (tabId === activeTabId && changeInfo.url) {
        syncFocusModeFromApi()
            .finally(() => {
                handleTabSwitch(tabId);
            });
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
            if (tabs[0]) {
                syncFocusModeFromApi()
                    .finally(() => {
                        handleTabSwitch(tabs[0].id);
                    });
            }
        });
    }
});

// Popupとの通信（集中モードON/OFF）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === 'focusMode:getStatus') {
        sendResponse({ enabled: focusModeEnabled });
        return;
    }

    if (message.type === 'focusMode:setEnabled') {
        setFocusModeEnabled(message.enabled);
        if (focusModeEnabled) {
            checkCurrentActiveTab();
        }
        sendResponse({ enabled: focusModeEnabled });
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
                // 計測したいサイト（targetSites）と一致するかパトロール
                for (const [domain, siteName] of Object.entries(targetSites)) {
                    if (url.hostname.includes(domain)) {
                        activeSite = siteName;    // ターゲット発見！サイト名を記録。
                        startTime = Date.now();   // 見始めた時間を記録。タイマースタート！

                        // OFF時は絶対にロックしない
                        if (!focusModeEnabled) {
                            break;
                        }

                        // 🎯 集中モードONの時だけ即ロック
                        if (focusModeEnabled && !lockedTabs.has(tabId)) {
                            triggerLockScreen(tabId, siteName);
                        }
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

// ⏰ --- 定期的にバックエンド（API）にデータを送信・取得する設定 ---
// 「5秒ごと」に同期、「1分ごと」にブラックリスト更新
chrome.alarms.create('syncTime', { periodInMinutes: 1 / 12 });
chrome.alarms.create('fetchBlacklist', { periodInMinutes: 1 });
chrome.alarms.create('syncFocusMode', { periodInMinutes: 1 / 12 });

// アラームが鳴った時の処理
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'syncTime') {
        syncToApi();
    } else if (alarm.name === 'fetchBlacklist') {
        fetchBlacklist();
    } else if (alarm.name === 'syncFocusMode') {
        syncFocusModeFromApi();
    }
});

// 🔒 --- ロック画面を表示する関数 ---
function triggerLockScreen(tabId, siteName) {
    // 二重安全策: OFFならロックしない
    if (!focusModeEnabled) return;

    // 重複防止フラグをセット
    lockedTabs.add(tabId);

    // アクティブ計測をリセット（onUpdated が発火してもタイマーが二重にならないように）
    activeSite = null;
    startTime = null;

    const blockedUrl = chrome.runtime.getURL(
        `blocked.html?site=${encodeURIComponent(siteName)}&limit=集中モード&elapsed=集中モード`
    );

    chrome.tabs.update(tabId, { url: blockedUrl });
    console.log(`🔒 LOCKED: ${siteName} (tabId=${tabId})`);
}

// 🔒 --- タブが閉じられたらトラッキングデータをクリーンアップ ---
chrome.tabs.onRemoved.addListener((tabId) => {
    lockedTabs.delete(tabId);
});

// �🚀 --- バックエンド（API）にデータを送信する関数 ---
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
                        'Content-Type': 'application/json',
                        'x-user-id': X_USER_ID,
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
