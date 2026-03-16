// 🕵️ Dashboardから同期用データを取得するスクリプト
(function () {
    let lastSentUserId = null;
    let lastSentApiUrl = null;
    let lastSentSyncToken = null;

    function sendSyncConfig(userId, apiUrl, syncToken) {
        if (!userId && !apiUrl) return;

        if (lastSentUserId === userId && lastSentApiUrl === apiUrl && lastSentSyncToken === syncToken) {
            return;
        }

        lastSentUserId = userId;
        lastSentApiUrl = apiUrl;
        lastSentSyncToken = syncToken;

        chrome.runtime.sendMessage(
            {
                type: 'sync:config',
                config: { userId, apiUrl, syncToken }
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to send sync message:', chrome.runtime.lastError.message);
                    return;
                }
            }
        );
    }

    function trySyncFromDom() {
        const syncEl = document.getElementById('extension-sync-data');
        if (!syncEl) return false;

        const userId = (syncEl.getAttribute('data-user-id') || '').trim();
        const apiUrl = (syncEl.getAttribute('data-api-url') || '').trim();
        const syncToken = (syncEl.getAttribute('data-sync-token') || '').trim();
        sendSyncConfig(userId || null, apiUrl || null, syncToken || null);
        return true;
    }

    // 即時試行（静的HTML向け）
    trySyncFromDom();

    // Reactレンダリング後に要素が出るケースに対応
    const observer = new MutationObserver(() => {
        trySyncFromDom();
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-user-id', 'data-api-url', 'data-sync-token']
    });

    // 念のためロード完了後にも再試行
    window.addEventListener('load', () => {
        trySyncFromDom();
    });
})();
