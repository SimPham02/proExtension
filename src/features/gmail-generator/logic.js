import { copyToClipboard } from '../../common/clipboard.js';

const GMAIL_DOMAIN = '@gmail.com';
const MAX_PREFIX_LENGTH = 24;
const MAX_VARIANT_COUNT = 50000;

export function generateGmailVariants(base, maxVariants = MAX_VARIANT_COUNT) {
    const prefix = normalizeGmailPrefix(base);
    if (prefix.length < 2) return [];

    const variantCount = 2 ** (prefix.length - 1) - 1;
    if (prefix.length > MAX_PREFIX_LENGTH || variantCount > maxVariants) {
        throw new Error('Gmail qua dai, vui long nhap toi da 16-24 ky tu de tranh treo popup.');
    }

    const results = [];
    for (let mask = 1; mask <= variantCount; mask += 1) {
        results.push(applyDotMask(prefix, mask));
    }

    return results.map(value => `${value}${GMAIL_DOMAIN}`);
}

export { copyToClipboard };

export function initUI() {
    const genBtn = document.getElementById('genBtn');
    const output = document.getElementById('output');
    const gmailInput = document.getElementById('gmailInput');
    const copyStatus = document.getElementById('copyStatus');

    if (!genBtn || !output || !gmailInput || !copyStatus) return;

    genBtn.addEventListener('click', async () => {
        output.textContent = '';
        copyStatus.textContent = '';
        output.style.display = 'block';

        try {
            const variants = generateGmailVariants(gmailInput.value);
            if (variants.length === 0) {
                output.textContent = 'Khong the tao bien the voi chuoi nay!';
                return;
            }

            const randomVariant = variants[randomInt(variants.length)];
            output.textContent = randomVariant;
            await copyToClipboard(randomVariant);
            copyStatus.textContent = 'Da copy bien the vao clipboard!';
        } catch (error) {
            output.textContent = error.message || 'Khong the tao bien the Gmail.';
        }
    });
}

function normalizeGmailPrefix(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .split('@')[0]
        .replace(/\./g, '');
}

function applyDotMask(prefix, mask) {
    let value = '';
    for (let index = 0; index < prefix.length; index += 1) {
        value += prefix[index];
        if (index < prefix.length - 1 && (mask & (2 ** index))) {
            value += '.';
        }
    }
    return value;
}

function randomInt(maxExclusive) {
    if (globalThis.crypto?.getRandomValues) {
        const buffer = new Uint32Array(1);
        const maxUint32 = 0xffffffff;
        const limit = maxUint32 - (maxUint32 % maxExclusive);

        do {
            globalThis.crypto.getRandomValues(buffer);
        } while (buffer[0] >= limit);

        return buffer[0] % maxExclusive;
    }

    return Math.floor(Math.random() * maxExclusive);
}
