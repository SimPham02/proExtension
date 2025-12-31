chrome.runtime.onInstalled.addListener(() => {
    console.log('pro Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getTranslateSettings') {
    chrome.storage.local.get(['pro_translate_lang'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (request.type === 'clearStudocuCookies') {
    (async () => {
      try {
        const allCookies = await chrome.cookies.getAll({});
        let count = 0;
        for (const cookie of allCookies) {
          if (cookie.domain.includes('studocu')) {
            let cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
            const protocol = cookie.secure ? "https:" : "http:";
            const url = `${protocol}//${cleanDomain}${cookie.path}`;
            await chrome.cookies.remove({ url: url, name: cookie.name, storeId: cookie.storeId });
            count++;
          }
        }
        sendResponse({ success: true, count: count });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }
});
