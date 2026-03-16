export function init() {
    const saveBtn = document.getElementById('save-home-settings');
    const resetBtn = document.getElementById('reset-home-settings');
    const statusMessage = document.getElementById('status-message');

    loadSettings();

    saveBtn?.addEventListener('click', async () => {
        const settings = {
            showClock: document.getElementById('show-clock')?.checked ?? true,
            showSearch: document.getElementById('show-search')?.checked ?? true,
            showShortcuts: document.getElementById('show-shortcuts')?.checked ?? true,
            showWeather: document.getElementById('show-weather')?.checked ?? true,
            showAiTools: document.getElementById('show-ai-tools')?.checked ?? true,
            showQuote: document.getElementById('show-quote')?.checked ?? true,
            userName: document.getElementById('user-name')?.value || ''
        };
        
        try {
            await chrome.storage.sync.set({ edgeHomeSettings: settings });
            showStatus('✓ Đã lưu! Mở tab mới để xem.', 'success');
        } catch (error) {
            showStatus('✗ Lỗi: ' + error.message, 'error');
        }
    });

    resetBtn?.addEventListener('click', async () => {
        if (confirm('Đặt lại tất cả cài đặt về mặc định?')) {
            await chrome.storage.sync.remove('edgeHomeSettings');
            loadSettings();
            showStatus('✓ Đã đặt lại!', 'success');
        }
    });

    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get('edgeHomeSettings');
            const s = result.edgeHomeSettings || {};
            
            document.getElementById('show-clock').checked = s.showClock ?? true;
            document.getElementById('show-search').checked = s.showSearch ?? true;
            document.getElementById('show-shortcuts').checked = s.showShortcuts ?? true;
            document.getElementById('show-weather').checked = s.showWeather ?? true;
            document.getElementById('show-ai-tools').checked = s.showAiTools ?? true;
            document.getElementById('show-quote').checked = s.showQuote ?? true;
            
            if (s.userName) document.getElementById('user-name').value = s.userName;
            // removed searchEngine config (managed on New Tab)
        } catch (e) {
            console.error('Lỗi load cài đặt:', e);
        }
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.classList.add('show');
        if (type === 'error') {
            statusMessage.style.background = '#ff3b30';
        } else {
            statusMessage.style.background = '#1d1d1f';
        }
        setTimeout(() => statusMessage.classList.remove('show'), 3000);
    }
}
