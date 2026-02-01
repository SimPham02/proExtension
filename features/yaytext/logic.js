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
    const result = document.getElementById('yayResult');
    const copyBtn = document.getElementById('yayCopyBtn');

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
