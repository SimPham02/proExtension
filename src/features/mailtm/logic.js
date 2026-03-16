// Mail.tm Feature Logic

let currentAccount = null;
let currentToken = null;

export async function initUI() {
            // Gán sự kiện xem nội dung mail (CSP safe)
            document.addEventListener('click', function(e) {
                if (e.target && e.target.classList && e.target.classList.contains('viewMailBtn')) {
                    const mailId = e.target.getAttribute('data-mailid');
                    if (mailId) showMailTmContent(mailId);
                }
            });
        // Modal đọc mail
        const mailModal = document.getElementById('mailModal');
        const closeMailModal = document.getElementById('closeMailModal');
        const modalMailSubject = document.getElementById('modalMailSubject');
        const modalMailFrom = document.getElementById('modalMailFrom');
        const modalMailText = document.getElementById('modalMailText');

        if (closeMailModal && mailModal) {
            closeMailModal.onclick = () => {
                mailModal.style.display = 'none';
            };
        }
    const createBtn = document.getElementById('createMailBtn');
    const downloadBtn = document.getElementById('downloadMailBtn');
    const mailInfo = document.getElementById('mailInfo');
    const mailList = document.getElementById('mailList');

    // Load từ localStorage nếu có
    const saved = JSON.parse(localStorage.getItem('mailtm_account') || 'null');
    if (saved && saved.address && saved.token) {
        currentAccount = saved;
        currentToken = saved.token;
        showAccountInfo();
        fetchAndShowMails();
    }

    createBtn.onclick = async () => {
        mailInfo.textContent = 'Đang tạo mail ảo...';
        mailInfo.style.display = 'block';
        mailList.innerHTML = '';
        downloadBtn.style.display = 'none';
        await createMailAccount();
    };

    downloadBtn.onclick = () => {
        if (currentAccount) {
            const blob = new Blob([JSON.stringify(currentAccount, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mailtm_account.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    };
}

async function createMailAccount() {
    // Đăng ký tài khoản mới
    const domainRes = await fetch('https://api.mail.tm/domains');
    const domains = (await domainRes.json())["hydra:member"];
    const domain = domains[0].domain;
    const username = Math.random().toString(36).substring(2, 10);
    const address = `${username}@${domain}`;
    const password = Math.random().toString(36).substring(2, 12);
    // Tạo account
    const res = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({address, password})
    });
    if (!res.ok) {
        document.getElementById('mailInfo').textContent = 'Tạo tài khoản thất bại!';
        return;
    }
    // Đăng nhập lấy token
    const tokenRes = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({address, password})
    });
    const tokenData = await tokenRes.json();
    currentAccount = {address, password, token: tokenData.token};
    currentToken = tokenData.token;
    localStorage.setItem('mailtm_account', JSON.stringify(currentAccount));
    showAccountInfo();
    fetchAndShowMails();
}

function showAccountInfo() {
    const mailInfo = document.getElementById('mailInfo');
    const downloadBtn = document.getElementById('downloadMailBtn');
    if (currentAccount) {
        mailInfo.innerHTML = `<b>Mail ảo:</b> ${currentAccount.address}<br><b>Password:</b> ${currentAccount.password}`;
        mailInfo.style.display = 'block';
        downloadBtn.style.display = 'block';
    }
}

async function fetchAndShowMails() {
    const mailList = document.getElementById('mailList');
    mailList.innerHTML = 'Đang tải mail...';
    if (!currentToken) return;
    const res = await fetch('https://api.mail.tm/messages', {
        headers: {Authorization: `Bearer ${currentToken}`}
    });
    const data = await res.json();
    if (!data['hydra:member'] || data['hydra:member'].length === 0) {
        mailList.innerHTML = '<i>Chưa có mail nào.</i>';
        return;
    }
    mailList.innerHTML = data['hydra:member'].map(m =>
        `<div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 5px;">
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--accent-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.from && m.from.address ? m.from.address : ''}</div>
            <div style="font-size: 0.85rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.subject}</div>
            <button class="viewMailBtn" data-mailid="${m.id}" style="margin-top: 5px; padding: 5px; font-size: 0.8rem; background: var(--hover-bg); color: var(--text-primary); border: 1px solid var(--border-color);">Xem nội dung</button>
        </div>`
    ).join('');
}

// Hàm toàn cục để xem nội dung mail
async function showMailTmContent(id) {
    if (!currentToken) return;
    const res = await fetch(`https://api.mail.tm/messages/${id}`, {
        headers: {Authorization: `Bearer ${currentToken}`}
    });
    const data = await res.json();
    // Hiển thị nội dung mail trong modal
    const mailModal = document.getElementById('mailModal');
    const modalMailSubject = document.getElementById('modalMailSubject');
    const modalMailFrom = document.getElementById('modalMailFrom');
    const modalMailText = document.getElementById('modalMailText');
    if (mailModal && modalMailSubject && modalMailFrom && modalMailText) {
        modalMailSubject.textContent = data.subject || '(Không tiêu đề)';
        modalMailFrom.textContent = data.from && data.from.address ? 'Từ: ' + data.from.address : '';
        modalMailText.textContent = data.text || '';
        mailModal.style.display = 'flex';
    }
};
