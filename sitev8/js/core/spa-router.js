/**
 * AnimeEngine v8 — SPA Router
 * Intercepta links internos, carrega views via AJAX e injeta no DOM.
 * Usa History API (pushState + popstate) para navegação sem reload.
 */

const SpaRouter = (function () {
    'use strict';

    const CONFIG = {
        contentSelector: '#spa-content',
        navItemSelector: '.nav-item, .bottom-nav-item, .bottom-nav-popup a',
        transitionDuration: 200,
        skeletonMinTime: 180,
    };

    const getBasePath = () => {
        const baseTag = document.querySelector('base');
        if (baseTag && baseTag.href) {
            return new URL(baseTag.href).pathname;
        }
        return window.location.pathname.replace(/\/[^\/]*$/, '/') || '/';
    };
    const BASE_PATH = getBasePath();

    const loadedScripts = new Set();

    let isNavigating = false;
    let currentPage = null;
    let abortController = null;

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

    function fadeOut(el) {
        return new Promise(resolve => {
            el.style.transition = `all ${CONFIG.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            el.style.opacity = '0';
            el.style.transform = 'scale(0.99)';
            el.style.filter = 'blur(6px)';
            setTimeout(resolve, CONFIG.transitionDuration);
        });
    }

    function fadeIn(el) {
        return new Promise(resolve => {
            el.style.opacity = '0';
            el.style.transform = 'scale(1.01)';
            el.style.filter = 'blur(6px)';
            void el.offsetHeight;
            el.style.transition = `all ${CONFIG.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
            el.style.filter = 'blur(0px)';
            setTimeout(resolve, CONFIG.transitionDuration);
        });
    }

    /**
     * Normaliza URLs legadas (ex: detalhes.php?id=10 -> ?page=detalhes&id=10)
     */
    function normalizeInternalUrl(rawUrl) {
        if (!rawUrl) return 'home';
        let cleaned = rawUrl.trim();
        // Converter arquivo.php?xyz para ?page=arquivo&xyz ou arquivo
        const phpMatch = cleaned.match(/^(?:.*\/)?([a-z0-9_]+)\.php(\?.*)?$/i);
        if (phpMatch) {
            let page = phpMatch[1].toLowerCase();
            if (page === 'index') page = 'home';
            const query = phpMatch[2] || '';
            if (query) {
                const params = new URLSearchParams(query);
                params.set('page', page);
                return '?' + params.toString();
            }
            return page;
        }
        return cleaned;
    }

    async function navigateTo(rawUrl, pushState = true) {
        const url = normalizeInternalUrl(rawUrl);

        if (isNavigating) {
            if (abortController) abortController.abort();
        }

        const container = document.querySelector(CONFIG.contentSelector);
        if (!container) {
            window.location.href = url;
            return;
        }

        let fullUrl;
        if (url.startsWith('http')) {
            fullUrl = new URL(url);
        } else if (url.startsWith('?')) {
            fullUrl = new URL(window.location.origin + BASE_PATH + url);
        } else {
            const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
            fullUrl = new URL(cleanUrl, window.location.origin + BASE_PATH);
        }

        let pageName = fullUrl.searchParams.get('page');
        if (!pageName) {
            const pathParts = fullUrl.pathname.replace(BASE_PATH, '').split('/');
            pageName = pathParts.find(p => p !== '') || 'home';
        }
        pageName = pageName.replace(/\.php$/i, '').toLowerCase();
        if (pageName === 'index' || !pageName) pageName = 'home';
        if (pageName === 'arcade' || pageName === 'music_quiz') pageName = 'animdle';

        // Evitar recarregar a exata mesma rota + query
        const currentSearch = window.location.search || '';
        const targetSearch = fullUrl.search || '';
        if (pushState && pageName === currentPage && currentSearch === targetSearch && !['detalhes', 'animdle', 'perfil'].includes(pageName)) {
            return;
        }

        isNavigating = true;
        abortController = new AbortController();

        const leaveDetail = { from: currentPage, to: pageName, url: fullUrl.href };
        document.dispatchEvent(new CustomEvent('spa:beforeLeave', { detail: leaveDetail }));
        window.dispatchEvent(new CustomEvent('spa:beforeNavigate', { detail: leaveDetail }));

        try {
            await fadeOut(container);

            container.innerHTML = createSkeleton();
            container.style.opacity = '1';
            container.style.transform = 'none';
            container.style.filter = 'none';
            const skeletonStart = Date.now();

            if (['login', 'register'].includes(pageName)) {
                document.body.classList.add('fullscreen-mode');
            } else {
                document.body.classList.remove('fullscreen-mode');
            }
            document.body.dataset.page = pageName;

            // Construir URL AJAX garantindo que index.php receba ?page=...&ajax=true
            const ajaxUrl = new URL(window.location.origin + BASE_PATH + 'index.php');
            fullUrl.searchParams.forEach((val, key) => ajaxUrl.searchParams.set(key, val));
            ajaxUrl.searchParams.set('page', pageName);
            ajaxUrl.searchParams.set('ajax', 'true');

            const response = await fetch(ajaxUrl.href, {
                signal: abortController.signal,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            const redirectUrl = response.headers.get('X-Page-Redirect');
            if (redirectUrl || response.status === 401) {
                isNavigating = false;
                navigateTo(redirectUrl || 'login');
                return;
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();

            const rawTitle = response.headers.get('X-Page-Title');
            const pageTitle = rawTitle ? decodeURIComponent(rawTitle) : 'ANIME.ENGINE v8';
            const pageScriptsRaw = response.headers.get('X-Page-Scripts');
            const pageScripts = pageScriptsRaw ? JSON.parse(pageScriptsRaw) : [];
            const pageCssRaw = response.headers.get('X-Page-Css');
            const pageCss = pageCssRaw ? JSON.parse(pageCssRaw) : [];
            const isFullscreen = response.headers.get('X-Page-Fullscreen') === 'true';

            const elapsed = Date.now() - skeletonStart;
            if (elapsed < CONFIG.skeletonMinTime) {
                await new Promise(r => setTimeout(r, CONFIG.skeletonMinTime - elapsed));
            }

            await fadeOut(container);

            toggleFullscreen(isFullscreen);
            container.innerHTML = html;
            document.title = pageTitle;

            // Atualizar URL no navegador ANTES de rodar scripts de página (ex: DetalhesPage lê window.location.search)
            if (pushState) {
                const cleanParams = new URLSearchParams(fullUrl.search);
                cleanParams.delete('ajax');
                // Se tiver outros parâmetros (ex: id=123 ou date=...), mantém ?page=... ou /pagina?id=...
                cleanParams.delete('page');
                const queryString = cleanParams.toString();
                const cleanPagePath = (pageName === 'home') ? '' : pageName;
                const finalPath = (BASE_PATH + cleanPagePath).replace(/\/+/g, '/');
                const finalUrl = finalPath + (queryString ? '?' + queryString : '');
                history.pushState({ page: pageName, url: finalUrl }, pageTitle, finalUrl);
            }

            loadPageCss(pageCss);
            await executeInlineViewScripts(container, pageScripts);
            await loadPageScripts(pageScripts);
            updateActiveNav(pageName);

            await fadeIn(container);

            currentPage = pageName;
            window.scrollTo({ top: 0, behavior: 'instant' });
            reinitGlobalSystems();

            const afterDetail = { page: pageName, url: window.location.href };
            document.dispatchEvent(new CustomEvent('spa:afterNavigate', { detail: afterDetail }));
            window.dispatchEvent(new CustomEvent('spa:afterNavigate', { detail: afterDetail }));

        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('[SPA Router] Erro:', err);
            window.location.href = url;
        } finally {
            isNavigating = false;
        }
    }

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
        'js/pages/tierlist.js': 'TierListPage',
        'js/pages/titulos.js': 'TitulosPage',
        'js/pages/stats.js': 'StatsPage',
        'js/pages/radio.js': 'RadioPage',
        'js/pages/animdle.js': 'AnimdlePage',
        'js/calendar.js': 'Calendar',
        'js/airing.js': 'Airing',
        'js/timeline.js': 'Timeline',
        'js/animedata.js': 'ANIME_DATA',
        'js/pages/configuracoes.js': 'ConfiguracoesPage'
    };

    function getGlobalObject(globalName) {
        if (!globalName) return null;
        if (window[globalName]) return window[globalName];
        try {
            return Function(`return typeof ${globalName} !== 'undefined' ? ${globalName} : null`)();
        } catch (e) {
            return null;
        }
    }

    /**
     * Executa scripts inline presentes no HTML da view (ex: ranking.php, editar_perfil.php, variáveis de perfil.php)
     */
    async function executeInlineViewScripts(container, managedScripts = []) {
        const inlineScripts = Array.from(container.querySelectorAll('script'));
        for (const oldScript of inlineScripts) {
            const src = oldScript.getAttribute('src');
            if (src) {
                // Se já está na lista de scripts gerenciados pela rota, apenas remove a tag duplicada
                if (managedScripts.includes(src)) {
                    oldScript.remove();
                    continue;
                }
            } else {
                const code = oldScript.textContent || '';
                oldScript.remove();
                if (!code.trim()) continue;
                try {
                    // Se o script inline usa document.addEventListener('DOMContentLoaded', fn), executa fn imediatamente
                    const patchedCode = code.replace(
                        /document\.addEventListener\(\s*['"]DOMContentLoaded['"]\s*,\s*([\s\S]*?)\)\s*;?\s*$/,
                        '($1)();'
                    );
                    const newScript = document.createElement('script');
                    newScript.textContent = patchedCode;
                    document.body.appendChild(newScript);
                    newScript.remove();
                } catch (e) {
                    console.warn('[SPA] Erro ao executar script inline da view:', e);
                }
            }
        }
    }

    async function loadPageScripts(scripts) {
        window.__SPA_MANAGED_LOAD__ = true;
        try {
            for (const src of scripts) {
                try {
                    const globalName = SCRIPT_GLOBALS[src];
                    const globalObj = getGlobalObject(globalName);

                    if (globalObj) {
                        if (typeof globalObj.init === 'function') {
                            await globalObj.init();
                        }
                        continue;
                    }

                    // Se for script externo (ex: Sortable.min.js ou chart.js) já carregado
                    if (loadedScripts.has(src)) {
                        continue;
                    }

                    const script = document.createElement('script');
                    script.src = src.startsWith('http') ? src : (src + '?v=' + Date.now());
                    script.async = false;
                    script.setAttribute('data-spa-page-script', src);

                    await new Promise((resolve, reject) => {
                        script.onload = async () => {
                            loadedScripts.add(src);
                            const newlyLoadedObj = getGlobalObject(globalName);
                            if (newlyLoadedObj && typeof newlyLoadedObj.init === 'function') {
                                await newlyLoadedObj.init();
                            }
                            resolve();
                        };
                        script.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
                        document.body.appendChild(script);
                    });
                } catch (e) {
                    console.warn(`[SPA] Script falhou: ${src}`, e);
                }
            }
        } finally {
            window.__SPA_MANAGED_LOAD__ = false;
        }
    }

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

    function loadPageCss(cssFiles) {
        document.querySelectorAll('link[data-page-css]').forEach(el => el.remove());

        for (const href of cssFiles) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href + '?v=10.2';
            link.setAttribute('data-page-css', 'true');
            document.head.appendChild(link);
        }
    }

    function updateActiveNav(pageName) {
        document.querySelectorAll('.nav-item.active, .bottom-nav-item.active').forEach(el => {
            el.classList.remove('active');
        });

        document.querySelectorAll(CONFIG.navItemSelector).forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;

            try {
                let linkPage = 'home';
                if (href.includes('page=')) {
                    const url = new URL(href, window.location.origin + BASE_PATH);
                    linkPage = url.searchParams.get('page') || 'home';
                } else {
                    linkPage = href.replace(/\/+$/, '').replace(/^\?/, '') || 'home';
                }

                if (linkPage === pageName) {
                    link.classList.add('active');
                }
            } catch (e) { }
        });
    }

    function reinitGlobalSystems() {
        if (typeof Themes !== 'undefined' && Themes.apply) {
            try { Themes.apply(); } catch (e) { }
        }
        if (typeof Achievements !== 'undefined' && Achievements.check) {
            try { Achievements.check(); } catch (e) { }
        }
        if (typeof Goals !== 'undefined' && Goals.renderWeekly) {
            try { Goals.renderWeekly(); } catch (e) { }
        }
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.init) {
            try { NotificationSystem.init(); } catch (e) { }
        }
        if (typeof Common !== 'undefined' && Common.initSearch) {
            try { Common.initSearch(); } catch (e) { }
        }
    }

    function init() {
        const urlObj = new URL(window.location.href);
        currentPage = urlObj.searchParams.get('page');

        if (!currentPage) {
            const path = urlObj.pathname.replace(BASE_PATH, '').replace(/\/+$/, '');
            currentPage = (path && path !== 'index.php') ? path : 'home';
        }
        currentPage = currentPage.replace(/\.php$/i, '').toLowerCase();

        document.querySelectorAll('script[src]').forEach(s => {
            const rawSrc = s.getAttribute('src');
            if (rawSrc) loadedScripts.add(rawSrc);
        });

        history.replaceState(
            { page: currentPage, url: window.location.href },
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
        const targetUrl = e.state?.url || window.location.href;
        navigateTo(targetUrl, false);
    }

    return {
        init,
        navigateTo,
        normalizeInternalUrl,
        getCurrentPage: () => currentPage,
        isNavigating: () => isNavigating
    };
})();

document.addEventListener('DOMContentLoaded', () => SpaRouter.init());
