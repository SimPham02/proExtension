// YayText Style Feature

const yayStyles = [
    { name: 'In đậm', map: c => boldMap[c] || c },
    { name: 'In nghiêng', map: c => italicMap[c] || c },
    { name: 'Gạch chân', map: c => underlineMap[c] || c },
    { name: 'Chữ bong bóng', map: c => bubbleMap[c] || c },
    { name: 'Chữ vuông', map: c => squareMap[c] || c },
    { name: 'Chữ nhỏ', map: c => smallMap[c] || c },
    { name: 'Mathematical Script', map: c => scriptMap[c] || c },
];

export async function initUI() {
    const input = document.getElementById('yayInput');
    const btn = document.getElementById('yayRenderBtn');
    const imageBtn = document.getElementById('yayImageBtn');
    const result = document.getElementById('yayResult');
    const copyBtn = document.getElementById('yayCopyBtn');
    const copyImageBtn = document.getElementById('yayCopyImageBtn');
    let currentImageBlob = null;

    btn.onclick = () => {
        const text = input.value;
        if (!text) {
            result.innerHTML = '<i>Vui lòng nhập văn bản.</i>';
            result.style.display = 'block';
            copyBtn.style.display = 'none';
            return;
        }
        // Chỉ lấy kiểu "Mathematical Script"
        const script = yayStyles[6];
        result.innerHTML = `<div style=\"margin-bottom:8px;\"><b>${script.name}:</b> <span style=\"user-select:all;\">${[...text].map(script.map).join('')}</span></div>`;
        result.style.display = 'block';
        copyBtn.style.display = 'block';
    };

    copyBtn.onclick = async () => {
        const first = result.querySelector('span');
        if (first) {
            await copyToClipboard(first.textContent);
            copyBtn.textContent = 'Đã copy!';
            setTimeout(() => { copyBtn.textContent = 'Copy kết quả'; }, 1200);
        }
    };

    imageBtn.onclick = async () => {
        const text = input.value;
        if (!text) {
            alert('Vui lòng nhập văn bản!');
            return;
        }
        const script = yayStyles[6];
        const convertedText = [...text].map(script.map).join('');
        const { imageUrl, blob } = await createTextImage(convertedText);
        
        currentImageBlob = blob;
        result.innerHTML = `<div style="margin-bottom:8px;"><img src="${imageUrl}" style="max-width:100%; border-radius:8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"/></div>`;
        result.style.display = 'block';
        copyBtn.style.display = 'none';
        copyImageBtn.style.display = 'inline-block';
    };

    copyImageBtn.onclick = async () => {
        if (currentImageBlob) {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': currentImageBlob })
                ]);
                copyImageBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã copy!';
                setTimeout(() => { 
                    copyImageBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy hình ảnh'; 
                }, 1200);
            } catch (err) {
                alert('Không thể copy hình ảnh. Trình duyệt không hỗ trợ.');
            }
        }
    };
}

// Bảng mã hóa ký tự cho các kiểu chữ
const boldMap = Object.fromEntries('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map((c,i)=>[c,'𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟕𝟴𝟵'[i]]));
const italicMap = Object.fromEntries('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c,i)=>[c,'𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡'[i]]));
const underlineMap = Object.fromEntries('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c,i)=>[c,c+'̲']));
const bubbleMap = Object.fromEntries('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map((c,i)=>[c,'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ⓪①②③④⑤⑥⑦⑧⑨'[i]]));
const squareMap = Object.fromEntries('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map((c,i)=>[c,'🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉０１２３４５６７８９'[i]]));
const smallMap = Object.fromEntries('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c,i)=>[c,'ᵃᵇᶜᵈᵉᶠᵍʰᶦʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᵠᴿˢᵀᵁⱽᵂˣʸᶻ'[i]]));
// Mathematical Italic Script Unicode
const scriptMap = {
    'a': '\uD835\uDC4E', 'b': '\uD835\uDC4F', 'c': '\uD835\uDC50', 'd': '\uD835\uDC51',
    'e': '\uD835\uDC52', 'f': '\uD835\uDC53', 'g': '\uD835\uDC54', 'h': '\u210E',
    'i': '\uD835\uDC56', 'j': '\uD835\uDC57', 'k': '\uD835\uDC58', 'l': '\uD835\uDC59',
    'm': '\uD835\uDC5A', 'n': '\uD835\uDC5B', 'o': '\uD835\uDC5C', 'p': '\uD835\uDC5D',
    'q': '\uD835\uDC5E', 'r': '\uD835\uDC5F', 's': '\uD835\uDC60', 't': '\uD835\uDC61',
    'u': '\uD835\uDC62', 'v': '\uD835\uDC63', 'w': '\uD835\uDC64', 'x': '\uD835\uDC65',
    'y': '\uD835\uDC66', 'z': '\uD835\uDC67',
    'A': '\uD835\uDC34', 'B': '\uD835\uDC35', 'C': '\uD835\uDC36', 'D': '\uD835\uDC37',
    'E': '\uD835\uDC38', 'F': '\uD835\uDC39', 'G': '\uD835\uDC3A', 'H': '\uD835\uDC3B',
    'I': '\uD835\uDC3C', 'J': '\uD835\uDC3D', 'K': '\uD835\uDC3E', 'L': '\uD835\uDC3F',
    'M': '\uD835\uDC40', 'N': '\uD835\uDC41', 'O': '\uD835\uDC42', 'P': '\uD835\uDC43',
    'Q': '\uD835\uDC44', 'R': '\uD835\uDC45', 'S': '\uD835\uDC46', 'T': '\uD835\uDC47',
    'U': '\uD835\uDC48', 'V': '\uD835\uDC49', 'W': '\uD835\uDC4A', 'X': '\uD835\uDC4B',
    'Y': '\uD835\uDC4C', 'Z': '\uD835\uDC4D'
};

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

async function createTextImage(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Config
    const fontSize = 64;
    ctx.font = `${fontSize}px serif`;
    const lineHeight = fontSize * 1.5;
    const paddingX = 80;
    const paddingY = 60;

    // Split lines and measure
    const lines = text.split('\n');
    let maxLineWidth = 0;
    lines.forEach(line => {
        const width = ctx.measureText(line).width;
        if (width > maxLineWidth) maxLineWidth = width;
    });
    
    // Canvas dimensions
    const totalTextHeight = lines.length * lineHeight;
    canvas.width = Math.max(maxLineWidth + (paddingX * 2), 200); // Min width 200
    canvas.height = totalTextHeight + (paddingY * 2);
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#4158D0');
    gradient.addColorStop(0.46, '#C850C0');
    gradient.addColorStop(1, '#FFCC70');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Decoration bubbles
    for(let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 40 + 10;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.12})`;
        ctx.fill();
    }
    
    // Glass border
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
    
    // Text rendering
    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    
    // Draw each line
    const startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2);
    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        ctx.fillText(line, paddingX, y);
    });
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve({ 
                imageUrl: URL.createObjectURL(blob),
                blob: blob
            });
        });
    });
}
