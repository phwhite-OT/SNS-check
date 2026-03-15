// 🕵️ Dashboardから同期用データを取得するスクリプト
(function () {
    const syncEl = document.getElementById('extension-sync-data');
    if (syncEl) {
        const userId = syncEl.getAttribute('data-user-id');
        const apiUrl = syncEl.getAttribute('data-api-url');

        if (userId || apiUrl) {
            console.log('🔄 Dashboard sync data detected:', { userId, apiUrl });
            
            // 背景（background.js）に保存を依頼
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
        }
    }
})();
