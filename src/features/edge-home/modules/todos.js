// ===== Danh sách việc cần làm (Todos) =====

let todos = [];

export async function initTodos(initialTodos = []) {
    todos = Array.isArray(initialTodos) ? initialTodos : [];

    const panel = document.getElementById('todo-panel');
    const closeBtn = document.getElementById('close-todo');
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');
    const todoFab = document.getElementById('todo-fab');

    if (todoFab) {
        todoFab.onclick = () => {
            panel?.classList.toggle('open');
            if (panel?.classList.contains('open')) input?.focus();
        };
    }

    if (!panel || !closeBtn || !form || !input || !list) return;

    closeBtn.onclick = () => panel.classList.remove('open');

    form.onsubmit = async (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        todos.push({
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            text,
            done: false,
            createdAt: Date.now()
        });
        input.value = '';
        await saveTodos();
        renderTodos();
    };

    renderTodos();
}

export function renderTodos() {
    const list = document.getElementById('todo-list');
    const count = document.getElementById('todo-count');
    if (!list || !count) return;

    list.replaceChildren();
    todos.forEach(todo => {
        const item = document.createElement('div');
        item.className = `todo-item ${todo.done ? 'done' : ''}`;

        const checkbox = document.createElement('button');
        checkbox.type = 'button';
        checkbox.className = 'todo-checkbox';
        checkbox.title = todo.done ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong';
        checkbox.onclick = async () => {
            todo.done = !todo.done;
            await saveTodos();
            renderTodos();
        };

        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'todo-delete';
        deleteBtn.title = 'Xóa';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-trash';
        deleteBtn.appendChild(icon);
        deleteBtn.onclick = async () => {
            todos = todos.filter(itemToKeep => itemToKeep.id !== todo.id);
            await saveTodos();
            renderTodos();
        };

        item.append(checkbox, text, deleteBtn);
        list.appendChild(item);
    });

    const remaining = todos.filter(todo => !todo.done).length;
    count.textContent = `${remaining} việc`;
}

export async function saveTodos() {
    await chrome.storage.local.set({ edgeHomeTodos: todos });
}

export function getTodos() {
    return todos;
}
