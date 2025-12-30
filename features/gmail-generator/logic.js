// Gmail Generator Logic

// Sinh tất cả các biến thể thêm dấu chấm vào giữa các ký tự (không thay đổi thứ tự)
export function generateGmailVariants(base) {
    if (!base || base.length < 2) return [];
    // Chỉ lấy phần trước @ nếu có
    let prefix = base.split('@')[0];
    let suffix = '@gmail.com';
    // Tạo tất cả các vị trí có thể chèn dấu chấm
    const results = new Set();
    const n = prefix.length;
    // Sử dụng bitmask để sinh các trường hợp chấm
    for (let mask = 1; mask < (1 << (n - 1)); mask++) {
        let s = '';
        for (let i = 0; i < n; i++) {
            s += prefix[i];
            if (i < n - 1 && (mask & (1 << i))) s += '.';
        }
        results.add(s + suffix);
    }
    return Array.from(results);
}

export async function copyToClipboard(text) {
    if (navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
    } else {
        // Fallback cho môi trường không hỗ trợ
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// Hàm khởi tạo UI cho feature này
export function initUI() {
    const genBtn = document.getElementById('genBtn');
    if (genBtn) {
        const output = document.getElementById('output');
        const gmailInput = document.getElementById('gmailInput');
        const copyStatus = document.getElementById('copyStatus');
        genBtn.addEventListener('click', async function() {
            const base = gmailInput.value.trim();
            output.textContent = '';
            copyStatus.textContent = '';
            if (!base) {
                output.textContent = 'Vui lòng nhập Gmail gốc!';
                return;
            }
            const variants = generateGmailVariants(base);
            if (variants.length === 0) {
                output.textContent = 'Không thể tạo biến thể với chuỗi này!';
                output.style.display = 'block';
                return;
            }
            const randomVariant = variants[Math.floor(Math.random() * variants.length)];
            output.textContent = randomVariant;
            output.style.display = 'block';
            await copyToClipboard(randomVariant);
            copyStatus.textContent = 'Đã copy biến thể vào clipboard!';
        });
    }
}

