/**
 * Smooth Scroll Content Script
 * Được inject vào trang web để cung cấp smooth scroll mượt mà hơn mặc định.
 * Dùng requestAnimationFrame để cuộn mượt, không giật.
 */

(function () {
  // Tránh inject nhiều lần
  if (window.__proExtSmoothScrollInstalled) return;
  window.__proExtSmoothScrollInstalled = true;

  let speed = 1.2;     // Hệ số tốc độ cuộn (1.0 = bình thường)
  let step = 0.1;      // Hệ số làm mượt (càng nhỏ càng mượt, nhưng chậm hơn)

  // Nhận config từ storage nếu có
  chrome.storage.local.get(['pro_smooth_speed', 'pro_smooth_step'], (res) => {
    if (res.pro_smooth_speed) speed = parseFloat(res.pro_smooth_speed);
    if (res.pro_smooth_step) step = parseFloat(res.pro_smooth_step);
  });

  // Lắng nghe thay đổi config realtime
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.pro_smooth_speed) speed = parseFloat(changes.pro_smooth_speed.newValue);
    if (changes.pro_smooth_step) step = parseFloat(changes.pro_smooth_step.newValue);
  });

  let targetY = window.scrollY;
  let currentY = window.scrollY;
  let rafId = null;

  function animate() {
    const diff = targetY - currentY;
    if (Math.abs(diff) < 0.5) {
      // Đã đến đích
      currentY = targetY;
      window.scrollTo(0, currentY);
      rafId = null;
      return;
    }
    currentY += diff * Math.min(step * 2.5, 1);
    window.scrollTo(0, currentY);
    rafId = requestAnimationFrame(animate);
  }

  function onWheel(e) {
    // Bỏ qua nếu đang cuộn trong element có overflow (như textarea, div có scroll)
    let el = e.target;
    while (el && el !== document.body) {
      const overflow = getComputedStyle(el).overflowY;
      if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) {
        return; // Để trình duyệt xử lý cuộn trong element con
      }
      el = el.parentElement;
    }

    e.preventDefault();

    const delta = e.deltaY * speed;
    targetY = Math.max(0, Math.min(
      document.documentElement.scrollHeight - window.innerHeight,
      targetY + delta
    ));

    if (!rafId) {
      currentY = window.scrollY;
      rafId = requestAnimationFrame(animate);
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false });

  // Hàm dọn dẹp khi disable
  window.__proExtRemoveSmoothScroll = function () {
    window.removeEventListener('wheel', onWheel);
    if (rafId) cancelAnimationFrame(rafId);
    window.__proExtSmoothScrollInstalled = false;
    delete window.__proExtSmoothScrollInstalled;
    delete window.__proExtRemoveSmoothScroll;
  };
})();
