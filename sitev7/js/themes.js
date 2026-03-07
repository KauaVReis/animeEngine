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
            description: 'Estilo MangaEngine (Laranja & Escuro)',
            secret: true
        },
        parafaMode: {
            name: 'Parafa Mode',
            icon: '🥴',
            description: 'Tons de Rosa Neon',
            secret: true
        },
        migueliMode: {
            name: 'Migueli Mode',
            icon: '🧠',
            description: 'Tons de Magenta Profundo',
            secret: true
        },
        kauaMode: {
            name: 'Kauã Mode',
            icon: '🤖',
            description: 'O Modo Supremo - Arco-íris Dinâmico',
            secret: true
        },
        ruanMode: {
            name: 'Ruan Mode',
            icon: '👨‍💻',
            description: 'Royal Blue & Sky Gradient',
            secret: true
        }
    },

    currentTheme: 'default',

    /**
     * Inicializar tema salvo
     */
    init() {
        const saved = localStorage.getItem('animeengine_theme');
        if (saved && this.themes[saved]) {
            // Se for secreto e não estiver desbloqueado, volta pro default
            if (this.themes[saved].secret && !this.isUnlocked(saved)) {
                this.apply('default');
            } else {
                this.apply(saved);
            }
        }
    },

    /**
     * Verificar se um tema está desbloqueado
     */
    isUnlocked(themeId) {
        if (!this.themes[themeId].secret) return true;

        const unlocked = JSON.parse(localStorage.getItem('animeengine_unlocked_themes') || '[]');
        return unlocked.includes(themeId);
    },

    /**
     * Desbloquear tema secreto
     */
    unlock(themeId) {
        if (!this.themes[themeId] || !this.themes[themeId].secret) return false;

        const unlocked = JSON.parse(localStorage.getItem('animeengine_unlocked_themes') || '[]');
        if (!unlocked.includes(themeId)) {
            unlocked.push(themeId);
            localStorage.setItem('animeengine_unlocked_themes', JSON.stringify(unlocked));
            return true;
        }
        return false;
    },

    /**
     * Aplicar tema
     */
    apply(themeName) {
        if (!this.themes[themeName]) return;

        // Se for secreto e estiver bloqueado, não aplica
        if (this.themes[themeName].secret && !this.isUnlocked(themeName)) {
            return;
        }

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
     * Listar todos os temas (filtros os secretos bloqueados)
     */
    getAll() {
        return Object.entries(this.themes)
            .filter(([id, theme]) => !theme.secret || this.isUnlocked(id))
            .map(([key, theme]) => ({
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

