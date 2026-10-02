// ===== Quản lý Favicon Cache & Letter SVG =====

const FAVICON_CACHE_KEY = 'edgeHomeFaviconCache';
const FAVICON_CLEANUP_KEY = 'edgeHomeFaviconCacheCleanupAt';
const FAVICON_CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000;
const FAVICON_MAX_AGE = 90 * 24 * 60 * 60 * 1000;
const FAVICON_MAX_ENTRIES = 100;

let faviconCache = {};
let faviconSaveTimer = null;
const faviconFetches = new Map();

export function initFaviconCache(initialCache = {}) {
    faviconCache = initialCache || {};
}

export function createLetterIcon(label, background = '#6366f1') {
    const text = escapeSvgText(String(label || '?').trim().charAt(0).toUpperCase() || '?');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${background}"/><text x="32" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="white">${text}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function escapeSvgText(value) {
    return value.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    }[char]));
}

export function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

export function faviconUrlForDomain(domain) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function applyShortcutImage(image, url, fallbackName = '') {
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
        if (!response.ok) throw new Error('Không tải được favicon');

        const blob = await response.blob();
        if (!blob.type.startsWith('image/') || blob.size > 128 * 1024) {
            throw new Error('Favicon không hợp lệ');
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

export async function cleanupFaviconCache(shortcuts = [], force = false) {
    const now = Date.now();
    const { [FAVICON_CLEANUP_KEY]: lastCleanup = 0 } = await chrome.storage.local.get(FAVICON_CLEANUP_KEY);
    if (!force && now - lastCleanup < FAVICON_CLEANUP_INTERVAL) return;

    const usedDomains = new Set([
        'google.com',
        'bing.com',
        'youtube.com',
        'duckduckgo.com'
    ]);
    shortcuts.forEach(shortcut => {
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

export function getFaviconCache() {
    return faviconCache;
}
