import { copyToClipboard } from '../../common/clipboard.js';
import { clearElement, createElement } from '../../common/dom.js';

const SCRIPT_STYLE = {
    name: 'Mathematical Script',
    map: character => SCRIPT_MAP[character] || character
};

const SCRIPT_MAP = {
    a: '\uD835\uDC4E', b: '\uD835\uDC4F', c: '\uD835\uDC50', d: '\uD835\uDC51',
    e: '\uD835\uDC52', f: '\uD835\uDC53', g: '\uD835\uDC54', h: '\u210E',
    i: '\uD835\uDC56', j: '\uD835\uDC57', k: '\uD835\uDC58', l: '\uD835\uDC59',
    m: '\uD835\uDC5A', n: '\uD835\uDC5B', o: '\uD835\uDC5C', p: '\uD835\uDC5D',
    q: '\uD835\uDC5E', r: '\uD835\uDC5F', s: '\uD835\uDC60', t: '\uD835\uDC61',
    u: '\uD835\uDC62', v: '\uD835\uDC63', w: '\uD835\uDC64', x: '\uD835\uDC65',
    y: '\uD835\uDC66', z: '\uD835\uDC67',
    A: '\uD835\uDC34', B: '\uD835\uDC35', C: '\uD835\uDC36', D: '\uD835\uDC37',
    E: '\uD835\uDC38', F: '\uD835\uDC39', G: '\uD835\uDC3A', H: '\uD835\uDC3B',
    I: '\uD835\uDC3C', J: '\uD835\uDC3D', K: '\uD835\uDC3E', L: '\uD835\uDC3F',
    M: '\uD835\uDC40', N: '\uD835\uDC41', O: '\uD835\uDC42', P: '\uD835\uDC43',
    Q: '\uD835\uDC44', R: '\uD835\uDC45', S: '\uD835\uDC46', T: '\uD835\uDC47',
    U: '\uD835\uDC48', V: '\uD835\uDC49', W: '\uD835\uDC4A', X: '\uD835\uDC4B',
    Y: '\uD835\uDC4C', Z: '\uD835\uDC4D'
};

export async function initUI() {
    const input = document.getElementById('yayInput');
    const renderBtn = document.getElementById('yayRenderBtn');
    const imageBtn = document.getElementById('yayImageBtn');
    const result = document.getElementById('yayResult');
    const copyBtn = document.getElementById('yayCopyBtn');
    const copyImageBtn = document.getElementById('yayCopyImageBtn');
    let currentImageBlob = null;
    let currentImageUrl = null;

    if (!input || !renderBtn || !imageBtn || !result || !copyBtn || !copyImageBtn) return;

    renderBtn.onclick = () => {
        const text = input.value;
        clearElement(result);

        if (!text) {
            result.appendChild(createElement('i', { text: 'Vui long nhap van ban.' }));
            result.style.display = 'block';
            copyBtn.style.display = 'none';
            return;
        }

        const convertedText = convertText(text);
        const label = createElement('b', { text: `${SCRIPT_STYLE.name}: ` });
        const value = createElement('span', {
            text: convertedText,
            styles: { userSelect: 'all' }
        });

        result.appendChild(createElement('div', {
            styles: { marginBottom: '8px' },
            children: [label, value]
        }));
        result.style.display = 'block';
        copyBtn.style.display = 'block';
        copyImageBtn.style.display = 'none';
    };

    copyBtn.onclick = async () => {
        const first = result.querySelector('span');
        if (!first) return;

        await copyToClipboard(first.textContent);
        copyBtn.textContent = 'Da copy!';
        setTimeout(() => { copyBtn.textContent = 'Copy ket qua'; }, 1200);
    };

    imageBtn.onclick = async () => {
        const text = input.value;
        if (!text) {
            alert('Vui long nhap van ban!');
            return;
        }

        if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);

        const image = await createTextImage(convertText(text));
        currentImageBlob = image.blob;
        currentImageUrl = image.imageUrl;

        clearElement(result);
        result.appendChild(createElement('div', {
            styles: { marginBottom: '8px' },
            children: [
                createElement('img', {
                    attributes: { src: currentImageUrl, alt: 'Ket qua YayText' },
                    styles: {
                        maxWidth: '100%',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                })
            ]
        }));
        result.style.display = 'block';
        copyBtn.style.display = 'none';
        copyImageBtn.style.display = 'inline-block';
    };

    copyImageBtn.onclick = async () => {
        if (!currentImageBlob) return;

        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': currentImageBlob })
            ]);
            copyImageBtn.textContent = 'Da copy!';
            setTimeout(() => { copyImageBtn.textContent = 'Copy hinh anh'; }, 1200);
        } catch {
            alert('Khong the copy hinh anh. Trinh duyet khong ho tro.');
        }
    };

    return {
        destroy() {
            if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        }
    };
}

function convertText(text) {
    return [...text].map(SCRIPT_STYLE.map).join('');
}

async function createTextImage(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 64;
    const lineHeight = fontSize * 1.5;
    const paddingX = 80;
    const paddingY = 60;
    const lines = text.split('\n');

    ctx.font = `${fontSize}px serif`;
    const maxLineWidth = lines.reduce((maxWidth, line) => {
        return Math.max(maxWidth, ctx.measureText(line).width);
    }, 0);

    canvas.width = Math.max(maxLineWidth + (paddingX * 2), 200);
    canvas.height = (lines.length * lineHeight) + (paddingY * 2);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#4158D0');
    gradient.addColorStop(0.46, '#C850C0');
    gradient.addColorStop(1, '#FFCC70');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 20; index += 1) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 40 + 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.12})`;
        ctx.fill();
    }

    const margin = 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(margin, margin, canvas.width - (margin * 2), canvas.height - (margin * 2), 24);
    } else {
        ctx.rect(margin, margin, canvas.width - (margin * 2), canvas.height - (margin * 2));
    }
    ctx.stroke();

    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    const totalTextHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2);
    lines.forEach((line, index) => {
        ctx.fillText(line, paddingX, startY + (index * lineHeight));
    });

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Khong the tao anh'));
                return;
            }
            resolve({ imageUrl: URL.createObjectURL(blob), blob });
        }, 'image/png');
    });
}
