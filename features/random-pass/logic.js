// Random Password Feature

export async function initUI() {
    const genBtn = document.getElementById('genPassBtn');
    const passLengthInput = document.getElementById('passLength');
    const passResult = document.getElementById('passResult');
    const copyBtn = document.getElementById('copyPassBtn');

    genBtn.onclick = () => {
        const len = Math.max(6, Math.min(64, parseInt(passLengthInput.value) || 12));
        const pass = generatePassword(len);
        passResult.textContent = pass;
        passResult.style.display = 'block';
        copyBtn.style.display = 'block';
    };

    copyBtn.onclick = async () => {
        if (passResult.textContent) {
            await copyToClipboard(passResult.textContent);
            copyBtn.textContent = 'Đã copy!';
            setTimeout(() => { copyBtn.textContent = 'Copy mật khẩu'; }, 1200);
        }
    };
}

function generatePassword(length) {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const specials = '!@#$%^&*()-_=+[]{};:,.<>?/|';
    const all = lower + upper + digits + specials;
    let pass = '';
    // Đảm bảo có đủ loại ký tự
    pass += lower[Math.floor(Math.random() * lower.length)];
    pass += upper[Math.floor(Math.random() * upper.length)];
    pass += digits[Math.floor(Math.random() * digits.length)];
    pass += specials[Math.floor(Math.random() * specials.length)];
    for (let i = 4; i < length; i++) {
        pass += all[Math.floor(Math.random() * all.length)];
    }
    // Trộn ký tự
    return shuffle(pass.split('')).join('');
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function copyToClipboard(text) {
    if (navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}
