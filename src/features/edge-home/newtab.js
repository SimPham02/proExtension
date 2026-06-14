// ===== Cấu hình =====
const CONFIG = {
    themes: [
        {
            id: 'default',
            name: 'Mặc định',
            description: 'Glass tím xanh hiện tại',
            icon: 'fa-wand-magic-sparkles',
            defaultBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        {
            id: 'linux',
            name: 'Linux Terminal',
            description: 'Tối, sắc nét, xanh terminal',
            icon: 'fa-terminal',
            defaultBackground: 'linear-gradient(135deg, #07130f 0%, #0d1f1a 45%, #111827 100%)'
        },
        {
            id: 'studio',
            name: 'Studio Focus',
            description: 'Tối, gọn, dạng studio tập trung',
            icon: 'fa-table-columns',
            defaultBackground: 'linear-gradient(135deg, #0f1720 0%, #18232d 48%, #152823 100%)'
        }
    ],
    engines: {
        google: { url: 'https://www.google.com/search?q=', name: 'Google' },
        bing: { url: 'https://www.bing.com/search?q=', name: 'Bing' },
        youtube: { url: 'https://www.youtube.com/results?search_query=', name: 'YouTube' },
        duckduckgo: { url: 'https://duckduckgo.com/?q=', name: 'DuckDuckGo' }
    },
    defaultShortcuts: [
        { name: 'Google', url: 'https://google.com' },
        { name: 'YouTube', url: 'https://youtube.com' },
        { name: 'Facebook', url: 'https://facebook.com' },
        { name: 'Gmail', url: 'https://mail.google.com' },
        { name: 'GitHub', url: 'https://github.com' }
    ],
    quotes: [
        { text: "Hãy bắt đầu ngày mới với năng lượng tích cực!", author: "Pro Extensions" },
        { text: "Thành công là tổng của những nỗ lực nhỏ được lặp lại mỗi ngày.", author: "Robert Collier" },
        { text: "Cách tốt nhất để dự đoán tương lai là tạo ra nó.", author: "Peter Drucker" },
        { text: "Đừng chờ đợi cơ hội, hãy tạo ra nó.", author: "George Bernard Shaw" },
        { text: "Mọi thành tựu vĩ đại đều bắt đầu từ quyết định thử.", author: "Gail Devers" },
        { text: "Học không bao giờ làm kiệt sức tâm trí.", author: "Leonardo da Vinci" },
        { text: "Hành động là chìa khóa cơ bản của mọi thành công.", author: "Pablo Picasso" },
        { text: "Sự sáng tạo là trí thông minh đang vui chơi.", author: "Albert Einstein" },
        { text: "Thay đổi là quy luật của cuộc sống.", author: "John F. Kennedy" },
        { text: "Điều duy nhất không thể là điều bạn không cố gắng.", author: "Jean Pictet" }
    ]
};

// ===== State =====
let state = {
    settings: {},
    shortcuts: [],
    todos: [],
    currentEngine: 'google'
};
const DEFAULT_NEWTAB_THEME = 'default';
let slideshowTimer = null;
let currentSlideIndex = 0;
const FAVICON_CACHE_KEY = 'edgeHomeFaviconCache';
const FAVICON_CLEANUP_KEY = 'edgeHomeFaviconCacheCleanupAt';
const FAVICON_CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000;
const FAVICON_MAX_AGE = 90 * 24 * 60 * 60 * 1000;
const FAVICON_MAX_ENTRIES = 100;
let faviconCache = {};
let faviconSaveTimer = null;
const faviconFetches = new Map();

function createLetterIcon(label, background = '#6366f1') {
    const text = escapeSvgText(String(label || '?').trim().charAt(0).toUpperCase() || '?');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${background}"/><text x="32" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="white">${text}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value) {
    return value.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    }[char]));
}

function shortcutIcon(url, fallbackName = '') {
    const domain = getDomainFromUrl(url);
    if (domain) return faviconUrlForDomain(domain);
    return createLetterIcon(fallbackName, '#334155');
}

function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

function faviconUrlForDomain(domain) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function applyShortcutImage(image, url, fallbackName = '') {
    const domain = getDomainFromUrl(url);
    image.alt = fallbackName || '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    if (!domain) {
        image.src = createLetterIcon(fallbackName, '#334155');
        return;
    }

    const cached = faviconCache[domain];
    if (cached?.dataUrl) {
        cached.lastUsedAt = Date.now();
        image.src = cached.dataUrl;
        scheduleFaviconCacheSave();
        return;
    }

    const remoteUrl = faviconUrlForDomain(domain);
    image.src = remoteUrl;
    image.onerror = () => {
        image.onerror = null;
        image.src = createLetterIcon(fallbackName, '#334155');
    };
    cacheFavicon(domain, remoteUrl, image).catch(() => {});
}

async function cacheFavicon(domain, remoteUrl, imageToUpdate) {
    if (faviconCache[domain]?.dataUrl) return faviconCache[domain].dataUrl;
    if (faviconFetches.has(domain)) return faviconFetches.get(domain);

    const task = (async () => {
        const response = await fetch(remoteUrl, { cache: 'force-cache' });
        if (!response.ok) throw new Error('Khong tai duoc favicon');

        const blob = await response.blob();
        if (!blob.type.startsWith('image/') || blob.size > 128 * 1024) {
            throw new Error('Favicon khong hop le');
        }

        const dataUrl = await blobToDataUrl(blob);
        faviconCache[domain] = {
            dataUrl,
            updatedAt: Date.now(),
            lastUsedAt: Date.now()
        };
        scheduleFaviconCacheSave();
        if (imageToUpdate && imageToUpdate.isConnected) imageToUpdate.src = dataUrl;
        return dataUrl;
    })().finally(() => faviconFetches.delete(domain));

    faviconFetches.set(domain, task);
    return task;
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

function scheduleFaviconCacheSave() {
    if (faviconSaveTimer) clearTimeout(faviconSaveTimer);
    faviconSaveTimer = setTimeout(() => {
        chrome.storage.local.set({ [FAVICON_CACHE_KEY]: faviconCache });
        faviconSaveTimer = null;
    }, 500);
}

async function cleanupFaviconCache(force = false) {
    const now = Date.now();
    const { [FAVICON_CLEANUP_KEY]: lastCleanup = 0 } = await chrome.storage.local.get(FAVICON_CLEANUP_KEY);
    if (!force && now - lastCleanup < FAVICON_CLEANUP_INTERVAL) return;

    const usedDomains = new Set([
        'google.com',
        'bing.com',
        'youtube.com',
        'duckduckgo.com'
    ]);
    state.shortcuts.forEach(shortcut => {
        const domain = getDomainFromUrl(shortcut.url);
        if (domain) usedDomains.add(domain);
    });

    const freshEntries = Object.entries(faviconCache)
        .filter(([domain, entry]) => {
            const lastUsedAt = entry?.lastUsedAt || entry?.updatedAt || 0;
            return usedDomains.has(domain) && now - lastUsedAt <= FAVICON_MAX_AGE && entry?.dataUrl;
        })
        .sort((a, b) => (b[1].lastUsedAt || b[1].updatedAt || 0) - (a[1].lastUsedAt || a[1].updatedAt || 0))
        .slice(0, FAVICON_MAX_ENTRIES);

    faviconCache = Object.fromEntries(freshEntries);
    await chrome.storage.local.set({
        [FAVICON_CACHE_KEY]: faviconCache,
        [FAVICON_CLEANUP_KEY]: now
    });
}

// ===== Khởi tạo =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initClock();
    renderSearchEngineSelect(); // Gọi render trước khi init search
    initSearch();
    initShortcuts();
    initTodos();
    initQuote();
    applySettings();
    // Wire settings button on new tab
    const settingsFab = document.getElementById('settings-fab');
    if (settingsFab) {
        settingsFab.addEventListener('click', (e) => {
            e.stopPropagation();
            openSettings();
        });
    }

    const todoFab = document.getElementById('todo-fab');
    if (todoFab) {
        todoFab.addEventListener('click', () => {
            document.getElementById('todo-panel')?.classList.toggle('open');
        });
    }
});
// Render select menu với icon cho từng engine
function renderSearchEngineSelect() {
    const dropdown = document.getElementById('search-engine-dropdown');
    const dropbtn = document.getElementById('current-engine-btn');
    const currentIcon = document.getElementById('current-engine-icon');
    const list = document.getElementById('engine-dropdown-list');
    
    if (!dropdown || !dropbtn || !list) return;

    const engines = [
        { value: 'google', url: 'https://www.google.com', name: 'Google' },
        { value: 'bing', url: 'https://www.bing.com', name: 'Bing' },
        { value: 'youtube', url: 'https://www.youtube.com', name: 'YouTube' },
        { value: 'duckduckgo', url: 'https://duckduckgo.com', name: 'DuckDuckGo' }
    ];

    // Khởi tạo icon hiện tại
    const current = engines.find(e => e.value === state.currentEngine) || engines[0];
    applyShortcutImage(currentIcon, current.url, current.name);

    // Render danh sách icon
    list.innerHTML = '';
    engines.forEach(engine => {
        const item = document.createElement('div');
        item.className = `engine-item ${engine.value === state.currentEngine ? 'active' : ''}`;
        const icon = document.createElement('img');
        icon.title = engine.name;
        applyShortcutImage(icon, engine.url, engine.name);
        item.appendChild(icon);
        item.addEventListener('click', () => {
            state.currentEngine = engine.value;
            applyShortcutImage(currentIcon, engine.url, engine.name);
            saveSettings({ searchEngine: state.currentEngine });
            
            // Update active state
            document.querySelectorAll('.engine-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            list.classList.remove('show');
            dropdown.classList.remove('open');
        });
        list.appendChild(item);
    });

    // Toggle dropdown
    dropbtn.addEventListener('click', (e) => {
        e.stopPropagation();
        list.classList.toggle('show');
        dropdown.classList.toggle('open');
    });

    // Đóng khi click bên ngoài
    document.addEventListener('click', () => {
        list.classList.remove('show');
        dropdown.classList.remove('open');
    });
}

function updateSelectIcon(select) {
    // Hàm này không còn dùng nữa vì đã chuyển sang custom dropdown
}

// ===== Load dữ liệu =====
async function loadData() {
    try {
        // Migrate from sync to local if needed, or just read local
        // We prefer local for settings now because of potential image data
        const localKeys = ['edgeHomeSettings', 'edgeHomeShortcuts', 'edgeHomeTodos', 'edgeHomeSlideIndex', FAVICON_CACHE_KEY];
        const localResult = await chrome.storage.local.get(localKeys);
        const syncResult = await chrome.storage.sync.get(['edgeHomeSettings', 'edgeHomeShortcuts', 'edgeHomeTodos']);
        
        // Merge or prioritize local. If local is empty but sync has data, migrate it.
        if (!localResult.edgeHomeSettings && syncResult.edgeHomeSettings) {
            state.settings = syncResult.edgeHomeSettings;
            await chrome.storage.local.set({ edgeHomeSettings: state.settings });
        } else {
            state.settings = localResult.edgeHomeSettings || {};
        }

        state.shortcuts = localResult.edgeHomeShortcuts || syncResult.edgeHomeShortcuts || CONFIG.defaultShortcuts;
        // normalize
        state.shortcuts = state.shortcuts.map(s => ({ pinned: false, folder: '', ...s }));
        state.todos = localResult.edgeHomeTodos || syncResult.edgeHomeTodos || [];
        state.currentEngine = state.settings.searchEngine || 'google';
        currentSlideIndex = localResult.edgeHomeSlideIndex || 0;
        faviconCache = localResult[FAVICON_CACHE_KEY] || {};
        cleanupFaviconCache().catch(() => {});
    } catch (e) {
        console.error('Lỗi load dữ liệu:', e);
    }
}

// ===== Áp dụng cài đặt =====
function applySettings() {
    const s = state.settings;
    applyTheme(s.newtabTheme || DEFAULT_NEWTAB_THEME);
    toggle('clock-section', s.showClock ?? true);
    toggle('search-section', s.showSearch ?? true);
    toggle('shortcuts-section', s.showShortcuts ?? true);
    toggle('ai-section', s.showAiTools ?? true);
    toggle('quote-section', s.showQuote ?? true);

    // Stop existing slideshow if any
    if (slideshowTimer) {
        clearInterval(slideshowTimer);
        slideshowTimer = null;
    }

    // Apply Background
    const bgType = s.bgType || 'gradient';
    const bgValue = s.bgValue;
    
    if (bgType === 'slideshow') {
        const list = (s.bgSlideshowList || []).filter(item => item.trim());
        if (list.length > 0) {
            // "Change on new tab" logic: increment index and save
            if (s.bgSlideshowOnNewTab) {
                currentSlideIndex = (currentSlideIndex + 1) % list.length;
                chrome.storage.local.set({ edgeHomeSlideIndex: currentSlideIndex });
            }

            if (currentSlideIndex >= list.length) currentSlideIndex = 0;
            setPageBackground(list[currentSlideIndex]);
            
            const interval = (s.bgSlideshowInterval || 30) * 1000;
            // Only start timer if interval > 0 and there are multiple slides
            if (interval > 0 && list.length > 1) {
                slideshowTimer = setInterval(() => {
                    currentSlideIndex = (currentSlideIndex + 1) % list.length;
                    setPageBackground(list[currentSlideIndex]);
                    chrome.storage.local.set({ edgeHomeSlideIndex: currentSlideIndex });
                }, interval);
            }
        } else {
            // Default if list is empty
            setPageBackground(getCurrentTheme().defaultBackground);
        }
    } else {
        setPageBackground(bgValue, bgType);
    }
}

function getCurrentTheme() {
    const themeId = state.settings.newtabTheme || DEFAULT_NEWTAB_THEME;
    return CONFIG.themes.find(theme => theme.id === themeId) || CONFIG.themes[0];
}

function applyTheme(themeId) {
    const nextTheme = CONFIG.themes.some(theme => theme.id === themeId) ? themeId : DEFAULT_NEWTAB_THEME;
    document.body.dataset.theme = nextTheme;
}

function setPageBackground(value, type) {
    if (!value) {
        document.body.style.backgroundImage = getCurrentTheme().defaultBackground;
        document.body.style.backgroundColor = 'var(--bg-primary)';
        return;
    }

    // Infer type if not provided (for slideshow)
    if (!type) {
        if (value.startsWith('linear-gradient') || value.startsWith('radial-gradient')) {
            type = 'gradient';
        } else if (value.startsWith('url(') || value.startsWith('data:') || value.includes('://')) {
            type = 'image';
            if (!value.startsWith('url(')) value = `url('${value}')`;
        } else if (value.startsWith('#') || value.startsWith('rgb')) {
            type = 'solid';
        } else {
            type = 'gradient'; // fallback
        }
    }

    if (type === 'image') {
        const imgUrl = value.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || value;
        // Basic check to avoid re-setting same image
        const currentBg = document.body.style.backgroundImage.replace(/['"]/g, '');
        const targetBg = value.replace(/['"]/g, '');
        if (currentBg === targetBg) return;

        if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) {
            const img = new Image();
            img.onload = () => {
                // Apply background with optimal settings
                document.body.style.backgroundImage = value;
                document.body.style.backgroundColor = 'var(--bg-primary)';
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundAttachment = 'fixed';
                // Use lighten blend mode to enhance image visibility without affecting text
                document.body.style.backgroundBlendMode = 'lighten';
            };
            img.src = imgUrl;
        } else {
            document.body.style.backgroundImage = value;
            document.body.style.backgroundColor = 'var(--bg-primary)';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center center';
            document.body.style.backgroundBlendMode = 'lighten';
        }
    } else if (type === 'solid') {
        if (document.body.style.backgroundColor === value && (document.body.style.backgroundImage === 'none' || !document.body.style.backgroundImage)) return;
        document.body.style.backgroundColor = value;
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundBlendMode = 'normal';
    } else {
        const currentBg = document.body.style.backgroundImage.replace(/\s+/g, '');
        const targetBg = value.replace(/\s+/g, '');
        if (currentBg === targetBg) return;
        
        document.body.style.backgroundImage = value;
        // For gradients, keep the theme background color underneath to support transparency
        document.body.style.backgroundColor = 'var(--bg-primary)';
        document.body.style.backgroundBlendMode = 'normal';
    }
}

function toggle(id, show) {
    document.getElementById(id)?.classList.toggle('hidden', !show);
}

function initTodos() {
    const panel = document.getElementById('todo-panel');
    const closeBtn = document.getElementById('close-todo');
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');

    if (!panel || !closeBtn || !form || !input || !list) return;

    closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        state.todos.push({
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            text,
            done: false,
            createdAt: Date.now()
        });
        input.value = '';
        await saveTodos();
        renderTodos();
    });

    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    const count = document.getElementById('todo-count');
    if (!list || !count) return;

    list.replaceChildren();
    state.todos.forEach(todo => {
        const item = document.createElement('div');
        item.className = `todo-item ${todo.done ? 'done' : ''}`;

        const checkbox = document.createElement('button');
        checkbox.type = 'button';
        checkbox.className = 'todo-checkbox';
        checkbox.title = todo.done ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong';
        checkbox.addEventListener('click', async () => {
            todo.done = !todo.done;
            await saveTodos();
            renderTodos();
        });

        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'todo-delete';
        deleteBtn.title = 'Xóa';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-trash';
        deleteBtn.appendChild(icon);
        deleteBtn.addEventListener('click', async () => {
            state.todos = state.todos.filter(itemToKeep => itemToKeep.id !== todo.id);
            await saveTodos();
            renderTodos();
        });

        item.append(checkbox, text, deleteBtn);
        list.appendChild(item);
    });

    const remaining = state.todos.filter(todo => !todo.done).length;
    count.textContent = `${remaining} việc`;
}

async function saveTodos() {
    await chrome.storage.local.set({ edgeHomeTodos: state.todos });
}

// ===== Đồng hồ =====
function initClock() {
    const fullDateElement = document.getElementById('full-date');
    fullDateElement.addEventListener('click', openCalendar);
    fullDateElement.style.cursor = 'pointer';
    
    const update = () => {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        
        document.getElementById('time').textContent = `${h}:${m}`;
        document.getElementById('day').textContent = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        document.getElementById('full-date').textContent = now.toLocaleDateString('vi-VN', { 
            day: '2-digit', month: 'long', year: 'numeric' 
        });
        
        updateGreeting(now.getHours());
    };
    update();
    setInterval(update, 1000);
}

function updateGreeting(hour) {
    let text = 'Xin chào';
    if (hour >= 5 && hour < 12) text = 'Chào buổi sáng';
    else if (hour >= 12 && hour < 18) text = 'Chào buổi chiều';
    else text = 'Chào buổi tối';
    
    const name = state.settings.userName;
    document.getElementById('greeting').textContent = name ? `${text}, ${name}!` : `${text}!`;
}

// ===== Lịch =====
let currentCalendarDate = new Date();

function openCalendar() {
    currentCalendarDate = new Date(); // Reset to current month
    const modal = document.getElementById('calendar-modal');
    modal.classList.add('open');
    
    const closeBtn = document.getElementById('calendar-close');
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.remove('open'));
    
    // Navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });
    
    renderCalendar();
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    document.getElementById('calendar-title').textContent = 
        `Tháng ${month + 1}, ${year}`;
    
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        if (date.getMonth() !== month) {
            dayDiv.classList.add('other-month');
        }
        
        if (isCurrentMonth && date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
            dayDiv.classList.add('today');
        }
        
        dayDiv.innerHTML = `
            <div class="calendar-day-number">${date.getDate()}</div>
        `;
        
        daysContainer.appendChild(dayDiv);
    }
}

// ===== Tìm kiếm =====
function initSearch() {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const voiceBtn = document.getElementById('voice-btn');
    const imageBtn = document.getElementById('image-btn');
    
    // Submit form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (q) {
            window.location.href = CONFIG.engines[state.currentEngine].url + encodeURIComponent(q);
        }
    });
    
    // Tìm kiếm giọng nói
    if ('webkitSpeechRecognition' in window) {
        voiceBtn.addEventListener('click', () => {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'vi-VN';
            recognition.start();
            
            voiceBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
            
            recognition.onresult = (e) => {
                input.value = e.results[0][0].transcript;
                voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            };
            
            recognition.onerror = () => {
                voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            };
        });
    } else {
        voiceBtn.style.display = 'none';
    }
    
    // Tìm kiếm hình ảnh
    imageBtn.addEventListener('click', () => {
        const q = input.value.trim();
        if (q) {
            // Search images with text
            window.location.href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
        } else {
            // Open Google Lens for direct image search
            window.location.href = 'https://lens.google.com/';
        }
    });
}

// ===== Lối tắt =====
function initShortcuts() {
    renderShortcuts();
    
    const addBtn = document.getElementById('add-shortcut-btn');
    const modal = document.getElementById('shortcut-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const saveBtn = document.getElementById('modal-save');
    const overlay = modal.querySelector('.modal-overlay');
    const folderView = document.getElementById('folder-view');
    
    const openModal = () => modal.classList.add('open');
    const closeModal = () => modal.classList.remove('open');
    
    addBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Close folder view
    const folderOverlay = folderView.querySelector('.folder-view-overlay');
    folderOverlay.addEventListener('click', () => {
        folderView.classList.remove('open');
    });

    // Drag out of folder logic
    folderOverlay.addEventListener('dragover', (e) => {
        e.preventDefault();
        folderOverlay.classList.add('drag-over');
    });

    folderOverlay.addEventListener('dragleave', () => {
        folderOverlay.classList.remove('drag-over');
    });

    folderOverlay.addEventListener('drop', (e) => {
        e.preventDefault();
        folderOverlay.classList.remove('drag-over');
        if (draggedType === 'index') {
            state.shortcuts[draggedItem].folder = '';
            saveShortcuts();
            renderShortcuts();
            folderView.classList.remove('open');
        }
    });

    saveBtn.addEventListener('click', () => {
        const name = document.getElementById('shortcut-name').value.trim();
        let url = document.getElementById('shortcut-url').value.trim();
        
        if (name && url) {
            url = normalizeShortcutUrl(url);
            if (!url) {
                alert('URL khong hop le. Chi ho tro http hoac https.');
                return;
            }
            state.shortcuts.push({ name, url, folder: '', pinned: false });
            saveShortcuts();
            renderShortcuts();
            closeModal();
            document.getElementById('shortcut-name').value = '';
            document.getElementById('shortcut-url').value = '';
        }
    });
}

function normalizeShortcutUrl(value) {
    try {
        const candidate = value.startsWith('http://') || value.startsWith('https://')
            ? value
            : `https://${value}`;
        const url = new URL(candidate);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url.href;
    } catch {
        return null;
    }
}

let isInitialLoad = true;

function renderShortcuts() {
    const grid = document.getElementById('shortcuts-grid');
    grid.innerHTML = '';
    
    if (isInitialLoad) {
        grid.classList.add('initial-load');
        setTimeout(() => {
            grid.classList.remove('initial-load');
            isInitialLoad = false;
        }, 1000);
    }
    
    // Group by folder
    const folders = {};
    const rootItems = [];

    state.shortcuts.forEach((s, index) => {
        if (s.folder) {
            if (!folders[s.folder]) folders[s.folder] = { name: s.folder, items: [] };
            folders[s.folder].items.push({ ...s, originalIndex: index });
        } else {
            rootItems.push({ ...s, originalIndex: index });
        }
    });

    // Render Folders
    Object.keys(folders).forEach((folderName, i) => {
        const folder = folders[folderName];
        const el = document.createElement('div');
        el.className = 'shortcut folder';
        el.setAttribute('draggable', 'true');
        el.style.animationDelay = `${i * 0.05}s`;
        
        const iconGrid = document.createElement('div');
        iconGrid.className = 'shortcut-icon folder-icon';
        folder.items.slice(0, 9).forEach(item => {
            const miniIcon = document.createElement('div');
            miniIcon.className = 'mini-icon';
            const image = document.createElement('img');
            applyShortcutImage(image, item.url, item.name);
            miniIcon.appendChild(image);
            iconGrid.appendChild(miniIcon);
        });

        const nameEl = document.createElement('span');
        nameEl.className = 'shortcut-name';
        nameEl.textContent = folderName;
        el.append(iconGrid, nameEl);

        el.addEventListener('click', () => openFolder(folderName, folder.items));
        setupDragEvents(el, folderName, true);
        grid.appendChild(el);
    });

    // Render Root Items
    const folderCount = Object.keys(folders).length;
    rootItems.forEach((s, i) => {
        const el = createShortcutElement(s);
        el.style.animationDelay = `${(folderCount + i) * 0.05}s`;
        grid.appendChild(el);
    });
}

function createShortcutElement(s) {
    const el = document.createElement('div');
    el.className = 'shortcut';
    el.setAttribute('draggable', 'true');

    const iconWrap = document.createElement('div');
    iconWrap.className = 'shortcut-icon';
    const image = document.createElement('img');
    applyShortcutImage(image, s.url, s.name);
    iconWrap.appendChild(image);

    const nameEl = document.createElement('span');
    nameEl.className = 'shortcut-name';
    nameEl.textContent = s.name || '';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'shortcut-delete';
    deleteBtn.dataset.index = s.originalIndex;
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fa-solid fa-xmark';
    deleteBtn.appendChild(deleteIcon);

    el.append(iconWrap, nameEl, deleteBtn);

    el.addEventListener('click', (e) => {
        if (e.target.closest('.shortcut-delete')) return;
        window.location.href = s.url;
    });

    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.shortcuts.splice(s.originalIndex, 1);
        saveShortcuts();
        renderShortcuts();
    });

    setupDragEvents(el, s.originalIndex, false);
    return el;
}

function openFolder(name, items) {
    const folderView = document.getElementById('folder-view');
    const folderGrid = document.getElementById('folder-grid');
    const folderNameDisplay = document.getElementById('folder-name-display');
    const editBtn = document.getElementById('edit-folder-name');

    folderNameDisplay.textContent = name;
    folderGrid.innerHTML = '';
    
    items.forEach(s => {
        const el = createShortcutElement(s);
        folderGrid.appendChild(el);
    });

    // Edit folder name
    editBtn.onclick = () => {
        const newName = prompt('Nhập tên mới cho thư mục:', name);
        if (newName && newName.trim() && newName !== name) {
            // Update all items in this folder
            state.shortcuts.forEach(s => {
                if (s.folder === name) s.folder = newName.trim();
            });
            saveShortcuts();
            renderShortcuts();
            folderView.classList.remove('open');
        }
    };

    folderView.classList.add('open');
}

// ===== Drag and Drop Logic =====
let draggedItem = null;
let draggedType = null; // 'index' or 'folder'
let groupTimer = null;
let isGroupedByTimer = false;

function generateUniqueFolderName() {
    const existingFolders = new Set(state.shortcuts.map(s => s.folder).filter(f => f));
    let counter = 1;
    let name = `Thư mục ${counter}`;
    while (existingFolders.has(name)) {
        counter++;
        name = `Thư mục ${counter}`;
    }
    return name;
}

function setupDragEvents(el, identifier, isFolder) {
    el.addEventListener('dragstart', (e) => {
        draggedItem = identifier;
        draggedType = isFolder ? 'folder' : 'index';
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        document.querySelectorAll('.shortcut').forEach(s => s.classList.remove('drag-over'));
        if (groupTimer) {
            clearTimeout(groupTimer);
            groupTimer = null;
        }
        isGroupedByTimer = false;
    });

    el.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.classList.add('drag-over');
        
        // For folders, start timer to group on hold
        if (isFolder && draggedType === 'index' && !groupTimer) {
            groupTimer = setTimeout(() => {
                state.shortcuts[draggedItem].folder = identifier;
                saveShortcuts();
                renderShortcuts();
                updateFolderView();
                isGroupedByTimer = true;
                groupTimer = null;
            }, 1500); // 1.5 seconds hold
        }
        
        // For shortcuts, start timer to create new folder on hold
        if (!isFolder && draggedType === 'index' && draggedItem !== identifier && !groupTimer) {
            groupTimer = setTimeout(() => {
                // Create new folder with both shortcuts
                const folderName = generateUniqueFolderName();
                state.shortcuts[draggedItem].folder = folderName;
                state.shortcuts[identifier].folder = folderName;
                saveShortcuts();
                renderShortcuts();
                updateFolderView();
                isGroupedByTimer = true;
                groupTimer = null;
            }, 1500); // 1.5 seconds hold
        }
    });

    el.addEventListener('dragleave', () => {
        el.classList.remove('drag-over');
        if (groupTimer) {
            clearTimeout(groupTimer);
            groupTimer = null;
        }
    });

    el.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIdentifier = identifier;
        const targetIsFolder = isFolder;

        if (draggedItem === targetIdentifier) return;

        // If already grouped by timer, skip reorder
        if (isGroupedByTimer) {
            isGroupedByTimer = false;
            return;
        }

        // Clear timer if drop happens before grouping
        if (groupTimer) {
            clearTimeout(groupTimer);
            groupTimer = null;
        }

        handleReorder(draggedItem, draggedType, targetIdentifier, targetIsFolder);
    });
}

function updateFolderView() {
    const folderView = document.getElementById('folder-view');
    if (!folderView.classList.contains('open')) return;
    
    const folderName = document.getElementById('folder-name-display').textContent;
    const items = state.shortcuts.filter(s => s.folder === folderName);
    const folderGrid = document.getElementById('folder-grid');
    folderGrid.innerHTML = '';
    items.forEach(s => {
        const el = createShortcutElement(s);
        folderGrid.appendChild(el);
    });
}

function handleReorder(sourceId, sourceType, targetId, targetType) {
    if (sourceType === 'index') {
        const sourceItem = state.shortcuts[sourceId];
        const targetItem = typeof targetId === 'number' ? state.shortcuts[targetId] : null;
        
        if (targetType === 'folder') {
            sourceItem.folder = targetId;
        } else if (targetItem && sourceItem.folder === targetItem.folder && sourceItem.folder !== '') {
            // Reordering within the same folder
            const folderName = sourceItem.folder;
            const folderItems = state.shortcuts.filter(s => s.folder === folderName);
            const sourceInFolder = folderItems.findIndex(s => s === sourceItem);
            const targetInFolder = folderItems.findIndex(s => s === targetItem);
            
            // Remove from folder items and reinsert
            folderItems.splice(sourceInFolder, 1);
            folderItems.splice(targetInFolder, 0, sourceItem);
            
            // Update state.shortcuts to reflect new order
            const nonFolderItems = state.shortcuts.filter(s => s.folder !== folderName);
            state.shortcuts = [...nonFolderItems, ...folderItems];
        } else {
            // Moving to root or different folder
            sourceItem.folder = ''; // Clear folder
            const removed = state.shortcuts.splice(sourceId, 1)[0];
            if (typeof targetId === 'number') {
                state.shortcuts.splice(targetId, 0, removed);
            } else {
                state.shortcuts.push(removed);
            }
        }
    } 
    
    saveShortcuts();
    renderShortcuts();
    updateFolderView();
}

async function saveShortcuts() {
    await chrome.storage.sync.set({ edgeHomeShortcuts: state.shortcuts });
}

// ===== Quote =====
function initQuote() {
    const q = CONFIG.quotes[Math.floor(Math.random() * CONFIG.quotes.length)];
    document.getElementById('quote-text').textContent = `"${q.text}"`;
    document.getElementById('quote-author').textContent = `— ${q.author}`;
}

// ===== Lưu cài đặt =====
async function saveSettings(update) {
    state.settings = { ...state.settings, ...update };
    // Save to local storage to support large image data
    await chrome.storage.local.set({ edgeHomeSettings: state.settings });
}

// ===== Settings UI loader & bindings =====
async function openSettings() {
    try {
        const modal = document.getElementById('settings-modal');
        const container = document.getElementById('settings-container');

        // Ensure settings styles are injected once
        if (!document.getElementById('edge-home-style')) {
            const link = document.createElement('link');
            link.id = 'edge-home-style';
            link.rel = 'stylesheet';
            link.href = 'style.css';
            document.head.appendChild(link);
        }

        // Load ui.html (same folder)
        const res = await fetch('ui.html');
        if (!res.ok) throw new Error('Không thể tải giao diện cài đặt');
        const html = await res.text();
        container.innerHTML = html;
        modal.classList.add('open');

        // Close when clicking overlay or pressing Escape
        modal.querySelector('.modal-overlay')?.addEventListener('click', closeSettings);
        const escHandler = (e) => { if (e.key === 'Escape') closeSettings(); };
        document.addEventListener('keydown', escHandler);

        // Wire buttons
        modal.querySelector('#reset-home-settings')?.addEventListener('click', async () => {
            // Reset to defaults
            state.settings = {};
            await chrome.storage.local.remove('edgeHomeSettings');
            await chrome.storage.sync.remove('edgeHomeSettings');
            applySettings();
            populateSettingsInputs(container);
            showStatus(container, 'Đã đặt lại mặc định');
        });

        modal.querySelector('#save-home-settings')?.addEventListener('click', async () => {
            const newSettings = collectSettingsFrom(container);
            await saveSettings(newSettings);
            applySettings();
            showStatus(container, 'Lưu thành công');
            setTimeout(closeSettings, 600);
        });

        // Tab Switching Logic
        const tabs = container.querySelectorAll('.nav-item');
        const contents = container.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                container.querySelector(`#tab-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Background Settings Logic
        initBackgroundSettings(container);

        // Populate inputs from current settings
        populateSettingsInputs(container);

        // Initialize image gallery after settings are populated
        await initImageGallery(container);

        // Initialize slideshow gallery after settings are populated
        await initSlideshowGallery(container);

        // Helper to close and cleanup
        function closeSettings() {
            modal.classList.remove('open');
            document.removeEventListener('keydown', escHandler);
        }
    } catch (e) {
        console.error(e);
    }
}

async function initBackgroundSettings(root) {
    const bgTypeBtns = root.querySelectorAll('.bg-type-btn');
    
    // Type switching
    bgTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveBackgroundPanel(root, btn.dataset.bgType);
        });
    });

    // Generate Gradients
    const gradients = [
        'linear-gradient(135deg, #1f2147 0%, #4b3f74 100%)',
        'linear-gradient(135deg, #12213a 0%, #253b63 100%)',
        'linear-gradient(135deg, #0f2a2a 0%, #28506a 100%)',
        'linear-gradient(to top, #1b2438 0%, #0a111d 100%)',
        'linear-gradient(120deg, #3b1f3f 0%, #7a3049 100%)',
        'linear-gradient(to right, #173d2f 0%, #1f6b63 100%)',
        'linear-gradient(to top, #1f2a4d 0%, #51466f 100%)',
        'linear-gradient(to top, #2b2540 0%, #1a1c30 100%)',
        'radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.18) 0%, transparent 46%), radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.12) 0%, transparent 42%), radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 58%)' // Default
    ];
    
    const gradientGrid = root.querySelector('#gradient-grid');
    gradients.forEach(g => {
        const el = document.createElement('div');
        el.className = 'color-swatch';
        el.style.backgroundImage = g;
        el.dataset.bgValue = g;
        el.onclick = () => selectBackground(root, 'gradient', g, el);
        gradientGrid.appendChild(el);
    });

    // Generate Solid Colors
    const colors = [
        '#0f172a', '#1e1b4b', '#172554', '#022c22', '#312e81', '#4c1d95', '#831843', '#881337', '#000000'
    ];
    const solidGrid = root.querySelector('#solid-grid');
    colors.forEach(c => {
        const el = document.createElement('div');
        el.className = 'color-swatch';
        el.style.background = c;
        el.dataset.bgValue = c;
        el.onclick = () => selectBackground(root, 'solid', c, el);
        solidGrid.appendChild(el);
    });

    // ===== Image Gallery Management =====
    // Will be called after populateSettingsInputs in openSettings()


    // ===== Slideshow Gallery Management =====
    // Will be called after populateSettingsInputs in openSettings()

}

function setActiveBackgroundPanel(root, type) {
    const nextType = type || 'gradient';
    root.querySelectorAll('.bg-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.bgType === nextType);
    });
    root.querySelectorAll('.bg-options-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `bg-panel-${nextType}`);
    });
}

function selectBackground(root, type, value, element) {
    // Visual selection
    root.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    
    // Store selection in dataset for collection
    root.dataset.selectedBgType = type;
    root.dataset.selectedBgValue = value;
}

function collectSettingsFrom(root) {
    const getChecked = (id, def) => {
        const el = root.querySelector(`#${id}`);
        return el ? !!el.checked : def;
    };

    // Background collection
    let bgType = root.dataset.selectedBgType;
    let bgValue = root.dataset.selectedBgValue;
    
    const activeTab = root.querySelector('.bg-type-btn.active');
    if (activeTab && activeTab.dataset.bgType === 'slideshow') {
        bgType = 'slideshow';
        bgValue = state.settings.bgValue;
    }

    return {
        showClock: getChecked('show-clock', true),
        showSearch: getChecked('show-search', true),
        showShortcuts: getChecked('show-shortcuts', true),
        showAiTools: getChecked('show-ai-tools', true),
        showQuote: getChecked('show-quote', true),
        newtabTheme: root.querySelector('input[name="newtab-theme"]:checked')?.value || state.settings.newtabTheme || DEFAULT_NEWTAB_THEME,
        userName: (root.querySelector('#user-name')?.value || '').trim(),
        bgType: bgType || state.settings.bgType || 'gradient',
        bgValue: bgValue || state.settings.bgValue,
        bgSlideshowInterval: parseInt(root.querySelector('#slideshow-interval')?.value || '30', 10),
        bgSlideshowList: root.slideshowList || state.settings.bgSlideshowList || [],
        bgSlideshowOnNewTab: getChecked('slideshow-on-newtab', false)
    };
}

function populateSettingsInputs(root) {
    const s = state.settings || {};
    const setChecked = (id, val) => { const el = root.querySelector(`#${id}`); if (el) el.checked = val; };
    setChecked('show-clock', s.showClock ?? true);
    setChecked('show-search', s.showSearch ?? true);
    setChecked('show-shortcuts', s.showShortcuts ?? true);
    setChecked('show-ai-tools', s.showAiTools ?? true);
    setChecked('show-quote', s.showQuote ?? true);
    const themeInput = root.querySelector(`input[name="newtab-theme"][value="${s.newtabTheme || DEFAULT_NEWTAB_THEME}"]`);
    if (themeInput) themeInput.checked = true;
    if (root.querySelector('#user-name')) root.querySelector('#user-name').value = s.userName || '';
    
    // Populate Slideshow settings
    setChecked('slideshow-on-newtab', s.bgSlideshowOnNewTab ?? false);
    if (root.querySelector('#slideshow-interval')) root.querySelector('#slideshow-interval').value = s.bgSlideshowInterval || 30;
    root.slideshowList = s.bgSlideshowList || [];


    // Populate Background
    const bgType = s.bgType || 'gradient';
    setActiveBackgroundPanel(root, bgType);
    root.querySelectorAll('.color-swatch').forEach(sw => sw.classList.remove('active'));

    if (s.bgValue) {
        if (bgType === 'image') {
            // Set dataset for image selection (gallery will show as active)
            root.dataset.selectedBgType = bgType;
            root.dataset.selectedBgValue = s.bgValue;
        } else {
            // Highlight swatch by comparing raw data-bg-value (for both solid and gradient)
            const currentValue = (s.bgValue || '').replace(/\s+/g, '');
            root.querySelectorAll('.color-swatch').forEach(sw => {
                if ((sw.dataset.bgValue || '').replace(/\s+/g, '') === currentValue) {
                    sw.classList.add('active');
                }
            });
        }

        root.dataset.selectedBgType = bgType;
        root.dataset.selectedBgValue = s.bgValue;
    } else {
        delete root.dataset.selectedBgType;
        delete root.dataset.selectedBgValue;
    }
}

// ===== Image Gallery Functions =====
async function initImageGallery(root) {
    // Load custom images from storage
    const customImages = await getCustomImages();
    
    const urlInput = root.querySelector('#bg-image-url');
    const addUrlBtn = root.querySelector('#add-image-url-btn');
    const fileInput = root.querySelector('#bg-image-upload');
    const gallery = root.querySelector('#image-gallery');
    const galleryCount = root.querySelector('#gallery-count');
    const emptyHint = root.querySelector('#empty-gallery-hint');
    
    // Render gallery
    const renderGallery = () => {
        gallery.innerHTML = '';
        customImages.forEach((img, idx) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const isActive = root.dataset.selectedBgValue === `url('${img}')`;
            if (isActive) item.classList.add('active');
            
            const imgEl = document.createElement('img');
            imgEl.src = img;
            imgEl.alt = `Image ${idx + 1}`;
            imgEl.onerror = () => { imgEl.src = ''; };
            
            const actions = document.createElement('div');
            actions.className = 'gallery-item-actions';
            
            const selectBtn = document.createElement('button');
            selectBtn.className = 'gallery-action-btn';
            selectBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            selectBtn.title = 'Chọn làm background';
            selectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                root.dataset.selectedBgType = 'image';
                root.dataset.selectedBgValue = `url('${img}')`;
                renderGallery();
                showStatus(root, 'Đã chọn hình ảnh');
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'gallery-action-btn delete';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.title = 'Xóa ảnh';
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Bạn chắc chắn muốn xóa ảnh này?')) {
                    customImages.splice(idx, 1);
                    await saveCustomImages(customImages);
                    renderGallery();
                    showStatus(root, 'Đã xóa ảnh');
                }
            });
            
            actions.appendChild(selectBtn);
            actions.appendChild(deleteBtn);
            item.appendChild(imgEl);
            item.appendChild(actions);
            gallery.appendChild(item);
        });
        
        galleryCount.textContent = `${customImages.length} ${customImages.length === 1 ? 'ảnh' : 'ảnh'}`;
        emptyHint.style.display = customImages.length === 0 ? 'block' : 'none';
    };
    
    // Add URL button
    addUrlBtn?.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            showStatus(root, 'Vui lòng nhập URL hình ảnh');
            return;
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            showStatus(root, 'URL phải bắt đầu bằng http:// hoặc https://');
            return;
        }
        
        // Check if already exists
        if (customImages.includes(url)) {
            showStatus(root, 'Hình ảnh này đã được thêm');
            return;
        }
        
        // Verify image can be loaded
        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
            
            customImages.push(url);
            await saveCustomImages(customImages);
            urlInput.value = '';
            renderGallery();
            showStatus(root, 'Đã thêm ảnh mới');
        } catch (e) {
            showStatus(root, 'Không thể tải ảnh. Kiểm tra URL');
        }
    });
    
    // File upload
    fileInput?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        
        let addedCount = 0;
        
        for (const file of files) {
            if (file.size > 2 * 1024 * 1024) {
                console.warn(`File ${file.name} quá lớn`);
                continue;
            }
            
            try {
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                
                if (!customImages.includes(dataUrl)) {
                    customImages.push(dataUrl);
                    addedCount++;
                }
            } catch (err) {
                console.error('Error reading file:', err);
            }
        }
        
        if (addedCount > 0) {
            await saveCustomImages(customImages);
            fileInput.value = '';
            renderGallery();
            showStatus(root, `Đã thêm ${addedCount} ảnh`);
        }
    });
    
    // Initial render
    renderGallery();
}

// ===== Slideshow Gallery Functions =====
async function initSlideshowGallery(root) {
    // Load slideshow items
    if (!root.slideshowList) root.slideshowList = [];
    
    const urlInput = root.querySelector('#slideshow-url');
    const addUrlBtn = root.querySelector('#add-slideshow-url-btn');
    const fileInput = root.querySelector('#slideshow-image-upload');
    const addCurrentBtn = root.querySelector('#add-current-to-slideshow');
    const gallery = root.querySelector('#slideshow-gallery');
    const galleryCount = root.querySelector('#slideshow-count');
    const emptyHint = root.querySelector('#empty-slideshow-hint');
    const clearBtn = root.querySelector('#clear-slideshow-list');
    
    // Render gallery
    const renderGallery = () => {
        gallery.innerHTML = '';
        root.slideshowList.forEach((item, idx) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'slideshow-item';
            
            // Detect type: image or gradient
            const isGradient = item.startsWith('linear-gradient') || item.startsWith('radial-gradient');
            const isUrl = item.startsWith('url(');
            
            if (isGradient) {
                const gradEl = document.createElement('div');
                gradEl.className = 'slideshow-item-gradient';
                gradEl.style.background = item;
                gradEl.title = 'Gradient';
                itemEl.appendChild(gradEl);
            } else if (isUrl) {
                const imgEl = document.createElement('img');
                const urlMatch = item.match(/url\(['"]?(.*?)['"]?\)/);
                if (urlMatch) {
                    imgEl.src = urlMatch[1];
                    imgEl.alt = `Item ${idx + 1}`;
                    imgEl.onerror = () => { imgEl.alt = 'Lỗi'; };
                }
                itemEl.appendChild(imgEl);
            } else {
                // Try as URL directly
                const imgEl = document.createElement('img');
                imgEl.src = item;
                imgEl.alt = `Item ${idx + 1}`;
                imgEl.onerror = () => { imgEl.alt = 'Lỗi'; };
                itemEl.appendChild(imgEl);
            }
            
            const actions = document.createElement('div');
            actions.className = 'slideshow-item-actions';
            
            if (idx > 0) {
                const upBtn = document.createElement('button');
                upBtn.className = 'slideshow-action-btn move-up';
                upBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
                upBtn.title = 'Lên trên';
                upBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const temp = root.slideshowList[idx];
                    root.slideshowList[idx] = root.slideshowList[idx - 1];
                    root.slideshowList[idx - 1] = temp;
                    renderGallery();
                });
                actions.appendChild(upBtn);
            }
            
            if (idx < root.slideshowList.length - 1) {
                const downBtn = document.createElement('button');
                downBtn.className = 'slideshow-action-btn move-down';
                downBtn.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
                downBtn.title = 'Xuống dưới';
                downBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const temp = root.slideshowList[idx];
                    root.slideshowList[idx] = root.slideshowList[idx + 1];
                    root.slideshowList[idx + 1] = temp;
                    renderGallery();
                });
                actions.appendChild(downBtn);
            }
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'slideshow-action-btn delete';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.title = 'Xóa';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Xóa item này khỏi trình chiếu?')) {
                    root.slideshowList.splice(idx, 1);
                    renderGallery();
                    showStatus(root, 'Đã xóa item');
                }
            });
            actions.appendChild(deleteBtn);
            
            itemEl.appendChild(actions);
            gallery.appendChild(itemEl);
        });
        
        galleryCount.textContent = `${root.slideshowList.length} ${root.slideshowList.length === 1 ? 'item' : 'item'}`;
        emptyHint.style.display = root.slideshowList.length === 0 ? 'block' : 'none';
    };
    
    // Add URL button
    addUrlBtn?.addEventListener('click', async () => {
        const input = urlInput.value.trim();
        if (!input) {
            showStatus(root, 'Vui lòng nhập URL hoặc Gradient');
            return;
        }
        
        // Check if already exists
        if (root.slideshowList.includes(input)) {
            showStatus(root, 'Item này đã được thêm');
            return;
        }
        
        // Validate: if URL, check if it's valid
        if (!input.startsWith('linear-gradient') && !input.startsWith('radial-gradient')) {
            if (!input.startsWith('http://') && !input.startsWith('https://')) {
                showStatus(root, 'URL phải bắt đầu bằng http:// hoặc https://');
                return;
            }
            
            // Verify image can be loaded
            try {
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = input;
                });
            } catch (e) {
                showStatus(root, 'Không thể tải ảnh. Kiểm tra URL');
                return;
            }
        }
        
        root.slideshowList.push(input);
        urlInput.value = '';
        renderGallery();
        showStatus(root, 'Đã thêm vào trình chiếu');
    });
    
    // File upload
    fileInput?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        
        let addedCount = 0;
        
        for (const file of files) {
            if (file.size > 2 * 1024 * 1024) {
                console.warn(`File ${file.name} quá lớn`);
                continue;
            }
            
            try {
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                
                if (!root.slideshowList.includes(dataUrl)) {
                    root.slideshowList.push(dataUrl);
                    addedCount++;
                }
            } catch (err) {
                console.error('Error reading file:', err);
            }
        }
        
        if (addedCount > 0) {
            fileInput.value = '';
            renderGallery();
            showStatus(root, `Đã thêm ${addedCount} ảnh`);
        }
    });
    
    // Add current background button
    addCurrentBtn?.addEventListener('click', () => {
        let currentVal = root.dataset.selectedBgValue || state.settings.bgValue;
        
        if (!currentVal) {
            showStatus(root, 'Chưa có background được chọn');
            return;
        }
        
        if (!root.slideshowList.includes(currentVal)) {
            root.slideshowList.push(currentVal);
            renderGallery();
            showStatus(root, 'Đã thêm background hiện tại');
        } else {
            showStatus(root, 'Background này đã có trong trình chiếu');
        }
    });
    
    // Clear all button
    clearBtn?.addEventListener('click', () => {
        if (confirm('Xóa toàn bộ danh sách trình chiếu?')) {
            root.slideshowList = [];
            renderGallery();
            showStatus(root, 'Đã xóa tất cả');
        }
    });
    
    // Initial render
    renderGallery();
}

async function getCustomImages() {
    const result = await chrome.storage.local.get('customImages');
    return result.customImages || [];
}

async function saveCustomImages(images) {
    await chrome.storage.local.set({ customImages: images });
}

function showStatus(root, msg) {
    // Prefer the in-modal status message, fall back to a simple toast
    const status = root.querySelector('#status-message');
    if (status) {
        status.textContent = msg;
        status.classList.add('show');
        setTimeout(() => { if (status) status.classList.remove('show'); }, 1800);
        return;
    }

    // Fallback: create a transient toast
    let toast = document.getElementById('edge-home-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'edge-home-toast';
        toast.className = 'status-message show';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 1800);
}
