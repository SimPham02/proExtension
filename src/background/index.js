// ─── Background Service Worker (Manifest V3) ──────────────────────────────────
// Xử lý các tác vụ nền: API proxy an toàn (vượt rào cản CSP của trang web),
// quản lý cấu hình và đồng bộ sự kiện giữa các module.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getTranslateSettings') {
    chrome.storage.local.get(['pro_translate_lang'], sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.type === 'translate') {
    const { text, lang } = request;
    if (!text || !lang) {
      sendResponse({ success: false, error: 'Thiếu tham số dịch' });
      return false;
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`;
    
    fetch(url)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        const translatedText = (data[0] || []).map(part => part[0]).join('') || '';
        sendResponse({ success: true, result: translatedText });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message || 'Không thể kết nối máy chủ dịch' });
      });

    return true; // Asynchronous sendResponse
  }
});
