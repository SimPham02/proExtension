// Translate Feature - Inject selection listener to pages

async function injectScriptIfNeeded(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.__proExtTranslateInstalled === true
    });
    if (result?.result) return;
    
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['features/translate/selection-listener.js']
    });
  } catch (e) {}
}

async function processAllTabs(inject) {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    if (!t.url?.startsWith('http')) continue;
    if (inject) {
      await injectScriptIfNeeded(t.id);
    } else {
      await chrome.scripting.executeScript({
        target: { tabId: t.id },
        func: () => window.__proExtRemoveTranslate?.()
      }).catch(() => {});
    }
  }
}

export async function initUI() {
  const langSelect = document.getElementById('translate-lang-select');
  const result = document.getElementById('translate-result');

  const stored = await chrome.storage.local.get(['pro_translate_lang']);
  const currentLang = stored.pro_translate_lang || 'none';
  if (langSelect) langSelect.value = currentLang;

  langSelect?.addEventListener('change', async (e) => {
    const lang = e.target.value || 'none';
    await chrome.storage.local.set({ pro_translate_lang: lang });

    if (lang === 'none') {
      if (result) result.textContent = '✗ Tự động dịch tắt';
      await processAllTabs(false);
    } else {
      if (result) result.textContent = `✓ Dịch sang: ${lang}`;
      await processAllTabs(true);
    }
  });

  if (currentLang !== 'none') await processAllTabs(true);
}
