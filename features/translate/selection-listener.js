(function () {
  'use strict';
  
  // Suppress context invalidated errors
  const _err = console.error;
  console.error = (...a) => { if (!a.join(' ').includes('context')) _err.apply(console, a); };

  // Cleanup previous instance
  try { window.__proExtRemoveTranslate?.(); } catch (e) {}
  window.__proExtTranslateInstalled = true;
  document.querySelectorAll('[data-proext-translate]').forEach(el => el.remove());

  // UI
  const container = document.createElement('div');
  container.setAttribute('data-proext-translate', '1');
  Object.assign(container.style, {
    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
    zIndex: '2147483647', display: 'none', fontFamily: 'sans-serif'
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    background: 'linear-gradient(180deg, rgba(20,20,20,0.98), rgba(30,30,30,0.98))',
    color: '#fff', padding: '10px 14px', borderRadius: '8px',
    maxWidth: '600px', minWidth: '200px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    fontSize: '13px', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '8px'
  });

  const textEl = document.createElement('div');
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
  document.documentElement.appendChild(container);

  // State
  let lastText = '', timer = null, dead = false;

  // Safe chrome.runtime access
  const getRuntime = () => {
    try { return chrome?.runtime?.id ? chrome.runtime : null; } catch { return null; }
  };

  // Get settings
  const getSettings = () => new Promise(resolve => {
    if (window.__proExtSettings) return resolve(window.__proExtSettings);
    if (dead) return resolve({});
    
    const rt = getRuntime();
    if (!rt?.sendMessage) { dead = true; return resolve({}); }

    const t = setTimeout(() => resolve({}), 500);
    try {
      rt.sendMessage({ type: 'getTranslateSettings' }, r => {
        clearTimeout(t);
        if (rt.lastError?.message?.includes('context')) dead = true;
        resolve(r || {});
      });
    } catch { dead = true; clearTimeout(t); resolve({}); }
  });

  // Translate
  const translate = async (text) => {
    const s = await getSettings();
    const lang = s?.pro_translate_lang || 'none';
    if (lang === 'none') return null;

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

  // Handle selection
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

      const s = await getSettings();
      if (s?.pro_translate_lang === 'none') { container.style.display = 'none'; return; }

      textEl.textContent = 'Đang dịch...';
      container.style.display = 'block';

      const out = await translate(txt);
      textEl.textContent = out ?? 'Không dịch được';
    } catch {}
  };

  const schedule = () => { clearTimeout(timer); timer = setTimeout(handle, 200); };

  // Events
  document.addEventListener('mouseup', schedule);
  document.addEventListener('keyup', schedule);
  btnCopy.onclick = () => navigator.clipboard?.writeText(textEl.textContent || '').catch(() => {});
  btnClose.onclick = () => container.style.display = 'none';
  document.addEventListener('click', e => { if (!container.contains(e.target)) container.style.display = 'none'; });

  // Cleanup
  window.__proExtRemoveTranslate = () => {
    document.removeEventListener('mouseup', schedule);
    document.removeEventListener('keyup', schedule);
    container.remove();
    delete window.__proExtTranslateInstalled;
    delete window.__proExtRemoveTranslate;
  };
})();