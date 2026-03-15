// 🕵️ Dashboardから同期用データを取得するスクリプト
(function () {
    function trySync() {
        const syncEl = document.getElementById('extension-sync-data');
        if (!syncEl) return false;

        const userId = syncEl.getAttribute('data-user-id');
        const apiUrl = syncEl.getAttribute('data-api-url');

        if (userId && apiUrl) {
            console.log('🔄 Dashboard sync data detected:', { userId, apiUrl });
            
            chrome.runtime.sendMessage({
                type: 'sync:config',
                config: { userId, apiUrl }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to send sync message:', chrome.runtime.lastError);
                } else if (response?.success) {
                    console.log('✅ Extension configuration synchronized automatically.');
                }
            });
            return true;
        }
        return false;
    }

    // 初回実行
    if (!trySync()) {
        // 見つからない場合は、DOMの変化を監視（SPA遷移対策）
        const observer = new MutationObserver((mutations, obs) => {
            if (trySync()) {
                obs.disconnect(); // 同期に成功したら停止
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
