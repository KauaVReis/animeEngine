/**
 * AnimeEngine v4 - Themes Module
 * Sistema de personalização visual com múltiplos temas
 */

const Themes = {
    // Temas disponíveis
    available: {
        default: {
            name: "Neo-Brutalist",
            icon: "☀️",
            description: "Tema claro com estilo Neo-Brutalist"
        },
        cyberpunk: {
            name: "Cyberpunk",
            icon: "🌆",
            description: "Neon em fundo escuro"
        },
        manga: {
            name: "Mangá",
            icon: "📖",
            description: "Estilo preto e branco"
        }
    },

    // Tema atual
    current: 'default',

    /**
     * Inicializa o sistema de temas
     */
    init() {
        // Carregar tema salvo ou usar default
        const savedTheme = this.getSavedTheme();
        this.apply(savedTheme);
        this.renderSelector();
    },

    /**
     * Aplica um tema
     * @param {string} themeName - Nome do tema
     */
    apply(themeName) {
        if (!this.available[themeName]) {
            themeName = 'default';
        }

        // Remover classes de tema anteriores
        document.documentElement.removeAttribute('data-theme');
        document.body.classList.remove('theme-default', 'theme-cyberpunk', 'theme-manga');

        // Aplicar novo tema
        document.documentElement.setAttribute('data-theme', themeName);
        document.body.classList.add(`theme-${themeName}`);

        this.current = themeName;
        this.saveTheme(themeName);
        this.updateSelector();

        console.log(`🎨 Tema aplicado: ${this.available[themeName].name}`);
    },

    /**
     * Salva tema no localStorage via appState
     */
    saveTheme(themeName) {
        if (typeof appState !== 'undefined') {
            appState.theme = themeName;
            if (typeof saveData === 'function') {
                saveData();
            }
        }
    },

    /**
     * Recupera tema salvo
     */
    getSavedTheme() {
        if (typeof appState !== 'undefined' && appState.theme) {
            return appState.theme;
        }
        return 'default';
    },

    /**
     * Alterna para o próximo tema
     */
    toggle() {
        const themeNames = Object.keys(this.available);
        const currentIndex = themeNames.indexOf(this.current);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        this.apply(themeNames[nextIndex]);
    },

    /**
     * Renderiza o seletor de tema
     */
    renderSelector() {
        const container = document.getElementById('theme-selector');
        if (!container) return;

        let html = '';
        for (const [key, theme] of Object.entries(this.available)) {
            const isActive = key === this.current ? 'active' : '';
            html += `
                <button class="theme-option ${isActive}" 
                        data-theme="${key}" 
                        onclick="Themes.apply('${key}')"
                        title="${theme.description}">
                    <span class="theme-option-icon">${theme.icon}</span>
                    <span class="theme-option-name">${theme.name}</span>
                </button>
            `;
        }
        container.innerHTML = html;
    },

    /**
     * Atualiza visual do seletor
     */
    updateSelector() {
        const buttons = document.querySelectorAll('.theme-option');
        buttons.forEach(btn => {
            const theme = btn.dataset.theme;
            btn.classList.toggle('active', theme === this.current);
        });
    }
};

// Expor globalmente
window.Themes = Themes;
