# proExtension

Tien ich mo rong Chrome/Edge da tinh nang.

## Cau truc thu muc

- `src/background/`: service worker cho Manifest V3.
- `src/popup/`: giao dien popup cua extension.
- `src/core/`: registry va dinh nghia feature.
- `src/features/`: tung feature doc lap.
- `src/content-scripts/`: script chay tren trang web.
- `src/common/`: tien ich dung chung.
- `tasks/`: ke hoach, ket qua va bai hoc trong qua trinh phat trien.

## Cach load extension

1. Mo Chrome hoac Edge va vao trang quan ly Extensions.
2. Bat Developer mode.
3. Chon Load unpacked va tro toi thu muc repository.
4. Kiem tra popup va trang New Tab override tai `src/features/edge-home/newtab.html`.

## Kiem tra nhanh

Repo hien la extension thuan JS/HTML/CSS, khong co build tool rieng. Co the kiem tra cu phap JavaScript bang:

```powershell
Get-ChildItem -Recurse src -Filter *.js | ForEach-Object { node --check $_.FullName }
```
