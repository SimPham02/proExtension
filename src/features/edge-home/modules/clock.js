// ===== Đồng hồ & Lịch =====

let currentCalendarDate = new Date();

export function initClock(getUserName) {
    const fullDateElement = document.getElementById('full-date');
    if (fullDateElement) {
        fullDateElement.addEventListener('click', openCalendar);
        fullDateElement.style.cursor = 'pointer';
    }
    
    const update = () => {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        
        const timeEl = document.getElementById('time');
        const dayEl = document.getElementById('day');
        const fullDateEl = document.getElementById('full-date');

        if (timeEl) timeEl.textContent = `${h}:${m}`;
        if (dayEl) dayEl.textContent = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        if (fullDateEl) {
            fullDateEl.textContent = now.toLocaleDateString('vi-VN', { 
                day: '2-digit', month: 'long', year: 'numeric' 
            });
        }
        
        updateGreeting(now.getHours(), getUserName?.());
    };

    update();
    setInterval(update, 1000);
}

export function updateGreeting(hour, userName = '') {
    let text = 'Xin chào';
    if (hour >= 5 && hour < 12) text = 'Chào buổi sáng';
    else if (hour >= 12 && hour < 18) text = 'Chào buổi chiều';
    else text = 'Chào buổi tối';
    
    const greetingEl = document.getElementById('greeting');
    if (greetingEl) {
        greetingEl.textContent = userName ? `${text}, ${userName}!` : `${text}!`;
    }
}

export function openCalendar() {
    currentCalendarDate = new Date(); // Reset to current month
    const modal = document.getElementById('calendar-modal');
    if (!modal) return;
    modal.classList.add('open');
    
    const closeBtn = document.getElementById('calendar-close');
    closeBtn?.addEventListener('click', () => modal.classList.remove('open'), { once: true });
    modal.querySelector('.modal-overlay')?.addEventListener('click', () => modal.classList.remove('open'), { once: true });
    
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    // Remove old listeners by replacing or keeping simple handlers
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        };
    }
    
    renderCalendar();
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const titleEl = document.getElementById('calendar-title');
    if (titleEl) titleEl.textContent = `Tháng ${month + 1}, ${year}`;
    
    const daysContainer = document.getElementById('calendar-days');
    if (!daysContainer) return;
    daysContainer.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    const frag = document.createDocumentFragment();
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
        
        dayDiv.innerHTML = `<div class="calendar-day-number">${date.getDate()}</div>`;
        frag.appendChild(dayDiv);
    }
    daysContainer.appendChild(frag);
}
