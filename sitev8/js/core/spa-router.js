/**
 * AnimeEngine v8 — SPA Router
 * Intercepta links internos, carrega views via AJAX e injeta no DOM.
 * Usa History API (pushState + popstate) para navegação sem reload.
 * 
 * Funcionalidades:
 *  - Interceptação de cliques em links ?page=
 *  - Fetch de views com ?ajax=true
 *  - Transição fade out → skeleton → fade in
 *  - Carregamento dinâmico de scripts por página
 *  - Atualização do título e estado ativo do nav
 *  - Integração com sistemas existentes (themes, goals, achievements)
 */

const SpaRouter = (function () {
    'use strict';

    // =========================================================
    // CONFIGURAÇÃO
    // =========================================================
    const CONFIG = {
        contentSelector: '#spa-content',
        navItemSelector: '.nav-item, .bottom-nav-item, .bottom-nav-popup a',
        transitionDuration: 250, // ms
        skeletonMinTime: 300, // tempo mínimo do skeleton (UX)
    };

    // Base path do projeto (Detectado da tag <base> ou fallback dinâmico)
    const getBasePath = () => {
        const baseTag = document.querySelector('base');
        if (baseTag && baseTag.href) {
            return new URL(baseTag.href).pathname;
        }
        return window.location.pathname.replace(/\/[^\/]*$/, '/') || '/';
    };
    const BASE_PATH = getBasePath();

    // Cache de scripts já carregados (para não carregar 2x)
    const loadedScripts = new Set();

    // Estado
    let isNavigating = false;
    let currentPage = null;
    let abortController = null;

    // =========================================================
    // SKELETON SCREEN
    // =========================================================
    function createSkeleton() {
        return `
        <div class="spa-skeleton" aria-busy="true">
            <div class="skeleton-header">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-subtitle"></div>
            </div>
            <div class="skeleton-grid">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        </div>`;
    }

    // =========================================================
    // TRANSIÇÕES PREMIUM
    // =========================================================
    function fadeOut(el) {
        return new Promise(resolve => {
            el.style.transition = `all ${CONFIG.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            el.style.opacity = '0';
            el.style.transform = 'scale(0.98)';
            el.style.filter = 'blur(10px)';
            setTimeout(resolve, CONFIG.transitionDuration);
        });
    }

    function fadeIn(el) {
        return new Promise(resolve => {
            el.style.opacity = '0';
            el.style.transform = 'scale(1.02)';
            el.style.filter = 'blur(10px)';
            // Force reflow
            void el.offsetHeight;
            el.style.transition = `all ${CONFIG.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
            el.style.filter = 'blur(0px)';
            setTimeout(resolve, CONFIG.transitionDuration);
        });
    }

    // =========================================================
    // NAVEGAÇÃO CORE
    // =========================================================
    async function navigateTo(url, pushState = true) {
        if (isNavigating) {
            if (abortController) abortController.abort();
        }

        const container = document.querySelector(CONFIG.contentSelector);
        if (!container) {
            window.location.href = url;
            return;
        }

        // Resolver URL (suportando friendly URLs e subpastas)
        let fullUrl;
        if (url.startsWith('http')) {
            fullUrl = new URL(url);
        } else {
            // Se for ?page=, mantém o comportamento relativo
            if (url.startsWith('?')) {
                fullUrl = new URL(url, window.location.href);
            } else {
                // Para URLs amigáveis, garante que herdam a BASE_PATH corretamente
                // Remove / inicial se existir para não resetar para a raiz do domínio
                const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
                fullUrl = new URL(cleanUrl, window.location.origin + BASE_PATH);
            }
        }

        // 1. Extrair o nome da página (pageName)
        let pageName = fullUrl.searchParams.get('page');

        if (!pageName) {
            // Se não tem ?page=, tenta tirar do path
            // Remove a BASE_PATH do path total para sobrar apenas a página
            const pathParts = fullUrl.pathname.replace(BASE_PATH, '').split('/');
            pageName = pathParts.find(p => p !== '') || 'home';
        }

        // Se é a mesma página, não navegar (exceto detalhes que tem ID variável)
        if (pageName === currentPage && pageName !== 'detalhes') return;

        isNavigating = true;
        abortController = new AbortController();

        document.dispatchEvent(new CustomEvent('spa:beforeLeave', {
            detail: { from: currentPage, to: pageName }
        }));

        try {
            // 1. Fade out dinâmico
            await fadeOut(container);

            // 2. Mostrar skeleton com glassmorphism
            container.innerHTML = createSkeleton();
            container.style.opacity = '1';
            container.style.transform = 'none';
            container.style.filter = 'none';
            const skeletonStart = Date.now();

            // 3. Preparar URL de fetch (sempre envia ?ajax=true)
            const fetchUrl = new URL(fullUrl.toString());
            fetchUrl.searchParams.set('ajax', 'true');

            // Se a página for login ou register, limpa a interface (modo fullscreen)
            if (['login', 'register'].includes(pageName)) {
                document.body.classList.add('fullscreen-mode');
            } else {
                document.body.classList.remove('fullscreen-mode');
            }

            // Fetch do conteúdo (com ?ajax=true)
            const ajaxUrl = new URL(fullUrl.href);
            ajaxUrl.searchParams.set('ajax', 'true');

            const response = await fetch(ajaxUrl.href, {
                signal: abortController.signal,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            // Redirecionamentos
            const redirectUrl = response.headers.get('X-Page-Redirect');
            if (redirectUrl || response.status === 401) {
                const target = redirectUrl || 'login';
                navigateTo(target);
                return;
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();

            // 5. Metadados do Header
            const pageTitle = response.headers.get('X-Page-Title') || 'ANIME.ENGINE v8';
            const pageScriptsRaw = response.headers.get('X-Page-Scripts');
            const pageScripts = pageScriptsRaw ? JSON.parse(pageScriptsRaw) : [];
            const pageCssRaw = response.headers.get('X-Page-Css');
            const pageCss = pageCssRaw ? JSON.parse(pageCssRaw) : [];
            const isFullscreen = response.headers.get('X-Page-Fullscreen') === 'true';

            // 6. UX: Tempo mínimo de skeleton
            const elapsed = Date.now() - skeletonStart;
            if (elapsed < CONFIG.skeletonMinTime) {
                await new Promise(r => setTimeout(r, CONFIG.skeletonMinTime - elapsed));
            }

            // 7. Saída do skeleton
            await fadeOut(container);

            // 8. Injetar e Configurar
            toggleFullscreen(isFullscreen);
            container.innerHTML = html;
            document.title = pageTitle;

            // 9. Atualizar History (Formato amigável e limpo)
            if (pushState) {
                // Remove barras extras e garante que começa com /
                const cleanPagePath = (pageName === 'home') ? '' : pageName;
                const finalUrl = (BASE_PATH + cleanPagePath).replace(/\/+/g, '/');
                history.pushState({ page: pageName }, pageTitle, finalUrl + fullUrl.search);
            }

            // 10. Recursos
            loadPageCss(pageCss);
            await loadPageScripts(pageScripts);
            updateActiveNav(pageName);

            // 11. Entrada triunfal
            await fadeIn(container);

            currentPage = pageName;
            window.scrollTo({ top: 0, behavior: 'instant' });
            reinitGlobalSystems();

            document.dispatchEvent(new CustomEvent('spa:afterNavigate', {
                detail: { page: pageName }
            }));

        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('[SPA Router] Erro:', err);
            window.location.href = url;
        } finally {
            isNavigating = false;
        }
    }

    // =========================================================
    // CARREGAMENTO DINÂMICO DE SCRIPTS
    // =========================================================
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Se já foi carregado, não recarregar
            if (loadedScripts.has(src)) {
                resolve();
                return;
            }

            // Remover script anterior da mesma página (se existir)
            const existing = document.querySelector(`script[data-spa-script="${src}"]`);
            if (existing) existing.remove();

            const script = document.createElement('script');
            script.src = src + '?v=' + Date.now(); // Cache bust para reexecução
            script.setAttribute('data-spa-script', src);
            script.onload = () => {
                loadedScripts.add(src);
                resolve();
            };
            script.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
            document.body.appendChild(script);
        });
    }

    // Mapa de script src → objeto global que deve ter .init()
    const SCRIPT_GLOBALS = {
        'js/pages/lista.js': 'ListaPage',
        'js/pages/home.js': 'HomePage',
        'js/pages/explorar.js': 'ExplorePage',
        'js/pages/detalhes.js': 'DetalhesPage',
        'js/pages/perfil.js': 'PerfilPage',
        'js/pages/calendario.js': 'CalendarioPage',
        'js/pages/calculadora.js': 'CalculadoraPage',
        'js/pages/assistindo.js': 'AssistindoPage',
        'js/pages/favoritos.js': 'FavoritosPage',
        'js/pages/tierlist.js': 'TierlistPage',
        'js/pages/titulos.js': 'TitulosPage',
        'js/pages/stats.js': 'StatsPage',
        'js/calendar.js': 'Calendar',
        'js/airing.js': 'AiringCountdown',
    };

    async function loadPageScripts(scripts) {
        for (const src of scripts) {
            try {
                const globalName = SCRIPT_GLOBALS[src];
                const globalObj = globalName ? window[globalName] : null;

                if (globalObj && typeof globalObj.init === 'function') {
                    // Script já está carregado → apenas re-executar init()
                    console.log(`[SPA] Re-init: ${globalName}.init()`);
                    await globalObj.init();
                } else {
                    // Primeira carga → carregar script normalmente
                    const script = document.createElement('script');
                    script.src = src + '?spa=' + Date.now();
                    script.setAttribute('data-spa-page-script', 'true');
                    
                    await new Promise((resolve, reject) => {
                        script.onload = () => {
                            // Após carregar primeiro, inicializa
                            const newlyLoadedObj = window[globalName];
                            if (newlyLoadedObj && typeof newlyLoadedObj.init === 'function') {
                                console.log(`[SPA] Init: ${globalName}.init()`);
                                newlyLoadedObj.init();
                            }
                            resolve();
                        };
                        script.onerror = reject;
                        document.body.appendChild(script);
                    });
                }
            } catch (e) {
                console.warn(`[SPA] Script falhou: ${src}`, e);
            }
        }
    }

    // =========================================================
    // TOGGLE FULLSCREEN (login/register)
    // =========================================================
    function toggleFullscreen(fullscreen) {
        const header = document.querySelector('.header');
        const sidebar = document.querySelector('.sidebar');
        const bottomNav = document.querySelector('.bottom-nav');
        const mainContent = document.querySelector('.main-content');

        if (fullscreen) {
            if (header) header.style.display = 'none';
            if (sidebar) sidebar.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            if (mainContent) {
                mainContent.style.marginLeft = '0';
                mainContent.style.marginTop = '0';
                mainContent.style.padding = '0';
                mainContent.style.minHeight = '100vh';
            }
        } else {
            if (header) header.style.display = '';
            if (sidebar) sidebar.style.display = '';
            if (bottomNav) bottomNav.style.display = '';
            if (mainContent) {
                mainContent.style.marginLeft = '';
                mainContent.style.marginTop = '';
                mainContent.style.padding = '';
                mainContent.style.minHeight = '';
            }
        }
    }

    // =========================================================
    // CARREGAMENTO DINÂMICO DE CSS POR PÁGINA
    // =========================================================
    function loadPageCss(cssFiles) {
        // Remover CSS da página anterior
        document.querySelectorAll('link[data-page-css]').forEach(el => el.remove());

        // Injetar novos CSS
        for (const href of cssFiles) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.setAttribute('data-page-css', 'true');
            document.head.appendChild(link);
        }
    }

    // =========================================================
    // NAV ATIVO
    // =========================================================
    function updateActiveNav(pageName) {
        document.querySelectorAll('.nav-item.active, .bottom-nav-item.active').forEach(el => {
            el.classList.remove('active');
        });

        document.querySelectorAll(CONFIG.navItemSelector).forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            try {
                // Suporta ?page= e links amigáveis
                let linkPage = 'home';
                if (href.includes('page=')) {
                    const url = new URL(href, window.location.origin);
                    linkPage = url.searchParams.get('page') || 'home';
                } else {
                    linkPage = href.replace(/\/+$/, '') || 'home';
                }

                if (linkPage === pageName) {
                    link.classList.add('active');
                }
            } catch (e) { }
        });
    }

    // =========================================================
    // RE-INICIALIZAÇÃO DE SISTEMAS GLOBAIS
    // =========================================================
    function reinitGlobalSystems() {
        // Themes — reaplicar tema ao novo conteúdo
        if (typeof Themes !== 'undefined' && Themes.apply) {
            try { Themes.apply(); } catch (e) { /* silêncio */ }
        }

        // Achievements — verificar conquistas com novo estado
        if (typeof Achievements !== 'undefined' && Achievements.check) {
            try { Achievements.check(); } catch (e) { /* silêncio */ }
        }

        // Goals — atualizar UI de metas
        if (typeof Goals !== 'undefined' && Goals.renderWeekly) {
            try { Goals.renderWeekly(); } catch (e) { /* silêncio */ }
        }

        // Notifications — re-bind
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.init) {
            try { NotificationSystem.init(); } catch (e) { /* silêncio */ }
        }

        // Search — re-bind se existir
        if (typeof Common !== 'undefined' && Common.initSearch) {
            try { Common.initSearch(); } catch (e) { /* silêncio */ }
        }
    }

    // =========================================================
    // EVENT LISTENERS
    // =========================================================
    function init() {
        // Detecção de página inicial (friendly url ou query param)
        const urlObj = new URL(window.location.href);
        currentPage = urlObj.searchParams.get('page');
        
        if (!currentPage) {
            const path = urlObj.pathname.replace(BASE_PATH, '').replace(/\/+$/, '');
            currentPage = path || 'home';
        }

        document.querySelectorAll('script[src]').forEach(s => {
            if (s.src) loadedScripts.add(new URL(s.src).pathname);
        });

        history.replaceState(
            { page: currentPage },
            document.title,
            window.location.href
        );

        document.addEventListener('click', handleLinkClick);
        window.addEventListener('popstate', handlePopState);

        console.log('[SPA Router] ✅ Inicializado — página:', currentPage);
    }

    function handleLinkClick(e) {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        if (
            href.startsWith('http') ||
            href.startsWith('//') ||
            href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('api/') ||
            href.includes('logout') ||
            link.hasAttribute('download') ||
            link.getAttribute('target') === '_blank' ||
            link.hasAttribute('data-no-spa')
        ) {
            return;
        }

        e.preventDefault();
        navigateTo(href);
    }

    function handlePopState(e) {
        const page = e.state?.page || 'home';
        const url = window.location.href;
        navigateTo(url, false); // false = não fazer pushState de novo
    }

    // =========================================================
    // API PÚBLICA
    // =========================================================
    return {
        init,
        navigateTo,
        getCurrentPage: () => currentPage,
        isNavigating: () => isNavigating
    };

})();

// Auto-inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => SpaRouter.init());
