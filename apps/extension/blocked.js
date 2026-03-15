const params = new URLSearchParams(window.location.search);
const siteName = params.get('site') || '不明なサイト';

const lines = [
    { prompt: '>>', label: 'MODE    :', value: '集中モード', cls: 'value-green' },
    { prompt: '>>', label: 'SYSTEM  :', value: '集中モード中のためアクセスを遮断しました。', cls: 'value-red' },
    { prompt: '>>', label: 'SITE    :', value: siteName, cls: 'value-orange' },
    { prompt: '>>', label: 'STATUS  :', value: '■ LOCKED', cls: 'value-red' },
    { prompt: '>>', label: 'ACTION  :', value: '作業に戻るか、タブを閉じてください。', cls: 'value-dim' },
];

const terminal = document.getElementById('terminal');
const countdownEl = document.getElementById('countdown');
const closeButton = document.getElementById('btn-close');
const backButton = document.getElementById('btn-back');

function addLine(lineData, delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const row = document.createElement('div');
            row.className = 'line';

            const promptEl = document.createElement('span');
            promptEl.className = 'prompt';
            promptEl.textContent = lineData.prompt;

            const labelEl = document.createElement('span');
            labelEl.className = 'label';
            labelEl.textContent = lineData.label;

            const valueEl = document.createElement('span');
            valueEl.className = `typed active ${lineData.cls}`;

            row.appendChild(promptEl);
            row.appendChild(labelEl);
            row.appendChild(valueEl);
            terminal.appendChild(row);

            const text = lineData.value;
            let index = 0;
            const typeInterval = setInterval(() => {
                valueEl.textContent = text.slice(0, index + 1);
                index += 1;
                if (index >= text.length) {
                    clearInterval(typeInterval);
                    valueEl.classList.remove('active');
                    resolve();
                }
            }, 30);
        }, delay);
    });
}

async function runAnimation() {
    for (let index = 0; index < lines.length; index += 1) {
        await addLine(lines[index], index === 0 ? 300 : 0);
        await new Promise((resolve) => setTimeout(resolve, 80));
    }
}

function closeCurrentTab() {
    chrome.tabs.getCurrent((tab) => {
        if (tab?.id) {
            chrome.tabs.remove(tab.id);
            return;
        }
        window.close();
    });
}

let countdown = 30;
const timer = setInterval(() => {
    countdownEl.innerHTML = `>> タブは <span>${countdown}</span> 秒後に自動で閉じます...`;
    countdown -= 1;
    if (countdown < 0) {
        clearInterval(timer);
        closeCurrentTab();
    }
}, 1000);

closeButton?.addEventListener('click', () => {
    clearInterval(timer);
    closeCurrentTab();
});

backButton?.addEventListener('click', () => {
    clearInterval(timer);
    if (history.length > 1) {
        history.back();
        return;
    }
    closeCurrentTab();
});

runAnimation();
