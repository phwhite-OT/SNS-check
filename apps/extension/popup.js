// 📡 APIサーバーの設定（自動同期またはフォールバック）
let API_BASE = 'http://localhost:3001/api';
let X_USER_ID = 'b186ec48-06dd-4844-b29d-ab987e2b5989';

async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['apiUrl', 'userId'], (result) => {
            if (result.apiUrl) API_BASE = result.apiUrl;
            if (result.userId) X_USER_ID = result.userId;
            resolve();
        });
    });
}

const focusStatusEl = document.getElementById('focusStatus');
const focusToggleBtn = document.getElementById('focusToggleBtn');

function renderFocusStatus(status) {
    const enabled = !!status?.enabled;
    focusStatusEl.textContent = enabled
        ? '現在: ON（ブラックリストを即ロック）'
        : '現在: OFF';
    focusToggleBtn.textContent = enabled
        ? '集中モードをOFFにする'
        : '集中モードをONにする';
}

function refreshFocusStatus() {
    chrome.runtime.sendMessage({ type: 'focusMode:getStatus' }, (status) => {
        if (chrome.runtime.lastError) return;
        renderFocusStatus(status);
    });
}

focusToggleBtn?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'focusMode:getStatus' }, (current) => {
        if (chrome.runtime.lastError) return;
        chrome.runtime.sendMessage(
            { type: 'focusMode:setEnabled', enabled: !current?.enabled },
            (status) => {
                if (chrome.runtime.lastError) return;
                renderFocusStatus(status);
            }
        );
    });
});

// 秒数を「○h ○m」のような分かりやすい時間フォーマットに変換する関数
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// 新しいタブでWebダッシュボード（localhost:3000）を開きます
document.getElementById('dashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
});

// 🌐 APIにアクセスして最新のデータを取得する
async function init() {
    await loadConfig();
    refreshFocusStatus();

    fetch(`${API_BASE}/dashboard`, {
        headers: {
            'x-user-id': X_USER_ID,
        },
    })
        .then(res => res.json())
        .then(data => {
            const statsDiv = document.getElementById('stats');

            let html = '';

            // スコア表示
            html += `
              <div class="stat-row" style="margin-bottom: 15px; background: #1e3a8a;">
                <span style="color: #93c5fd; font-weight: bold;">Current Score</span>
                <span style="color: #ffffff; font-weight: bold; font-size: 1.2em;">${data.score}</span>
              </div>
            `;

            // サイトごとの内訳ループ
            if (data.timeData) {
                let hasTimeData = false;
                for (const [site, seconds] of Object.entries(data.timeData)) {
                    if (seconds > 0) {
                        hasTimeData = true;
                        // 時間をそのままスコア減少分として扱う想定
                        const penalty = seconds;
                        const siteName = site.charAt(0).toUpperCase() + site.slice(1);
                        html += `
                          <div class="stat-row">
                            <span>${siteName}</span>
                            <span style="color: #ef4444">${formatTime(seconds)} (-${penalty})</span>
                          </div>
                        `;
                    }
                }
                if (!hasTimeData) {
                    html += '<p style="color:#aaa; font-size: 0.9em;">No time wasted today! Good job.</p>';
                }
            }

            statsDiv.innerHTML = html;
        })
        .catch(err => {
            document.getElementById('stats').innerHTML =
                '<p style="color: #ff5555">Cannot connect to backend... Is `npm run dev` running?</p>';
        });
}

init();
