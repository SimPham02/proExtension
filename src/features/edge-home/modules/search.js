// ===== Quản lý Công Cụ Tìm Kiếm & Thanh Tìm Kiếm =====

export const SEARCH_ENGINES = {
    google: { url: 'https://www.google.com/search?q=', name: 'Google', homeUrl: 'https://www.google.com' },
    bing: { url: 'https://www.bing.com/search?q=', name: 'Bing', homeUrl: 'https://www.bing.com' },
    youtube: { url: 'https://www.youtube.com/results?search_query=', name: 'YouTube', homeUrl: 'https://www.youtube.com' },
    duckduckgo: { url: 'https://duckduckgo.com/?q=', name: 'DuckDuckGo', homeUrl: 'https://duckduckgo.com' }
};

export function initSearch({ getCurrentEngine, onEngineChange, applyIcon }) {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const voiceBtn = document.getElementById('voice-btn');
    const imageBtn = document.getElementById('image-btn');
    
    // Submit form
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = input?.value.trim();
        if (q) {
            const engineKey = getCurrentEngine() || 'google';
            const engine = SEARCH_ENGINES[engineKey] || SEARCH_ENGINES.google;
            window.location.href = engine.url + encodeURIComponent(q);
        }
    });
    
    // Tìm kiếm giọng nói
    if (voiceBtn) {
        if ('webkitSpeechRecognition' in window) {
            voiceBtn.addEventListener('click', () => {
                const recognition = new webkitSpeechRecognition();
                recognition.lang = 'vi-VN';
                recognition.start();
                
                voiceBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
                
                recognition.onresult = (e) => {
                    if (input) input.value = e.results[0][0].transcript;
                    voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                };
                
                recognition.onerror = () => {
                    voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                };
            });
        } else {
            voiceBtn.style.display = 'none';
        }
    }
    
    // Tìm kiếm hình ảnh
    imageBtn?.addEventListener('click', () => {
        const q = input?.value.trim();
        if (q) {
            window.location.href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
        } else {
            window.location.href = 'https://lens.google.com/';
        }
    });

    renderSearchEngineDropdown({ getCurrentEngine, onEngineChange, applyIcon });
}

export function renderSearchEngineDropdown({ getCurrentEngine, onEngineChange, applyIcon }) {
    const dropdown = document.getElementById('search-engine-dropdown');
    const dropbtn = document.getElementById('current-engine-btn');
    const currentIcon = document.getElementById('current-engine-icon');
    const list = document.getElementById('engine-dropdown-list');
    
    if (!dropdown || !dropbtn || !list) return;

    const engineList = Object.entries(SEARCH_ENGINES).map(([key, data]) => ({
        value: key,
        url: data.homeUrl,
        name: data.name
    }));

    const currentKey = getCurrentEngine() || 'google';
    const current = engineList.find(e => e.value === currentKey) || engineList[0];
    if (currentIcon && applyIcon) applyIcon(currentIcon, current.url, current.name);

    list.innerHTML = '';
    engineList.forEach(engine => {
        const item = document.createElement('div');
        item.className = `engine-item ${engine.value === currentKey ? 'active' : ''}`;
        const icon = document.createElement('img');
        icon.title = engine.name;
        if (applyIcon) applyIcon(icon, engine.url, engine.name);
        item.appendChild(icon);

        item.addEventListener('click', () => {
            if (currentIcon && applyIcon) applyIcon(currentIcon, engine.url, engine.name);
            onEngineChange?.(engine.value);
            
            document.querySelectorAll('.engine-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            list.classList.remove('show');
            dropdown.classList.remove('open');
        });
        list.appendChild(item);
    });

    dropbtn.onclick = (e) => {
        e.stopPropagation();
        list.classList.toggle('show');
        dropdown.classList.toggle('open');
    };

    document.addEventListener('click', () => {
        list.classList.remove('show');
        dropdown.classList.remove('open');
    });
}
