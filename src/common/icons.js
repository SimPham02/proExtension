(function () {
    const icons = {
        'fa-arrow-down': ['M12 5v14', 'M5 12l7 7 7-7'],
        'fa-arrow-left': ['M19 12H5', 'M12 5l-7 7 7 7'],
        'fa-arrow-right': ['M5 12h14', 'M12 5l7 7-7 7'],
        'fa-arrow-up': ['M12 19V5', 'M5 12l7-7 7 7'],
        'fa-atom': ['M12 12h.01', 'M3 12c2.5-4 15.5-4 18 0-2.5 4-15.5 4-18 0z', 'M7.5 4.8c4.7.2 11.2 11.5 9 14.4-4.7-.2-11.2-11.5-9-14.4z', 'M16.5 4.8c-4.7.2-11.2 11.5-9 14.4 4.7-.2 11.2-11.5 9-14.4z'],
        'fa-bolt': ['M13 2 4 14h7l-1 8 10-13h-7l1-7z'],
        'fa-bolt-lightning': ['M13 2 4 14h7l-1 8 10-13h-7l1-7z'],
        'fa-bookmark': ['M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4z'],
        'fa-brain': ['M9 6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3', 'M15 6a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3', 'M9 6a3 3 0 0 1 6 0v13a3 3 0 0 1-6 0V6z', 'M9 11h6', 'M9 15h6'],
        'fa-broom': ['M14 4l6 6', 'M12 6l6 6', 'M4 20l8-8 4 4-8 8H4v-4z', 'M3 21h7'],
        'fa-check': ['M20 6 9 17l-5-5'],
        'fa-chevron-down': ['M6 9l6 6 6-6'],
        'fa-chevron-left': ['M15 18l-6-6 6-6'],
        'fa-chevron-right': ['M9 18l6-6-6-6'],
        'fa-circle-notch': ['M21 12a9 9 0 1 1-6.2-8.6'],
        'fa-clock': ['M12 6v6l4 2', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'],
        'fa-clone': ['M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z', 'M4 16V5a2 2 0 0 1 2-2h11'],
        'fa-cloud': ['M17.5 19H8a5 5 0 1 1 1.1-9.9A6 6 0 0 1 20 12.5 3.5 3.5 0 0 1 17.5 19z'],
        'fa-cloud-rain': ['M17.5 16H8a5 5 0 1 1 1.1-9.9A6 6 0 0 1 20 9.5 3.5 3.5 0 0 1 17.5 16z', 'M8 19v2', 'M12 18v2', 'M16 19v2'],
        'fa-cloud-showers-heavy': ['M17.5 16H8a5 5 0 1 1 1.1-9.9A6 6 0 0 1 20 9.5 3.5 3.5 0 0 1 17.5 16z', 'M8 19v2', 'M12 18v3', 'M16 19v2'],
        'fa-cloud-sun': ['M8 3v2', 'M3 8h2', 'M4.2 4.2l1.4 1.4', 'M8 13a5 5 0 0 1 3.6-8.5', 'M17.5 21H9a4 4 0 1 1 .8-7.9A5.5 5.5 0 0 1 20 16.5 3.5 3.5 0 0 1 17.5 21z'],
        'fa-cog': ['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.8 1.8 0 0 0-2 .1 8 8 0 0 1-1.7.7 1.8 1.8 0 0 0-1.2 1.5V23H8.8v-.3a1.8 1.8 0 0 0-1.2-1.5 8 8 0 0 1-1.7-.7 1.8 1.8 0 0 0-2-.1l-.2.1-2-3.4.1-.1A1.7 1.7 0 0 0 2.1 15a8 8 0 0 1 0-2 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.8 1.8 0 0 0 2-.1 8 8 0 0 1 1.7-.7 1.8 1.8 0 0 0 1.2-1.5V5h3.9v.3a1.8 1.8 0 0 0 1.2 1.5 8 8 0 0 1 1.7.7 1.8 1.8 0 0 0 2 .1l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9 8 8 0 0 1 0 2z'],
        'fa-copy': ['M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z', 'M4 16V5a2 2 0 0 1 2-2h11'],
        'fa-ellipsis-vertical': ['M12 5h.01', 'M12 12h.01', 'M12 19h.01'],
        'fa-envelope-open-text': ['M4 8l8 5 8-5', 'M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-5-8 5z', 'M8 14h8', 'M8 17h5'],
        'fa-exclamation-triangle': ['M12 3 2 21h20L12 3z', 'M12 9v5', 'M12 18h.01'],
        'fa-file-export': ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M14 3v6h6', 'M12 12v6', 'M9 15l3 3 3-3'],
        'fa-folder': ['M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z'],
        'fa-folder-open': ['M3 8a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1', 'M3 10h18l-2 8a2 2 0 0 1-2 1H5a2 2 0 0 1-2-2v-7z'],
        'fa-font': ['M5 20 12 4l7 16', 'M8 14h8', 'M4 20h4', 'M16 20h4'],
        'fa-gear': 'fa-cog',
        'fa-gem': ['M6 3h12l4 6-10 12L2 9l4-6z', 'M2 9h20', 'M8 9l4 12 4-12', 'M6 3l2 6', 'M18 3l-2 6'],
        'fa-grip': ['M9 5h.01', 'M15 5h.01', 'M9 12h.01', 'M15 12h.01', 'M9 19h.01', 'M15 19h.01'],
        'fa-grip-vertical': 'fa-grip',
        'fa-house': ['M3 11 12 3l9 8', 'M5 10v10h5v-6h4v6h5V10'],
        'fa-image': ['M3 5h18v14H3z', 'M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M21 16l-5-5L5 19'],
        'fa-key': ['M8 15a4 4 0 1 1 2.8-6.8A4 4 0 0 1 8 15z', 'M11 12l9-9', 'M16 7l2 2', 'M14 9l2 2'],
        'fa-language': ['M4 5h8', 'M8 3v2', 'M6 9c1.2 2.2 3.2 4 6 5', 'M12 5c-.7 4.8-3 8.2-8 10', 'M13 21l4-9 4 9', 'M15 17h4'],
        'fa-layer-group': ['M12 3 21 8l-9 5-9-5 9-5z', 'M3 12l9 5 9-5', 'M3 16l9 5 9-5'],
        'fa-list': ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
        'fa-list-check': ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6l1 1 2-2', 'M3 12l1 1 2-2', 'M3 18l1 1 2-2'],
        'fa-magnifying-glass': ['M21 21l-4.3-4.3', 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z'],
        'fa-microphone': ['M9 2h6v10a3 3 0 0 1-6 0V2z', 'M5 10a7 7 0 0 0 14 0', 'M12 17v4', 'M8 21h8'],
        'fa-minus': ['M5 12h14'],
        'fa-money-bill-transfer': ['M4 7h16v10H4z', 'M8 11h.01', 'M16 13h.01', 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', 'M3 4l3-2', 'M21 20l-3 2'],
        'fa-pen': ['M4 20h4L19 9l-4-4L4 16v4z', 'M13 7l4 4'],
        'fa-pencil': 'fa-pen',
        'fa-plus': ['M12 5v14', 'M5 12h14'],
        'fa-plus-circle': ['M12 8v8', 'M8 12h8', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'],
        'fa-quote-left': ['M7 7h5v5c0 4-2 6-6 7l-1-2c2-.8 3-2 3-4H5V7h2z', 'M17 7h5v5c0 4-2 6-6 7l-1-2c2-.8 3-2 3-4h-3V7h2z'],
        'fa-robot': ['M5 7h14v10H5z', 'M9 11h.01', 'M15 11h.01', 'M12 3v4', 'M8 21l2-4', 'M16 21l-2-4', 'M8 15h8'],
        'fa-rotate-left': ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v6h6'],
        'fa-sliders': ['M4 6h16', 'M4 12h16', 'M4 18h16', 'M9 6a2 2 0 1 0 0 .01', 'M15 12a2 2 0 1 0 0 .01', 'M11 18a2 2 0 1 0 0 .01'],
        'fa-smog': ['M3 9h14a3 3 0 1 0-3-3', 'M3 13h18', 'M3 17h10a3 3 0 1 1-3 3'],
        'fa-snowflake': ['M12 2v20', 'M4 6l16 12', 'M20 6 4 18'],
        'fa-sun': ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
        'fa-times': ['M6 6l12 12', 'M18 6 6 18'],
        'fa-xmark': ['M6 6l12 12', 'M18 6 6 18'],
        'fa-trash': ['M3 6h18', 'M8 6V4h8v2', 'M6 6l1 15h10l1-15', 'M10 11v6', 'M14 11v6'],
        'fa-triangle-exclamation': 'fa-exclamation-triangle',
        'fa-upload': ['M12 16V4', 'M7 9l5-5 5 5', 'M5 20h14'],
        'fa-user-gear': 'fa-cog',
        'fa-user-secret': ['M5 9h14l-2-5H7L5 9z', 'M7 15a5 5 0 0 0 10 0', 'M4 13h16', 'M9 13v2', 'M15 13v2'],
        'fa-wand-magic-sparkles': ['M4 20 14 10', 'M13 5l6 6', 'M15 3l1-2', 'M20 8l2-1', 'M18 14l1 2', 'M9 6 8 4', 'M5 11l-2 1']
    };

    function resolveIcon(classes) {
        for (const className of classes) {
            const icon = icons[className];
            if (!icon) continue;
            return Array.isArray(icon) ? icon : icons[icon];
        }
        return icons['fa-circle-notch'];
    }

    function createSvg(paths) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.classList.add('pro-icon-svg');
        paths.forEach(d => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'currentColor');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
        });
        return svg;
    }

    function renderIcon(node) {
        if (!(node instanceof HTMLElement) || !node.classList.contains('fa-solid')) return;
        const signature = node.className;
        if (node.dataset.proIcon === signature) return;
        node.dataset.proIcon = signature;
        node.setAttribute('aria-hidden', 'true');
        node.classList.add('pro-icon-ready');
        node.replaceChildren(createSvg(resolveIcon(node.classList)));
    }

    function renderAll(root = document) {
        root.querySelectorAll?.('i.fa-solid').forEach(renderIcon);
        if (root.matches?.('i.fa-solid')) renderIcon(root);
    }

    function installStyle() {
        if (document.getElementById('pro-icon-style')) return;
        const style = document.createElement('style');
        style.id = 'pro-icon-style';
        style.textContent = `
            i.fa-solid.pro-icon-ready {
                display: inline-flex;
                width: 1em;
                height: 1em;
                align-items: center;
                justify-content: center;
                vertical-align: -0.125em;
                line-height: 1;
            }
            i.fa-solid.pro-icon-ready::before { content: none !important; }
            .pro-icon-svg {
                width: 1em;
                height: 1em;
                display: block;
                stroke: currentColor;
            }
            .fa-spin .pro-icon-svg {
                animation: pro-icon-spin 1s linear infinite;
            }
            @keyframes pro-icon-spin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }

    function start() {
        installStyle();
        renderAll();
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) renderAll(node);
                });
                if (mutation.type === 'attributes') renderIcon(mutation.target);
            });
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
}());
