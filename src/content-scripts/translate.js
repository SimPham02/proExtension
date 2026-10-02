(function () {
  'use strict';

  if (window.__proExtTranslateScriptLoaded) return;
  window.__proExtTranslateScriptLoaded = true;

  const DEFAULT_LANG = 'none';
  const SELECTION_DEBOUNCE_MS = 250;

  let initialized = false;
  let currentLang = DEFAULT_LANG;
  let hostEl = null;
  let shadowRoot = null;
  let cardEl = null;
  let textEl = null;
  let timer = null;
  let lastText = '';
  let requestId = 0;

  const chromeStorage = chrome?.storage;

  function getSelectedText() {
    let text = window.getSelection()?.toString().trim() || '';
    if (text) return text;

    const activeElement = document.activeElement;
    const isTextInput = activeElement?.tagName === 'TEXTAREA' || (activeElement?.tagName === 'INPUT' && activeElement?.type === 'text');
    if (!isTextInput) return '';

    const { selectionStart, selectionEnd, value } = activeElement;
    if (selectionStart == null || selectionEnd <= selectionStart) return '';
    return value.substring(selectionStart, selectionEnd).trim();
  }

  function positionNearSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !cardEl || !hostEl) return;

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return;

      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      cardEl.style.display = 'flex';
      cardEl.style.visibility = 'hidden';
      const popupRect = cardEl.getBoundingClientRect();
      cardEl.style.visibility = 'visible';

      let top = rect.bottom + scrollY + 8;
      let left = rect.left + scrollX;

      // Tránh tràn viền dưới màn hình
      if (rect.bottom + popupRect.height + 24 > window.innerHeight) {
        top = rect.top + scrollY - popupRect.height - 8;
      }
      // Tránh tràn viền phải màn hình
      if (left + popupRect.width > window.innerWidth + scrollX - 16) {
        left = window.innerWidth + scrollX - popupRect.width - 16;
      }
      if (left < scrollX + 10) left = scrollX + 10;
      if (top < scrollY + 10) top = scrollY + 10;

      cardEl.style.top = `${top}px`;
      cardEl.style.left = `${left}px`;
    } catch {
      // Fallback an toàn nếu selection range không truy cập được
    }
  }

  async function handleSelection() {
    if (!cardEl || currentLang === DEFAULT_LANG) return;

    const text = getSelectedText();
    if (!text || text.length < 2) {
      hidePopup();
      lastText = '';
      return;
    }
    if (text === lastText) return;

    lastText = text;
    const activeRequestId = requestId + 1;
    requestId = activeRequestId;

    textEl.textContent = 'Đang dịch...';
    positionNearSelection();

    // Ủy thác việc fetch sang Background Service Worker để tránh vi phạm CSP của trang web
    try {
      chrome.runtime.sendMessage(
        { type: 'translate', text, lang: currentLang },
        (response) => {
          if (activeRequestId !== requestId) return;

          if (chrome.runtime.lastError) {
            textEl.textContent = 'Lỗi kết nối extension';
            return;
          }

          if (response?.success) {
            textEl.textContent = response.result || 'Không tìm thấy bản dịch';
            positionNearSelection();
          } else {
            textEl.textContent = response?.error || 'Không dịch được';
          }
        }
      );
    } catch {
      if (activeRequestId === requestId) {
        textEl.textContent = 'Không dịch được';
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(handleSelection, SELECTION_DEBOUNCE_MS);
  }

  function initUI() {
    if (initialized) return;
    initialized = true;
    window.__proExtTranslateInstalled = true;

    // Sử dụng Shadow DOM để cách ly hoàn toàn CSS của trang web
    hostEl = document.createElement('div');
    hostEl.id = 'pro-ext-translate-host';
    hostEl.style.all = 'initial';
    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        z-index: 2147483647;
      }
      .translate-card {
        position: absolute;
        z-index: 2147483647;
        display: none;
        flex-direction: column;
        gap: 8px;
        background: #1e293b;
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 10px 14px;
        min-width: 160px;
        max-width: 380px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.45;
        box-sizing: border-box;
      }
      .translate-card * {
        box-sizing: border-box;
      }
      .translate-text {
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 200px;
        overflow-y: auto;
        color: #f1f5f9;
      }
      .translate-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 6px;
      }
      .btn {
        background: #334155;
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 3px 8px;
        font-size: 11px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .btn:hover {
        background: #475569;
        color: #fff;
      }
      .btn-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 14px;
        padding: 2px 6px;
        cursor: pointer;
      }
      .btn-close:hover {
        color: #fff;
      }
    `;

    cardEl = document.createElement('div');
    cardEl.className = 'translate-card';

    textEl = document.createElement('div');
    textEl.className = 'translate-text';

    const actions = document.createElement('div');
    actions.className = 'translate-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn';
    copyBtn.textContent = 'Copy';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-close';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Đóng';

    actions.append(copyBtn, closeBtn);
    cardEl.append(textEl, actions);

    shadowRoot.append(style, cardEl);
    document.body.appendChild(hostEl);

    document.addEventListener('mouseup', schedule);
    document.addEventListener('keyup', schedule);
    document.addEventListener('click', handleDocumentClick);

    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = textEl?.textContent || '';
      if (content && content !== 'Đang dịch...' && content !== 'Không dịch được') {
        navigator.clipboard?.writeText(content).then(() => {
          copyBtn.textContent = 'Đã copy!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
        }).catch(() => {});
      }
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hidePopup();
    });
  }

  function handleDocumentClick(event) {
    if (hostEl && !hostEl.contains(event.target)) {
      hidePopup();
    }
  }

  function hidePopup() {
    if (cardEl) cardEl.style.display = 'none';
  }

  function disableTranslate() {
    hidePopup();
    lastText = '';
  }

  function destroyTranslate() {
    clearTimeout(timer);
    document.removeEventListener('mouseup', schedule);
    document.removeEventListener('keyup', schedule);
    document.removeEventListener('click', handleDocumentClick);
    chromeStorage?.onChanged?.removeListener(handleStorageChange);
    hostEl?.remove();
    hostEl = null;
    shadowRoot = null;
    cardEl = null;
    textEl = null;
    timer = null;
    initialized = false;
    window.__proExtTranslateInstalled = false;
    delete window.__proExtRemoveTranslate;
  }

  function handleStorageChange(changes) {
    if (!changes.pro_translate_lang) return;

    currentLang = changes.pro_translate_lang.newValue || DEFAULT_LANG;
    if (currentLang !== DEFAULT_LANG) {
      initUI();
    } else {
      disableTranslate();
    }
  }

  chromeStorage?.local?.get(['pro_translate_lang'], (res) => {
    currentLang = res.pro_translate_lang || DEFAULT_LANG;
    if (currentLang !== DEFAULT_LANG) initUI();
  });

  chromeStorage?.onChanged?.addListener(handleStorageChange);
  window.__proExtRemoveTranslate = destroyTranslate;
})();
