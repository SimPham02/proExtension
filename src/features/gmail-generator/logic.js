import { copyToClipboard } from '../../common/clipboard.js';

const GMAIL_DOMAIN = '@gmail.com';
const MIN_PREFIX_LENGTH = 2;
const MAX_PREFIX_LENGTH = 64;

/**
 * Chuẩn hóa username Gmail: loại bỏ khoảng trắng, chữ hoa, đuôi domain và dấu chấm cũ
 */
export function normalizeGmailPrefix(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .split('@')[0]
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Sinh trực tiếp 1 biến thể Gmail ngẫu nhiên với độ phức tạp O(N) thời gian và O(1) bộ nhớ.
 * Giải quyết triệt để thắt cổ chai O(2^N) bộ nhớ trước đây.
 */
export function generateRandomGmailVariant(base) {
    const prefix = normalizeGmailPrefix(base);
    if (prefix.length < MIN_PREFIX_LENGTH) {
        throw new Error('Tên Gmail phải có ít nhất 2 ký tự (chỉ gồm chữ cái và số).');
    }
    if (prefix.length > MAX_PREFIX_LENGTH) {
        throw new Error(`Tên Gmail không được vượt quá ${MAX_PREFIX_LENGTH} ký tự.`);
    }

    const slots = prefix.length - 1; // Số vị trí có thể đặt dấu chấm
    // Tạo mảng boolean ngẫu nhiên quyết định có chèn dấu chấm tại mỗi vị trí hay không
    // Đảm bảo có ít nhất 1 dấu chấm được chèn
    const dotPlacements = new Array(slots);
    let hasDot = false;

    // Lấy mảng byte ngẫu nhiên an toàn (Web Crypto CSPRNG)
    const randomBytes = new Uint8Array(slots);
    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(randomBytes);
    } else {
        for (let i = 0; i < slots; i++) randomBytes[i] = Math.floor(Math.random() * 256);
    }

    for (let i = 0; i < slots; i++) {
        // Xác suất ~50% có dấu chấm tại mỗi vị trí
        dotPlacements[i] = (randomBytes[i] % 2) === 1;
        if (dotPlacements[i]) hasDot = true;
    }

    // Nếu ngẫu nhiên không có dấu chấm nào, ép chọn ngẫu nhiên 1 vị trí đặt chấm
    if (!hasDot && slots > 0) {
        const forcedIndex = randomBytes[0] % slots;
        dotPlacements[forcedIndex] = true;
    }

    // Ghép chuỗi kết quả
    let variant = '';
    for (let i = 0; i < prefix.length; i++) {
        variant += prefix[i];
        if (i < slots && dotPlacements[i]) {
            variant += '.';
        }
    }

    return `${variant}${GMAIL_DOMAIN}`;
}

/**
 * Tương thích ngược: Sinh danh sách tối đa N biến thể (mặc định 10 biến thể ngẫu nhiên)
 */
export function generateGmailVariants(base, count = 10) {
    const prefix = normalizeGmailPrefix(base);
    if (prefix.length < MIN_PREFIX_LENGTH) return [];

    const variants = new Set();
    const maxAttempts = count * 4;
    let attempts = 0;

    while (variants.size < count && attempts < maxAttempts) {
        attempts++;
        variants.add(generateRandomGmailVariant(prefix));
    }

    return Array.from(variants);
}

export { copyToClipboard };

export function initUI() {
    const genBtn = document.getElementById('genBtn');
    const output = document.getElementById('output');
    const gmailInput = document.getElementById('gmailInput');
    const copyStatus = document.getElementById('copyStatus');

    if (!genBtn || !output || !gmailInput || !copyStatus) return;

    const handleGenerate = async () => {
        output.textContent = '';
        copyStatus.textContent = '';
        output.style.display = 'block';

        const rawInput = gmailInput.value.trim();
        if (!rawInput) {
            output.textContent = 'Vui lòng nhập tên Gmail!';
            return;
        }

        try {
            const randomVariant = generateRandomGmailVariant(rawInput);
            output.textContent = randomVariant;
            await copyToClipboard(randomVariant);
            copyStatus.textContent = '✓ Đã tạo và sao chép vào clipboard!';
        } catch (error) {
            output.textContent = error.message || 'Không thể tạo biến thể Gmail.';
        }
    };

    genBtn.addEventListener('click', handleGenerate);

    const handleKeydown = (e) => {
        if (e.key === 'Enter') handleGenerate();
    };
    gmailInput.addEventListener('keydown', handleKeydown);

    return {
        destroy() {
            genBtn.removeEventListener('click', handleGenerate);
            gmailInput.removeEventListener('keydown', handleKeydown);
        }
    };
}
