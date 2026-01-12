// Premium Todo App with Advanced Features
(function() {
    'use strict';

    // State
    let todos = [];
    let currentFilter = 'all';
    let currentSort = 'date'; // date, priority, name
    let searchQuery = '';
    let selectedPriority = 'medium';

    // DOM Elements
    let DOM = {};

    // Initialize
    function init() {
        console.log('Premium Todo App: Starting...');

        // Cache DOM elements
        DOM = {
            input: document.getElementById('todo-input'),
            priorityButtons: document.querySelectorAll('.prio-btn'),
            dayInput: document.getElementById('day-input'),
            monthInput: document.getElementById('month-input'),
            yearInput: document.getElementById('year-input'),
            tagsInput: document.getElementById('tags-input'),
            addBtn: document.getElementById('add-todo'),
            clearBtn: document.getElementById('clear-done'),
            searchInput: document.getElementById('search-input'),
            sortBtn: document.getElementById('sort-btn'),
            exportBtn: document.getElementById('export-btn'),
            importBtn: document.getElementById('import-btn'),
            importFile: document.getElementById('import-file'),
            list: document.getElementById('todo-list'),
            todoCount: document.getElementById('todo-count'),
            doneCount: document.getElementById('done-count'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            completionText: document.getElementById('completion-text')
        };

        if (!DOM.input || !DOM.addBtn || !DOM.list) {
            console.error('Critical DOM elements missing!');
            return;
        }

        setupEventListeners();
        loadTodos();
    }

    function setupEventListeners() {
        // Date input validation & auto-focus
        DOM.dayInput.addEventListener('input', function() {
            if (this.value > 31) this.value = 31;
            if (this.value < 0) this.value = '';
            if (this.value.length >= 2) DOM.monthInput.focus();
        });

        DOM.monthInput.addEventListener('input', function() {
            if (this.value > 12) this.value = 12;
            if (this.value < 0) this.value = '';
            if (this.value.length >= 2) DOM.yearInput.focus();
        });

        DOM.yearInput.addEventListener('input', function() {
            if (this.value > 2099) this.value = 2099;
            if (this.value < 2024) this.value = 2024;
        });

        // Priority selection
        DOM.priorityButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                DOM.priorityButtons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                selectedPriority = btn.getAttribute('data-priority');
            });
        });

        // Add todo
        DOM.addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addTodo();
        });

        DOM.input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTodo();
            }
        });

        // Clear completed
        DOM.clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Xóa tất cả công việc đã hoàn thành?')) {
                todos = todos.filter(function(t) { return !t.done; });
                saveTodos();
                renderTodos();
            }
        });

        // Filter buttons
        DOM.filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                DOM.filterBtns.forEach(function(b) { 
                    b.classList.remove('active'); 
                });
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                renderTodos();
            });
        });

        // Search
        DOM.searchInput.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase();
            renderTodos();
        });

        // Sort
        DOM.sortBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cycleSortMode();
        });

        // Export
        DOM.exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportTodos();
        });

        // Import
        DOM.importBtn.addEventListener('click', function(e) {
            e.preventDefault();
            DOM.importFile.click();
        });

        DOM.importFile.addEventListener('change', function(e) {
            importTodos(e);
        });
    }

    function addTodo() {
        var text = DOM.input.value.trim();
        var priority = selectedPriority;
        var dueDate = null;
        
        // Get date from separate inputs
        var day = parseInt(DOM.dayInput.value);
        var month = parseInt(DOM.monthInput.value);
        var year = parseInt(DOM.yearInput.value);
        
        // Create date if all parts are valid
        if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 2024 && year <= 2099) {
            dueDate = new Date(year, month - 1, day).toISOString().split('T')[0];
        }
        
        var tags = DOM.tagsInput.value.split(',').map(function(t) { 
            return t.trim(); 
        }).filter(function(t) { 
            return t; 
        });

        if (!text) return;

        var newTodo = {
            id: Date.now(),
            text: text,
            done: false,
            priority: priority,
            dueDate: dueDate,
            tags: tags,
            notes: '',
            subtasks: [],
            createdAt: new Date().toISOString()
        };

        todos.unshift(newTodo);
        saveTodos();
        renderTodos();

        // Clear inputs
        DOM.input.value = '';
        DOM.dayInput.value = '';
        DOM.monthInput.value = '';
        // Keeping year as it is likely common
        DOM.tagsInput.value = '';
        
        // Reset priority to medium
        selectedPriority = 'medium';
        DOM.priorityButtons.forEach(function(b) { 
            b.classList.remove('active');
            if (b.getAttribute('data-priority') === 'medium') b.classList.add('active');
        });

        DOM.input.focus();
    }

    function loadTodos() {
        chrome.storage.local.get(['edgeHomeTodos'], function(result) {
            if (result.edgeHomeTodos && result.edgeHomeTodos.length > 0) {
                todos = result.edgeHomeTodos;
                renderTodos();
            } else {
                chrome.storage.sync.get(['edgeHomeTodos'], function(syncResult) {
                    todos = syncResult.edgeHomeTodos || [];
                    renderTodos();
                });
            }
        });
    }

    function saveTodos() {
        chrome.storage.local.set({ edgeHomeTodos: todos });
        chrome.storage.sync.set({ edgeHomeTodos: todos });
    }

    function renderTodos() {
        DOM.list.innerHTML = '';

        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Filter todos
        var filteredTodos = todos.filter(function(todo) {
            // Search filter
            if (searchQuery && !todo.text.toLowerCase().includes(searchQuery)) {
                return false;
            }

            // Status filters
            if (currentFilter === 'pending') return !todo.done;
            if (currentFilter === 'completed') return todo.done;
            
            // Date filters
            if (currentFilter === 'today') {
                if (!todo.dueDate) return false;
                var todoDate = new Date(todo.dueDate);
                return todoDate.toDateString() === today.toDateString();
            }
            
            if (currentFilter === 'week') {
                var weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                var todoDate = new Date(todo.createdAt);
                return todoDate >= weekAgo;
            }
            
            if (currentFilter === 'overdue') {
                if (!todo.dueDate || todo.done) return false;
                return new Date(todo.dueDate) < today;
            }

            return true;
        });

        // Sort todos
        filteredTodos.sort(function(a, b) {
            if (currentSort === 'priority') {
                var priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            } else if (currentSort === 'name') {
                return a.text.localeCompare(b.text);
            } else if (currentSort === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            // Default: by creation date
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        if (filteredTodos.length === 0) {
            DOM.list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-clipboard-list"></i><p>Không có công việc nào.</p></div>';
        } else {
            filteredTodos.forEach(function(todo) {
                var originalIndex = todos.indexOf(todo);
                renderTodoItem(todo, originalIndex);
            });
        }

        updateStats();
        attachItemListeners();
    }

    function renderTodoItem(todo, originalIndex) {
        var li = document.createElement('li');
        li.className = 'todo-item' + (todo.done ? ' done' : '');

        var priorityLabels = { 
            high: '<i class="fa-solid fa-flag"></i> Cao', 
            medium: '<i class="fa-solid fa-flag"></i> Trung bình', 
            low: '<i class="fa-solid fa-flag"></i> Thấp' 
        };
        var date = new Date(todo.createdAt);
        var dateStr = date.toLocaleDateString('vi-VN', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit' 
        });

        // Due date status
        var dueDateHTML = '';
        if (todo.dueDate) {
            var dueDate = new Date(todo.dueDate);
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            
            // Format as DD/MM/YYYY
            var day = dueDate.getDate().toString().padStart(2, '0');
            var month = (dueDate.getMonth() + 1).toString().padStart(2, '0');
            var year = dueDate.getFullYear();
            var dueDateStr = day + '/' + month + '/' + year;
            
            var className = 'upcoming';
            if (dueDate < today) className = 'overdue';
            else if (dueDate.getTime() === today.getTime()) className = 'today';
            
            dueDateHTML = '<span class="due-date-tag ' + className + '">📅 ' + dueDateStr + '</span>';
        }

        // Tags HTML
        var tagsHTML = '';
        if (todo.tags && todo.tags.length > 0) {
            tagsHTML = '<div class="todo-tags">';
            todo.tags.forEach(function(tag) {
                tagsHTML += '<span class="tag">' + tag + '</span>';
            });
            tagsHTML += '</div>';
        }

        // Notes HTML
        var notesHTML = '';
        if (todo.notes) {
            notesHTML = '<div class="todo-notes">📝 ' + todo.notes + '</div>';
        }

        // Subtasks HTML
        var subtasksHTML = '';
        if (todo.subtasks && todo.subtasks.length > 0) {
            subtasksHTML = '<button class="expand-btn" data-index="' + originalIndex + '">➕ ' + todo.subtasks.length + ' công việc con</button>';
            subtasksHTML += '<div class="subtasks" id="subtasks-' + originalIndex + '">';
            todo.subtasks.forEach(function(sub, subIdx) {
                subtasksHTML += '<div class="subtask-item">';
                subtasksHTML += '<input type="checkbox" ' + (sub.done ? 'checked' : '') + ' data-index="' + originalIndex + '" data-sub="' + subIdx + '">';
                subtasksHTML += '<span>' + sub.text + '</span>';
                subtasksHTML += '</div>';
            });
            subtasksHTML += '</div>';
        }

        li.innerHTML = 
            '<button class="todo-checkbox" data-index="' + originalIndex + '"></button>' +
            '<div class="todo-content">' +
                '<div class="todo-meta">' +
                    '<span class="priority-tag ' + (todo.priority || 'medium') + '">' + priorityLabels[todo.priority || 'medium'] + '</span>' +
                    '<span class="date-tag">' + dateStr + '</span>' +
                    dueDateHTML +
                '</div>' +
                '<span class="todo-text" data-index="' + originalIndex + '" contenteditable="false">' + todo.text + '</span>' +
                tagsHTML +
                notesHTML +
                subtasksHTML +
            '</div>' +
            '<div class="todo-actions">' +
                '<button class="action-btn edit-btn" data-index="' + originalIndex + '" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="action-btn delete-btn" data-index="' + originalIndex + '" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>' +
            '</div>';

        DOM.list.appendChild(li);
    }

    function attachItemListeners() {
        // Checkbox
        DOM.list.querySelectorAll('.todo-checkbox').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var i = parseInt(btn.getAttribute('data-index'));
                todos[i].done = !todos[i].done;
                saveTodos();
                renderTodos();
            });
        });

        // Delete
        DOM.list.querySelectorAll('.delete-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var i = parseInt(btn.getAttribute('data-index'));
                if (confirm('Xóa công việc này?')) {
                    todos.splice(i, 1);
                    saveTodos();
                    renderTodos();
                }
            });
        });

        // Edit
        DOM.list.querySelectorAll('.edit-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var i = parseInt(btn.getAttribute('data-index'));
                openEditModal(i);
            });
        });

        // Expand subtasks
        DOM.list.querySelectorAll('.expand-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var i = parseInt(btn.getAttribute('data-index'));
                var subtasksDiv = document.getElementById('subtasks-' + i);
                subtasksDiv.classList.toggle('expanded');
            });
        });

        // Subtask checkbox
        DOM.list.querySelectorAll('.subtask-item input').forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                var todoIdx = parseInt(checkbox.getAttribute('data-index'));
                var subIdx = parseInt(checkbox.getAttribute('data-sub'));
                todos[todoIdx].subtasks[subIdx].done = checkbox.checked;
                saveTodos();
            });
        });

        // Edit text on double click
        DOM.list.querySelectorAll('.todo-text').forEach(function(span) {
            span.addEventListener('dblclick', function(e) {
                e.preventDefault();
                span.contentEditable = 'true';
                span.focus();
                
                var range = document.createRange();
                range.selectNodeContents(span);
                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            });

            span.addEventListener('blur', function() {
                span.contentEditable = 'false';
                var i = parseInt(span.getAttribute('data-index'));
                var newText = span.textContent.trim();
                
                if (newText && newText !== todos[i].text) {
                    todos[i].text = newText;
                    saveTodos();
                }
            });

            span.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    span.blur();
                }
            });
        });
    }

    function openEditModal(index) {
        var todo = todos[index];
        var notes = prompt('Nhập ghi chú cho công việc này:', todo.notes || '');
        if (notes !== null) {
            todo.notes = notes;
            saveTodos();
            renderTodos();
        }
    }

    function updateStats() {
        var pendingCount = todos.filter(function(t) { return !t.done; }).length;
        var completedCount = todos.length - pendingCount;

        DOM.todoCount.textContent = pendingCount;
        DOM.doneCount.textContent = completedCount;

        if (todos.length === 0) {
            DOM.completionText.textContent = 'Bắt đầu ngày mới!';
        } else if (pendingCount === 0) {
            DOM.completionText.textContent = '🎉 Hoàn thành tất cả!';
        } else {
            DOM.completionText.textContent = pendingCount + ' việc còn lại';
        }
    }

    function cycleSortMode() {
        var modes = ['date', 'priority', 'name', 'dueDate'];
        var currentIndex = modes.indexOf(currentSort);
        currentSort = modes[(currentIndex + 1) % modes.length];
        
        var labels = { date: 'Ngày tạo', priority: 'Ưu tiên', name: 'Tên', dueDate: 'Hạn' };
        DOM.sortBtn.title = 'Sắp xếp: ' + labels[currentSort];
        
        renderTodos();
    }

    function exportTodos() {
        var dataStr = JSON.stringify(todos, null, 2);
        var dataBlob = new Blob([dataStr], { type: 'application/json' });
        var url = URL.createObjectURL(dataBlob);
        
        var link = document.createElement('a');
        link.href = url;
        link.download = 'todos_' + new Date().toISOString().split('T')[0] + '.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    function importTodos(e) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(event) {
            try {
                var imported = JSON.parse(event.target.result);
                if (confirm('Nhập ' + imported.length + ' công việc? Dữ liệu hiện tại sẽ được thay thế.')) {
                    todos = imported;
                    saveTodos();
                    renderTodos();
                }
            } catch (err) {
                alert('Lỗi: File không hợp lệ!');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
