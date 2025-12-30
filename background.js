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
});
