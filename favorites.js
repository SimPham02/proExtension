

let allBookmarksFlat = [];
let currentFolderId = null;
let currentViewMode = 'grid'; // 'grid' or 'list'
let currentSortMode = 'name'; // 'name', 'date', 'url'
let currentNodes = []; // Currently displayed nodes

// Helper to get high-quality favicon
function getFavicon(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
        return 'https://www.google.com/s2/favicons?domain=google.com&sz=128';
    }
}

// Breadcrumbs logic
function updateBreadcrumbs(folderId) {
    const container = document.getElementById('breadcrumbs');
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
    document.getElementById('current-folder-name').textContent = title || 'All Bookmarks';
    
    if (!id) {
        currentNodes = allBookmarksFlat;
        renderBookmarks(currentNodes);
    } else {
        chrome.bookmarks.getSubTree(id, (sub) => {
            currentNodes = sub[0].children;
            renderBookmarks(currentNodes);
        });
    }

    // Update sidebar active state
    document.querySelectorAll('.folder-item').forEach(el => {
        if (el.dataset.id === id) el.classList.add('active');
        else el.classList.remove('active');
    });
}

function sortNodes(nodes) {
    const sorted = [...nodes];
    sorted.sort((a, b) => {
        // Folders always come first
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

function renderBookmarks(nodes) {
    const grid = document.getElementById('bookmarks-grid');
    const emptyMsg = document.getElementById('empty-msg');
    grid.innerHTML = '';
    
    // Apply view mode
    grid.className = `bookmarks-grid ${currentViewMode}-view`;
    
    updateBreadcrumbs(currentFolderId);

    const sortedNodes = sortNodes(nodes);

    if (sortedNodes.length === 0) {
        emptyMsg.style.display = 'flex';
        return;
    }
    emptyMsg.style.display = 'none';

    sortedNodes.forEach(node => {
        if (node.children) {
            // Render Folder Card
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.innerHTML = `
                <i class="fa-solid fa-folder"></i>
                <div class="card-info">
                    <div class="card-title">${node.title || 'Untitled'}</div>
                    <div class="card-url">${node.children.length} items</div>
                </div>
            `;
            card.onclick = () => navigateToFolder(node.id, node.title);
            grid.appendChild(card);
        } else {
            // Render Bookmark Card
            const card = document.createElement('a');
            card.className = 'bookmark-card';
            card.href = node.url;
            card.target = '_blank';

            card.innerHTML = `
                <div class="bookmark-tooltip">${node.title}</div>
                <div class="card-top">
                    <div class="favicon-box">
                        <img src="${getFavicon(node.url)}" alt="" onerror="this.src='https://www.google.com/s2/favicons?domain=example.com'">
                    </div>
                    <div class="card-info">
                        <div class="card-title">${node.title || 'Untitled'}</div>
                        <div class="card-url">${node.url}</div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

// Recursive function to build folder tree
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

// Flatten bookmarks for global search
function flatten(nodes, arr = []) {
    nodes.forEach(node => {
        if (node.url) arr.push(node);
        if (node.children) flatten(node.children, arr);
    });
    return arr;
}

function init() {
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        chrome.bookmarks.getTree(function(tree) {
            const root = tree[0];
            const treeContainer = document.getElementById('folder-tree-container');
            treeContainer.innerHTML = '';

            // Build the tree
            buildTree(root.children, treeContainer);

            // Prepare data
            allBookmarksFlat = flatten(tree);
            currentNodes = allBookmarksFlat;
            renderBookmarks(currentNodes);

            // Sidebar Search
            document.getElementById('sidebar-search-input').addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                document.querySelectorAll('.folder-item').forEach(item => {
                    const title = item.dataset.title || '';
                    if (title.includes(query)) {
                        item.style.display = 'flex';
                        // If searching, expand parents
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

            // Main Search
            document.getElementById('search-input').addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                if (!query) {
                    navigateToFolder(currentFolderId, document.getElementById('current-folder-name').textContent);
                    return;
                }
                const filtered = allBookmarksFlat.filter(bm => 
                    (bm.title || '').toLowerCase().includes(query) || 
                    (bm.url || '').toLowerCase().includes(query)
                );
                renderBookmarks(filtered);
            });

            // View Toggles
            document.getElementById('grid-view-btn').onclick = () => {
                currentViewMode = 'grid';
                document.getElementById('grid-view-btn').classList.add('active');
                document.getElementById('list-view-btn').classList.remove('active');
                renderBookmarks(currentNodes);
            };
            document.getElementById('list-view-btn').onclick = () => {
                currentViewMode = 'list';
                document.getElementById('list-view-btn').classList.add('active');
                document.getElementById('grid-view-btn').classList.remove('active');
                renderBookmarks(currentNodes);
            };

            // Sort Select
            document.getElementById('sort-select').onchange = (e) => {
                currentSortMode = e.target.value;
                renderBookmarks(currentNodes);
            };

            // Tooltip Toggle
            const tooltipToggle = document.getElementById('tooltip-toggle');
            tooltipToggle.addEventListener('change', () => {
                if (tooltipToggle.checked) {
                    document.body.classList.add('full-title-mode');
                } else {
                    document.body.classList.remove('full-title-mode');
                }
            });
            // Initial state
            if (tooltipToggle.checked) document.body.classList.add('full-title-mode');

            // All Bookmarks button
            document.getElementById('all-bookmarks-btn').onclick = () => navigateToFolder(null);
        });
    } else {
        document.getElementById('empty-msg').style.display = 'flex';
        document.getElementById('empty-msg').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><p>Please open this page through the extension to access bookmarks.</p>';
    }
}

window.onload = init;
