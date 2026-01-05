

let allBookmarksFlat = [];
let currentFolderId = null;
let currentViewMode = 'grid'; 
let currentSortMode = 'name';
let currentNodes = [];
let selectedIds = new Set();
let currentSearchMode = 'flat'; 

function getFavicon(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
        return 'https://www.google.com/s2/favicons?domain=google.com&sz=128';
    }
}

function toggleSelection(id, e) {
    if (e) e.stopPropagation();
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    
    updateSelectionToolbar();
}

function updateSelectionToolbar() {
    const toolbar = document.getElementById('selection-toolbar');
    const count = document.getElementById('selected-count');
    if (!toolbar || !count) return;
    
    if (selectedIds.size > 0) {
        toolbar.classList.add('active');
        count.textContent = selectedIds.size;
    } else {
        toolbar.classList.remove('active');
    }
}

function createCard(node) {
    const isFolder = !!node.children || !node.url;
    const card = document.createElement(isFolder ? 'div' : 'a');
    card.className = isFolder ? 'folder-card' : 'bookmark-card';
    if (!isFolder) {
        card.href = node.url;
        card.target = '_blank';
    }

    const isSelected = selectedIds.has(node.id);
    if (isSelected) card.classList.add('selected');

    card.innerHTML = `
        <div class="selection-indicator ${isSelected ? 'active' : ''}">
            <i class="fa-solid fa-check"></i>
        </div>
        ${!isFolder ? `<div class="bookmark-tooltip">${node.title}</div>` : ''}
        ${isFolder ? '<i class="fa-solid fa-folder"></i>' : ''}
        <div class="${isFolder ? 'card-info' : 'card-top'}">
            ${!isFolder ? `
                <div class="favicon-box">
                    <img src="${getFavicon(node.url)}" alt="" onerror="this.src='https://www.google.com/s2/favicons?domain=example.com'">
                </div>
            ` : ''}
            <div class="card-info">
                <div class="card-title">${node.title || 'Untitled'}</div>
                <div class="card-url">${isFolder ? (node.children ? node.children.length : '0') + ' items' : node.url}</div>
            </div>
        </div>
    `;

    const selectionBtn = card.querySelector('.selection-indicator');
    selectionBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleSelection(node.id);
        card.classList.toggle('selected');
        selectionBtn.classList.toggle('active');
    };

    if (isFolder) {
        card.onclick = (e) => {
            if (e.target.closest('.selection-indicator')) return;
            navigateToFolder(node.id, node.title);
        };
    }

    return card;
}

function updateBreadcrumbs(folderId) {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;
    container.innerHTML = '';
    
    if (!folderId) {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.textContent = 'All Bookmarks';
        span.onclick = () => navigateToFolder(null);
        container.appendChild(span);
        return;
    }

    chrome.bookmarks.get(folderId, (nodes) => {
        const node = nodes[0];
        const path = [];
        
        function getPath(id) {
            if (id === '0' || !id) {
                renderPath();
                return;
            }
            chrome.bookmarks.get(id, (n) => {
                path.unshift(n[0]);
                getPath(n[0].parentId);
            });
        }

        function renderPath() {
            path.forEach((p, index) => {
                const span = document.createElement('span');
                span.className = 'breadcrumb-item';
                span.textContent = p.title || 'Root';
                span.onclick = () => navigateToFolder(p.id, p.title);
                container.appendChild(span);
                
                if (index < path.length - 1) {
                    const sep = document.createElement('span');
                    sep.className = 'breadcrumb-separator';
                    sep.textContent = '/';
                    container.appendChild(sep);
                }
            });
        }
        
        getPath(folderId);
    });
}

function navigateToFolder(id, title) {
    currentFolderId = id;
    const folderNameEl = document.getElementById('current-folder-name');
    if (folderNameEl) folderNameEl.textContent = title || 'All Bookmarks';
    
    if (!id) {
        chrome.bookmarks.getTree(function(tree) {
            currentNodes = tree[0].children;
            renderBookmarks(currentNodes);
        });
    } else {
        chrome.bookmarks.getSubTree(id, (sub) => {
            currentNodes = sub[0].children;
            renderBookmarks(currentNodes);
        });
    }

    document.querySelectorAll('.folder-item').forEach(el => {
        if (el.dataset.id === id) el.classList.add('active');
        else el.classList.remove('active');
    });
}

function sortNodes(nodes) {
    const sorted = [...nodes];
    sorted.sort((a, b) => {
        if (a.children && !b.children) return -1;
        if (!a.children && b.children) return 1;

        if (currentSortMode === 'name') {
            return (a.title || '').localeCompare(b.title || '');
        } else if (currentSortMode === 'date') {
            return (b.dateAdded || 0) - (a.dateAdded || 0);
        } else if (currentSortMode === 'url') {
            return (a.url || '').localeCompare(b.url || '');
        }
        return 0;
    });
    return sorted;
}

function renderBookmarks(nodes, isSearch = false) {
    const grid = document.getElementById('bookmarks-grid');
    const emptyMsg = document.getElementById('empty-msg');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    grid.className = `bookmarks-grid ${currentViewMode}-view`;
    
    if (!isSearch) updateBreadcrumbs(currentFolderId);

    if (nodes.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'flex';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    if (isSearch && currentSearchMode === 'grouped') {
        const groups = {};
        nodes.forEach(node => {
            const p = node.parentTitle || 'Other';
            if (!groups[p]) groups[p] = [];
            groups[p].push(node);
        });

        Object.keys(groups).forEach(groupName => {
            const header = document.createElement('div');
            header.className = 'search-group-header';
            header.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${groupName}`;
            grid.appendChild(header);

            groups[groupName].forEach(node => {
                grid.appendChild(createCard(node));
            });
        });
    } else {
        const sortedNodes = sortNodes(nodes);
        sortedNodes.forEach(node => {
            grid.appendChild(createCard(node));
        });
    }
}

function buildTree(nodes, container, depth = 0) {
    const ul = document.createElement('ul');
    ul.className = depth === 0 ? 'folder-tree' : 'sub-tree';
    
    nodes.forEach(node => {
        if (node.children) {
            const li = document.createElement('li');
            const div = document.createElement('div');
            div.className = 'folder-item';
            div.dataset.id = node.id;
            div.dataset.title = (node.title || '').toLowerCase();
            
            const hasSubFolders = node.children.some(c => c.children);
            
            div.innerHTML = `
                ${hasSubFolders ? '<i class="fa-solid fa-chevron-right chevron"></i>' : '<i class="fa-solid fa-minus" style="font-size:0.5rem; width:12px; opacity:0.3"></i>'}
                <i class="fa-solid fa-folder" style="color: #eab308"></i>
                <span>${node.title || 'Untitled'}</span>
            `;
            
            const subTreeContainer = document.createElement('div');
            subTreeContainer.className = 'sub-tree';

            div.onclick = (e) => {
                e.stopPropagation();
                if (hasSubFolders) {
                    div.classList.toggle('expanded');
                    subTreeContainer.classList.toggle('expanded');
                }
                navigateToFolder(node.id, node.title);
            };

            li.appendChild(div);
            const subFolders = node.children.filter(c => c.children);
            if (subFolders.length > 0) {
                buildTree(subFolders, subTreeContainer, depth + 1);
                li.appendChild(subTreeContainer);
            }
            ul.appendChild(li);
        }
    });
    container.appendChild(ul);
}


function flatten(nodes, arr = [], parentTitle = 'All Bookmarks') {
    nodes.forEach(node => {
        if (node.title && node.id !== '0') {
            node.parentTitle = parentTitle;
            arr.push(node);
        }
        if (node.children) flatten(node.children, arr, node.title || parentTitle);
    });
    return arr;
}

function init() {
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        chrome.bookmarks.getTree((tree) => {
            if (chrome.runtime.lastError || !tree || !tree[0]) {
                console.error('Error loading bookmarks');
                const emptyMsg = document.getElementById('empty-msg');
                if (emptyMsg) emptyMsg.style.display = 'flex';
                return;
            }

            const root = tree[0];
            const treeContainer = document.getElementById('folder-tree-container');
            if (treeContainer) treeContainer.innerHTML = '';

            buildTree(root.children, treeContainer);

            allBookmarksFlat = flatten(tree);

            currentNodes = root.children; 
            renderBookmarks(currentNodes);

            const toolsBtn = document.getElementById('tools-btn');
            const toolsMenu = document.getElementById('tools-menu');
            if (toolsBtn && toolsMenu) {
                toolsBtn.onclick = (e) => {
                    e.stopPropagation();
                    toolsMenu.classList.toggle('active');
                };
            }
            document.onclick = () => toolsMenu && toolsMenu.classList.remove('active');

            // Find Duplicates
            const findDupsBtn = document.getElementById('find-duplicates-btn');
            if (findDupsBtn) {
                findDupsBtn.onclick = () => {
                    const seen = new Map();
                    const dups = allBookmarksFlat.filter(bm => {
                        if (!bm.url) return false; 
                        if (seen.has(bm.url)) return true;
                        seen.set(bm.url, true);
                        return false;
                    });
                    if (dups.length === 0) alert('No duplicates found!');
                    else {
                        currentNodes = dups;
                        document.getElementById('current-folder-name').textContent = `Duplicates (${dups.length})`;
                        renderBookmarks(dups);
                    }
                };
            }

            const exportBtn = document.getElementById('export-json-btn');
            if (exportBtn) {
                exportBtn.onclick = () => {
                    const blob = new Blob([JSON.stringify(allBookmarksFlat, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'bookmarks_backup.json';
                    a.click();
                };
            }

            const bulkCancelBtn = document.getElementById('bulk-cancel-btn');
            if (bulkCancelBtn) {
                bulkCancelBtn.onclick = () => {
                    selectedIds.clear();
                    updateSelectionToolbar();
                    renderBookmarks(currentNodes);
                };
            }

            const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
            if (bulkDeleteBtn) {
                bulkDeleteBtn.onclick = () => {
                    if (confirm(`Delete ${selectedIds.size} items?`)) {
                        const ids = Array.from(selectedIds);
                        let deleted = 0;
                        ids.forEach(id => {
                            chrome.bookmarks.removeTree(id, () => {
                                deleted++;
                                if (deleted === ids.length) {
                                    selectedIds.clear();
                                    updateSelectionToolbar();
                                    location.reload();
                                }
                            });
                        });
                    }
                };
            }

            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) searchInput.focus();
                }
                if (e.key === 'Escape' && selectedIds.size > 0) {
                    selectedIds.clear();
                    updateSelectionToolbar();
                    renderBookmarks(currentNodes);
                }
            });

            const sidebarSearch = document.getElementById('sidebar-search-input');
            if (sidebarSearch) {
                sidebarSearch.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    document.querySelectorAll('.folder-item').forEach(item => {
                        const title = item.dataset.title || '';
                        if (title.includes(query)) {
                            item.style.display = 'flex';
                            if (query.length > 0) {
                                let parent = item.parentElement.closest('.sub-tree');
                                while (parent) {
                                    parent.classList.add('expanded');
                                    parent.previousElementSibling.classList.add('expanded');
                                    parent = parent.parentElement.closest('.sub-tree');
                                }
                            }
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            }

            const mainSearch = document.getElementById('search-input');
            const searchModeBtn = document.getElementById('search-mode-btn');

            if (searchModeBtn) {
                searchModeBtn.onclick = () => {
                    currentSearchMode = currentSearchMode === 'flat' ? 'grouped' : 'flat';
                    searchModeBtn.classList.toggle('active', currentSearchMode === 'grouped');
                    searchModeBtn.title = currentSearchMode === 'grouped' ? 'Show Flat List' : 'Group by Folder';
                    
                    const span = searchModeBtn.querySelector('span');
                    if (span) {
                        span.textContent = currentSearchMode === 'grouped' ? 'Grouped' : 'Flat View';
                    }

                    if (mainSearch && mainSearch.value) {
                        mainSearch.dispatchEvent(new Event('input'));
                    }
                };
            }

            if (mainSearch) {
                mainSearch.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    if (!query) {
                        navigateToFolder(currentFolderId, document.getElementById('current-folder-name').textContent);
                        return;
                    }
                    currentNodes = allBookmarksFlat.filter(bm => 
                        (bm.title || '').toLowerCase().includes(query) || 
                        (bm.url || '').toLowerCase().includes(query)
                    );
                    renderBookmarks(currentNodes, true);
                });
            }

            const gridBtn = document.getElementById('grid-view-btn');
            const listBtn = document.getElementById('list-view-btn');
            if (gridBtn) {
                gridBtn.onclick = () => {
                    currentViewMode = 'grid';
                    gridBtn.classList.add('active');
                    if (listBtn) listBtn.classList.remove('active');
                    const isSearch = !!(mainSearch && mainSearch.value);
                    renderBookmarks(currentNodes, isSearch);
                };
            }
            if (listBtn) {
                listBtn.onclick = () => {
                    currentViewMode = 'list';
                    listBtn.classList.add('active');
                    if (gridBtn) gridBtn.classList.remove('active');
                    const isSearch = !!(mainSearch && mainSearch.value);
                    renderBookmarks(currentNodes, isSearch);
                };
            }

            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) {
                sortSelect.onchange = (e) => {
                    currentSortMode = e.target.value;
                    const isSearch = !!(mainSearch && mainSearch.value);
                    renderBookmarks(currentNodes, isSearch);
                };
            }

            const tooltipToggle = document.getElementById('tooltip-toggle');
            if (tooltipToggle) {
                tooltipToggle.addEventListener('change', () => {
                    if (tooltipToggle.checked) {
                        document.body.classList.add('full-title-mode');
                    } else {
                        document.body.classList.remove('full-title-mode');
                    }
                });
                if (tooltipToggle.checked) document.body.classList.add('full-title-mode');
            }

            const allBookmarksBtn = document.getElementById('all-bookmarks-btn');
            if (allBookmarksBtn) {
                allBookmarksBtn.onclick = () => navigateToFolder(null);
            }
        });
    } else {
        const emptyMsg = document.getElementById('empty-msg');
        if (emptyMsg) {
            emptyMsg.style.display = 'flex';
            emptyMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><p>Please open this page through the extension to access bookmarks.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
