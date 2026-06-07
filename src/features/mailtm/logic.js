import { clearElement, createElement } from '../../common/dom.js';

const ACCOUNT_STORAGE_KEY = 'mailtm_account';
const API_BASE_URL = 'https://api.mail.tm';

let currentAccount = null;
let currentToken = null;
let rootClickHandler = null;

export async function initUI() {
    const root = document.getElementById('feature-content') || document;
    const createBtn = document.getElementById('createMailBtn');
    const downloadBtn = document.getElementById('downloadMailBtn');
    const mailInfo = document.getElementById('mailInfo');
    const mailList = document.getElementById('mailList');
    const mailModal = document.getElementById('mailModal');
    const closeMailModal = document.getElementById('closeMailModal');

    if (!createBtn || !downloadBtn || !mailInfo || !mailList) return;

    rootClickHandler = event => {
        const viewButton = event.target.closest?.('.viewMailBtn');
        if (!viewButton) return;

        const mailId = viewButton.dataset.mailId;
        if (mailId) showMailTmContent(mailId);
    };
    root.addEventListener('click', rootClickHandler);

    closeMailModal?.addEventListener('click', () => {
        if (mailModal) mailModal.style.display = 'none';
    });

    const saved = loadSavedAccount();
    if (saved?.address && saved?.token) {
        currentAccount = saved;
        currentToken = saved.token;
        showAccountInfo();
        fetchAndShowMails();
    }

    createBtn.onclick = async () => {
        mailInfo.textContent = 'Dang tao mail ao...';
        mailInfo.style.display = 'block';
        clearElement(mailList);
        downloadBtn.style.display = 'none';
        await createMailAccount();
    };

    downloadBtn.onclick = () => {
        if (!currentAccount) return;

        const blob = new Blob([JSON.stringify(currentAccount, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mailtm_account.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    return {
        destroy() {
            if (rootClickHandler) root.removeEventListener('click', rootClickHandler);
            rootClickHandler = null;
        }
    };
}

async function createMailAccount() {
    const mailInfo = document.getElementById('mailInfo');

    try {
        const domainRes = await fetch(`${API_BASE_URL}/domains`);
        if (!domainRes.ok) throw new Error('Khong lay duoc domain Mail.tm');

        const domains = (await domainRes.json())['hydra:member'] || [];
        const domain = domains[0]?.domain;
        if (!domain) throw new Error('Mail.tm khong tra ve domain hop le');

        const username = cryptoRandomString(10);
        const password = cryptoRandomString(16);
        const address = `${username}@${domain}`;

        const accountRes = await fetch(`${API_BASE_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        if (!accountRes.ok) throw new Error('Tao tai khoan that bai');

        const tokenRes = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        if (!tokenRes.ok) throw new Error('Dang nhap Mail.tm that bai');

        const tokenData = await tokenRes.json();
        currentAccount = { address, password, token: tokenData.token };
        currentToken = tokenData.token;
        localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(currentAccount));

        showAccountInfo();
        fetchAndShowMails();
    } catch (error) {
        if (mailInfo) mailInfo.textContent = error.message || 'Tao tai khoan that bai!';
    }
}

function showAccountInfo() {
    const mailInfo = document.getElementById('mailInfo');
    const downloadBtn = document.getElementById('downloadMailBtn');
    if (!mailInfo || !downloadBtn || !currentAccount) return;

    clearElement(mailInfo);
    mailInfo.append(
        createElement('b', { text: 'Mail ao: ' }),
        document.createTextNode(currentAccount.address),
        createElement('br'),
        createElement('b', { text: 'Password: ' }),
        document.createTextNode(currentAccount.password)
    );
    mailInfo.style.display = 'block';
    downloadBtn.style.display = 'block';
}

async function fetchAndShowMails() {
    const mailList = document.getElementById('mailList');
    if (!mailList || !currentToken) return;

    mailList.textContent = 'Dang tai mail...';

    try {
        const res = await fetch(`${API_BASE_URL}/messages`, {
            headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error('Khong lay duoc danh sach mail');

        const data = await res.json();
        const mails = data['hydra:member'] || [];
        clearElement(mailList);

        if (mails.length === 0) {
            mailList.appendChild(createElement('i', { text: 'Chua co mail nao.' }));
            return;
        }

        mailList.append(...mails.map(createMailCard));
    } catch (error) {
        mailList.textContent = error.message || 'Khong tai duoc mail.';
    }
}

function createMailCard(mail) {
    const viewButton = createElement('button', {
        className: 'viewMailBtn',
        text: 'Xem noi dung',
        dataset: { mailId: mail.id },
        styles: {
            marginTop: '5px',
            padding: '5px',
            fontSize: '0.8rem',
            background: 'var(--hover-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
        }
    });

    return createElement('div', {
        styles: {
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
        },
        children: [
            createElement('div', {
                text: mail.from?.address || '',
                styles: {
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: 'var(--accent-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }
            }),
            createElement('div', {
                text: mail.subject || '(Khong tieu de)',
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
        if (!res.ok) throw new Error('Khong doc duoc mail');

        const data = await res.json();
        const mailModal = document.getElementById('mailModal');
        const modalMailSubject = document.getElementById('modalMailSubject');
        const modalMailFrom = document.getElementById('modalMailFrom');
        const modalMailText = document.getElementById('modalMailText');
        if (!mailModal || !modalMailSubject || !modalMailFrom || !modalMailText) return;

        modalMailSubject.textContent = data.subject || '(Khong tieu de)';
        modalMailFrom.textContent = data.from?.address ? `Tu: ${data.from.address}` : '';
        modalMailText.textContent = data.text || '';
        mailModal.style.display = 'flex';
    } catch (error) {
        const mailList = document.getElementById('mailList');
        if (mailList) mailList.textContent = error.message || 'Khong doc duoc mail.';
    }
}

function loadSavedAccount() {
    try {
        return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || 'null');
    } catch {
        localStorage.removeItem(ACCOUNT_STORAGE_KEY);
        return null;
    }
}

function cryptoRandomString(length) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
}
