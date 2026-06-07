(function () {
  'use strict';

  if (window.__proExtTranslateScriptLoaded) return;
  window.__proExtTranslateScriptLoaded = true;

  const DEFAULT_LANG = 'none';
  const TRANSLATE_TIMEOUT_MS = 10000;
  const SELECTION_DEBOUNCE_MS = 200;

  let initialized = false;
  let currentLang = DEFAULT_LANG;
  let container = null;
  let textEl = null;
  let timer = null;
  let lastText = '';
  let requestId = 0;
  let currentAbortController = null;

  const chromeStorage = chrome?.storage;

  function getSelectedText() {
    let text = window.getSelection()?.toString().trim() || '';
    if (text) return text;

    const activeElement = document.activeElement;
    const isTextInput = activeElement?.tagName === 'TEXTAREA' || activeElement?.type === 'text';
    if (!isTextInput) return '';

    const { selectionStart, selectionEnd, value } = activeElement;
    if (selectionStart == null || selectionEnd <= selectionStart) return '';
    return value.substring(selectionStart, selectionEnd).trim();
  }

  async function translate(text, lang, signal) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { signal });
    if (!response.ok) return null;

    const data = await response.json();
    return (data[0] || []).map(part => part[0]).join('') || '';
  }

  function positionNearSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !container) return;

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;

    container.style.display = 'block';
    container.style.visibility = 'hidden';
    const popupRect = container.getBoundingClientRect();
    container.style.visibility = 'visible';

    if (rect.bottom + popupRect.height + 20 > window.innerHeight) {
      top = rect.top + scrollY - popupRect.height - 8;
    }
    if (left + popupRect.width > window.innerWidth + scrollX - 10) {
      left = window.innerWidth + scrollX - popupRect.width - 10;
    }
    if (left < scrollX + 10) left = scrollX + 10;
    if (top < scrollY + 10) top = scrollY + 10;

    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
  }

  async function handleSelection() {
    if (!container || !textEl || currentLang === DEFAULT_LANG) return;

    const text = getSelectedText();
    if (!text) {
      hidePopup();
      lastText = '';
      return;
    }
    if (text === lastText) return;

    lastText = text;
    const activeRequestId = requestId + 1;
    requestId = activeRequestId;

    currentAbortController?.abort();
    currentAbortController = new AbortController();
    const timeout = setTimeout(() => currentAbortController.abort(), TRANSLATE_TIMEOUT_MS);

    textEl.textContent = 'Dang dich...';
    positionNearSelection();

    try {
      const translated = await translate(text, currentLang, currentAbortController.signal);
      if (activeRequestId === requestId) {
        textEl.textContent = translated ?? 'Khong dich duoc';
      }
    } catch {
      if (activeRequestId === requestId) {
        textEl.textContent = 'Khong dich duoc';
      }
    } finally {
      clearTimeout(timeout);
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

    container = document.createElement('div');
    container.setAttribute('data-proext-translate', '1');
    Object.assign(container.style, {
      position: 'absolute',
      zIndex: '2147483647',
      display: 'none',
      fontFamily: 'sans-serif'
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      background: 'linear-gradient(180deg, rgba(20,20,20,0.98), rgba(30,30,30,0.98))',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '8px',
      maxWidth: '400px',
      minWidth: '150px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      fontSize: '13px',
      lineHeight: '1.4',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    });

    textEl = document.createElement('div');
    Object.assign(textEl.style, { whiteSpace: 'pre-wrap', wordBreak: 'break-word' });

    const actions = document.createElement('div');
    Object.assign(actions.style, {
      fontSize: '11px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px'
    });

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    Object.assign(copyButton.style, {
      cursor: 'pointer',
      fontSize: '12px',
      padding: '4px 8px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '4px',
      color: '#fff'
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = 'x';
    Object.assign(closeButton.style, {
      cursor: 'pointer',
      fontSize: '14px',
      padding: '2px 6px',
      background: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.85)'
    });

    actions.append(copyButton, closeButton);
    card.append(textEl, actions);
    container.appendChild(card);
    document.body.appendChild(container);

    document.addEventListener('mouseup', schedule);
    document.addEventListener('keyup', schedule);
    document.addEventListener('click', handleDocumentClick);
    copyButton.addEventListener('click', copyTranslatedText);
    closeButton.addEventListener('click', hidePopup);
  }

  function copyTranslatedText() {
    navigator.clipboard?.writeText(textEl?.textContent || '').catch(() => {});
  }

  function handleDocumentClick(event) {
    if (container && !container.contains(event.target)) hidePopup();
  }

  function hidePopup() {
    if (container) container.style.display = 'none';
  }

  function disableTranslate() {
    hidePopup();
    lastText = '';
    currentAbortController?.abort();
  }

  function destroyTranslate() {
    clearTimeout(timer);
    currentAbortController?.abort();
    document.removeEventListener('mouseup', schedule);
    document.removeEventListener('keyup', schedule);
    document.removeEventListener('click', handleDocumentClick);
    chromeStorage?.onChanged?.removeListener(handleStorageChange);
    container?.remove();
    container = null;
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
