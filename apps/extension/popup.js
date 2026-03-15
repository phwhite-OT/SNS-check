let APP_ORIGIN = 'https://sns-check.onrender.com';
let API_DASHBOARD = `${APP_ORIGIN}/api/dashboard`;
let DASHBOARD_URL = `${APP_ORIGIN}/`;

const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const authError = document.getElementById('authError');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const statsDiv = document.getElementById('stats');
const statsError = document.getElementById('statsError');
const scoreValue = document.getElementById('scoreValue');

async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['apiUrl'], (result) => {
            if (result.apiUrl) {
                APP_ORIGIN = result.apiUrl.replace(/\/api\/?$/, '');
                API_DASHBOARD = `${APP_ORIGIN}/api/dashboard`;
                DASHBOARD_URL = `${APP_ORIGIN}/`;
            }
            resolve();
        });
    });
}
const focusStatusEl = document.getElementById('focusStatus');
const focusToggleBtn = document.getElementById('focusToggleBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const syncHistoryBtn = document.getElementById('syncHistoryBtn');

let currentAuth = {
    loggedIn: false,
    userId: null,
    email: null,
};

function sendMessage(payload) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(payload, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(response);
        });
    });
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatTime(seconds) {
    const safe = Number(seconds || 0);
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);

    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function setAuthError(message) {
    authError.textContent = message || '';
    authError.classList.toggle('is-visible', Boolean(message));
}

function setStatsError(message) {
    statsError.textContent = message || '';
    statsError.classList.toggle('is-visible', Boolean(message));
}

function setLoginBusy(isBusy) {
    loginBtn.disabled = isBusy;
    loginBtn.textContent = isBusy ? 'ログイン中...' : 'ログイン';
}

function renderAuthView(auth) {
    currentAuth = {
        loggedIn: Boolean(auth?.loggedIn),
        userId: auth?.userId || null,
        email: auth?.email || null,
    };

    if (currentAuth.loggedIn && currentAuth.userId) {
        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
        userEmail.textContent = currentAuth.email || currentAuth.userId;
        setAuthError('');
        return;
    }

    loginView.classList.remove('hidden');
    appView.classList.add('hidden');
    scoreValue.textContent = '--';
    statsDiv.innerHTML = '<p class="muted">ログイン後に利用状況を表示します。</p>';
    setStatsError('');
    renderFocusStatus({ enabled: false, requiresLogin: true });
}

function renderFocusStatus(status) {
    const requiresLogin = !currentAuth.loggedIn || Boolean(status?.requiresLogin);
    if (requiresLogin) {
        focusStatusEl.textContent = 'ログイン後に集中モードを操作できます。';
        focusToggleBtn.textContent = 'ログインしてください';
        focusToggleBtn.disabled = true;
        return;
    }

    const enabled = Boolean(status?.enabled);
    focusStatusEl.textContent = enabled
        ? '現在: ON（ブラックリストを即ロック）'
        : '現在: OFF';
    focusToggleBtn.textContent = enabled
        ? '集中モードをOFFにする'
        : '集中モードをONにする';
    focusToggleBtn.disabled = false;
}

async function refreshFocusStatus() {
    if (!currentAuth.loggedIn) {
        renderFocusStatus({ enabled: false, requiresLogin: true });
        return;
    }

    try {
        const status = await sendMessage({ type: 'focusMode:getStatus' });
        renderFocusStatus(status || { enabled: false });
    } catch (_error) {
        renderFocusStatus({ enabled: false });
    }
}

function renderStats(data) {
    scoreValue.textContent = Number.isFinite(Number(data?.score))
        ? String(Math.round(Number(data.score)))
        : '--';

    const rows = Object.entries(data?.timeData || {})
        .filter(([, seconds]) => Number(seconds) > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 5);

    if (rows.length === 0) {
        statsDiv.innerHTML = '<p class="muted">今日はまだSNS浪費がありません。良いペースです。</p>';
        return;
    }

    statsDiv.innerHTML = rows
        .map(([site, seconds]) => {
            const safeSite = escapeHtml(site.charAt(0).toUpperCase() + site.slice(1));
            const safeTime = escapeHtml(formatTime(Number(seconds)));
            const penalty = escapeHtml(String(Math.floor(Number(seconds))));
            return `
                <div class="stat-row">
                    <span class="site">${safeSite}</span>
                    <span class="time">${safeTime} (-${penalty})</span>
                </div>
            `;
        })
        .join('');
}

async function loadDashboard() {
    if (!currentAuth.loggedIn || !currentAuth.userId) return;

    setStatsError('');
    statsDiv.innerHTML = '<p class="muted">データを取得しています...</p>';

    try {
        const response = await fetch(API_DASHBOARD, {
            headers: {
                'x-user-id': currentAuth.userId,
            },
        });

        if (!response.ok) {
            throw new Error(`Dashboard API Error: ${response.status}`);
        }

        const data = await response.json();
        renderStats(data);
    } catch (_error) {
        setStatsError('ダッシュボード情報の取得に失敗しました。');
        statsDiv.innerHTML = '<p class="muted">接続を確認して再度お試しください。</p>';
    }
}

async function refreshAuthState() {
    try {
        await loadConfig();
        const auth = await sendMessage({ type: 'auth:getState' });
        renderAuthView(auth);
        if (auth?.loggedIn) {
            await loadDashboard();
            await refreshFocusStatus();
        }
    } catch (_error) {
        setAuthError('拡張機能の状態取得に失敗しました。');
    }
}

loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setAuthError('');

    const email = String(emailInput.value || '').trim();
    const password = String(passwordInput.value || '');

    if (!email || !password) {
        setAuthError('メールアドレスとパスワードを入力してください。');
        return;
    }

    try {
        setLoginBusy(true);
        const result = await sendMessage({
            type: 'auth:login',
            email,
            password,
        });

        if (!result?.ok) {
            setAuthError(result?.error || 'ログインに失敗しました。');
            return;
        }

        passwordInput.value = '';
        renderAuthView(result.auth);
        await loadDashboard();
        await refreshFocusStatus();
    } catch (error) {
        console.error('Extension login flow failed:', error);
        setAuthError(error?.message || 'ログイン処理中にエラーが発生しました。');
    } finally {
        setLoginBusy(false);
    }
});

logoutBtn?.addEventListener('click', async () => {
    try {
        const result = await sendMessage({ type: 'auth:logout' });
        if (!result?.ok) {
            setAuthError(result?.error || 'ログアウトに失敗しました。');
            return;
        }

        emailInput.value = '';
        passwordInput.value = '';
        renderAuthView(result.auth);
    } catch (_error) {
        setAuthError('ログアウト処理に失敗しました。');
    }
});

focusToggleBtn?.addEventListener('click', async () => {
    if (!currentAuth.loggedIn) return;

    try {
        const current = await sendMessage({ type: 'focusMode:getStatus' });
        const nextEnabled = !Boolean(current?.enabled);
        const result = await sendMessage({
            type: 'focusMode:setEnabled',
            enabled: nextEnabled,
        });

        if (!result?.ok) {
            setStatsError(result?.error || '集中モードの更新に失敗しました。');
            return;
        }

        setStatsError('');
        renderFocusStatus(result.status || { enabled: nextEnabled });
    } catch (_error) {
        setStatsError('集中モードの更新に失敗しました。');
    }
});

syncHistoryBtn?.addEventListener('click', async () => {
    if (!currentAuth.loggedIn) return;

    const originalLabel = syncHistoryBtn.textContent;
    syncHistoryBtn.disabled = true;
    syncHistoryBtn.textContent = '同期中...';

    try {
        const result = await sendMessage({ action: 'syncHistory' });
        if (!result?.success) {
            throw new Error(result?.error || 'sync failed');
        }
        setStatsError('');
    } catch (_error) {
        setStatsError('履歴同期に失敗しました。');
    } finally {
        syncHistoryBtn.disabled = false;
        syncHistoryBtn.textContent = originalLabel;
    }
});

dashboardBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
});

refreshAuthState();
