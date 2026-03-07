/**
 * AnimeEngine v6 - Themes Module
 * Sistema de temas inspirado no v4
 */

var Themes = window.Themes || {
    // Temas disponíveis
    themes: {
        default: {
            name: 'Default',
            icon: '🎨',
            description: 'Neo-Brutalist clássico'
        },
        cyberpunk: {
            name: 'Cyberpunk',
            icon: '🌃',
            description: 'Neon escuro futurista'
        },
        manga: {
            name: 'Manga',
            icon: '📖',
            description: 'Estilo papel de mangá'
        },
        mono: {
            name: 'Mono',
            icon: '⬛',
            description: 'Preto e branco puro'
        },
        dark: {
            name: 'Dark Mode',
            icon: '🌙',
            description: 'Modo escuro elegante'
        },
        matrix: {
            name: 'Matrix',
            icon: '💚',
            description: 'Estilo hacker verde'
        },
        benevaMode: {
            name: 'Beneva Mode',
            icon: '🤓',
            description: 'Estilo MangaEngine (Laranja & Escuro)'
        },
        parafaMode: {
            name: 'Parafa Mode',
            icon: '🥴',
            description: 'Tons de Rosa Neon'
        },
        migueliMode: {
            name: 'Migueli Mode',
            icon: '🧠',
            description: 'Tons de Magenta Profundo'
        },
        kauaMode: {
            name: 'Kauã Mode',
            icon: '🤖',
            description: 'O Modo Supremo - Arco-íris Dinâmico'
        },
        ruanMode: {
            name: 'Ruan Mode',
            icon: '👨‍💻',
            description: 'Royal Blue & Sky Gradient'
        }
    },

    currentTheme: 'default',

    /**
     * Inicializar tema salvo
     */
    init() {
        const saved = localStorage.getItem('animeengine_theme');
        if (saved && this.themes[saved]) {
            this.apply(saved);
        }
    },

    /**
     * Aplicar tema
     */
    apply(themeName) {
        if (!this.themes[themeName]) return;

        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        localStorage.setItem('animeengine_theme', themeName);

        // Update particles if available
        if (window.Particles && Particles.enabled) {
            Particles.setTheme(themeName);
        }

        console.log(`🎨 Theme applied: ${themeName}`);
    },

    /**
     * Obter tema atual
     */
    getCurrent() {
        return this.currentTheme;
    },

    /**
     * Listar todos os temas
     */
    getAll() {
        return Object.entries(this.themes).map(([key, theme]) => ({
            id: key,
            ...theme,
            active: key === this.currentTheme
        }));
    }
};

// Expor globalmente
window.Themes = Themes;

// Inicializar
document.addEventListener('DOMContentLoaded', () => Themes.init());

