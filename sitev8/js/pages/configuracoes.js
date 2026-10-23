/**
 * AnimeEngine v8 - Configurações Page
 * Lógica da Central de Configurações, Swatches de Temas,
 * Preferências de Áudio, Export/Import de Backup e Diagnóstico Tri-API
 */

const ConfiguracoesPage = {
    activeTab: 'themes',

    init() {
        console.log('⚙️ Inicializando Central de Configurações v8...');
        this.loadPreferences();
        this.renderThemeSwatches();
        this.pingAllApis();
    },

    switchTab(tabId) {
        this.activeTab = tabId;

        document.querySelectorAll('.config-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        document.querySelectorAll('.config-tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `config-panel-${tabId}`);
        });

        try {
            window.history.replaceState(null, null, window.location.pathname + window.location.search + '#' + tabId);
        } catch (_) {}
    },

    /**
     * Renderizar Swatches dos 30 Temas
     */
    renderThemeSwatches() {
        const grid = document.getElementById('themes-swatch-grid');
        if (!grid) return;

        const currentTheme = (typeof Themes !== 'undefined' && Themes.currentTheme) ? Themes.currentTheme : (localStorage.getItem('theme') || 'default');

        const themesList = [
            { id: 'default', name: 'Default Neo', primary: '#ff3366', bg: '#f5f5f5', surface: '#ffffff' },
            { id: 'dark', name: 'Dark Brutal', primary: '#ff3366', bg: '#121212', surface: '#1e1e1e' },
            { id: 'cyberpunk', name: 'Cyberpunk 2077', primary: '#00ffcc', bg: '#05050f', surface: '#0d0d1f' },
            { id: 'matrix', name: 'Matrix Digital', primary: '#00ff41', bg: '#0d1117', surface: '#161b22' },
            { id: 'synthwave', name: 'Synthwave 80s', primary: '#f72585', bg: '#1a0933', surface: '#2d1154' },
            { id: 'retro', name: 'Retro Arcade', primary: '#e63946', bg: '#f1faee', surface: '#ffffff' },
            { id: 'sakura', name: 'Sakura Blossom', primary: '#ff758f', bg: '#fff0f3', surface: '#ffffff' },
            { id: 'dracula', name: 'Dracula Night', primary: '#bd93f9', bg: '#282a36', surface: '#44475a' },
            { id: 'monokai', name: 'Monokai Code', primary: '#a6e22e', bg: '#272822', surface: '#3e3d32' },
            { id: 'nord', name: 'Nordic Frost', primary: '#88c0d0', bg: '#2e3440', surface: '#3b4252' },
            { id: 'gruvbox', name: 'Gruvbox Warm', primary: '#fe8019', bg: '#282828', surface: '#3c3836' },
            { id: 'gameboy', name: 'GameBoy Classic', primary: '#306230', bg: '#8bac0f', surface: '#9bbc0f' },
            { id: 'sunset', name: 'Golden Sunset', primary: '#f97316', bg: '#fff7ed', surface: '#ffffff' },
            { id: 'coffee', name: 'Café & Lo-Fi', primary: '#b45309', bg: '#fef3c7', surface: '#ffffff' },
            { id: 'vaporwave', name: 'Vaporwave 90s', primary: '#ff71ce', bg: '#01cdfe', surface: '#05ffa1' },
            { id: 'ocean', name: 'Deep Ocean', primary: '#38bdf8', bg: '#0c4a6e', surface: '#075985' },
            { id: 'forest', name: 'Emerald Forest', primary: '#10b981', bg: '#064e3b', surface: '#065f46' },
            { id: 'crimson', name: 'Crimson Blood', primary: '#dc2626', bg: '#450a0a', surface: '#7f1d1d' },
            { id: 'amethyst', name: 'Amethyst Gem', primary: '#c084fc', bg: '#3b0764', surface: '#581c87' },
            { id: 'midnight', name: 'Midnight Blue', primary: '#60a5fa', bg: '#0f172a', surface: '#1e293b' },
            { id: 'gold', name: 'Imperial Gold', primary: '#eab308', bg: '#1c1917', surface: '#292524' },
            { id: 'manga', name: 'Manga Monocromático', primary: '#000000', bg: '#ffffff', surface: '#f4f4f5' },
            { id: 'neon', name: 'Neon Toxic', primary: '#a3e635', bg: '#09090b', surface: '#18181b' },
            { id: 'arcade', name: 'Arcade 1984', primary: '#ec4899', bg: '#18181b', surface: '#27272a' }
        ];

        grid.innerHTML = themesList.map(t => `
            <div class="theme-swatch-card ${t.id === currentTheme ? 'active' : ''}" 
                 data-theme-id="${t.id}"
                 onclick="ConfiguracoesPage.selectTheme('${t.id}')">
                <div class="swatch-palette">
                    <div class="swatch-bar" style="background: ${t.primary};" title="Cor Primária"></div>
                    <div class="swatch-bar" style="background: ${t.surface};" title="Superfície"></div>
                    <div class="swatch-bar" style="background: ${t.bg};" title="Fundo"></div>
                </div>
                <div class="swatch-name">${t.name}</div>
            </div>
        `).join('');
    },

    selectTheme(themeId) {
        if (typeof Themes !== 'undefined' && Themes.setTheme) {
            Themes.setTheme(themeId);
        } else {
            document.documentElement.setAttribute('data-theme', themeId);
            localStorage.setItem('theme', themeId);
        }

        document.querySelectorAll('.theme-swatch-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-theme-id') === themeId);
        });

        if (typeof Common !== 'undefined') {
            Common.showNotification(`🎨 Tema alterado para ${themeId}!`);
        }
    },

    /**
     * Carregar preferências salvas do LocalStorage
     */
    loadPreferences() {
        try {
            // Visual
            const matrixPref = localStorage.getItem('ae_matrix_effects') !== 'false';
            const reduceMotion = localStorage.getItem('ae_reduce_motion') === 'true';
            const shadowDepth = localStorage.getItem('ae_shadow_depth') || '4px';

            const matrixEl = document.getElementById('cfg-matrix-effects');
            if (matrixEl) matrixEl.checked = matrixPref;

            const motionEl = document.getElementById('cfg-reduce-motion');
            if (motionEl) motionEl.checked = reduceMotion;

            const shadowEl = document.getElementById('cfg-shadow-depth');
            if (shadowEl) shadowEl.value = shadowDepth;

            // Áudio
            const masterVol = localStorage.getItem('ost_player_volume') || '70';
            const showMicroDock = localStorage.getItem('ae_show_micro_dock') !== 'false';
            const radioAutoplay = localStorage.getItem('ae_radio_autoplay') !== 'false';
            const audioQuality = localStorage.getItem('ae_audio_quality') || 'hd';
            const dualSkin = localStorage.getItem('ae_dual_skin') !== 'false';

            const volSlider = document.getElementById('cfg-master-volume');
            const volDisp = document.getElementById('cfg-volume-display');
            if (volSlider) volSlider.value = masterVol;
            if (volDisp) volDisp.textContent = `${masterVol}%`;

            const dockEl = document.getElementById('cfg-micro-dock');
            if (dockEl) dockEl.checked = showMicroDock;

            const autoEl = document.getElementById('cfg-radio-autoplay');
            if (autoEl) autoEl.checked = radioAutoplay;

            const qualEl = document.getElementById('cfg-audio-quality');
            if (qualEl) qualEl.value = audioQuality;

            const dualEl = document.getElementById('cfg-dual-skin');
            if (dualEl) dualEl.checked = dualSkin;

            // UI
            const exploreView = localStorage.getItem('ae_explore_view_mode') || 'grid';
            const expEl = document.getElementById('cfg-explore-view');
            if (expEl) expEl.value = exploreView;

            const telFooter = localStorage.getItem('ae_show_telemetry_footer') !== 'false';
            const telEl = document.getElementById('cfg-telemetry-footer');
            if (telEl) telEl.checked = telFooter;

        } catch (e) {
            console.error('Erro ao ler preferências:', e);
        }
    },

    updateVisualPreference(key, val) {
        if (key === 'matrixEffects') {
            localStorage.setItem('ae_matrix_effects', val);
            const canvas = document.getElementById('matrix-canvas') || document.querySelector('.particles-canvas');
            if (canvas) canvas.style.display = val ? 'block' : 'none';
        } else if (key === 'reduceMotion') {
            localStorage.setItem('ae_reduce_motion', val);
            document.documentElement.classList.toggle('reduce-motion', val);
        } else if (key === 'shadowDepth') {
            localStorage.setItem('ae_shadow_depth', val);
            document.documentElement.style.setProperty('--shadow-neo', `${val} ${val} 0 var(--border-color)`);
        }
        Common.showNotification('Preferência visual atualizada!');
    },

    updateAudioPreference(key, val) {
        if (key === 'showMicroDock') {
            localStorage.setItem('ae_show_micro_dock', val);
            const dock = document.getElementById('ost-micro-dock');
            if (dock) dock.style.display = val ? 'inline-flex' : 'none';
        } else if (key === 'radioAutoplay') {
            localStorage.setItem('ae_radio_autoplay', val);
        } else if (key === 'audioQuality') {
            localStorage.setItem('ae_audio_quality', val);
        } else if (key === 'dualSkin') {
            localStorage.setItem('ae_dual_skin', val);
        }
        Common.showNotification('Preferência de áudio atualizada!');
    },

    updateVolume(val) {
        localStorage.setItem('ost_player_volume', val);
        const disp = document.getElementById('cfg-volume-display');
        if (disp) disp.textContent = `${val}%`;

        if (typeof OSTPlayer !== 'undefined' && OSTPlayer.setVolume) {
            OSTPlayer.setVolume(val / 100);
        }
    },

    updateUIPreference(key, val) {
        if (key === 'exploreView') {
            localStorage.setItem('ae_explore_view_mode', val);
        } else if (key === 'telemetryFooter') {
            localStorage.setItem('ae_show_telemetry_footer', val);
            const footer = document.getElementById('app-telemetry-footer');
            if (footer) footer.style.display = val ? 'block' : 'none';
        }
        Common.showNotification('Preferência de interface salva!');
    },

    /**
     * Exportar Minha Lista e Histórico em JSON
     */
    exportData() {
        try {
            const backup = {
                version: '8.0',
                exportDate: new Date().toISOString(),
                lists: JSON.parse(localStorage.getItem('anime_lists') || '{}'),
                watched: JSON.parse(localStorage.getItem('watched_episodes') || '{}'),
                favorites: JSON.parse(localStorage.getItem('anime_favorites') || '[]'),
                settings: {
                    theme: localStorage.getItem('theme'),
                    volume: localStorage.getItem('ost_player_volume'),
                    exploreView: localStorage.getItem('ae_explore_view_mode')
                }
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `animeengine-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Common.showNotification('💾 Backup exportado com sucesso!', 'success');
        } catch (e) {
            console.error('Erro na exportação:', e);
            Common.showNotification('Erro ao exportar backup', 'error');
        }
    },

    /**
     * Importar Arquivo de Backup
     */
    importData(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.lists) localStorage.setItem('anime_lists', JSON.stringify(data.lists));
                if (data.watched) localStorage.setItem('watched_episodes', JSON.stringify(data.watched));
                if (data.favorites) localStorage.setItem('anime_favorites', JSON.stringify(data.favorites));

                Common.showNotification('🎉 Backup restaurado com sucesso! Recarregando dados...', 'success');
                setTimeout(() => window.location.reload(), 1200);
            } catch (err) {
                console.error('Arquivo de backup inválido:', err);
                Common.showNotification('Arquivo inválido ou corrompido!', 'error');
            }
        };
        reader.readAsText(file);
    },

    clearApiCache() {
        try {
            sessionStorage.removeItem('ae_anilist_cooldown');
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('aotd_') || key.startsWith('cache_') || key.startsWith('jikan_'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            Common.showNotification('🧹 Cache de requisições limpo com sucesso!', 'success');
        } catch (e) {
            Common.showNotification('Erro ao limpar cache', 'error');
        }
    },

    confirmResetWatched() {
        Common.confirm({
            title: '⚠️ Resetar Episódios Assistidos?',
            message: 'Tem certeza de que deseja resetar todo o histórico de episódios vistos? Os animes permanecerão na sua lista.',
            confirmText: 'Sim, Resetar Tudo',
            cancelText: 'Cancelar',
            onConfirm: () => {
                localStorage.removeItem('watched_episodes');
                Common.showNotification('Histórico de episódios resetado com sucesso.');
            }
        });
    },

    async pingAllApis() {
        // 1. AniList
        const elAnilist = document.getElementById('diag-status-anilist');
        const latAnilist = document.getElementById('diag-lat-anilist');
        if (elAnilist) {
            const t0 = performance.now();
            try {
                const cdVal = Number(sessionStorage.getItem('ae_anilist_cooldown') || 0);
                const isCooldown = cdVal > Date.now();
                if (isCooldown) {
                    elAnilist.textContent = 'COOLDOWN';
                    elAnilist.className = 'api-pill-status pill-standby';
                    latAnilist.textContent = 'Latência: Standby (Reserva)';
                } else {
                    const r = await fetch('https://graphql.anilist.co', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: '{ Page(page: 1, perPage: 1) { media(type: ANIME) { id } } }' })
                    });
                    const diff = Math.round(performance.now() - t0);
                    if (r.ok) {
                        elAnilist.textContent = 'OK (PRIMÁRIA)';
                        elAnilist.className = 'api-pill-status pill-ok';
                        latAnilist.textContent = `Latência: ${diff} ms (Online)`;
                    } else {
                        elAnilist.textContent = `AVISO (${r.status})`;
                        elAnilist.className = 'api-pill-status pill-standby';
                        latAnilist.textContent = `Falha de estabilidade: Modo Resiliente Ativo`;
                    }
                }
            } catch (_) {
                elAnilist.textContent = 'STANDBY';
                elAnilist.className = 'api-pill-status pill-standby';
                latAnilist.textContent = 'Failover automático engajado';
            }
        }

        // 2. AnimeThemes
        const elThemes = document.getElementById('diag-status-animethemes');
        const latThemes = document.getElementById('diag-lat-animethemes');
        if (elThemes) {
            const t0 = performance.now();
            try {
                const r = await fetch('https://api.animethemes.moe/anime?page[size]=1');
                const diff = Math.round(performance.now() - t0);
                if (r.ok) {
                    elThemes.textContent = 'OK (HD)';
                    elThemes.className = 'api-pill-status pill-ok';
                    latThemes.textContent = `Latência: ${diff} ms`;
                }
            } catch (_) {
                latThemes.textContent = 'Latência: -- ms';
            }
        }

        // 3. Jikan
        const elJikan = document.getElementById('diag-status-jikan');
        const latJikan = document.getElementById('diag-lat-jikan');
        if (elJikan) {
            elJikan.textContent = 'STANDBY';
            elJikan.className = 'api-pill-status pill-standby';
            latJikan.textContent = 'Provedor de Retaguarda';
        }
    },

    resetToDefaults() {
        Common.confirm({
            title: 'Restaurar Configurações?',
            message: 'Isso redefinirá todas as preferências de visual, som e interface para os padrões originais.',
            confirmText: 'Restaurar',
            cancelText: 'Cancelar',
            onConfirm: () => {
                localStorage.removeItem('theme');
                localStorage.removeItem('ae_matrix_effects');
                localStorage.removeItem('ae_reduce_motion');
                localStorage.removeItem('ae_shadow_depth');
                localStorage.removeItem('ost_player_volume');
                localStorage.removeItem('ae_explore_view_mode');
                localStorage.removeItem('ae_show_telemetry_footer');

                Common.showNotification('Configurações restauradas com sucesso!');
                setTimeout(() => window.location.reload(), 1000);
            }
        });
    },

    saveAll() {
        Common.showNotification('✅ Todas as alterações foram salvas com sucesso!', 'success');
    }
};

window.ConfiguracoesPage = ConfiguracoesPage;
if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        ConfiguracoesPage.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => ConfiguracoesPage.init());
    }
}
