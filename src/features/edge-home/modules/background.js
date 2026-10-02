// ===== Quản lý Theme, Hình Nền & Trình Chiếu (Slideshow) =====

export const THEMES = [
    {
        id: 'default',
        name: 'Mặc định',
        description: 'Glass tím xanh hiện đại',
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
];

export const DEFAULT_THEME_ID = 'default';

let slideshowTimer = null;
let currentSlideIndex = 0;

export function getTheme(themeId = DEFAULT_THEME_ID) {
    return THEMES.find(t => t.id === themeId) || THEMES[0];
}

export function applyTheme(themeId = DEFAULT_THEME_ID) {
    const validTheme = THEMES.some(t => t.id === themeId) ? themeId : DEFAULT_THEME_ID;
    document.body.dataset.theme = validTheme;
}

export function applyBackground(settings) {
    if (slideshowTimer) {
        clearInterval(slideshowTimer);
        slideshowTimer = null;
    }

    const bgType = settings?.bgType || 'gradient';
    const bgValue = settings?.bgValue;
    const theme = getTheme(settings?.newtabTheme);

    if (bgType === 'slideshow') {
        const list = (settings.bgSlideshowList || []).filter(item => item && item.trim());
        if (list.length > 0) {
            if (settings.bgSlideshowOnNewTab) {
                currentSlideIndex = (currentSlideIndex + 1) % list.length;
                chrome.storage.local.set({ edgeHomeSlideIndex: currentSlideIndex });
            }

            if (currentSlideIndex >= list.length) currentSlideIndex = 0;
            setPageBackground(list[currentSlideIndex]);

            const interval = (settings.bgSlideshowInterval || 30) * 1000;
            if (interval > 0 && list.length > 1) {
                slideshowTimer = setInterval(() => {
                    currentSlideIndex = (currentSlideIndex + 1) % list.length;
                    setPageBackground(list[currentSlideIndex]);
                    chrome.storage.local.set({ edgeHomeSlideIndex: currentSlideIndex });
                }, interval);
            }
        } else {
            setPageBackground(theme.defaultBackground);
        }
    } else {
        setPageBackground(bgValue || theme.defaultBackground, bgType);
    }
}

export function setPageBackground(value, type) {
    if (!value) {
        document.body.style.backgroundImage = getTheme().defaultBackground;
        document.body.style.backgroundColor = 'var(--bg-primary)';
        return;
    }

    if (!type) {
        if (value.startsWith('linear-gradient') || value.startsWith('radial-gradient')) {
            type = 'gradient';
        } else if (value.startsWith('url(') || value.startsWith('data:') || value.includes('://')) {
            type = 'image';
            if (!value.startsWith('url(')) value = `url('${value}')`;
        } else if (value.startsWith('#') || value.startsWith('rgb')) {
            type = 'solid';
        } else {
            type = 'gradient';
        }
    }

    if (type === 'image') {
        const imgUrl = value.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || value;
        const currentBg = document.body.style.backgroundImage.replace(/['"]/g, '');
        const targetBg = value.replace(/['"]/g, '');
        if (currentBg === targetBg) return;

        if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) {
            const img = new Image();
            img.onload = () => {
                document.body.style.backgroundImage = value;
                document.body.style.backgroundColor = 'var(--bg-primary)';
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundAttachment = 'fixed';
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
        document.body.style.backgroundColor = value;
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundBlendMode = 'normal';
    } else {
        document.body.style.backgroundImage = value;
        document.body.style.backgroundColor = 'var(--bg-primary)';
        document.body.style.backgroundBlendMode = 'normal';
    }
}

export async function getCustomImages() {
    const result = await chrome.storage.local.get('customImages');
    return result.customImages || [];
}

export async function saveCustomImages(images) {
    await chrome.storage.local.set({ customImages: images });
}
