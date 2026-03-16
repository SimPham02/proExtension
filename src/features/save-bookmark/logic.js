export async function initUI() {
    const titleInput = document.getElementById('save-bm-title');
    const folderGrid = document.getElementById('save-folder-grid');
    const selectedPath = document.getElementById('selected-folder-path');
    const saveBtn = document.getElementById('save-bm-confirm');
    const backBtn = document.getElementById('folder-back-btn');
    
    let selectedFolderId = '0'; 
    let currentViewFolderId = '0';
    let folderHistory = [];
    let savedTab = null;

    // Get the active tab (the page behind the popup)
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        savedTab = tab;
        
        if (savedTab && savedTab.title) {
            titleInput.value = savedTab.title;
        }
    } catch (error) {
        console.error('Error getting tab:', error);
        titleInput.placeholder = 'Error detecting page';
    }

    function renderFolders(folderId) {
        chrome.bookmarks.getSubTree(folderId, (results) => {
            const node = results[0];
            folderGrid.innerHTML = '';
            
            const folderName = node.title || 'Root';
            selectedFolderId = folderId;
            selectedPath.textContent = folderName;

            // Show/Hide back button
            backBtn.style.display = (folderId === '0' || folderId === 'root') ? 'none' : 'flex';

            // Get only folders (no bookmarks)
            const folders = (node.children || []).filter(item => !item.url);
            
            if (folders.length === 0) {
                folderGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 30px 20px; color: var(--text-secondary);">
                        <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.3;"></i>
                        <p style="font-size: 0.8rem;">No subfolders</p>
                        <p style="font-size: 0.7rem; opacity: 0.6;">Click Save to add page here</p>
                    </div>
                `;
            }

            folders.forEach(folder => {
                const card = document.createElement('div');
                card.className = 'folder-item-card';
                
                card.innerHTML = `
                    <i class="fa-solid fa-folder" style="color: #fbbf24;"></i>
                    <span>${folder.title || 'Untitled'}</span>
                `;
                
                // Single click = open this folder
                card.onclick = () => {
                    folderHistory.push(currentViewFolderId);
                    currentViewFolderId = folder.id;
                    renderFolders(folder.id);
                };

                folderGrid.appendChild(card);
            });
        });
    }

    backBtn.onclick = () => {
        if (folderHistory.length > 0) {
            currentViewFolderId = folderHistory.pop();
            renderFolders(currentViewFolderId);
        }
    };

    // Initial render
    renderFolders('0');

    // 3. Save logic - Add page to current folder
    saveBtn.onclick = async () => {
        if (!savedTab || !savedTab.url) {
            saveBtn.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> No page to save!';
            saveBtn.style.background = '#ef4444';
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Save Bookmark';
                saveBtn.style.background = '';
            }, 2000);
            return;
        }
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

        chrome.bookmarks.create({
            parentId: currentViewFolderId,
            title: titleInput.value || savedTab.title,
            url: savedTab.url
        }, (result) => {
            if (chrome.runtime.lastError) {
                saveBtn.innerHTML = '<i class="fa-solid fa-times"></i> Error!';
                saveBtn.style.background = '#ef4444';
                console.error('Bookmark creation error:', chrome.runtime.lastError);
            } else {
                saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
                saveBtn.style.background = '#10b981';
            }
            
            setTimeout(() => {
                document.getElementById('back-to-grid').click();
            }, 1200);
        });
    };
}
