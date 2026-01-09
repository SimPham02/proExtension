// ===== Cấu hình =====
const CONFIG = {
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
    ],
    weatherIcons: {
        0: 'fa-sun', 1: 'fa-sun', 2: 'fa-cloud-sun', 3: 'fa-cloud',
        45: 'fa-smog', 48: 'fa-smog', 51: 'fa-cloud-rain', 53: 'fa-cloud-rain',
        55: 'fa-cloud-rain', 61: 'fa-cloud-showers-heavy', 63: 'fa-cloud-showers-heavy',
        65: 'fa-cloud-showers-heavy', 71: 'fa-snowflake', 73: 'fa-snowflake',
        75: 'fa-snowflake', 80: 'fa-cloud-showers-heavy', 95: 'fa-bolt'
    },
    weatherText: {
        0: 'Trời quang', 1: 'Trời quang', 2: 'Có mây', 3: 'U ám',
        45: 'Sương mù', 48: 'Sương mù', 51: 'Mưa phùn', 53: 'Mưa phùn',
        55: 'Mưa phùn', 61: 'Mưa nhẹ', 63: 'Mưa vừa', 65: 'Mưa to',
        71: 'Tuyết nhẹ', 73: 'Tuyết vừa', 75: 'Tuyết dày',
        80: 'Mưa rào', 95: 'Dông'
    }
};

// ===== State =====
let state = {
    settings: {},
    shortcuts: [],
    todos: [],
    currentEngine: 'google'
};
let slideshowTimer = null;
let currentSlideIndex = 0;

// ===== Khởi tạo =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initClock();
    initWeather();
    renderSearchEngineSelect(); // Gọi render trước khi init search
    initSearch();
    initShortcuts();
    initTodo();
    initQuote();
    applySettings();
    // Wire settings button on new tab
    const settingsFab = document.getElementById('settings-fab');
    if (settingsFab) settingsFab.addEventListener('click', openSettings);
});
// Render select menu với icon cho từng engine
function renderSearchEngineSelect() {
    const dropdown = document.getElementById('search-engine-dropdown');
    const dropbtn = document.getElementById('current-engine-btn');
    const currentIcon = document.getElementById('current-engine-icon');
    const list = document.getElementById('engine-dropdown-list');
    
    if (!dropdown || !dropbtn || !list) return;

    const engines = [
        { value: 'google', icon: 'https://www.google.com/favicon.ico', name: 'Google' },
        { value: 'bing', icon: 'https://www.bing.com/favicon.ico', name: 'Bing' },
        { value: 'youtube', icon: 'https://www.youtube.com/favicon.ico', name: 'YouTube' },
        { value: 'duckduckgo', icon: 'https://duckduckgo.com/favicon.ico', name: 'DuckDuckGo' }
    ];

    // Khởi tạo icon hiện tại
    const current = engines.find(e => e.value === state.currentEngine) || engines[0];
    currentIcon.src = current.icon;

    // Render danh sách icon
    list.innerHTML = '';
    engines.forEach(engine => {
        const item = document.createElement('div');
        item.className = `engine-item ${engine.value === state.currentEngine ? 'active' : ''}`;
        item.innerHTML = `<img src="${engine.icon}" alt="${engine.name}" title="${engine.name}">`;
        item.addEventListener('click', () => {
            state.currentEngine = engine.value;
            currentIcon.src = engine.icon;
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
        const localKeys = ['edgeHomeSettings', 'edgeHomeShortcuts', 'edgeHomeTodos', 'edgeHomeSlideIndex'];
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
    } catch (e) {
        console.error('Lỗi load dữ liệu:', e);
    }
}

// ===== Áp dụng cài đặt =====
function applySettings() {
    const s = state.settings;
    toggle('clock-section', s.showClock ?? true);
    toggle('search-section', s.showSearch ?? true);
    toggle('shortcuts-section', s.showShortcuts ?? true);
    toggle('ai-section', s.showAiTools ?? true);
    toggle('quote-section', s.showQuote ?? true);
    toggle('weather', s.showWeather ?? true);

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
            setPageBackground('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
        }
    } else {
        setPageBackground(bgValue, bgType);
    }
}

function setPageBackground(value, type) {
    if (!value) {
        document.body.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
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
                document.body.style.backgroundImage = value;
                document.body.style.backgroundColor = 'var(--bg-primary)';
            };
            img.src = imgUrl;
        } else {
            document.body.style.backgroundImage = value;
            document.body.style.backgroundColor = 'var(--bg-primary)';
        }
    } else if (type === 'solid') {
        if (document.body.style.backgroundColor === value && (document.body.style.backgroundImage === 'none' || !document.body.style.backgroundImage)) return;
        document.body.style.backgroundColor = value;
        document.body.style.backgroundImage = 'none';
    } else {
        const currentBg = document.body.style.backgroundImage.replace(/\s+/g, '');
        const targetBg = value.replace(/\s+/g, '');
        if (currentBg === targetBg) return;
        
        document.body.style.backgroundImage = value;
        // For gradients, keep the theme background color underneath to support transparency
        document.body.style.backgroundColor = 'var(--bg-primary)';
    }
}

function toggle(id, show) {
    document.getElementById(id)?.classList.toggle('hidden', !show);
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
        
        const lunar = getLunarDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
        
        dayDiv.innerHTML = `
            <div class="calendar-day-number">${date.getDate()}</div>
            <div class="calendar-lunar">${lunar.day}/${lunar.month}</div>
        `;
        
        daysContainer.appendChild(dayDiv);
    }
}

// Calibrated lunar date calculation for Vietnamese calendar
function getLunarDate(day, month, year) {
    // Use calibrated calculation based on known dates
    const lunarData = calculateCalibratedLunarDate(day, month, year);

    return {
        day: lunarData.day,
        month: lunarData.month
    };
}

// Calibrated lunar calculation using known reference points
function calculateCalibratedLunarDate(day, month, year) {
    // Known reference: January 6, 2026 = Lunar 18/11/2025
    // This gives us a calibration point

    const targetJd = julianDayNumber(6, 1, 2026);
    const targetLunar = { day: 18, month: 11, year: 2025 };

    // Calculate days from our reference point
    const currentJd = julianDayNumber(day, month, year);
    const daysDiff = currentJd - targetJd;

    // Lunar month is approximately 29.530588 days
    const lunarMonthLength = 29.530588;
    const lunarDayLength = lunarMonthLength;

    // Calculate lunar date relative to reference
    let lunarDay = targetLunar.day + Math.round(daysDiff);
    let lunarMonth = targetLunar.month;
    let lunarYear = targetLunar.year;

    // Adjust for month boundaries
    while (lunarDay > 30) {
        lunarDay -= 30;
        lunarMonth += 1;
        if (lunarMonth > 12) {
            lunarMonth = 1;
            lunarYear += 1;
        }
    }

    while (lunarDay < 1) {
        lunarDay += 30;
        lunarMonth -= 1;
        if (lunarMonth < 1) {
            lunarMonth = 12;
            lunarYear -= 1;
        }
    }

    // Handle leap months (simplified - add leap month every 19 years)
    const yearsDiff = lunarYear - 2025;
    const leapMonths = Math.floor(yearsDiff / 19);
    lunarMonth += leapMonths;
    if (lunarMonth > 12) {
        lunarMonth -= 12;
        lunarYear += 1;
    }

    return {
        day: Math.max(1, Math.min(30, lunarDay)),
        month: lunarMonth,
        year: lunarYear
    };
}

// Convert Gregorian date to Julian Day Number
function julianDayNumber(day, month, year) {
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;

    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// ===== Thời tiết =====
async function initWeather() {
    if (state.settings.showWeather === false) return;
    
    try {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            );
            const data = await res.json();
            
            if (data.current_weather) {
                const { temperature, weathercode } = data.current_weather;
                document.getElementById('temp').textContent = `${Math.round(temperature)}°C`;
                document.getElementById('city').textContent = CONFIG.weatherText[weathercode] || 'Không rõ';
                
                const iconEl = document.querySelector('.weather-icon');
                iconEl.className = `fa-solid ${CONFIG.weatherIcons[weathercode] || 'fa-cloud'} weather-icon`;
            }
        }, () => {
            document.getElementById('city').textContent = 'Bật vị trí';
        });
    } catch (e) {
        console.error('Lỗi thời tiết:', e);
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
            if (!url.startsWith('http')) url = 'https://' + url;
            state.shortcuts.push({ name, url, folder: '', pinned: false });
            saveShortcuts();
            renderShortcuts();
            closeModal();
            document.getElementById('shortcut-name').value = '';
            document.getElementById('shortcut-url').value = '';
        }
    });
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
        
        let miniIconsHtml = '';
        folder.items.slice(0, 9).forEach(item => {
            miniIconsHtml += `<div class="mini-icon"><img src="https://www.google.com/s2/favicons?domain=${item.url}&sz=32" alt=""></div>`;
        });

        el.innerHTML = `
            <div class="shortcut-icon folder-icon">
                ${miniIconsHtml}
            </div>
            <span class="shortcut-name">${folderName}</span>
        `;

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
    el.innerHTML = `
        <div class="shortcut-icon">
            <img src="https://www.google.com/s2/favicons?domain=${s.url}&sz=64" alt="${s.name}">
        </div>
        <span class="shortcut-name">${s.name}</span>
        <button class="shortcut-delete" data-index="${s.originalIndex}"><i class="fa-solid fa-xmark"></i></button>
    `;

    el.addEventListener('click', (e) => {
        if (e.target.closest('.shortcut-delete')) return;
        window.location.href = s.url;
    });

    el.querySelector('.shortcut-delete').addEventListener('click', (e) => {
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

// ===== Todo =====
function initTodo() {
    const panel = document.getElementById('todo-panel');
    const fab = document.getElementById('todo-fab');
    const closeBtn = document.getElementById('close-todo');
    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-todo');
    const clearBtn = document.getElementById('clear-done');
    
    fab.addEventListener('click', () => panel.classList.add('open'));
    closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    
    const addTodo = () => {
        const text = input.value.trim();
        if (text) {
            state.todos.push({ text, done: false });
            saveTodos();
            renderTodos();
            input.value = '';
        }
    };
    
    addBtn.addEventListener('click', addTodo);
    input.addEventListener('keypress', (e) => e.key === 'Enter' && addTodo());
    
    clearBtn.addEventListener('click', () => {
        state.todos = state.todos.filter(t => !t.done);
        saveTodos();
        renderTodos();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 't' && !panel.classList.contains('open')) {
            e.preventDefault();
            fab.click();
        }
    });

}
function renderTodos() {
    const list = document.getElementById('todo-list');
    const count = document.getElementById('todo-count');
    
    list.innerHTML = '';
    state.todos.forEach((todo, i) => {
        const li = document.createElement('li');
        li.className = `todo-item${todo.done ? ' done' : ''}`;
        li.innerHTML = `
            <button class="todo-checkbox" data-index="${i}" title="Đánh dấu hoàn thành"></button>
            <span class="todo-text" data-index="${i}" contenteditable="false" title="Double-click để chỉnh sửa">${todo.text}</span>
            <button class="todo-delete" data-index="${i}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        `;
        list.appendChild(li);
    });
    
    count.textContent = `${state.todos.filter(t => !t.done).length} việc`;
    
    // Sự kiện
    list.querySelectorAll('.todo-checkbox').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.index);
            state.todos[i].done = !state.todos[i].done;
            saveTodos();
            renderTodos();
        });
    });
    
    list.querySelectorAll('.todo-text').forEach(span => {
        span.addEventListener('dblclick', () => {
            span.contentEditable = 'true';
            span.focus();
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(span);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
        
        span.addEventListener('blur', () => {
            span.contentEditable = 'false';
            const i = parseInt(span.dataset.index);
            const newText = span.textContent.trim();
            if (newText && newText !== state.todos[i].text) {
                state.todos[i].text = newText;
                saveTodos();
            } else if (!newText) {
                // If empty, delete
                state.todos.splice(i, 1);
                saveTodos();
                renderTodos();
            }
        });
        
        span.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                span.blur();
            }
        });
    });
    
    list.querySelectorAll('.todo-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            state.todos.splice(parseInt(btn.dataset.index), 1);
            saveTodos();
            renderTodos();
        });
    });
}

async function saveTodos() {
    await chrome.storage.sync.set({ edgeHomeTodos: state.todos });
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

        // Helper to close and cleanup
        function closeSettings() {
            modal.classList.remove('open');
            document.removeEventListener('keydown', escHandler);
        }
    } catch (e) {
        console.error(e);
    }
}

function initBackgroundSettings(root) {
    const bgTypeBtns = root.querySelectorAll('.bg-type-btn');
    const bgPanels = root.querySelectorAll('.bg-options-panel');
    
    // Type switching
    bgTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            bgTypeBtns.forEach(b => b.classList.remove('active'));
            bgPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            root.querySelector(`#bg-panel-${btn.dataset.bgType}`).classList.add('active');
        });
    });

    // Generate Gradients
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
        'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(to top, #5ee7df 0%, #b490ca 100%)',
        'linear-gradient(to top, #9890e3 0%, #b1f4cf 100%)',
        'radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.12) 0%, transparent 50%), radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.08) 0%, transparent 60%)' // Default
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

    // Image Input (URL)
    const imgInput = root.querySelector('#bg-image-url');
    const imgPreview = root.querySelector('#bg-image-preview');
    imgInput.addEventListener('input', () => {
        const url = imgInput.value.trim();
        if (url) {
            imgPreview.style.backgroundImage = `url('${url}')`;
            imgPreview.textContent = '';
            // Auto-select image type if typing
            root.dataset.selectedBgType = 'image';
            root.dataset.selectedBgValue = `url('${url}')`;
        }
    });

    // Image Input (File Upload)
    const fileInput = root.querySelector('#bg-image-upload');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('File quá lớn! Vui lòng chọn ảnh dưới 2MB.');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target.result;
            imgPreview.style.backgroundImage = `url('${result}')`;
            imgPreview.textContent = '';
            
            // Auto-select image type
            root.dataset.selectedBgType = 'image';
            root.dataset.selectedBgValue = `url('${result}')`;
            
            // Clear URL input to avoid confusion
            imgInput.value = '';
            
            // Switch to image tab if not active (though input is inside it)
            const imgTabBtn = root.querySelector('.bg-type-btn[data-bg-type="image"]');
            if (imgTabBtn) imgTabBtn.click();
        };
        reader.readAsDataURL(file);
    });

    // Slideshow: Add current background to list
    const addCurrentBtn = root.querySelector('#add-current-to-slideshow');
    const slideshowList = root.querySelector('#slideshow-list');
    if (addCurrentBtn && slideshowList) {
        addCurrentBtn.addEventListener('click', () => {
            let currentVal = root.dataset.selectedBgValue || state.settings.bgValue;
            
            // If image/gradient type is active but not "selected" via click (e.g. manually typed URL)
            const activeTab = root.querySelector('.bg-type-btn.active');
            if (activeTab) {
                const type = activeTab.dataset.bgType;
                if (type === 'image') {
                    const urlInput = root.querySelector('#bg-image-url').value.trim();
                    if (urlInput) currentVal = `url('${urlInput}')`;
                }
            }

            if (!currentVal) {
                // Last fallback: default gradient
                currentVal = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }

            // Normalizing value for comparison
            const normalizedVal = currentVal.trim();
            const currentContent = slideshowList.value.trim();
            const lines = currentContent ? currentContent.split('\n').map(l => l.trim()) : [];
            
            if (!lines.includes(normalizedVal)) {
                lines.push(normalizedVal);
                slideshowList.value = lines.join('\n');
            }
        });
    }

    // Slideshow: Multiple image upload
    const slideshowUpload = root.querySelector('#slideshow-image-upload');
    if (slideshowUpload && slideshowList) {
        slideshowUpload.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;

            const currentContent = slideshowList.value.trim();
            const lines = currentContent ? currentContent.split('\n').map(l => l.trim()) : [];
            let addedCount = 0;

            for (const file of files) {
                if (file.size > 2 * 1024 * 1024) {
                    console.warn(`File ${file.name} too large`);
                    continue;
                }

                try {
                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => resolve(ev.target.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    const val = `url('${dataUrl}')`;
                    if (!lines.includes(val)) {
                        lines.push(val);
                        addedCount++;
                    }
                } catch (err) {
                    console.error('Error reading file:', err);
                }
            }

            slideshowList.value = lines.join('\n');
            slideshowUpload.value = ''; // Reset
            if (addedCount > 0) {
                // Optional: show a small toast or just update UI
            }
        });
    }

    // Slideshow: Clear All
    root.querySelector('#clear-slideshow-list')?.addEventListener('click', () => {
        if (confirm('Xóa toàn bộ danh sách hình nền trong trình chiếu?')) {
            slideshowList.value = '';
        }
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
    
    // If image tab is active, prefer input value
    const activeTab = root.querySelector('.bg-type-btn.active');
    if (activeTab && activeTab.dataset.bgType === 'image') {
        const url = root.querySelector('#bg-image-url').value.trim();
        if (url) {
            bgType = 'image';
            bgValue = `url('${url}')`;
        }
    } else if (activeTab && activeTab.dataset.bgType === 'slideshow') {
        bgType = 'slideshow';
    }

    return {
        showClock: getChecked('show-clock', true),
        showSearch: getChecked('show-search', true),
        showShortcuts: getChecked('show-shortcuts', true),
        showWeather: getChecked('show-weather', true),
        showAiTools: getChecked('show-ai-tools', true),
        showQuote: getChecked('show-quote', true),
        userName: (root.querySelector('#user-name')?.value || '').trim(),
        bgType: bgType || state.settings.bgType || 'gradient',
        bgValue: bgValue || state.settings.bgValue,
        bgSlideshowInterval: parseInt(root.querySelector('#slideshow-interval')?.value || '30', 10),
        bgSlideshowList: (root.querySelector('#slideshow-list')?.value || '').split('\n').map(s => s.trim()).filter(s => s),
        bgSlideshowOnNewTab: getChecked('slideshow-on-newtab', false)
    };
}

function populateSettingsInputs(root) {
    const s = state.settings || {};
    const setChecked = (id, val) => { const el = root.querySelector(`#${id}`); if (el) el.checked = val; };
    setChecked('show-clock', s.showClock ?? true);
    setChecked('show-search', s.showSearch ?? true);
    setChecked('show-shortcuts', s.showShortcuts ?? true);
    setChecked('show-weather', s.showWeather ?? true);
    setChecked('show-ai-tools', s.showAiTools ?? true);
    setChecked('show-quote', s.showQuote ?? true);
    if (root.querySelector('#user-name')) root.querySelector('#user-name').value = s.userName || '';
    
    // Populate Slideshow settings
    setChecked('slideshow-on-newtab', s.bgSlideshowOnNewTab ?? false);
    if (root.querySelector('#slideshow-interval')) root.querySelector('#slideshow-interval').value = s.bgSlideshowInterval || 30;
    if (root.querySelector('#slideshow-list')) root.querySelector('#slideshow-list').value = (s.bgSlideshowList || []).join('\n');

    // Populate Background
    if (s.bgType) {
        const typeBtn = root.querySelector(`.bg-type-btn[data-bg-type="${s.bgType}"]`);
        if (typeBtn) typeBtn.click();
        
        if (s.bgType === 'image' && s.bgValue) {
            // Extract URL from url('...')
            const match = s.bgValue.match(/url\(['"]?(.*?)['"]?\)/);
            if (match) {
                const url = match[1];
                // Only set URL input if it's not a data URI (too long)
                if (!url.startsWith('data:')) {
                    root.querySelector('#bg-image-url').value = url;
                }
                root.querySelector('#bg-image-preview').style.backgroundImage = s.bgValue;
                root.querySelector('#bg-image-preview').textContent = '';
            }
        } else if (s.bgValue) {
            // Highlight swatch by comparing raw data-bg-value (for both solid and gradient)
            const swatches = root.querySelectorAll('.color-swatch');
            swatches.forEach(sw => {
                // Compare as string, ignore whitespace
                if ((sw.dataset.bgValue || '').replace(/\s+/g, '') === (s.bgValue || '').replace(/\s+/g, '')) {
                    sw.classList.add('active');
                }
            });
        }
        
        root.dataset.selectedBgType = s.bgType;
        root.dataset.selectedBgValue = s.bgValue;
    }
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
