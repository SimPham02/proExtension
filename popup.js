
import { FEATURES } from './features.js';

document.addEventListener('DOMContentLoaded', function() {
    const featureSelect = document.getElementById('featureSelect');
    const featureContent = document.getElementById('feature-content');

    // Tạo option cho select
    FEATURES.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.key;
        opt.textContent = f.name;
        featureSelect.appendChild(opt);
    });

    featureSelect.addEventListener('change', async function() {
        const selected = featureSelect.value;
        featureContent.innerHTML = '';
        if (selected === 'none') return;
        const feature = FEATURES.find(f => f.key === selected);
        if (!feature) return;
        // Load UI động
        const res = await fetch(feature.ui);
        const html = await res.text();
        featureContent.innerHTML = html;
        // Import logic và tự động gọi hàm initUI nếu có
        if (feature.logic) {
            const logicModule = await feature.logic();
            if (typeof logicModule.initUI === 'function') {
                logicModule.initUI();
            }
        }
    });
});
