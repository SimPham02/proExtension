
import { FEATURES } from './features.js';

document.addEventListener('DOMContentLoaded', function() {
    const openFavBtn = document.getElementById('open-favorites');
    const featureGrid = document.getElementById('feature-grid');
    const mainView = document.getElementById('main-view');
    const featureView = document.getElementById('feature-view');
    const featureContent = document.getElementById('feature-content');
    const backBtn = document.getElementById('back-to-grid');

    if (openFavBtn) {
        openFavBtn.addEventListener('click', () => {
            window.open('favorites.html', '_blank');
        });
    }

    // Render feature cards
    FEATURES.forEach(f => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.innerHTML = `
            <i class="${f.icon}"></i>
            <span>${f.name}</span>
        `;
        card.onclick = () => loadFeature(f);
        featureGrid.appendChild(card);
    });

    async function loadFeature(feature) {
        featureContent.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>';
        mainView.style.display = 'none';
        featureView.style.display = 'block';
        featureContent.classList.add('active');

        try {
            const res = await fetch(feature.ui);
            const html = await res.text();
            featureContent.innerHTML = html;

            if (feature.logic) {
                const logicModule = await feature.logic();
                if (typeof logicModule.initUI === 'function') {
                    logicModule.initUI();
                }
            }
        } catch (error) {
            featureContent.innerHTML = `<div style="color: #ef4444; padding: 10px;">Error loading feature: ${error.message}</div>`;
        }
    }

    backBtn.onclick = () => {
        featureView.style.display = 'none';
        mainView.style.display = 'block';
        featureContent.classList.remove('active');
        featureContent.innerHTML = '';
    };
});
