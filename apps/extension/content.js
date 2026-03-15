// 🕵️ Dashboardから同期用データを取得するスクリプト
(function () {
    let lastSentUserId = null;
    let lastSentApiUrl = null;

    function sendSyncConfig(userId, apiUrl) {
        if (!userId && !apiUrl) return;

        if (lastSentUserId === userId && lastSentApiUrl === apiUrl) {
            return;
        }

        lastSentUserId = userId;
        lastSentApiUrl = apiUrl;

        chrome.runtime.sendMessage(
            {
                type: 'sync:config',
                config: { userId, apiUrl }
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
        sendSyncConfig(userId || null, apiUrl || null);
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
        attributeFilter: ['data-user-id', 'data-api-url']
    });

    // 念のためロード完了後にも再試行
    window.addEventListener('load', () => {
        trySyncFromDom();
    });
})();
