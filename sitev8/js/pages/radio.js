/**
 * AnimeEngine v8 — RadioPage Controller (Estações Temáticas & Ambiência Visual)
 * Sincroniza a interface dedicada da Rádio (?page=radio) com o motor único OSTPlayer,
 * o catálogo compartilhado MusicService e o sistema de Ambiência/Temas (Themes + Particles).
 */

const RadioPage = {
    activeTab: 'queue',
    displayMode: 'video', // 'video' | 'visualizer'
    ambientSync: true,
    savedUserTheme: 'default',
    searchResults: [],
    boundStateHandler: null,
    boundQueueHandler: null,
    boundTimeHandler: null,
    boundBeforeNavigateHandler: null,

    async init() {
        console.log('📻 Initializing RadioPage (Thematic Stations)...');
        if (typeof OSTPlayer === 'undefined') return;

        // Salvar o tema original escolhido pelo usuário antes de aplicar o ambiente da Rádio
        this.savedUserTheme = localStorage.getItem('animeengine_theme') || 'default';
        const savedSync = localStorage.getItem('animeengine_radio_ambient_sync');
        this.ambientSync = savedSync !== null ? savedSync === 'true' : true;

        // Acoplar o palco de vídeo global do OSTPlayer dentro do monitor da Rádio
        const mount = document.getElementById('radio-video-mount');
        if (mount) {
            OSTPlayer.dockStageTo(mount);
        }

        this.bindEvents();
        this.updateAmbientToggleUI();

        const state = OSTPlayer.getState();
        this.applyStationAmbiance(state.currentStation || 'random');
        this.syncFromPlayerState(state);
        this.renderQueue();
        this.renderHistory();

        // Se a fila ainda estiver vazia, carregar estação inicial sem forçar erro de autoplay
        if (!OSTPlayer.queue || OSTPlayer.queue.length === 0) {
            await this.populateInitialStation();
        }
    },

    bindEvents() {
        if (this.boundStateHandler) {
            window.removeEventListener('ost:stateChange', this.boundStateHandler);
            window.removeEventListener('ost:queueChange', this.boundQueueHandler);
            window.removeEventListener('ost:timeUpdate', this.boundTimeHandler);
        }
        if (this.boundBeforeNavigateHandler) {
            window.removeEventListener('spa:beforeNavigate', this.boundBeforeNavigateHandler);
        }

        this.boundStateHandler = (e) => this.syncFromPlayerState(e.detail);
        this.boundQueueHandler = () => {
            this.renderQueue();
            this.renderHistory();
        };
        this.boundTimeHandler = (e) => this.updateSeekUI(e.detail);
        this.boundBeforeNavigateHandler = (e) => {
            const targetUrl = e.detail?.url || '';
            if (!targetUrl.includes('radio')) {
                this.restoreUserTheme();
            }
        };

        window.addEventListener('ost:stateChange', this.boundStateHandler);
        window.addEventListener('ost:queueChange', this.boundQueueHandler);
        window.addEventListener('ost:timeUpdate', this.boundTimeHandler);
        window.addEventListener('spa:beforeNavigate', this.boundBeforeNavigateHandler);

        const seekBar = document.getElementById('radio-seek-bar');
        if (seekBar) {
            seekBar.onclick = (e) => {
                const rect = seekBar.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                OSTPlayer.seekToPercent(pct);
            };
        }
    },

    /**
     * Aplica a identidade visual (skin local + tema/partículas ao redor se Ambient Sync estiver ON)
     */
    applyStationAmbiance(stationId) {
        if (typeof MusicService === 'undefined' || !MusicService.getStationConfig) return;
        const station = MusicService.getStationConfig(stationId);
        const wrapper = document.getElementById('radio-page');

        if (wrapper) {
            wrapper.setAttribute('data-station-theme', station.visualTheme || 'classic');
            wrapper.style.removeProperty('--station-accent');
        }

        const fmEl = document.getElementById('radio-station-fm');
        const headingEl = document.getElementById('radio-station-heading');
        const taglineEl = document.getElementById('radio-station-tagline');
        const chipEl = document.getElementById('radio-stage-station-chip');
        const queueLabelEl = document.getElementById('radio-queue-station-label');
        const themePillEl = document.getElementById('radio-station-theme-pill');
        const loadingMsgEl = document.getElementById('radio-loading-msg');

        if (fmEl) fmEl.textContent = station.badge || 'FM 88.1';
        if (headingEl) {
            headingEl.textContent = `RÁDIO • ${station.name.toUpperCase()}`;
            headingEl.title = station.tagline || '';
        }
        if (taglineEl) taglineEl.textContent = station.tagline;
        if (chipEl) chipEl.textContent = (station.badge || 'FM 88.1').split('•')[0].trim();
        if (queueLabelEl) queueLabelEl.textContent = `Programação: ${station.name}`;
        if (loadingMsgEl) loadingMsgEl.textContent = `Sintonizando ${station.name} (${station.badge})...`;

        const themeMeta = (typeof Themes !== 'undefined' && Themes.themes?.[station.globalTheme])
            ? Themes.themes[station.globalTheme]
            : { name: 'Default', icon: '🎨' };

        if (themePillEl) {
            themePillEl.innerHTML = `${themeMeta.icon || '🎨'} <strong>${this.escapeHtml(themeMeta.name || station.globalTheme)}</strong>`;
            themePillEl.title = `Ambiente da Estação: ${themeMeta.name || station.globalTheme} (${this.ambientSync ? 'Ativo' : 'Desativado'})`;
        }

        // Se o modo Ambiente da Estação estiver ativo, aplica o tema e as partículas na página sem sobrescrever a preferência permanente do usuário
        if (this.ambientSync) {
            document.documentElement.setAttribute('data-theme', station.globalTheme || 'default');
            if (typeof Particles !== 'undefined' && Particles.enabled) {
                Particles.setTheme(station.globalTheme || 'default');
            }
        } else {
            this.restoreUserTheme();
        }
    },

    toggleAmbientSync() {
        this.ambientSync = !this.ambientSync;
        localStorage.setItem('animeengine_radio_ambient_sync', String(this.ambientSync));
        this.updateAmbientToggleUI();
        this.applyStationAmbiance(OSTPlayer?.currentStation || 'random');
    },

    updateAmbientToggleUI() {
        const btn = document.getElementById('radio-ambient-sync-btn');
        const stateEl = document.getElementById('radio-ambient-state');
        if (btn) {
            btn.classList.toggle('active', this.ambientSync);
            btn.setAttribute('aria-pressed', String(this.ambientSync));
            btn.title = `Ambiente da Estação: ${this.ambientSync ? 'ON (Sincroniza tema e partículas com a rádio)' : 'OFF (Mantém seu tema fixo)'}`;
        }
        if (stateEl) stateEl.textContent = this.ambientSync ? 'ON' : 'OFF';
    },

    filterStationCategory(category = 'all') {
        document.querySelectorAll('.tuner-cat-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === category);
        });
        document.querySelectorAll('.station-btn').forEach(btn => {
            const matches = category === 'all' || btn.dataset.category === category;
            btn.style.display = matches ? 'inline-flex' : 'none';
        });
    },

    restoreUserTheme() {
        const themeToRestore = localStorage.getItem('animeengine_theme') || this.savedUserTheme || 'default';
        document.documentElement.setAttribute('data-theme', themeToRestore);
        if (typeof Particles !== 'undefined' && Particles.enabled) {
            Particles.setTheme(themeToRestore);
        }
    },

    async populateInitialStation() {
        if (typeof MusicService === 'undefined') return;
        const overlay = document.getElementById('radio-loading-overlay');
        if (overlay) overlay.style.display = 'flex';

        try {
            const state = OSTPlayer.getState();
            const stationId = state.currentStation || 'random';
            this.applyStationAmbiance(stationId);
            const tracks = await MusicService.getStationTracks(stationId, state.typeFilter || 'ALL');
            if (tracks && tracks.length > 0) {
                OSTPlayer.setQueue(tracks, 0);
                if (!OSTPlayer.currentTrack) {
                    OSTPlayer.currentTrack = tracks[0];
                    if (OSTPlayer.videoEl && tracks[0].mediaUrl) {
                        OSTPlayer.videoEl.src = tracks[0].mediaUrl;
                    }
                    OSTPlayer.updateUI();
                    OSTPlayer.saveState();
                    OSTPlayer.emitState();
                }
            }
        } catch (e) {
            console.warn('[RadioPage] Erro ao popular estação inicial:', e);
        } finally {
            if (overlay) overlay.style.display = 'none';
        }
    },

    async selectStation(stationId) {
        document.querySelectorAll('.station-btn').forEach(btn => {
            const isActive = btn.dataset.station === stationId;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', String(isActive));
        });
        this.applyStationAmbiance(stationId);
        await OSTPlayer.startAutoStation(stationId, OSTPlayer.typeFilter);
    },

    async setTypeFilter(type) {
        document.querySelectorAll('.type-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        await OSTPlayer.startAutoStation(OSTPlayer.currentStation, type);
    },

    async refreshStation() {
        await OSTPlayer.startAutoStation(OSTPlayer.currentStation, OSTPlayer.typeFilter);
    },

    async loadMoreToQueue() {
        if (typeof MusicService === 'undefined') return;
        const btn = document.querySelector('#radio-tab-queue .btn-link-neo');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        try {
            const more = await MusicService.getStationTracks(OSTPlayer.currentStation, OSTPlayer.typeFilter);
            more.forEach(t => {
                if (!OSTPlayer.queue.some(q => q.id === t.id)) {
                    OSTPlayer.queue.push(t);
                }
            });
            OSTPlayer.saveState();
            OSTPlayer.emitQueue();
        } finally {
            if (btn) btn.innerHTML = '<i class="fas fa-plus"></i> + Faixas';
        }
    },

    setDisplayMode(mode) {
        this.displayMode = mode === 'visualizer' ? 'visualizer' : 'video';
        OSTPlayer.viewMode = this.displayMode;

        const videoMount = document.getElementById('radio-video-mount');
        const vinylStage = document.getElementById('radio-vinyl-stage');
        const btnVideo = document.getElementById('btn-mode-video');
        const btnVinyl = document.getElementById('btn-mode-vinyl');

        if (this.displayMode === 'visualizer') {
            if (videoMount) videoMount.style.opacity = '0';
            if (videoMount) videoMount.style.pointerEvents = 'none';
            if (vinylStage) vinylStage.style.display = 'flex';
            btnVideo?.classList.remove('active');
            btnVinyl?.classList.add('active');
        } else {
            if (videoMount) videoMount.style.opacity = '1';
            if (videoMount) videoMount.style.pointerEvents = 'auto';
            if (vinylStage) vinylStage.style.display = 'none';
            btnVideo?.classList.add('active');
            btnVinyl?.classList.remove('active');
        }
    },

    toggleFullscreenStage() {
        const screen = document.getElementById('radio-stage-screen');
        if (!screen) return;
        if (!document.fullscreenElement) {
            screen.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.().catch(() => {});
        }
    },

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.radio-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        ['queue', 'search', 'history'].forEach(id => {
            const panel = document.getElementById(`radio-tab-${id}`);
            if (panel) panel.style.display = (id === tabId) ? 'flex' : 'none';
        });
    },

    async performSearch() {
        const input = document.getElementById('radio-search-input');
        const resultsEl = document.getElementById('radio-search-results');
        if (!input || !resultsEl || typeof MusicService === 'undefined') return;

        const q = input.value.trim();
        if (!q) return;

        resultsEl.innerHTML = '<div class="carousel-loading"><div class="loader"></div></div>';
        const results = await MusicService.searchTracks(q, OSTPlayer.typeFilter || 'ALL');
        this.searchResults = results;

        if (!results || results.length === 0) {
            resultsEl.innerHTML = `
                <div class="radio-empty-state">
                    <p>Nenhum tema encontrado para "<strong>${this.escapeHtml(q)}</strong>".</p>
                </div>
            `;
            return;
        }

        resultsEl.innerHTML = results.map((track, idx) => `
            <div class="radio-track-item">
                <img src="${track.cover}" alt="${this.escapeHtml(track.animeTitle)}" class="track-item-cover">
                <div class="track-item-info" onclick="RadioPage.playSearchResult(${idx})">
                    <div class="track-item-title-row">
                        <span class="track-badge type-${(track.themeType || 'OP').toLowerCase()}">${track.themeSlug || track.themeType}</span>
                        <span class="track-item-song">${this.escapeHtml(track.songTitle)}</span>
                    </div>
                    <div class="track-item-sub">${this.escapeHtml(track.animeTitle)} • ${this.escapeHtml(track.artist)}</div>
                </div>
                <div class="track-item-actions">
                    <button class="track-action-btn" onclick="RadioPage.playSearchResult(${idx})" title="Tocar Agora">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="track-action-btn" onclick="RadioPage.queueSearchResult(${idx})" title="Adicionar à Fila">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    async playSearchResult(idx) {
        const track = this.searchResults[idx];
        if (!track) return;
        await OSTPlayer.playTrack(track, true);
    },

    queueSearchResult(idx) {
        const track = this.searchResults[idx];
        if (!track) return;
        OSTPlayer.addToQueue(track);
    },

    syncFromPlayerState(state) {
        if (!state || !document.getElementById('radio-page')) return;

        const mount = document.getElementById('radio-video-mount');
        const stage = document.getElementById('ost-media-stage');
        if (mount && stage && stage.parentElement !== mount) {
            OSTPlayer.dockStageTo(mount);
        }

        const overlay = document.getElementById('radio-loading-overlay');
        if (overlay) {
            overlay.style.display = state.isLoading ? 'flex' : 'none';
        }

        this.applyStationAmbiance(state.currentStation || 'random');

        document.querySelectorAll('.station-btn').forEach(btn => {
            const isActive = btn.dataset.station === state.currentStation;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', String(isActive));
        });
        document.querySelectorAll('.type-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === state.typeFilter);
        });

        const statusText = document.getElementById('radio-status-text');
        const liveBadge = document.getElementById('radio-live-badge');
        if (statusText) {
            statusText.textContent = state.isPlaying
                ? 'NO AR'
                : (state.isLoading ? 'SINTONIZANDO' : 'PRONTO');
        }
        if (liveBadge) {
            liveBadge.classList.toggle('playing', state.isPlaying);
        }

        const track = state.currentTrack;
        if (track) {
            const coverEl = document.getElementById('radio-np-cover');
            const vinylCover = document.getElementById('radio-vinyl-cover');
            const vinylBackdrop = document.getElementById('radio-vinyl-backdrop');
            const typeEl = document.getElementById('radio-np-type');
            const yearEl = document.getElementById('radio-np-year');
            const songEl = document.getElementById('radio-np-song');
            const artistEl = document.getElementById('radio-np-artist');
            const animeEl = document.getElementById('radio-np-anime');
            const linkBtn = document.getElementById('radio-anime-link-btn');
            const sourceBadge = document.getElementById('radio-source-badge');
            const qualityBadge = document.getElementById('radio-quality-badge');

            if (coverEl && track.cover) coverEl.src = track.cover;
            if (vinylCover && track.cover) vinylCover.src = track.cover;
            if (vinylBackdrop && (track.banner || track.cover)) {
                vinylBackdrop.style.backgroundImage = `url('${track.banner || track.cover}')`;
            }
            if (typeEl) {
                typeEl.textContent = track.themeSlug || track.themeType || 'OP';
                typeEl.className = `np-theme-pill type-${(track.themeType || 'OP').toLowerCase()}`;
            }
            if (yearEl) {
                yearEl.textContent = track.animeYear ? `${track.animeYear}` : (track.nc ? 'CREDITLESS' : 'ORIGINAL');
            }
            if (songEl) songEl.textContent = track.songTitle || 'Anime Theme';
            if (artistEl) artistEl.textContent = `🎤 ${track.artist || 'Artista Original'}`;
            if (animeEl) animeEl.textContent = `📺 ${track.animeTitle || 'Anime'}`;
            if (linkBtn) {
                linkBtn.style.display = track.animeId ? 'inline-flex' : 'none';
            }
            if (sourceBadge) {
                sourceBadge.textContent = track.sourceType === 'animethemes' ? 'ANIMETHEMES DIRECT' : 'YOUTUBE FALLBACK';
            }
            if (qualityBadge) {
                qualityBadge.textContent = `${track.resolution || 720}p${track.nc ? ' • NC' : ''}`;
            }
        }

        const vinylDisc = document.getElementById('radio-vinyl-disc');
        const eqBars = document.getElementById('radio-eq-bars');
        if (vinylDisc) vinylDisc.classList.toggle('spinning', state.isPlaying);
        if (eqBars) eqBars.classList.toggle('playing', state.isPlaying);

        const playBtn = document.getElementById('radio-btn-play');
        if (playBtn) {
            playBtn.innerHTML = state.isLoading
                ? '<i class="fas fa-circle-notch fa-spin"></i>'
                : (state.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>');
        }

        document.getElementById('radio-btn-shuffle')?.classList.toggle('active', state.shuffle);
        const repBtn = document.getElementById('radio-btn-repeat');
        if (repBtn) {
            repBtn.classList.toggle('active', state.repeat !== 'off');
            repBtn.innerHTML = state.repeat === 'one'
                ? '<i class="fas fa-redo"></i><small>1</small>'
                : '<i class="fas fa-redo"></i>';
        }

        const volSlider = document.getElementById('radio-volume-slider');
        if (volSlider && Number(volSlider.value) !== state.volume) {
            volSlider.value = state.volume;
        }
    },

    updateSeekUI(detail) {
        if (!detail) return;
        const fill = document.getElementById('radio-seek-fill');
        const cur = document.getElementById('radio-time-current');
        const tot = document.getElementById('radio-time-total');

        if (fill) fill.style.width = `${Math.min(100, detail.percent || 0)}%`;
        if (cur) cur.textContent = OSTPlayer.formatTime(detail.currentTime);
        if (tot) tot.textContent = OSTPlayer.formatTime(detail.duration);
    },

    renderQueue() {
        const listEl = document.getElementById('radio-queue-list');
        const countEl = document.getElementById('radio-queue-count');
        if (!listEl || typeof OSTPlayer === 'undefined') return;

        const queue = OSTPlayer.queue || [];
        const currentIdx = OSTPlayer.currentIndex;
        if (countEl) countEl.textContent = queue.length;

        if (queue.length === 0) {
            listEl.innerHTML = `
                <div class="radio-empty-state">
                    <p>Fila vazia. Selecione uma estação acima para carregar faixas.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = queue.map((track, idx) => {
            const isCurrent = idx === currentIdx;
            return `
                <div class="radio-track-item ${isCurrent ? 'active-track' : ''}">
                    <img src="${track.cover}" alt="${this.escapeHtml(track.animeTitle)}" class="track-item-cover">
                    <div class="track-item-info" onclick="OSTPlayer.playQueueAt(${idx})">
                        <div class="track-item-title-row">
                            <span class="track-badge type-${(track.themeType || 'OP').toLowerCase()}">${track.themeSlug || track.themeType}</span>
                            <span class="track-item-song">${this.escapeHtml(track.songTitle)}</span>
                        </div>
                        <div class="track-item-sub">${this.escapeHtml(track.animeTitle)} • ${this.escapeHtml(track.artist)}</div>
                    </div>
                    <div class="track-item-actions">
                        ${isCurrent ? `<span class="now-playing-pill"><i class="fas fa-volume-up"></i></span>` : `
                            <button class="track-action-btn" onclick="OSTPlayer.playQueueAt(${idx})" title="Tocar">
                                <i class="fas fa-play"></i>
                            </button>
                        `}
                        <button class="track-action-btn track-remove-btn" onclick="OSTPlayer.removeFromQueue(${idx})" title="Remover da Fila">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderHistory() {
        const listEl = document.getElementById('radio-history-list');
        if (!listEl || typeof OSTPlayer === 'undefined') return;

        const history = OSTPlayer.history || [];
        if (history.length === 0) {
            listEl.innerHTML = `
                <div class="radio-empty-state">
                    <p>Nenhuma faixa reproduzida anteriormente nesta sessão.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = history.map((track, idx) => `
            <div class="radio-track-item">
                <img src="${track.cover}" alt="${this.escapeHtml(track.animeTitle)}" class="track-item-cover">
                <div class="track-item-info" onclick="RadioPage.replayHistoryItem(${idx})">
                    <div class="track-item-title-row">
                        <span class="track-badge type-${(track.themeType || 'OP').toLowerCase()}">${track.themeSlug || track.themeType}</span>
                        <span class="track-item-song">${this.escapeHtml(track.songTitle)}</span>
                    </div>
                    <div class="track-item-sub">${this.escapeHtml(track.animeTitle)} • ${this.escapeHtml(track.artist)}</div>
                </div>
                <div class="track-item-actions">
                    <button class="track-action-btn" onclick="RadioPage.replayHistoryItem(${idx})" title="Tocar Novamente">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    async replayHistoryItem(idx) {
        const track = OSTPlayer.history?.[idx];
        if (!track) return;
        await OSTPlayer.playTrack(track, true);
    },

    openCurrentAnimeDetails() {
        const animeId = OSTPlayer.currentTrack?.animeId;
        if (!animeId) return;
        if (typeof Common !== 'undefined' && Common.navigate) {
            Common.navigate(`?page=detalhes&id=${animeId}`);
        } else if (typeof SpaRouter !== 'undefined') {
            SpaRouter.navigateTo(`?page=detalhes&id=${animeId}`);
        }
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
};

window.RadioPage = RadioPage;
if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        RadioPage.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => RadioPage.init());
    }
}
