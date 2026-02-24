/**
 * Smooth Scroll - logic.js
 * Quản lý trạng thái bật/tắt và cấu hình, inject content script vào tab.
 */

const STORAGE_KEY_ENABLED = 'pro_smooth_scroll_enabled';
const STORAGE_KEY_SPEED   = 'pro_smooth_speed';
const STORAGE_KEY_STEP    = 'pro_smooth_step';
const CONTENT_SCRIPT      = 'features/smooth-scroll/scroll-handler.js';

/**
 * Kiểm tra tab có hỗ trợ inject không (chỉ http/https).
 */
function isInjectableTab(tab) {
  return tab?.url?.startsWith('http');
}

/**
 * Inject scroll handler vào một tab nếu chưa có.
 */
async function injectIntoTab(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.__proExtSmoothScrollInstalled === true
    });
    if (result?.result) return; // Đã inject

    await chrome.scripting.executeScript({
      target: { tabId },
      files: [CONTENT_SCRIPT]
    });
  } catch (_) {}
}

/**
 * Gỡ scroll handler khỏi một tab.
 */
async function removeFromTab(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.__proExtRemoveSmoothScroll?.()
  }).catch(() => {});
}

/**
 * Áp dụng trạng thái (inject hoặc gỡ) cho tất cả tab HTTP.
 */
async function applyToAllTabs(enabled) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!isInjectableTab(tab)) continue;
    if (enabled) {
      await injectIntoTab(tab.id);
    } else {
      await removeFromTab(tab.id);
    }
  }
}

export async function initUI() {
  const toggle     = document.getElementById('ss-toggle');
  const controls   = document.getElementById('ss-controls');
  const status     = document.getElementById('ss-status');
  const speedInput = document.getElementById('ss-speed');
  const speedVal   = document.getElementById('ss-speed-val');
  const smoothInput = document.getElementById('ss-smooth');
  const smoothVal   = document.getElementById('ss-smooth-val');

  // Đọc state đã lưu
  const stored = await chrome.storage.local.get([STORAGE_KEY_ENABLED, STORAGE_KEY_SPEED, STORAGE_KEY_STEP]);
  const isEnabled = stored[STORAGE_KEY_ENABLED] === true;
  const speed     = parseFloat(stored[STORAGE_KEY_SPEED] || '1.2');
  const step      = parseFloat(stored[STORAGE_KEY_STEP]  || '0.1');

  // Khởi tạo UI
  toggle.checked    = isEnabled;
  speedInput.value  = speed;
  smoothInput.value = step;
  updateSpeedLabel(speed);
  updateSmoothLabel(step);
  updateUI(isEnabled);

  // Nếu đã bật từ trước, inject lại vào tab hiện tại
  if (isEnabled) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (isInjectableTab(activeTab)) await injectIntoTab(activeTab.id);
  }

  // Sự kiện toggle
  toggle.addEventListener('change', async () => {
    const enabled = toggle.checked;
    await chrome.storage.local.set({ [STORAGE_KEY_ENABLED]: enabled });
    updateUI(enabled);
    await applyToAllTabs(enabled);
  });

  // Sự kiện speed slider
  speedInput.addEventListener('input', async () => {
    const val = parseFloat(speedInput.value);
    updateSpeedLabel(val);
    await chrome.storage.local.set({ [STORAGE_KEY_SPEED]: val });
  });

  // Sự kiện smooth slider
  smoothInput.addEventListener('input', async () => {
    const val = parseFloat(smoothInput.value);
    updateSmoothLabel(val);
    await chrome.storage.local.set({ [STORAGE_KEY_STEP]: val });
  });

  function updateUI(enabled) {
    controls.classList.toggle('disabled', !enabled);
    if (enabled) {
      status.textContent = '▶ Đang hoạt động trên tất cả tab';
      status.classList.add('active');
    } else {
      status.textContent = '⏸ Chưa kích hoạt';
      status.classList.remove('active');
    }
  }

  function updateSpeedLabel(val) {
    speedVal.textContent = val.toFixed(1) + '×';
  }

  function updateSmoothLabel(val) {
    const labels = { 0.05: 'Rất mượt', 0.1: 'Mượt', 0.15: 'Vừa', 0.2: 'Nhanh', 0.25: 'Rất nhanh' };
    smoothVal.textContent = labels[val] ?? (val <= 0.1 ? 'Mượt' : val <= 0.2 ? 'Vừa' : 'Nhanh');
  }
}
