// Studocu Cleaner

function updateStatus(msg, processing = false) {
    const text = document.getElementById('status-text');
    const bar = document.getElementById('status');
    if (text) text.innerText = msg;
    if (bar) bar.classList.toggle('processing', processing);
}

// Xóa cookies qua background script
async function clearCookies() {
    updateStatus("Đang xóa cookie...", true);
    try {
        const res = await chrome.runtime.sendMessage({ type: 'clearStudocuCookies' });
        if (res.success) {
            updateStatus(`Đã xóa ${res.count} cookies!`, false);
            setTimeout(() => {
                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    if (tabs[0]) chrome.tabs.reload(tabs[0].id);
                });
            }, 800);
        } else {
            updateStatus("Lỗi: " + res.error, false);
        }
    } catch (e) {
        updateStatus("Lỗi: " + e.message, false);
    }
}

// Script inject vào trang Studocu
function viewerScript() {
    const pages = document.querySelectorAll('div[data-page-index]');
    if (!pages.length) {
        alert("⚠️ Không tìm thấy trang nào.\nHãy cuộn xuống cuối để tải hết nội dung!");
        return;
    }
    if (!confirm(`Tìm thấy ${pages.length} trang.\nBấm OK để tạo PDF...`)) return;

    const SCALE = 4;

    function copyStyles(src, tgt, scale, scaleH = false, scaleW = false) {
        const cs = getComputedStyle(src);
        const props = ['position','left','top','bottom','right','font-family','font-weight','font-style',
            'color','background-color','text-align','white-space','display','visibility','opacity',
            'z-index','text-shadow','padding'];
        let s = props.map(p => {
            const v = cs.getPropertyValue(p);
            return (v && v !== 'none' && v !== 'auto') ? `${p}:${v}!important;` : '';
        }).join('');

        ['width','height'].forEach(p => {
            const v = cs.getPropertyValue(p);
            if (v && v !== 'auto') {
                const n = parseFloat(v);
                if (!isNaN(n) && n > 0 && ((p === 'height' && scaleH) || (p === 'width' && scaleW))) {
                    s += `${p}:${n/scale}${v.replace(n,'')}!important;`;
                } else {
                    s += `${p}:${v}!important;`;
                }
            }
        });

        ['font-size','line-height'].forEach(p => {
            const v = cs.getPropertyValue(p);
            if (v && v !== 'normal') {
                const n = parseFloat(v);
                s += (!isNaN(n) && n) ? `${p}:${n/scale}${v.replace(n,'')}!important;` : `${p}:${v}!important;`;
            }
        });

        ['margin-top','margin-right','margin-bottom','margin-left'].forEach(p => {
            const v = cs.getPropertyValue(p);
            if (v && v !== 'auto') {
                const n = parseFloat(v);
                if (!isNaN(n) && n !== 0 && src.tagName === 'SPAN' && src.classList.contains('_')) {
                    s += `${p}:${n/scale}${v.replace(n,'')}!important;`;
                } else if (!isNaN(n)) {
                    s += `${p}:${v}!important;`;
                }
            }
        });

        s += 'overflow:visible!important;max-width:none!important;max-height:none!important;';
        tgt.style.cssText += s;
    }

    function cloneEl(el, scale) {
        const clone = el.cloneNode(false);
        const isText = el.classList?.contains('t');
        const isUnderscore = el.classList?.contains('_');
        copyStyles(el, clone, scale, isText, isUnderscore);

        if (el.classList?.contains('pc')) {
            clone.style.setProperty('transform', 'none', 'important');
            clone.style.setProperty('overflow', 'visible', 'important');
        }

        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
            clone.textContent = el.textContent;
        } else {
            el.childNodes.forEach(c => {
                if (c.nodeType === 1) clone.appendChild(cloneEl(c, scale));
                else if (c.nodeType === 3) clone.appendChild(c.cloneNode(true));
            });
        }
        return clone;
    }

    const container = document.createElement('div');
    container.id = 'clean-viewer-container';

    pages.forEach((page, i) => {
        const pc = page.querySelector('.pc');
        let w = 595.3, h = 841.9; // A4

        if (pc) {
            const s = getComputedStyle(pc);
            const pw = parseFloat(s.width), ph = parseFloat(s.height);
            if (pw > 0 && ph > 0) { w = pw; h = ph; }
        }

        const div = document.createElement('div');
        div.className = 'std-page';
        div.style.cssText = `width:${w}px;height:${h}px;`;

        // Layer ảnh
        const img = page.querySelector('img.bi') || page.querySelector('img');
        if (img) {
            const bg = document.createElement('div');
            bg.className = 'layer-bg';
            const imgClone = img.cloneNode(true);
            imgClone.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            bg.appendChild(imgClone);
            div.appendChild(bg);
        }

        // Layer text
        if (pc) {
            const txt = document.createElement('div');
            txt.className = 'layer-text';
            const pcClone = cloneEl(pc, SCALE);
            pcClone.querySelectorAll('img').forEach(i => i.style.display = 'none');
            txt.appendChild(pcClone);
            div.appendChild(txt);
        }

        container.appendChild(div);
    });

    document.body.appendChild(container);
    setTimeout(() => window.print(), 800);
}

// Tạo PDF
async function createPDF() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["features/studocu/viewer.css"]
    });

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: viewerScript
    });
}

// Init
export function initUI() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'features/studocu/style.css';
    document.head.appendChild(link);

    document.getElementById('clearBtn')?.addEventListener('click', clearCookies);
    document.getElementById('checkBtn')?.addEventListener('click', createPDF);
}

export { clearCookies, createPDF };
