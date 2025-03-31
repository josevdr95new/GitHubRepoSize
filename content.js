(() => {
    // Configuración de estilos
    const CONFIG = {
        decimalPrecision: 6,
        measurementUnit: 'MB',
        styles: {
            container: `
                display: flex;
                align-items: center;
                margin-top: 8px;
                padding: 6px 8px;
                background-color: var(--color-accent-subtle);
                border-radius: 6px;
                border: 1px solid var(--color-accent-muted);
            `,
            label: `
                margin-right: 6px;
                font-weight: 600;
                color: var(--color-accent-fg);
            `,
            value: `
                font-weight: 700;
                color: var(--color-fg-default);
                background: var(--color-neutral-subtle);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: ui-monospace, SFMono-Regular, monospace;
            `,
            icon: `
                margin-right: 6px;
                color: var(--color-accent-fg);
                transform: translateY(1px);
                width: 16px;
                height: 16px;
            `
        },
        iconSVG: `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm6 15c0 .55-3.03 2-6 2s-6-1.45-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V18zm-6-3c-3.07 0-6-.45-6-1V9.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V14c0 .55-2.93 1-6 1zm0-5C8.93 9 6 8.55 6 8s2.93-1 6-1 6 .45 6 1-2.93 1-6 1z"/>
            </svg>
        `
    };

    // Cache de tamaños
    const sizeCache = new Map();

    async function fetchRepoSize(owner, repo) {
        const cacheKey = `${owner}/${repo}`;
        if (sizeCache.has(cacheKey)) return sizeCache.get(cacheKey);

        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const { size: sizeKB } = await response.json();
            const sizeMB = (sizeKB / 1024).toLocaleString('en', {
                minimumFractionDigits: CONFIG.decimalPrecision,
                maximumFractionDigits: CONFIG.decimalPrecision
            }).replace(/\.?0+$/, '') || '0';
            
            sizeCache.set(cacheKey, sizeMB);
            return sizeMB;
        } catch (error) {
            console.error('[GitHub Size]', error);
            return null;
        }
    }

    function createSizeElement(sizeMB) {
        const container = document.createElement('div');
        container.className = 'gh-repo-size-container';
        container.style.cssText = CONFIG.styles.container;

        // Ícono
        const icon = document.createElement('div');
        icon.innerHTML = CONFIG.iconSVG;
        icon.querySelector('svg').style.cssText = CONFIG.styles.icon;
        container.appendChild(icon);

        // Etiqueta
        const label = document.createElement('span');
        label.className = 'gh-size-label';
        label.style.cssText = CONFIG.styles.label;
        label.textContent = 'Repository size:';
        container.appendChild(label);

        // Valor
        const value = document.createElement('span');
        value.className = 'gh-size-value';
        value.style.cssText = CONFIG.styles.value;
        value.textContent = `${sizeMB} ${CONFIG.measurementUnit}`;
        container.appendChild(value);

        return container;
    }

    async function updateSizeDisplay() {
        const [, owner, repo] = window.location.pathname.split('/');
        if (!owner || !repo) return;

        const sizeMB = await fetchRepoSize(owner, repo);
        if (!sizeMB) return;

        const existing = document.querySelector('.gh-repo-size-container');
        if (existing) {
            existing.querySelector('.gh-size-value').textContent = `${sizeMB} ${CONFIG.measurementUnit}`;
            return;
        }

        const target = [...document.querySelectorAll('h2, h3')]
            .find(el => el.textContent.includes('Forks'));
        
        if (target) {
            const container = target.closest('.BorderGrid-cell') || target.parentElement;
            container.appendChild(createSizeElement(sizeMB));
        }
    }

    // Observador para SPA
    new MutationObserver(() => {
        if (!document.querySelector('.gh-repo-size-container')) {
            updateSizeDisplay();
        }
    }).observe(document.body, { childList: true, subtree: true });

    // Iniciar
    if (document.readyState === 'complete') {
        updateSizeDisplay();
    } else {
        document.addEventListener('DOMContentLoaded', updateSizeDisplay);
    }
})();