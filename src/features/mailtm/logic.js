import { clearElement, createElement } from '../../common/dom.js';

const ACCOUNT_STORAGE_KEY = 'mailtm_account';
const API_BASE_URL = 'https://api.mail.tm';

let currentAccount = null;
let currentToken = null;
let rootClickHandler = null;

export async function initUI() {
    const root = document.getElementById('feature-content') || document;
    const createBtn = document.getElementById('createMailBtn');
    const refreshBtn = document.getElementById('refreshMailBtn');
    const downloadBtn = document.getElementById('downloadMailBtn');
    const mailInfo = document.getElementById('mailInfo');
    const mailList = document.getElementById('mailList');
    const mailModal = document.getElementById('mailModal');
    const closeMailModal = document.getElementById('closeMailModal');

    if (!createBtn || !mailInfo || !mailList) return;

    rootClickHandler = event => {
        const viewButton = event.target.closest?.('.viewMailBtn');
        if (!viewButton) return;

        const mailId = viewButton.dataset.mailId;
        if (mailId) showMailTmContent(mailId);
    };
    root.addEventListener('click', rootClickHandler);

    const handleCloseModal = () => {
        if (mailModal) mailModal.style.display = 'none';
    };
    closeMailModal?.addEventListener('click', handleCloseModal);

    // Nạp tài khoản đã lưu từ chrome.storage.local
    const saved = await loadSavedAccount();
    if (saved?.address && saved?.token) {
        currentAccount = saved;
        currentToken = saved.token;
        showAccountInfo();
        fetchAndShowMails();
    }

    const handleCreate = async () => {
        createBtn.disabled = true;
        mailInfo.textContent = 'Đang tạo mail ảo mới...';
        mailInfo.style.display = 'block';
        clearElement(mailList);
        if (downloadBtn) downloadBtn.style.display = 'none';
        if (refreshBtn) refreshBtn.style.display = 'none';

        try {
            await createMailAccount();
        } finally {
            createBtn.disabled = false;
        }
    };

    const handleRefresh = async () => {
        if (!currentToken) return;
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải';
        }
        try {
            await fetchAndShowMails();
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Làm mới';
            }
        }
    };

    const handleDownload = () => {
        if (!currentAccount) return;

        const blob = new Blob([JSON.stringify(currentAccount, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mailtm_${currentAccount.address.split('@')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    createBtn.addEventListener('click', handleCreate);
    refreshBtn?.addEventListener('click', handleRefresh);
    downloadBtn?.addEventListener('click', handleDownload);

    return {
        destroy() {
            if (rootClickHandler) root.removeEventListener('click', rootClickHandler);
            closeMailModal?.removeEventListener('click', handleCloseModal);
            createBtn.removeEventListener('click', handleCreate);
            refreshBtn?.removeEventListener('click', handleRefresh);
            downloadBtn?.removeEventListener('click', handleDownload);
            rootClickHandler = null;
        }
    };
}

async function createMailAccount() {
    const mailInfo = document.getElementById('mailInfo');

    try {
        const domainRes = await fetch(`${API_BASE_URL}/domains`);
        if (!domainRes.ok) throw new Error('Không lấy được danh sách tên miền');

        const domains = (await domainRes.json())['hydra:member'] || [];
        const domain = domains[0]?.domain;
        if (!domain) throw new Error('Dịch vụ tạm thời không có tên miền khả dụng');

        const username = cryptoRandomString(10);
        const password = cryptoRandomString(16);
        const address = `${username}@${domain}`;

        const accountRes = await fetch(`${API_BASE_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        if (!accountRes.ok) throw new Error('Tạo tài khoản thất bại');

        const tokenRes = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        if (!tokenRes.ok) throw new Error('Đăng nhập thất bại');

        const tokenData = await tokenRes.json();
        currentAccount = { address, password, token: tokenData.token };
        currentToken = tokenData.token;

        // Lưu an toàn vào chrome.storage.local
        await chrome.storage.local.set({ [ACCOUNT_STORAGE_KEY]: currentAccount });

        showAccountInfo();
        await fetchAndShowMails();
    } catch (error) {
        if (mailInfo) mailInfo.textContent = error.message || 'Tạo tài khoản thất bại!';
    }
}

function showAccountInfo() {
    const mailInfo = document.getElementById('mailInfo');
    const downloadBtn = document.getElementById('downloadMailBtn');
    const refreshBtn = document.getElementById('refreshMailBtn');
    if (!mailInfo || !currentAccount) return;

    clearElement(mailInfo);
    mailInfo.append(
        createElement('div', {
            children: [
                createElement('b', { text: 'Email: ' }),
                createElement('span', { text: currentAccount.address, styles: { userSelect: 'all', color: 'var(--accent-color)' } })
            ]
        }),
        createElement('div', {
            styles: { marginTop: '4px', fontSize: '0.8rem', opacity: '0.8' },
            children: [
                createElement('b', { text: 'Mật khẩu: ' }),
                createElement('span', { text: currentAccount.password, styles: { userSelect: 'all' } })
            ]
        })
    );
    mailInfo.style.display = 'block';
    if (downloadBtn) downloadBtn.style.display = 'inline-block';
    if (refreshBtn) refreshBtn.style.display = 'inline-block';
}

async function fetchAndShowMails() {
    const mailList = document.getElementById('mailList');
    if (!mailList || !currentToken) return;

    mailList.textContent = 'Đang kiểm tra thư mới...';

    try {
        const res = await fetch(`${API_BASE_URL}/messages`, {
            headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error('Không thể tải danh sách thư');

        const data = await res.json();
        const mails = data['hydra:member'] || [];
        clearElement(mailList);

        if (mails.length === 0) {
            mailList.appendChild(createElement('div', {
                styles: { textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' },
                children: [
                    createElement('i', { className: 'fa-solid fa-inbox', styles: { fontSize: '1.5rem', marginBottom: '6px', display: 'block', opacity: '0.5' } }),
                    document.createTextNode('Hộp thư trống. Thư mới sẽ xuất hiện tại đây.')
                ]
            }));
            return;
        }

        mailList.append(...mails.map(createMailCard));
    } catch (error) {
        mailList.textContent = error.message || 'Lỗi khi tải danh sách thư.';
    }
}

function createMailCard(mail) {
    const viewButton = createElement('button', {
        className: 'viewMailBtn btn',
        text: 'Đọc thư',
        dataset: { mailId: mail.id },
        styles: {
            alignSelf: 'flex-start',
            marginTop: '4px',
            padding: '4px 10px',
            fontSize: '0.8rem',
            background: 'var(--hover-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer'
        }
    });

    return createElement('div', {
        styles: {
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        },
        children: [
            createElement('div', {
                text: mail.from?.address || 'Người gửi ẩn',
                styles: {
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    color: 'var(--accent-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }
            }),
            createElement('div', {
                text: mail.subject || '(Không có tiêu đề)',
                styles: {
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }
            }),
            viewButton
        ]
    });
}

async function showMailTmContent(id) {
    if (!currentToken) return;

    try {
        const res = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error('Không đọc được nội dung thư');

        const data = await res.json();
        const mailModal = document.getElementById('mailModal');
        const modalMailSubject = document.getElementById('modalMailSubject');
        const modalMailFrom = document.getElementById('modalMailFrom');
        const modalMailText = document.getElementById('modalMailText');
        if (!mailModal || !modalMailSubject || !modalMailFrom || !modalMailText) return;

        modalMailSubject.textContent = data.subject || '(Không có tiêu đề)';
        modalMailFrom.textContent = data.from?.address ? `Từ: ${data.from.address}` : '';
        modalMailText.textContent = data.text || '(Thư không có nội dung văn bản thuần)';
        mailModal.style.display = 'flex';
    } catch (error) {
        alert(error.message || 'Không đọc được nội dung thư.');
    }
}

async function loadSavedAccount() {
    try {
        const result = await chrome.storage.local.get([ACCOUNT_STORAGE_KEY]);
        return result[ACCOUNT_STORAGE_KEY] || null;
    } catch {
        return null;
    }
}

function cryptoRandomString(length) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
}
