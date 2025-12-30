// YayText Style Feature

const yayStyles = [
    { name: 'In đậm', map: c => boldMap[c] || c },
    { name: 'In nghiêng', map: c => italicMap[c] || c },
    { name: 'Gạch chân', map: c => underlineMap[c] || c },
    { name: 'Chữ bong bóng', map: c => bubbleMap[c] || c },
    { name: 'Chữ vuông', map: c => squareMap[c] || c },
    { name: 'Chữ nhỏ', map: c => smallMap[c] || c },
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
        // Chỉ lấy kiểu "Gạch chân"
        const underline = yayStyles[2];
        result.innerHTML = `<div style=\"margin-bottom:8px;\"><b>${underline.name}:</b> <span style=\"user-select:all;\">${[...text].map(underline.map).join('')}</span></div>`;
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
