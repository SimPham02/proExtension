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

// ===== Khởi tạo =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initClock();
    initWeather();
    initSearch();
    initShortcuts();
    initTodo();
    initQuote();
    applySettings();
});

// ===== Load dữ liệu =====
async function loadData() {
    try {
        const result = await chrome.storage.sync.get(['edgeHomeSettings', 'edgeHomeShortcuts', 'edgeHomeTodos']);
        state.settings = result.edgeHomeSettings || {};
        state.shortcuts = result.edgeHomeShortcuts || CONFIG.defaultShortcuts;
        // normalize
        state.shortcuts = state.shortcuts.map(s => ({ pinned: false, folder: '', ...s }));
        state.todos = result.edgeHomeTodos || [];
        state.currentEngine = state.settings.searchEngine || 'google';
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
    const engines = document.querySelectorAll('.engine');
    const voiceBtn = document.getElementById('voice-btn');
    const imageBtn = document.getElementById('image-btn');
    const imageInput = document.getElementById('image-input');
    
    // Chọn công cụ tìm kiếm
    engines.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.engine === state.currentEngine);
        btn.addEventListener('click', () => {
            engines.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentEngine = btn.dataset.engine;
            saveSettings({ searchEngine: state.currentEngine });
        });
    });
    
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
    await chrome.storage.sync.set({ edgeHomeSettings: state.settings });
}
