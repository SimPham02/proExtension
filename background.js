chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getTranslateSettings') {
    chrome.storage.local.get(['pro_translate_lang'], sendResponse);
    return true;
  }
  
  if (request.type === 'clearStudocuCookies') {
    chrome.cookies.getAll({ domain: 'studocu.com' }).then(async cookies => {
      let count = 0;
      for (const c of cookies) {
        const url = `${c.secure ? 'https' : 'http'}://${c.domain.replace(/^\./, '')}${c.path}`;
        await chrome.cookies.remove({ url, name: c.name, storeId: c.storeId });
        count++;
      }
      sendResponse({ success: true, count });
    }).catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
});
