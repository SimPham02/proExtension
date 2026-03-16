(function () {
  'use strict';

  // Guard chống chạy nhiều lần (manifest + inject trùng)
  if (window.__proExtTranslateScriptLoaded) return;
  window.__proExtTranslateScriptLoaded = true;

  // Suppress context invalidated errors
  const _err = console.error;
  console.error = (...a) => { if (!a.join(' ').includes('context')) _err.apply(console, a); };

  // ─── State ──────────────────────────────────────────────────────────────────
  let initialized = false;
  let dead = false;
  let currentLang = 'none';
  let container = null, textEl = null, timer = null, lastText = '';

  // ─── Safe chrome.runtime ────────────────────────────────────────────────────
  const getRuntime = () => {
    try { return chrome?.runtime?.id ? chrome.runtime : null; } catch { return null; }
  };

  // ─── Translate ───────────────────────────────────────────────────────────────
  const translate = async (text, lang) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 10000);
    try {
      const r = await fetch(url, { signal: ac.signal });
      clearTimeout(t);
      if (!r.ok) return null;
      const d = await r.json();
      return (d[0] || []).map(p => p[0]).join('') || '';
    } catch { return null; }
  };

  // ─── Position popup ──────────────────────────────────────────────────────────
  const positionNearSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;
    container.style.display = 'block';
    container.style.visibility = 'hidden';
    const cRect = container.getBoundingClientRect();
    container.style.visibility = 'visible';
    if (rect.bottom + cRect.height + 20 > window.innerHeight) top = rect.top + scrollY - cRect.height - 8;
    if (left + cRect.width > window.innerWidth + scrollX - 10) left = window.innerWidth + scrollX - cRect.width - 10;
    if (left < scrollX + 10) left = scrollX + 10;
    if (top < scrollY + 10) top = scrollY + 10;
    container.style.top = top + 'px';
    container.style.left = left + 'px';
  };

  // ─── Handle selection ────────────────────────────────────────────────────────
  const handle = async () => {
    try {
      let txt = window.getSelection()?.toString().trim() || '';
      if (!txt) {
        const ae = document.activeElement;
        if (ae?.tagName === 'TEXTAREA' || ae?.type === 'text') {
          const { selectionStart: s, selectionEnd: e, value } = ae;
          if (s != null && e > s) txt = value.substring(s, e).trim();
        }
      }
      if (!txt) { container.style.display = 'none'; lastText = ''; return; }
      if (txt === lastText) return;
      lastText = txt;
      textEl.textContent = 'Đang dịch...';
      positionNearSelection();
      const out = await translate(txt, currentLang);
      textEl.textContent = out ?? 'Không dịch được';
    } catch {}
  };

  const schedule = () => { clearTimeout(timer); timer = setTimeout(handle, 200); };

  // ─── Init UI (chỉ gọi một lần) ───────────────────────────────────────────────
  function initUI() {
    if (initialized) return;
    initialized = true;
    window.__proExtTranslateInstalled = true;

    container = document.createElement('div');
    container.setAttribute('data-proext-translate', '1');
    Object.assign(container.style, {
      position: 'absolute', zIndex: '2147483647', display: 'none', fontFamily: 'sans-serif'
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      background: 'linear-gradient(180deg, rgba(20,20,20,0.98), rgba(30,30,30,0.98))',
      color: '#fff', padding: '10px 14px', borderRadius: '8px',
      maxWidth: '400px', minWidth: '150px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      fontSize: '13px', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '8px'
    });

    textEl = document.createElement('div');
    Object.assign(textEl.style, { whiteSpace: 'pre-wrap', wordBreak: 'break-word' });

    const metaEl = document.createElement('div');
    Object.assign(metaEl.style, { fontSize: '11px', display: 'flex', justifyContent: 'flex-end', gap: '8px' });

    const btnCopy = document.createElement('button');
    btnCopy.textContent = 'Copy';
    Object.assign(btnCopy.style, {
      cursor: 'pointer', fontSize: '12px', padding: '4px 8px',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '4px', color: '#fff'
    });

    const btnClose = document.createElement('button');
    btnClose.textContent = '✕';
    Object.assign(btnClose.style, {
      cursor: 'pointer', fontSize: '14px', padding: '2px 6px',
      background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)'
    });

    metaEl.append(btnCopy, btnClose);
    card.append(textEl, metaEl);
    container.appendChild(card);
    document.body.appendChild(container);

    document.addEventListener('mouseup', schedule);
    document.addEventListener('keyup', schedule);
    btnCopy.onclick = () => navigator.clipboard?.writeText(textEl.textContent || '').catch(() => {});
    btnClose.onclick = () => { container.style.display = 'none'; };
    document.addEventListener('click', e => { if (container && !container.contains(e.target)) container.style.display = 'none'; });

    window.__proExtRemoveTranslate = () => {
      document.removeEventListener('mouseup', schedule);
      document.removeEventListener('keyup', schedule);
      container?.remove();
      container = null;
      initialized = false;
      window.__proExtTranslateInstalled = false;
      delete window.__proExtRemoveTranslate;
    };
  }

  function disableTranslate() {
    container?.style && (container.style.display = 'none');
    lastText = '';
  }

  // ─── Khởi động: check storage trước, chỉ init nếu đã bật ─────────────────
  chrome.storage.local.get(['pro_translate_lang'], (res) => {
    currentLang = res.pro_translate_lang || 'none';
    if (currentLang !== 'none') initUI();
  });

  // ─── Lắng nghe thay đổi realtime (bật/tắt từ popup) ─────────────────────
  chrome.storage.onChanged.addListener((changes) => {
    if (!changes.pro_translate_lang) return;
    currentLang = changes.pro_translate_lang.newValue || 'none';
    if (currentLang !== 'none') {
      initUI(); // không làm gì nếu đã init rồi
    } else {
      disableTranslate();
    }
  });
})();
