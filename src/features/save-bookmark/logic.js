import { clearElement, createElement } from '../../common/dom.js';

const ROOT_FOLDER_ID = '0';

export async function initUI() {
    const titleInput = document.getElementById('save-bm-title');
    const folderGrid = document.getElementById('save-folder-grid');
    const selectedPath = document.getElementById('selected-folder-path');
    const saveBtn = document.getElementById('save-bm-confirm');
    const backBtn = document.getElementById('folder-back-btn');

    if (!titleInput || !folderGrid || !selectedPath || !saveBtn || !backBtn) return;

    let currentViewFolderId = ROOT_FOLDER_ID;
    const folderHistory = [];
    let savedTab = null;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        savedTab = tab;
        if (savedTab?.title) titleInput.value = savedTab.title;
    } catch (error) {
        console.error('Loi lay tab hien tai:', error);
        titleInput.placeholder = 'Khong nhan dien duoc trang';
    }

    function renderFolders(folderId) {
        chrome.bookmarks.getSubTree(folderId, (results) => {
            const node = results?.[0];
            if (!node) return;

            clearElement(folderGrid);
            currentViewFolderId = folderId;
            selectedPath.textContent = node.title || 'Root';
            backBtn.style.display = folderId === ROOT_FOLDER_ID ? 'none' : 'flex';

            const folders = (node.children || []).filter(item => !item.url);
            if (folders.length === 0) {
                folderGrid.appendChild(createEmptyFolderMessage());
            }

            folders.forEach(folder => {
                const card = createFolderCard(folder);
                card.onclick = () => {
                    folderHistory.push(currentViewFolderId);
                    renderFolders(folder.id);
                };
                folderGrid.appendChild(card);
            });
        });
    }

    backBtn.onclick = () => {
        if (folderHistory.length === 0) return;
        renderFolders(folderHistory.pop());
    };

    saveBtn.onclick = () => {
        if (!savedTab?.url) {
            showSaveButtonState(saveBtn, 'No page to save!', 'fa-solid fa-exclamation-triangle', '#ef4444');
            return;
        }

        saveBtn.disabled = true;
        setButtonContent(saveBtn, 'Saving...', 'fa-solid fa-circle-notch fa-spin');

        chrome.bookmarks.create({
            parentId: currentViewFolderId,
            title: titleInput.value || savedTab.title,
            url: savedTab.url
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Loi tao bookmark:', chrome.runtime.lastError);
                showSaveButtonState(saveBtn, 'Error!', 'fa-solid fa-times', '#ef4444');
                return;
            }

            showSaveButtonState(saveBtn, 'Saved!', 'fa-solid fa-check', '#10b981', () => {
                document.getElementById('back-to-grid')?.click();
            });
        });
    };

    renderFolders(ROOT_FOLDER_ID);
}

function createEmptyFolderMessage() {
    return createElement('div', {
        styles: {
            gridColumn: '1/-1',
            textAlign: 'center',
            padding: '30px 20px',
            color: 'var(--text-secondary)'
        },
        children: [
            createElement('i', {
                className: 'fa-solid fa-folder-open',
                styles: { fontSize: '2rem', marginBottom: '10px', opacity: '0.3' }
            }),
            createElement('p', {
                text: 'No subfolders',
                styles: { fontSize: '0.8rem' }
            }),
            createElement('p', {
                text: 'Click Save to add page here',
                styles: { fontSize: '0.7rem', opacity: '0.6' }
            })
        ]
    });
}

function createFolderCard(folder) {
    return createElement('div', {
        className: 'folder-item-card',
        children: [
            createElement('i', {
                className: 'fa-solid fa-folder',
                styles: { color: '#fbbf24' }
            }),
            createElement('span', { text: folder.title || 'Untitled' })
        ]
    });
}

function showSaveButtonState(button, label, iconClass, background, afterReset) {
    setButtonContent(button, label, iconClass);
    button.style.background = background;

    setTimeout(() => {
        button.disabled = false;
        button.style.background = '';
        setButtonContent(button, 'Save Bookmark', 'fa-solid fa-bookmark');
        afterReset?.();
    }, 1200);
}

function setButtonContent(button, label, iconClass) {
    clearElement(button);
    button.append(
        createElement('i', { className: iconClass }),
        document.createTextNode(` ${label}`)
    );
}
