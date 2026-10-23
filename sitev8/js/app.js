/**
 * AnimeEngine v8 — Master Application Entry Point (App)
 * Coordena os subsistemas globais, ciclo de vida do SPA e motor de áudio
 */

const App = (function () {
    'use strict';

    const VERSION = '8.0.0';
    let isInitialized = false;

    function init() {
        if (isInitialized) {
            console.warn('[AnimeEngine] App já inicializado.');
            return;
        }

        console.log(`%c🚀 ANIME.ENGINE v${VERSION} — Master Coordinator`, 'background: #ff3366; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 2px;');

        // 1. Inicializar Armazenamento e Temas (Design System)
        if (typeof Themes !== 'undefined' && Themes.init) {
            try { Themes.init(); } catch (e) { console.warn('[App] Falha ao iniciar Themes:', e); }
        }

        // 2. Inicializar Sistema de Notificações
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.init) {
            try { NotificationSystem.init(); } catch (e) { console.warn('[App] Falha ao iniciar NotificationSystem:', e); }
        }

        // 3. Inicializar Gamificação & Metas
        if (typeof Achievements !== 'undefined' && Achievements.init) {
            try { Achievements.init(); } catch (e) { console.warn('[App] Falha ao iniciar Achievements:', e); }
        }
        if (typeof Goals !== 'undefined' && Goals.init) {
            try { Goals.init(); } catch (e) { console.warn('[App] Falha ao iniciar Goals:', e); }
        }

        // 4. Inicializar Player Global Persistente
        if (typeof OSTPlayer !== 'undefined' && OSTPlayer.init) {
            try { OSTPlayer.init(); } catch (e) { console.warn('[App] Falha ao iniciar OSTPlayer:', e); }
        }

        // 5. Inicializar Utilitários Comuns e Easter Eggs
        if (typeof Common !== 'undefined' && Common.init) {
            try { Common.init(); } catch (e) { console.warn('[App] Falha ao iniciar Common:', e); }
        }

        // 6. Inicializar Roteador SPA
        if (typeof SpaRouter !== 'undefined' && SpaRouter.init) {
            try { SpaRouter.init(); } catch (e) { console.warn('[App] Falha ao iniciar SpaRouter:', e); }
        }

        isInitialized = true;
        document.dispatchEvent(new CustomEvent('app:ready', { detail: { version: VERSION } }));
    }

    /**
     * Retorna diagnóstico do estado atual da aplicação
     */
    function getDiagnostics() {
        return {
            version: VERSION,
            currentPage: typeof SpaRouter !== 'undefined' ? SpaRouter.getCurrentPage() : 'unknown',
            isPlayerActive: typeof OSTPlayer !== 'undefined' ? OSTPlayer.isPlaying : false,
            currentTrack: typeof OSTPlayer !== 'undefined' ? OSTPlayer.currentTrack : null,
            theme: localStorage.getItem('animeengine_theme') || 'default',
            userLoggedIn: !!document.querySelector('.level-badge')
        };
    }

    return {
        init,
        getVersion: () => VERSION,
        getDiagnostics,
        isReady: () => isInitialized
    };
})();

// Auto-inicialização segura no DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

window.App = App;
