// Quản lý cấu hình tính năng Dịch nhanh (Selection Translate)

async function injectActiveTabIfSupported() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith('http')) return;

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__proExtTranslateInstalled === true
    });
    if (result?.result) return;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content-scripts/translate.js']
    });
  } catch {
    // Bỏ qua nếu tab không cho phép inject (vd: chrome://, edge://)
  }
}

export async function initUI() {
  const langSelect = document.getElementById('translate-lang-select');
  const result = document.getElementById('translate-result');

  if (!langSelect) return;

  const stored = await chrome.storage.local.get(['pro_translate_lang']);
  const currentLang = stored.pro_translate_lang || 'none';
  langSelect.value = currentLang;
  updateStatusDisplay(currentLang);

  const handleChange = async (e) => {
    const lang = e.target.value || 'none';
    await chrome.storage.local.set({ pro_translate_lang: lang });
    updateStatusDisplay(lang);

    // Nếu vừa kích hoạt, chỉ kích hoạt nhanh tab hiện tại thay vì spam toàn bộ tab
    if (lang !== 'none') {
      injectActiveTabIfSupported();
    }
  };

  function updateStatusDisplay(lang) {
    if (!result) return;
    if (lang === 'none') {
      result.textContent = '✗ Tự động dịch đang tắt';
      result.style.color = 'var(--text-secondary)';
    } else {
      const selectedOption = langSelect.options[langSelect.selectedIndex]?.text || lang;
      result.textContent = `✓ Đang bật: Dịch sang ${selectedOption}`;
      result.style.color = '#10b981';
    }
  }

  langSelect.addEventListener('change', handleChange);

  return {
    destroy() {
      langSelect.removeEventListener('change', handleChange);
    }
  };
}
