const APP_ORIGIN = 'https://sns-check.onrender.com';
const API_BASE = `${APP_ORIGIN}/api`;
const API_ENDPOINT = `${API_BASE}/time`;
const AUTH_STORAGE_KEY = 'authState';
const FOCUS_MODE_STORAGE_KEY = 'focusModeEnabled';

const FALLBACK_TARGET_SITES = {
    'youtube.com': 'youtube',
    'x.com': 'x',
    'twitter.com': 'twitter',
    'instagram.com': 'instagram',
    'tiktok.com': 'tiktok',
};

let targetSites = { ...FALLBACK_TARGET_SITES };
let focusModeEnabled = false;
let authState = createEmptyAuthState();

const lockedTabs = new Set();
let activeTabId = null;
let activeSite = null;
let startTime = null;

function createEmptyAuthState() {
    return {
        loggedIn: false,
        userId: null,
        email: null,
        accessToken: null,
    };
}

function sanitizeAuthState(raw) {
    const userId = String(raw?.userId || '').trim();
    const loggedIn = Boolean(raw?.loggedIn && userId);

    if (!loggedIn) {
        return createEmptyAuthState();
    }

    return {
        loggedIn: true,
        userId,
        email: String(raw?.email || '').trim() || null,
        accessToken: String(raw?.accessToken || '').trim() || null,
    };
}

function getCurrentUserId() {
    return authState.loggedIn ? authState.userId : null;
}

function getPublicAuthState() {
    return {
        loggedIn: authState.loggedIn,
        userId: authState.userId,
        email: authState.email,
    };
}

function setFocusModeEnabled(enabled) {
    focusModeEnabled = Boolean(enabled);
    chrome.storage.local.set({ [FOCUS_MODE_STORAGE_KEY]: focusModeEnabled });

    if (!focusModeEnabled) {
        lockedTabs.clear();
    }
}

function setAuthState(nextState) {
    authState = sanitizeAuthState(nextState);
    chrome.storage.local.set({ [AUTH_STORAGE_KEY]: authState });
}

function clearAuthState() {
    authState = createEmptyAuthState();
    chrome.storage.local.remove(AUTH_STORAGE_KEY);
}

function resetTracking() {
    activeTabId = null;
    activeSite = null;
    startTime = null;
}

function loadInitialState() {
    return new Promise((resolve) => {
        chrome.storage.local.get([AUTH_STORAGE_KEY, FOCUS_MODE_STORAGE_KEY], (result) => {
            authState = sanitizeAuthState(result?.[AUTH_STORAGE_KEY]);
            focusModeEnabled = Boolean(result?.[FOCUS_MODE_STORAGE_KEY]);
            resolve();
        });
    });
}

function clearTimeBuffer() {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => {
            const resetPayload = {};
            Object.entries(items || {}).forEach(([key, value]) => {
                if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
                    resetPayload[key] = 0;
                }
            });

            if (Object.keys(resetPayload).length === 0) {
                resolve();
                return;
            }

            chrome.storage.local.set(resetPayload, resolve);
        });
    });
}

async function fetchBlacklist() {
    const userId = getCurrentUserId();
    if (!userId) {
        targetSites = { ...FALLBACK_TARGET_SITES };
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/blacklist`, {
            headers: {
                'x-user-id': userId,
            },
            credentials: 'include',
        });

        if (!res.ok) {
            targetSites = { ...FALLBACK_TARGET_SITES };
            return;
        }

        const list = await res.json();
        const newSites = {};

        (Array.isArray(list) ? list : []).forEach((item) => {
            const domain = String(item?.domain || '').trim().toLowerCase();
            if (!domain) return;

            const siteName = String(item?.name || domain.split('.')[0] || domain)
                .trim()
                .toLowerCase();
            newSites[domain] = siteName;
        });

        targetSites = Object.keys(newSites).length > 0
            ? newSites
            : { ...FALLBACK_TARGET_SITES };
    } catch (_error) {
        targetSites = { ...FALLBACK_TARGET_SITES };
    }
}

async function syncFocusModeFromApi() {
    const userId = getCurrentUserId();
    if (!userId) {
        setFocusModeEnabled(false);
        return {
            enabled: false,
            phase: 'idle',
            lockActive: false,
            requiresLogin: true,
        };
    }

    try {
        const res = await fetch(`${API_BASE}/focus-mode`, {
            headers: {
                'x-user-id': userId,
            },
            credentials: 'include',
        });

        if (!res.ok) {
            return {
                enabled: focusModeEnabled,
                phase: 'idle',
                lockActive: focusModeEnabled,
            };
        }

        const json = await res.json();
        const lockActive = Boolean(json?.enabled) && json?.phase !== 'break';

        if (lockActive !== focusModeEnabled) {
            setFocusModeEnabled(lockActive);
            if (focusModeEnabled) {
                checkCurrentActiveTab();
            }
        }

        return {
            enabled: Boolean(json?.enabled),
            phase: json?.phase || 'idle',
            lockActive,
        };
    } catch (_error) {
        return {
            enabled: focusModeEnabled,
            phase: 'idle',
            lockActive: focusModeEnabled,
        };
    }
}

async function setFocusModeFromPopup(enabled) {
    const userId = getCurrentUserId();
    if (!userId) {
        return {
            ok: false,
            error: 'ログインが必要です。',
            status: {
                enabled: false,
                phase: 'idle',
                lockActive: false,
            },
        };
    }

    try {
        const res = await fetch(`${API_BASE}/focus-mode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId,
            },
            credentials: 'include',
            body: JSON.stringify({ enabled: Boolean(enabled) }),
        });

        if (!res.ok) {
            throw new Error(`focus mode API error (${res.status})`);
        }

        const json = await res.json();
        const lockActive = Boolean(json?.enabled) && json?.phase !== 'break';
        setFocusModeEnabled(lockActive);

        if (lockActive) {
            checkCurrentActiveTab();
        }

        return {
            ok: true,
            status: {
                enabled: Boolean(json?.enabled),
                phase: json?.phase || 'idle',
                lockActive,
            },
        };
    } catch (_error) {
        return {
            ok: false,
            error: '集中モードの更新に失敗しました。',
            status: {
                enabled: focusModeEnabled,
                phase: 'idle',
                lockActive: focusModeEnabled,
            },
        };
    }
}

async function loginWithCredentials(email, password) {
    const safeEmail = String(email || '').trim();
    const safePassword = String(password || '');

    if (!safeEmail || !safePassword) {
        throw new Error('メールアドレスとパスワードを入力してください。');
    }

    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: safeEmail, password: safePassword }),
        credentials: 'include',
    });

    let payload = null;
    try {
        payload = await res.json();
    } catch (_error) {
        payload = null;
    }

    if (!res.ok) {
        throw new Error(payload?.error || `ログインに失敗しました (${res.status})`);
    }

    const userId = String(payload?.user?.id || '').trim();
    if (!userId) {
        throw new Error('ユーザーIDを取得できませんでした。');
    }

    setAuthState({
        loggedIn: true,
        userId,
        email: payload?.user?.email || safeEmail,
        accessToken: payload?.session?.access_token || null,
    });

    await fetchBlacklist();
    await syncFocusModeFromApi();

    return getPublicAuthState();
}

async function logoutUser() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (_error) {
        // Keep logout robust even if network is unavailable.
    }

    await clearTimeBuffer();
    clearAuthState();
    setFocusModeEnabled(false);
    targetSites = { ...FALLBACK_TARGET_SITES };
    lockedTabs.clear();
    resetTracking();

    return getPublicAuthState();
}

function checkCurrentActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) return;
        if (tabs[0]?.id) {
            handleTabSwitch(tabs[0].id);
        }
    });
}

function saveTime(site, seconds) {
    chrome.storage.local.get([site], (result) => {
        const current = Number(result?.[site] || 0);
        chrome.storage.local.set({ [site]: current + seconds });
    });
}

function handleTabSwitch(tabId) {
    if (activeSite && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed > 0) {
            saveTime(activeSite, elapsed);
        }
    }

    activeTabId = tabId;
    activeSite = null;
    startTime = null;

    if (!tabId) return;

    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab?.url) return;

        try {
            const url = new URL(tab.url);
            for (const [domain, siteName] of Object.entries(targetSites)) {
                if (!url.hostname.includes(domain)) continue;

                activeSite = siteName;
                startTime = Date.now();

                if (focusModeEnabled && !lockedTabs.has(tabId)) {
                    triggerLockScreen(tabId, siteName);
                }
                break;
            }
        } catch (_error) {
            // Ignore unparseable URLs such as chrome:// pages.
        }
    });
}

function triggerLockScreen(tabId, siteName) {
    if (!focusModeEnabled) return;

    lockedTabs.add(tabId);
    activeSite = null;
    startTime = null;

    const blockedUrl = chrome.runtime.getURL(
        `blocked.html?site=${encodeURIComponent(siteName)}&limit=${encodeURIComponent('集中モード')}&elapsed=${encodeURIComponent('集中モード')}`
    );

    chrome.tabs.update(tabId, { url: blockedUrl });
}

function syncToApi() {
    if (activeSite && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed > 0) {
            saveTime(activeSite, elapsed);
        }
        startTime = Date.now();
    }

    const userId = getCurrentUserId();
    if (!userId) return;

    chrome.storage.local.get(null, (items) => {
        Object.entries(items || {}).forEach(([site, time]) => {
            if (typeof time !== 'number' || !Number.isFinite(time) || time <= 0) {
                return;
            }

            fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                },
                credentials: 'include',
                body: JSON.stringify({ site, time }),
            })
                .then((response) => {
                    if (response.ok) {
                        chrome.storage.local.set({ [site]: 0 });
                    }
                })
                .catch((error) => {
                    console.error('Time sync failed:', error);
                });
        });
    });
}

async function syncHistory() {
    const userId = getCurrentUserId();
    if (!userId) return Promise.resolve();

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
        chrome.history.search(
            {
                text: '',
                startTime: oneDayAgo,
                maxResults: 5000,
            },
            (historyItems) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }

                if (!historyItems || historyItems.length === 0) {
                    resolve();
                    return;
                }

                fetch(`${API_BASE}/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                    },
                    credentials: 'include',
                    body: JSON.stringify({ history: historyItems }),
                })
                    .then((res) => {
                        if (!res.ok) {
                            reject(new Error(`history sync failed (${res.status})`));
                            return;
                        }
                        resolve();
                    })
                    .catch(reject);
            }
        );
    });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
    syncFocusModeFromApi().finally(() => {
        handleTabSwitch(activeInfo.tabId);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && !changeInfo.url.includes('blocked.html')) {
        lockedTabs.delete(tabId);
    }

    if (changeInfo.url && tab?.active) {
        syncFocusModeFromApi().finally(() => {
            handleTabSwitch(tabId);
        });
        return;
    }

    if (tabId === activeTabId && changeInfo.url) {
        syncFocusModeFromApi().finally(() => {
            handleTabSwitch(tabId);
        });
    }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        handleTabSwitch(null);
        return;
    }

    chrome.tabs.query({ active: true, windowId }, (tabs) => {
        if (tabs[0]) {
            syncFocusModeFromApi().finally(() => {
                handleTabSwitch(tabs[0].id);
            });
        }
    });
});

chrome.tabs.onRemoved.addListener((tabId) => {
    lockedTabs.delete(tabId);
    if (tabId === activeTabId) {
        resetTracking();
    }
});

chrome.alarms.create('syncTime', { periodInMinutes: 1 / 12 });
chrome.alarms.create('fetchBlacklist', { periodInMinutes: 1 });
chrome.alarms.create('syncFocusMode', { periodInMinutes: 1 / 12 });
chrome.alarms.create('syncHistory', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'syncTime') {
        syncToApi();
    } else if (alarm.name === 'fetchBlacklist') {
        fetchBlacklist();
    } else if (alarm.name === 'syncFocusMode') {
        syncFocusModeFromApi();
    } else if (alarm.name === 'syncHistory') {
        syncHistory().catch((error) => {
            console.error('History sync failed:', error);
        });
    }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message) return;

    if (message.type === 'auth:getState') {
        sendResponse(getPublicAuthState());
        return;
    }

    if (message.type === 'auth:login') {
        loginWithCredentials(message.email, message.password)
            .then((auth) => {
                sendResponse({ ok: true, auth });
            })
            .catch((error) => {
                sendResponse({ ok: false, error: error.message || 'ログインに失敗しました。' });
            });
        return true;
    }

    if (message.type === 'auth:logout') {
        logoutUser()
            .then((auth) => {
                sendResponse({ ok: true, auth });
            })
            .catch((error) => {
                sendResponse({ ok: false, error: error.message || 'ログアウトに失敗しました。' });
            });
        return true;
    }

    if (message.type === 'focusMode:getStatus') {
        if (!getCurrentUserId()) {
            sendResponse({ enabled: false, phase: 'idle', lockActive: false, requiresLogin: true });
            return;
        }

        syncFocusModeFromApi()
            .then((status) => {
                sendResponse(status || { enabled: false, phase: 'idle', lockActive: false });
            })
            .catch(() => {
                sendResponse({ enabled: focusModeEnabled, phase: 'idle', lockActive: focusModeEnabled });
            });
        return true;
    }

    if (message.type === 'focusMode:setEnabled') {
        setFocusModeFromPopup(Boolean(message.enabled))
            .then((result) => {
                sendResponse(result);
            })
            .catch((error) => {
                sendResponse({
                    ok: false,
                    error: error.message || '集中モードの更新に失敗しました。',
                    status: {
                        enabled: focusModeEnabled,
                        phase: 'idle',
                        lockActive: focusModeEnabled,
                    },
                });
            });
        return true;
    }

    if (message.action === 'syncHistory') {
        syncHistory()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message || 'sync failed' });
            });
        return true;
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (changes[AUTH_STORAGE_KEY]) {
        authState = sanitizeAuthState(changes[AUTH_STORAGE_KEY].newValue);
    }

    if (changes[FOCUS_MODE_STORAGE_KEY]) {
        focusModeEnabled = Boolean(changes[FOCUS_MODE_STORAGE_KEY].newValue);
    }
});

async function initialize() {
    await loadInitialState();
    await fetchBlacklist();
    await syncFocusModeFromApi();
    checkCurrentActiveTab();
    syncHistory().catch(() => {
        // History sync is best-effort on startup.
    });
}

initialize();
