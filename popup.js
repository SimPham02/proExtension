import { FEATURES } from './features.js';

// Feature lookup map for O(1) access
const FEATURE_MAP = new Map(FEATURES.map(f => [f.key, f]));
const DEFAULT_ORDER = FEATURES.map(f => f.key);

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements once
    const $ = id => document.getElementById(id);
    const featureGrid = $('feature-grid');
    const mainView = $('main-view');
    const featureView = $('feature-view');
    const featureContent = $('feature-content');
    const settingsPanel = $('settings-panel');
    const featuresList = $('features-list');

    let currentOrder = [];
    let draggedItem = null;

    // Event delegation for header buttons
    document.querySelector('header')?.addEventListener('click', e => {
        const btn = e.target.closest('.btn-icon');
        if (!btn) return;
        if (btn.id === 'open-favorites') window.open('favorites.html', '_blank');
        if (btn.id === 'open-settings') openSettings();
    });

    // Settings panel events (delegation)
    settingsPanel?.addEventListener('click', e => {
        const t = e.target;
        if (t.id === 'settings-backdrop' || t.id === 'close-settings' || t.closest('#close-settings')) closeSettings();
        if (t.id === 'save-settings') saveSettings();
        if (t.id === 'reset-settings') resetSettings();
    });

    // Drag-drop delegation on featuresList
    featuresList?.addEventListener('dragstart', e => {
        const item = e.target.closest('.feature-item');
        if (!item) return;
        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    featuresList?.addEventListener('dragend', e => {
        const item = e.target.closest('.feature-item');
        if (item) item.classList.remove('dragging');
        featuresList.querySelectorAll('.drag-over').forEach(i => i.classList.remove('drag-over'));
        draggedItem = null;
    });
    featuresList?.addEventListener('dragover', e => {
        e.preventDefault();
        const item = e.target.closest('.feature-item');
        if (item && item !== draggedItem) item.classList.add('drag-over');
    });
    featuresList?.addEventListener('dragleave', e => {
        const item = e.target.closest('.feature-item');
        if (item) item.classList.remove('drag-over');
    });
    featuresList?.addEventListener('drop', e => {
        e.preventDefault();
        const item = e.target.closest('.feature-item');
        if (!item || !draggedItem || item === draggedItem) return;
        item.classList.remove('drag-over');
        const items = [...featuresList.children];
        items.indexOf(draggedItem) < items.indexOf(item) ? item.after(draggedItem) : item.before(draggedItem);
        currentOrder = [...featuresList.children].map(el => el.dataset.key);
    });

    // Back button
    $('back-to-grid')?.addEventListener('click', () => {
        featureView.style.display = 'none';
        mainView.style.display = 'block';
        featureContent.classList.remove('active');
        featureContent.innerHTML = '';
    });

    function openSettings() {
        settingsPanel.classList.add('active');
        loadSettingsUI();
    }
    function closeSettings() {
        settingsPanel.classList.remove('active');
    }

    async function loadSettingsUI() {
        const { enabled_features: enabled = DEFAULT_ORDER, feature_order: order = DEFAULT_ORDER } = 
            await chrome.storage.local.get(['enabled_features', 'feature_order']);
        currentOrder = order.filter(k => FEATURE_MAP.has(k));
        FEATURES.forEach(f => { if (!currentOrder.includes(f.key)) currentOrder.push(f.key); });
        renderFeaturesList(enabled);
    }

    function renderFeaturesList(enabled) {
        const frag = document.createDocumentFragment();
        currentOrder.forEach(key => {
            const f = FEATURE_MAP.get(key);
            if (!f) return;
            const item = document.createElement('div');
            item.className = 'feature-item';
            item.draggable = true;
            item.dataset.key = key;
            item.innerHTML = `<i class="fa-solid fa-grip-vertical drag-handle"></i><i class="${f.icon} feature-icon"></i><span class="feature-name">${f.name}</span><input type="checkbox" ${enabled.includes(key) ? 'checked' : ''} data-key="${key}">`;
            frag.appendChild(item);
        });
        featuresList.innerHTML = '';
        featuresList.appendChild(frag);
    }

    async function saveSettings() {
        const checked = [...featuresList.querySelectorAll('input:checked')].map(i => i.dataset.key);
        const order = [...featuresList.children].map(el => el.dataset.key);
        await chrome.storage.local.set({ enabled_features: checked, feature_order: order });
        renderFeatures();
        closeSettings();
    }

    async function resetSettings() {
        await chrome.storage.local.set({ enabled_features: DEFAULT_ORDER, feature_order: DEFAULT_ORDER });
        currentOrder = [...DEFAULT_ORDER];
        renderFeaturesList(DEFAULT_ORDER);
    }

    async function renderFeatures() {
        const { enabled_features: enabled = DEFAULT_ORDER, feature_order: order = DEFAULT_ORDER } = 
            await chrome.storage.local.get(['enabled_features', 'feature_order']);
        const frag = document.createDocumentFragment();
        order.forEach(key => {
            if (!enabled.includes(key)) return;
            const f = FEATURE_MAP.get(key);
            if (!f) return;
            const card = document.createElement('div');
            card.className = 'feature-card';
            card.dataset.key = key;
            card.innerHTML = `<i class="${f.icon}"></i><span>${f.name}</span>`;
            frag.appendChild(card);
        });
        featureGrid.innerHTML = '';
        featureGrid.appendChild(frag);
    }

    // Feature grid click delegation
    featureGrid?.addEventListener('click', e => {
        const card = e.target.closest('.feature-card');
        if (!card) return;
        const f = FEATURE_MAP.get(card.dataset.key);
        if (f) loadFeature(f);
    });

    async function loadFeature(feature) {
        featureContent.innerHTML = '<div style="text-align:center;padding:20px"><i class="fa-solid fa-circle-notch fa-spin"></i></div>';
        mainView.style.display = 'none';
        featureView.style.display = 'block';
        featureContent.classList.add('active');
        try {
            const [html, logic] = await Promise.all([
                fetch(feature.ui).then(r => r.text()),
                feature.logic ? feature.logic() : null
            ]);
            featureContent.innerHTML = html;
            logic?.initUI?.();
        } catch (e) {
            featureContent.innerHTML = `<div style="color:#ef4444;padding:10px">Error: ${e.message}</div>`;
        }
    }

    renderFeatures();
});
