import { copyToClipboard } from '../../common/clipboard.js';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SPECIALS = '!@#$%^&*()-_=+[]{};:,.<>?/|';
const ALL_CHARACTERS = LOWERCASE + UPPERCASE + DIGITS + SPECIALS;
const DEFAULT_LENGTH = 12;
const MIN_LENGTH = 6;
const MAX_LENGTH = 64;

export async function initUI() {
    const genBtn = document.getElementById('genPassBtn');
    const passLengthInput = document.getElementById('passLength');
    const passResult = document.getElementById('passResult');
    const copyBtn = document.getElementById('copyPassBtn');

    if (!genBtn || !passLengthInput || !passResult || !copyBtn) return;

    genBtn.onclick = () => {
        const password = generatePassword(passLengthInput.value);
        passResult.textContent = password;
        passResult.style.display = 'block';
        copyBtn.style.display = 'block';
    };

    copyBtn.onclick = async () => {
        if (!passResult.textContent) return;

        await copyToClipboard(passResult.textContent);
        copyBtn.textContent = 'Da copy!';
        setTimeout(() => { copyBtn.textContent = 'Copy mat khau'; }, 1200);
    };
}

export function generatePassword(length = DEFAULT_LENGTH) {
    const normalizedLength = normalizeLength(length);
    const password = [
        randomCharacter(LOWERCASE),
        randomCharacter(UPPERCASE),
        randomCharacter(DIGITS),
        randomCharacter(SPECIALS)
    ];

    for (let index = password.length; index < normalizedLength; index += 1) {
        password.push(randomCharacter(ALL_CHARACTERS));
    }

    return shuffle(password).join('');
}

function normalizeLength(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_LENGTH;
    return Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, parsed));
}

function randomCharacter(characters) {
    return characters[randomInt(characters.length)];
}

function randomInt(maxExclusive) {
    if (!globalThis.crypto?.getRandomValues) {
        throw new Error('Trinh duyet khong ho tro Web Crypto');
    }

    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % maxExclusive);
    const buffer = new Uint32Array(1);

    do {
        globalThis.crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);

    return buffer[0] % maxExclusive;
}

function shuffle(items) {
    const output = [...items];
    for (let index = output.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(index + 1);
        [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
    }
    return output;
}
