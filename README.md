# proExtension

Tiện ích mở rộng Chrome/Edge đa tính năng.

## Cấu trúc thư mục (MV3)
- `src/background/` — service worker
- `src/popup/` — UI popup (action)
- `src/core/` — registry/định nghĩa feature
- `src/features/` — từng feature (ui.html, logic.js, style.css nếu có)
- `src/content-scripts/` — content scripts độc lập
- `src/common/` — tiện ích dùng chung
- `tasks/` — quy trình TODO/Lessons

## Build/Load
1. Mở Chrome/Edge → Manage Extensions
2. Bật Developer mode → Load unpacked → chọn thư mục repo
3. Kiểm tra popup và new tab override `src/features/edge-home/newtab.html`