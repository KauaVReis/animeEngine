/**
 * AnimeEngine v8 — RadioPage Controller & RadioRooms Multiplayer Engine
 * 
 * Funcionalidades:
 *  1. Modo Estações Solos: Sincronia contínua com OSTPlayer, 11 FMs temáticas,
 *     modo Clipe / Vitrola e Ambiência de Temas.
 *  2. Modo Salas Coletivas (Radio Rooms): Lobby de salas públicas e privadas,
 *     palco sincronizado por ETag 304 com algoritmo Soft-Sync (3 Zonas de Drift),
 *     chat ao vivo com reações flutuantes na tela, fila comunitária com votação
 *     e controles de DJ anfitrião.
 */

const RadioPage = {
    activeTab: 'queue',
    displayMode: 'video', // 'video' | 'visualizer'
    currentRadioMode: 'solo', // 'solo' | 'rooms'
    ambientSync: true,
    savedUserTheme: 'default',
    searchResults: [],
    boundStateHandler: null,
    boundQueueHandler: null,
    boundTimeHandler: null,
    boundBeforeNavigateHandler: null,

    async init() {
        console.log('📻 Initializing RadioPage (Thematic Stations & Radio Rooms)...');
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

        // Inicializar motor de Salas Coletivas
        if (typeof RadioRooms !== 'undefined') {
            RadioRooms.init();
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
                if (typeof RadioRooms !== 'undefined' && RadioRooms.activeRoomUuid) {
                    RadioRooms.leaveCurrentRoom(false);
                }
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
     * Alterna entre o Modo Solo (11 Estações FMs) e o Modo Salas Coletivas (Multiplayer Rooms)
     */
    switchRadioMode(mode) {
        this.currentRadioMode = mode;
        const btnSolo = document.getElementById('btn-mode-solo');
        const btnRooms = document.getElementById('btn-mode-rooms');
        const soloSec = document.getElementById('radio-mode-solo-section');
        const roomsSec = document.getElementById('radio-mode-rooms-section');

        if (mode === 'solo') {
            btnSolo?.classList.add('active');
            btnSolo?.setAttribute('aria-selected', 'true');
            btnRooms?.classList.remove('active');
            btnRooms?.setAttribute('aria-selected', 'false');

            if (soloSec) soloSec.style.display = 'block';
            if (roomsSec) roomsSec.style.display = 'none';

            // Redock do palco no monitor solo
            const soloMount = document.getElementById('radio-video-mount');
            if (soloMount && typeof OSTPlayer !== 'undefined') {
                OSTPlayer.dockStageTo(soloMount);
            }
        } else {
            btnRooms?.classList.add('active');
            btnRooms?.setAttribute('aria-selected', 'true');
            btnSolo?.classList.remove('active');
            btnSolo?.setAttribute('aria-selected', 'false');

            if (soloSec) soloSec.style.display = 'none';
            if (roomsSec) roomsSec.style.display = 'block';

            if (typeof RadioRooms !== 'undefined') {
                if (RadioRooms.activeRoomUuid) {
                    const roomMount = document.getElementById('room-video-mount');
                    if (roomMount && typeof OSTPlayer !== 'undefined') {
                        OSTPlayer.dockStageTo(roomMount);
                    }
                } else {
                    RadioRooms.loadRooms();
                }
            }
        }
    },

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
            btn.style.display = matches ? 'flex' : 'none';
        });
    },

    selectStation(stationId) {
        document.querySelectorAll('.station-btn').forEach(btn => {
            const isMatch = btn.dataset.station === stationId;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-checked', String(isMatch));
        });
        this.applyStationAmbiance(stationId);
        if (typeof OSTPlayer !== 'undefined') {
            OSTPlayer.setStation(stationId);
        }
    },

    setTypeFilter(type) {
        document.querySelectorAll('.type-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        if (typeof OSTPlayer !== 'undefined') {
            OSTPlayer.typeFilter = type;
            this.refreshStation();
        }
    },

    async refreshStation() {
        const stationId = OSTPlayer?.currentStation || 'random';
        const loadingEl = document.getElementById('radio-loading-overlay');
        if (loadingEl) loadingEl.style.display = 'flex';

        try {
            if (typeof MusicService !== 'undefined') {
                const tracks = await MusicService.getStationTracks(stationId, {
                    typeFilter: OSTPlayer.typeFilter || 'ALL',
                    count: 15,
                    forceRefresh: true
                });
                if (tracks && tracks.length > 0) {
                    OSTPlayer.setQueue(tracks, 0, true);
                }
            }
        } catch (err) {
            console.error('Erro ao sortear nova sintonia da estação:', err);
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    },

    async populateInitialStation() {
        const stationId = OSTPlayer?.currentStation || 'random';
        try {
            if (typeof MusicService !== 'undefined') {
                const tracks = await MusicService.getStationTracks(stationId, {
                    typeFilter: OSTPlayer.typeFilter || 'ALL',
                    count: 12
                });
                if (tracks && tracks.length > 0 && (!OSTPlayer.queue || OSTPlayer.queue.length === 0)) {
                    OSTPlayer.setQueue(tracks, 0, false);
                }
            }
        } catch (err) {
            console.warn('Falha silenciosa ao popular rádio inicial:', err);
        }
    },

    setDisplayMode(mode) {
        this.displayMode = mode;
        const videoBtn = document.getElementById('btn-mode-video');
        const vinylBtn = document.getElementById('btn-mode-vinyl');
        const vinylStage = document.getElementById('radio-vinyl-stage');
        const videoMount = document.getElementById('radio-video-mount');

        if (mode === 'visualizer') {
            vinylBtn?.classList.add('active');
            videoBtn?.classList.remove('active');
            if (vinylStage) vinylStage.style.display = 'flex';
            if (videoMount) videoMount.style.opacity = '0';
        } else {
            videoBtn?.classList.add('active');
            vinylBtn?.classList.remove('active');
            if (vinylStage) vinylStage.style.display = 'none';
            if (videoMount) videoMount.style.opacity = '1';
        }
    },

    toggleFullscreenStage() {
        const stage = document.getElementById('radio-stage-screen') || document.getElementById('room-stage-screen');
        if (!stage) return;
        if (!document.fullscreenElement) {
            stage.requestFullscreen?.().catch(err => console.warn('Erro ao entrar em fullscreen:', err));
        } else {
            document.exitFullscreen?.();
        }
    },

    syncFromPlayerState(state) {
        if (!state) return;

        const songEl = document.getElementById('radio-np-song');
        const artistEl = document.getElementById('radio-np-artist');
        const animeEl = document.getElementById('radio-np-anime');
        const coverEl = document.getElementById('radio-np-cover');
        const vinylCoverEl = document.getElementById('radio-vinyl-cover');
        const typeEl = document.getElementById('radio-np-type');
        const yearEl = document.getElementById('radio-np-year');
        const animeBtn = document.getElementById('radio-anime-link-btn');
        const playBtn = document.getElementById('radio-btn-play');
        const vinylDisc = document.getElementById('radio-vinyl-disc');
        const eqBars = document.getElementById('radio-eq-bars');
        const loadingEl = document.getElementById('radio-loading-overlay');

        if (loadingEl) {
            loadingEl.style.display = state.isLoading ? 'flex' : 'none';
        }

        if (state.currentTrack) {
            const track = state.currentTrack;
            if (songEl) songEl.textContent = track.songTitle || 'Sem Título';
            if (artistEl) artistEl.textContent = track.artist || 'Artista Desconhecido';
            if (animeEl) animeEl.textContent = track.animeTitle || 'Catálogo AnimeThemes';
            if (coverEl) coverEl.src = track.cover || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png';
            if (vinylCoverEl) vinylCoverEl.src = track.cover || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png';

            if (typeEl) {
                typeEl.textContent = track.themeSlug || track.themeType || 'OST';
                typeEl.className = `np-theme-pill type-${(track.themeType || 'OP').toLowerCase()}`;
            }

            if (yearEl) {
                yearEl.textContent = track.year ? String(track.year) : (track.episodes ? `${track.episodes} EPS` : 'ANIME');
            }

            if (animeBtn) {
                animeBtn.style.display = track.animeId ? 'inline-flex' : 'none';
            }
        }

        if (playBtn) {
            playBtn.innerHTML = state.isPlaying
                ? '<i class="fas fa-pause"></i>'
                : '<i class="fas fa-play"></i>';
            playBtn.title = state.isPlaying ? 'Pausar' : 'Reproduzir';
        }

        if (vinylDisc) {
            vinylDisc.classList.toggle('spinning', !!state.isPlaying);
        }
        if (eqBars) {
            eqBars.classList.toggle('animating', !!state.isPlaying);
        }

        const shuffleBtn = document.getElementById('radio-btn-shuffle');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', !!state.shuffle);
        }

        const repeatBtn = document.getElementById('radio-btn-repeat');
        if (repeatBtn) {
            repeatBtn.classList.toggle('active', state.repeat !== 'off');
            repeatBtn.innerHTML = state.repeat === 'one'
                ? '<i class="fas fa-redo-alt"></i><span class="repeat-one-badge">1</span>'
                : '<i class="fas fa-redo"></i>';
        }

        const muteBtn = document.getElementById('radio-btn-mute');
        if (muteBtn) {
            muteBtn.innerHTML = state.isMuted || state.volume === 0
                ? '<i class="fas fa-volume-mute"></i>'
                : '<i class="fas fa-volume-up"></i>';
        }

        const volSlider = document.getElementById('radio-volume-slider');
        if (volSlider && document.activeElement !== volSlider) {
            volSlider.value = state.isMuted ? 0 : state.volume;
        }

        if (state.currentStation) {
            document.querySelectorAll('.station-btn').forEach(btn => {
                const isMatch = btn.dataset.station === state.currentStation;
                btn.classList.toggle('active', isMatch);
                btn.setAttribute('aria-checked', String(isMatch));
            });
        }
    },

    updateSeekUI(detail) {
        if (!detail) return;
        const currentEl = document.getElementById('radio-time-current');
        const totalEl = document.getElementById('radio-time-total');
        const fillEl = document.getElementById('radio-seek-fill');

        if (currentEl) currentEl.textContent = this.formatTime(detail.currentTime || 0);
        if (totalEl) totalEl.textContent = this.formatTime(detail.duration || 0);

        if (fillEl && detail.duration > 0) {
            const pct = Math.min(100, Math.max(0, (detail.currentTime / detail.duration) * 100));
            fillEl.style.width = `${pct}%`;
        }
    },

    formatTime(sec) {
        const totalSec = Math.floor(sec || 0);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.radio-tabs-header .radio-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.radio-sidebar-column .radio-tab-content').forEach(content => {
            content.style.display = content.id === `radio-tab-${tab}` ? 'block' : 'none';
        });

        if (tab === 'queue') this.renderQueue();
        if (tab === 'history') this.renderHistory();
    },

    renderQueue() {
        const listEl = document.getElementById('radio-queue-list');
        const countEl = document.getElementById('radio-queue-count');
        if (!listEl || typeof OSTPlayer === 'undefined') return;

        const queue = OSTPlayer.queue || [];
        const currentIndex = OSTPlayer.currentIndex;
        if (countEl) countEl.textContent = queue.length;

        if (queue.length === 0) {
            listEl.innerHTML = `
                <div class="radio-empty-state">
                    <i class="fas fa-compact-disc"></i>
                    <p>Fila vazia. Escolha uma estação acima ou busque no catálogo.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = queue.map((track, idx) => {
            const isPlaying = idx === currentIndex;
            return `
                <div class="radio-track-item ${isPlaying ? 'is-playing' : ''}" data-idx="${idx}">
                    <div class="track-item-idx">${isPlaying ? '<i class="fas fa-volume-up play-wave"></i>' : (idx + 1)}</div>
                    <img src="${track.cover}" alt="${this.escapeHtml(track.animeTitle)}" class="track-item-cover" loading="lazy">
                    <div class="track-item-info" onclick="RadioPage.playQueueItem(${idx})">
                        <div class="track-item-title-row">
                            <span class="track-badge type-${(track.themeType || 'OP').toLowerCase()}">${track.themeSlug || track.themeType}</span>
                            <span class="track-item-song">${this.escapeHtml(track.songTitle)}</span>
                        </div>
                        <div class="track-item-sub">${this.escapeHtml(track.animeTitle)} • ${this.escapeHtml(track.artist)}</div>
                    </div>
                    <div class="track-item-actions">
                        <button class="track-action-btn" onclick="RadioPage.removeFromQueue(${idx})" title="Remover da fila">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    playQueueItem(idx) {
        if (typeof OSTPlayer !== 'undefined') {
            OSTPlayer.playIndex(idx);
        }
    },

    removeFromQueue(idx) {
        if (typeof OSTPlayer !== 'undefined') {
            OSTPlayer.removeQueueItem(idx);
        }
    },

    async loadMoreToQueue() {
        await this.refreshStation();
    },

    async performSearch() {
        const input = document.getElementById('radio-search-input');
        const q = input?.value.trim();
        if (!q) return;

        const resultsEl = document.getElementById('radio-search-results');
        if (resultsEl) {
            resultsEl.innerHTML = '<div class="carousel-loading"><div class="loader"></div><p>Buscando no AnimeThemes...</p></div>';
        }

        try {
            if (typeof MusicService !== 'undefined' && MusicService.search) {
                const tracks = await MusicService.search(q);
                this.searchResults = tracks || [];
                this.renderSearchResults();
            }
        } catch (err) {
            if (resultsEl) {
                resultsEl.innerHTML = `<div class="radio-empty-state"><p>Erro ao pesquisar: ${this.escapeHtml(err.message)}</p></div>`;
            }
        }
    },

    renderSearchResults() {
        const resultsEl = document.getElementById('radio-search-results');
        if (!resultsEl) return;

        if (!this.searchResults || this.searchResults.length === 0) {
            resultsEl.innerHTML = `
                <div class="radio-empty-state">
                    <i class="fas fa-search"></i>
                    <p>Nenhuma música encontrada para sua busca.</p>
                </div>
            `;
            return;
        }

        resultsEl.innerHTML = this.searchResults.map((track, idx) => `
            <div class="radio-track-item">
                <img src="${track.cover}" alt="${this.escapeHtml(track.animeTitle)}" class="track-item-cover" loading="lazy">
                <div class="track-item-info">
                    <div class="track-item-title-row">
                        <span class="track-badge type-${(track.themeType || 'OP').toLowerCase()}">${track.themeSlug || track.themeType}</span>
                        <span class="track-item-song">${this.escapeHtml(track.songTitle)}</span>
                    </div>
                    <div class="track-item-sub">${this.escapeHtml(track.animeTitle)} • ${this.escapeHtml(track.artist)}</div>
                </div>
                <div class="track-item-actions">
                    <button class="btn-neo-brand btn-sm" onclick="RadioPage.addSearchResultToQueue(${idx})" title="Adicionar à fila">
                        <i class="fas fa-plus"></i> Fila
                    </button>
                </div>
            </div>
        `).join('');
    },

    addSearchResultToQueue(idx) {
        const track = this.searchResults?.[idx];
        if (!track || typeof OSTPlayer === 'undefined') return;
        OSTPlayer.queue.push(track);
        OSTPlayer.saveState();
        OSTPlayer.emit('ost:queueChange', { queue: OSTPlayer.queue });
        this.switchTab('queue');
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

    restoreUserTheme() {
        const saved = this.savedUserTheme || localStorage.getItem('animeengine_theme') || 'default';
        document.documentElement.setAttribute('data-theme', saved);
        if (typeof Particles !== 'undefined' && Particles.enabled) {
            Particles.setTheme(saved);
        }
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
};

/**
 * =========================================================================
 * MOTOR DE SALAS COLETIVAS (RADIO ROOMS CLIENT ENGINE)
 * =========================================================================
 * - Sincronização Server Authority via ETag / HTTP 304 Not Modified
 * - Algoritmo Soft-Sync (Zona 1: Jitter mudo, Zona 2: Nudge playbackRate, Zona 3: Hard Seek)
 * - Chat em tempo real com reações visuais de partículas flutuantes
 * - Fila colaborativa e controles de DJ Anfitrião
 */
const RadioRooms = {
    currentCategory: 'all',
    searchQuery: '',
    roomsList: [],
    activeRoomUuid: null,
    activeRoomData: null,
    isHost: false,
    lastEtag: null,
    syncTimer: null,
    syncInProgress: false,
    lastChatId: 0,
    chatTimer: null,
    chatInProgress: false,
    activeTab: 'chat', // 'chat' | 'queue' | 'listeners'
    displayMode: 'video',
    searchQueueResults: [],

    init() {
        console.log('📻 [RadioRooms] Initializing Radio Rooms Engine...');
        const params = new URLSearchParams(window.location.search);
        const roomUuid = params.get('room');
        if (roomUuid) {
            RadioPage.switchRadioMode('rooms');
            this.enterRoom(roomUuid);
        }
    },

    // -------------------------------------------------------------------------
    // 1. LOBBY DE SALAS
    // -------------------------------------------------------------------------
    async loadRooms(forceRefresh = false) {
        const grid = document.getElementById('radio-rooms-cards-grid');
        const refreshIcon = document.getElementById('rooms-refresh-icon');
        if (refreshIcon) refreshIcon.classList.add('fa-spin');

        if (grid && (!this.roomsList || this.roomsList.length === 0 || forceRefresh)) {
            grid.innerHTML = '<div class="carousel-loading"><div class="loader"></div><p>Sintonizando salas ativas...</p></div>';
        }

        try {
            const res = await fetch('api/radio/list_rooms.php?status=ativa');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.roomsList = data.salas || [];
            this.renderRoomsGrid();
        } catch (err) {
            console.error('Falha ao carregar salas:', err);
            if (grid) {
                grid.innerHTML = `
                    <div class="radio-empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Não foi possível carregar as salas no momento. Tente novamente.</p>
                        <button class="btn-neo-secondary btn-sm" onclick="RadioRooms.loadRooms(true)">Tentar Novamente</button>
                    </div>
                `;
            }
        } finally {
            if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        }
    },

    renderRoomsGrid() {
        const grid = document.getElementById('radio-rooms-cards-grid');
        if (!grid) return;

        let filtered = this.roomsList.filter(room => {
            const matchCat = this.currentCategory === 'all' || room.tema_visual === this.currentCategory;
            const q = this.searchQuery.toLowerCase();
            const hostUsername = (room.host?.username || room.host_nome || '').toLowerCase();
            const trackSong = (room.musica_atual?.musica_titulo || room.tocando_agora?.musica_titulo || '').toLowerCase();
            const matchQuery = !q ||
                room.nome.toLowerCase().includes(q) ||
                (room.descricao && room.descricao.toLowerCase().includes(q)) ||
                hostUsername.includes(q) ||
                trackSong.includes(q);
            return matchCat && matchQuery;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="radio-empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-broadcast-tower"></i>
                    <p>Nenhuma sala encontrada com os filtros atuais.</p>
                    <button type="button" class="btn-neo-brand" onclick="RadioRooms.openCreateModal()">
                        <i class="fas fa-plus"></i> Seja o primeiro a criar uma sala!
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(room => {
            const isPrivate = room.tipo === 'privada';
            const djName = room.host?.username || room.host_nome || 'Anônimo';
            const djAvatar = room.host?.avatar || room.host_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(djName)}`;
            const djTitle = room.host?.titulo || room.host_titulo_ativo || 'DJ Iniciante';
            const track = room.musica_atual || room.tocando_agora;

            return `
                <div class="room-card-neo" data-theme="${this.escapeHtml(room.tema_visual)}">
                    <div class="room-card-top">
                        <div class="room-card-badges">
                            <span class="room-card-live-chip"><span class="live-dot"></span> AO VIVO</span>
                            <span class="room-card-theme-chip">${this.escapeHtml(room.tema_visual)}</span>
                            ${isPrivate ? '<span class="room-card-theme-chip" style="background:#4b5563;"><i class="fas fa-lock"></i> PRIVADA</span>' : ''}
                        </div>
                        <span class="room-card-listeners-chip" title="${room.ouvintes_count} ouvintes sintonizados">
                            <i class="fas fa-headphones"></i> ${room.ouvintes_count}
                        </span>
                    </div>

                    <div class="room-card-body">
                        <h3 class="room-card-title">${this.escapeHtml(room.nome)}</h3>
                        <p class="room-card-desc">${this.escapeHtml(room.descricao || 'Curadoria livre de músicas de anime com áudio sintonizado.')}</p>

                        <div class="room-card-dj-row">
                            <img src="${djAvatar}" alt="Host" class="room-card-dj-avatar">
                            <div class="room-card-dj-info">
                                <span class="room-card-dj-name">👑 @${this.escapeHtml(djName)}</span>
                                <span style="font-size:0.68rem; color:var(--color-primary);">${this.escapeHtml(djTitle)}</span>
                            </div>
                        </div>

                        ${track ? `
                            <div class="room-card-track-preview">
                                <img src="${track.capa_url || track.cover_url || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png'}" alt="Capa" class="room-card-track-cover">
                                <div class="room-card-track-info">
                                    <span class="room-card-track-song">${this.escapeHtml(track.musica_titulo)}</span>
                                    <span class="room-card-track-anime">${this.escapeHtml(track.anime_titulo)} • ${this.escapeHtml(track.tipo_tema || track.tema_tipo || 'OP')}</span>
                                </div>
                            </div>
                        ` : `
                            <div class="room-card-track-preview">
                                <div class="room-card-track-info">
                                    <span class="room-card-track-song">Fila em pausa</span>
                                    <span class="room-card-track-anime">Aguardando o DJ iniciar uma faixa</span>
                                </div>
                            </div>
                        `}
                    </div>

                    <div class="room-card-footer">
                        <button type="button" class="btn-neo-brand btn-enter-room" onclick="RadioRooms.enterRoom('${room.uuid}')">
                            <i class="fas fa-headphones"></i> Sintonizar nesta Sala
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    filterRooms(query) {
        this.searchQuery = query || '';
        this.renderRoomsGrid();
    },

    setCategoryFilter(cat) {
        this.currentCategory = cat;
        document.querySelectorAll('.rooms-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.cat === cat);
        });
        this.renderRoomsGrid();
    },

    // -------------------------------------------------------------------------
    // 2. MODAL DE CRIAÇÃO E ENTRADA
    // -------------------------------------------------------------------------
    openCreateModal() {
        const modal = document.getElementById('modal-create-room');
        if (modal) modal.style.display = 'flex';
    },

    closeCreateModal() {
        const modal = document.getElementById('modal-create-room');
        if (modal) modal.style.display = 'none';
    },

    togglePasswordInput(tipo) {
        const group = document.getElementById('group-room-password');
        if (group) group.style.display = tipo === 'privada' ? 'block' : 'none';
    },

    async submitCreateRoom() {
        const nome = document.getElementById('create-room-nome')?.value.trim();
        const desc = document.getElementById('create-room-desc')?.value.trim();
        const theme = document.getElementById('create-room-theme')?.value || 'shonen';
        const tipo = document.getElementById('create-room-tipo')?.value || 'publica';
        const pass = document.getElementById('create-room-pass')?.value.trim();
        const btn = document.getElementById('btn-submit-create-room');

        if (!nome) return;
        if (btn) btn.disabled = true;

        try {
            const payload = {
                nome: nome,
                descricao: desc,
                tema_visual: theme,
                tipo: tipo,
                senha: pass || null,
                max_ouvintes: 50
            };

            const res = await fetch('api/radio/create_room.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(`Erro ao criar sala: ${data.message || 'Tente novamente.'}`);
                return;
            }

            this.closeCreateModal();
            // Entra imediatamente na sala criada
            await this.enterRoom(data.uuid);
        } catch (err) {
            console.error('Falha na criação de sala:', err);
            alert('Erro de conexão ao criar a sala.');
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    promptEnterByCode() {
        const code = prompt('Digite o código ou UUID da sala para entrar:');
        if (code && code.trim()) {
            this.enterRoom(code.trim());
        }
    },

    // -------------------------------------------------------------------------
    // 3. ENTRADA NA SALA E SINCRONIZAÇÃO EM TEMPO REAL
    // -------------------------------------------------------------------------
    async enterRoom(uuid, senha = null) {
        console.log(`📻 [RadioRooms] Entering room ${uuid}...`);
        const overlay = document.getElementById('room-loading-overlay');
        if (overlay) overlay.style.display = 'flex';

        try {
            const url = `api/radio/sync.php?uuid=${encodeURIComponent(uuid)}${senha ? '&senha=' + encodeURIComponent(senha) : ''}`;
            const res = await fetch(url);

            if (res.status === 403) {
                const data = await res.json();
                if (data.requires_password) {
                    const passInput = prompt('🔒 Esta sala é privada. Digite a senha para entrar:');
                    if (passInput) {
                        return this.enterRoom(uuid, passInput);
                    }
                } else {
                    alert('Acesso negado: ' + (data.message || 'Senha incorreta.'));
                }
                return;
            }

            if (!res.ok) {
                alert('A sala não existe ou já foi encerrada.');
                return;
            }

            this.lastEtag = res.headers.get('ETag');
            const data = await res.json();

            this.activeRoomUuid = uuid;
            this.activeRoomData = data;
            this.isHost = (data.user_role === 'host') || !!data.sala?.is_host;
            this.lastChatId = 0;

            // Transição de tela: Oculta lobby e exibe palco da sala
            const lobbyView = document.getElementById('radio-rooms-lobby-view');
            const stageView = document.getElementById('radio-room-active-stage');
            if (lobbyView) lobbyView.style.display = 'none';
            if (stageView) stageView.style.display = 'block';

            // Acoplar o palco de vídeo único do OSTPlayer no monitor da sala
            const mount = document.getElementById('room-video-mount');
            if (mount && typeof OSTPlayer !== 'undefined') {
                OSTPlayer.dockStageTo(mount);
            }

            // Aplicar dados iniciais
            this.applyRoomSync(data);

            // Iniciar loops de Smart Polling (Sync e Chat)
            this.startSyncLoop();
            this.startChatLoop();
        } catch (err) {
            console.error('Falha ao entrar na sala:', err);
            alert('Erro de conexão ao entrar na sala.');
        } finally {
            if (overlay) overlay.style.display = 'none';
        }
    },

    leaveCurrentRoom(restoreSolo = true) {
        this.stopSyncLoop();
        this.stopChatLoop();
        this.activeRoomUuid = null;
        this.activeRoomData = null;
        this.lastEtag = null;
        this.lastChatId = 0;

        const lobbyView = document.getElementById('radio-rooms-lobby-view');
        const stageView = document.getElementById('radio-room-active-stage');
        if (stageView) stageView.style.display = 'none';
        if (lobbyView) lobbyView.style.display = 'block';

        if (restoreSolo) {
            RadioPage.switchRadioMode('solo');
        }
    },

    startSyncLoop() {
        this.stopSyncLoop();
        const poll = async () => {
            if (!this.activeRoomUuid || this.syncInProgress) return;
            this.syncInProgress = true;
            try {
                const headers = {};
                if (this.lastEtag) {
                    headers['If-None-Match'] = this.lastEtag;
                }

                const res = await fetch(`api/radio/sync.php?uuid=${this.activeRoomUuid}`, { headers });

                // HTTP 304: Nada mudou! O servidor respondeu em <3ms sem queries de chat/fila
                if (res.status === 304) {
                    this.updateSyncBadge('synced');
                    this.syncInProgress = false;
                    return;
                }

                if (res.status === 200) {
                    this.lastEtag = res.headers.get('ETag');
                    const data = await res.json();
                    this.activeRoomData = data;
                    this.applyRoomSync(data);
                    this.updateSyncBadge('synced');
                } else if (res.status === 404) {
                    alert('A sala foi encerrada pelo anfitrião.');
                    this.leaveCurrentRoom(false);
                    this.loadRooms(true);
                }
            } catch (err) {
                console.warn('[RadioRooms] Erro transitório de sync:', err);
                this.updateSyncBadge('error');
            } finally {
                this.syncInProgress = false;
            }
        };

        const interval = document.hidden ? 6000 : 2500;
        this.syncTimer = setInterval(poll, interval);
    },

    stopSyncLoop() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    },

    updateSyncBadge(status) {
        const pill = document.getElementById('room-active-sync-pill');
        if (!pill) return;
        if (status === 'synced') {
            pill.innerHTML = '<i class="fas fa-check-circle"></i> SYNC 304';
            pill.style.color = '#10b981';
            pill.style.borderColor = '#10b981';
        } else {
            pill.innerHTML = '<i class="fas fa-exclamation-circle"></i> RECONECTANDO';
            pill.style.color = '#f59e0b';
            pill.style.borderColor = '#f59e0b';
        }
    },

    /**
     * Aplica o estado sincronizado do servidor à interface e ao OSTPlayer
     */
    applyRoomSync(data) {
        if (!data || !data.sala) return;
        const sala = data.sala;
        this.isHost = (data.user_role === 'host') || !!sala.is_host;

        // Cabeçalho da sala
        const titleEl = document.getElementById('room-active-title');
        const descEl = document.getElementById('room-active-desc');
        const themePill = document.getElementById('room-active-theme-pill');
        const hostNameEl = document.getElementById('room-host-name');
        const hostAvatarEl = document.getElementById('room-host-avatar');
        const hostControls = document.getElementById('room-host-controls');
        const listenerControls = document.getElementById('room-listener-controls');
        const closeBtn = document.getElementById('room-btn-close');
        const listenerCounter = document.getElementById('room-listener-counter');

        const hostMember = (data.membros || []).find(m => m.role === 'host');
        const hostName = hostMember?.username || sala.host_nome || 'Anfitrião';
        const hostAvatar = hostMember?.avatar || sala.host_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(hostName)}`;
        const hostTitle = hostMember?.titulo || sala.host_titulo_ativo || 'DJ Oficial';

        if (titleEl) titleEl.textContent = sala.nome;
        if (descEl) descEl.textContent = sala.descricao || 'Audição sincronizada em alta qualidade.';
        if (themePill) themePill.textContent = sala.tema_visual;
        if (hostNameEl) hostNameEl.textContent = `@${hostName} (${hostTitle})`;
        if (hostAvatarEl) hostAvatarEl.src = hostAvatar;
        if (listenerCounter) listenerCounter.innerHTML = `<i class="fas fa-headphones"></i> ${data.membros ? data.membros.length : 1} Ouvinte(s)`;

        // Alterna controles Host vs Ouvinte
        if (hostControls) hostControls.style.display = this.isHost ? 'flex' : 'none';
        if (listenerControls) listenerControls.style.display = this.isHost ? 'none' : 'flex';
        if (closeBtn) closeBtn.style.display = this.isHost ? 'inline-flex' : 'none';

        // Playback & Soft-Sync
        const track = data.tocando_agora;
        if (track) {
            const elapsed = track.tempo_decorrido ?? track.current_seek_sec ?? 0;
            this.applySoftSyncAudio(track, elapsed, !!sala.is_paused);
        } else {
            // Sem faixa tocando
            if (typeof OSTPlayer !== 'undefined' && OSTPlayer.isPlaying) {
                OSTPlayer.pause();
            }
            this.updateNowPlayingUI(null);
        }

        // Fila e Membros
        this.renderRoomQueue(data.fila || []);
        this.renderRoomListeners(data.membros || []);
    },

    /**
     * Algoritmo Soft-Sync de 3 Zonas
     * Zona 1 (Drift < 1.5s): Tolerância de jitter silencioso
     * Zona 2 (1.5s <= Drift < 5s): Ajuste suave de playbackRate (1.05x ou 0.95x)
     * Zona 3 (Drift >= 5s): Hard seek corretivo
     */
    applySoftSyncAudio(track, serverElapsedSec, isPaused) {
        if (typeof OSTPlayer === 'undefined') return;

        const currentTrack = OSTPlayer.currentTrack;
        const isDifferentTrack = !currentTrack || currentTrack.audioUrl !== track.audio_url;

        // Se mudou a faixa, carrega imediatamente
        if (isDifferentTrack) {
            console.log('📻 [RadioRooms] Track change detected ->', track.musica_titulo);
            const formattedTrack = {
                id: track.id || track.musica_id,
                songTitle: track.musica_titulo,
                animeTitle: track.anime_titulo,
                artist: track.artista || 'Desconhecido',
                cover: track.capa_url || track.cover_url,
                audioUrl: track.audio_url,
                videoUrl: track.video_url || track.audio_url,
                themeType: track.tipo_tema || track.tema_tipo || 'OP',
                themeSlug: (track.tipo_tema || track.tema_tipo || 'OP') + (track.tema_numero || 1),
                duration: track.duracao_segundos || 90
            };

            OSTPlayer.playTrack(formattedTrack, !isPaused).then(() => {
                if (serverElapsedSec > 1) {
                    OSTPlayer.seekTo(serverElapsedSec);
                }
            });
            this.updateNowPlayingUI(track, serverElapsedSec);
            return;
        }

        // Se é a mesma faixa, sincroniza tempo e estado de pausa
        const media = OSTPlayer.videoEl;
        if (media) {
            const localTime = media.currentTime || 0;
            const drift = Math.abs(serverElapsedSec - localTime);

            if (drift >= 5.0) {
                // Zona 3: Hard Seek
                console.log(`[SoftSync] Zona 3 Hard Seek: drift=${drift.toFixed(2)}s`);
                media.currentTime = serverElapsedSec;
                media.playbackRate = 1.0;
            } else if (drift >= 1.5) {
                // Zona 2: Nudge Micro-Correção
                media.playbackRate = localTime < serverElapsedSec ? 1.05 : 0.95;
            } else {
                // Zona 1: Jitter Silencioso
                media.playbackRate = 1.0;
            }
        }

        if (isPaused && OSTPlayer.isPlaying) {
            OSTPlayer.pause();
        } else if (!isPaused && !OSTPlayer.isPlaying) {
            OSTPlayer.play();
        }

        this.updateNowPlayingUI(track, serverElapsedSec);
    },

    updateNowPlayingUI(track, elapsedSec = 0) {
        const songEl = document.getElementById('room-np-song');
        const artistEl = document.getElementById('room-np-artist');
        const animeEl = document.getElementById('room-np-anime');
        const coverEl = document.getElementById('room-np-cover');
        const vinylCoverEl = document.getElementById('room-vinyl-cover');
        const typeEl = document.getElementById('room-np-type');
        const curTimeEl = document.getElementById('room-time-current');
        const totTimeEl = document.getElementById('room-time-total');
        const fillEl = document.getElementById('room-seek-fill');
        const likeCountEl = document.getElementById('room-like-count');
        const voteSkipLabel = document.getElementById('room-vote-skip-label');

        if (!track) {
            if (songEl) songEl.textContent = 'Fila Vazia';
            if (artistEl) artistEl.textContent = 'Adicione músicas à fila da sala';
            if (animeEl) animeEl.textContent = '---';
            return;
        }

        if (songEl) songEl.textContent = track.musica_titulo;
        if (artistEl) artistEl.textContent = track.artista || 'Desconhecido';
        if (animeEl) animeEl.textContent = track.anime_titulo;
        if (coverEl) coverEl.src = track.capa_url || track.cover_url || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png';
        if (vinylCoverEl) vinylCoverEl.src = track.capa_url || track.cover_url || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png';
        if (typeEl) typeEl.textContent = (track.tipo_tema || track.tema_tipo || 'OP') + (track.tema_numero ? track.tema_numero : '');
        if (likeCountEl) likeCountEl.textContent = track.likes_count || 0;
        if (voteSkipLabel) voteSkipLabel.textContent = `Votar Pular (${track.votos_pular || 0})`;

        const duration = track.duracao_segundos || 90;
        if (curTimeEl) curTimeEl.textContent = RadioPage.formatTime(elapsedSec);
        if (totTimeEl) totTimeEl.textContent = RadioPage.formatTime(duration);
        if (fillEl && duration > 0) {
            const pct = Math.min(100, Math.max(0, (elapsedSec / duration) * 100));
            fillEl.style.width = `${pct}%`;
        }
    },

    // -------------------------------------------------------------------------
    // 4. CHAT AO VIVO E REAÇÕES FLUTUANTES
    // -------------------------------------------------------------------------
    startChatLoop() {
        this.stopChatLoop();
        const poll = async () => {
            if (!this.activeRoomUuid || this.chatInProgress) return;
            this.chatInProgress = true;
            try {
                const res = await fetch(`api/radio/chat.php?uuid=${this.activeRoomUuid}&last_id=${this.lastChatId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.mensagens && data.mensagens.length > 0) {
                    this.renderChatMessages(data.mensagens);
                }
            } catch (err) {
                console.warn('[RadioRooms] Erro ao buscar chat:', err);
            } finally {
                this.chatInProgress = false;
            }
        };

        this.chatTimer = setInterval(poll, 2000);
        poll();
    },

    stopChatLoop() {
        if (this.chatTimer) {
            clearInterval(this.chatTimer);
            this.chatTimer = null;
        }
    },

    renderChatMessages(messages) {
        const container = document.getElementById('room-chat-messages');
        if (!container) return;

        messages.forEach(msg => {
            if (msg.id > this.lastChatId) {
                this.lastChatId = msg.id;
            }

            const isReaction = msg.tipo === 'reacao';
            if (isReaction) {
                this.spawnFloatingSpark(msg.mensagem);
            }

            const bubble = document.createElement('div');
            bubble.className = `chat-bubble-neo ${msg.is_dj ? 'is-dj' : ''} ${isReaction ? 'is-reaction' : ''}`;

            const timeStr = msg.criado_em ? msg.criado_em.split(' ')[1].slice(0, 5) : '';

            const authorName = msg.autor?.username || msg.usuario_nome || 'Ouvinte';
            const isDj = msg.is_dj || (msg.autor && msg.autor.id === this.activeRoomData?.sala?.criador_id);

            bubble.innerHTML = `
                <div class="chat-header-row">
                    <span class="chat-user-pill">
                        ${isDj ? '<i class="fas fa-crown dj-crown" title="DJ Anfitrião"></i>' : ''}
                        <strong>@${this.escapeHtml(authorName)}</strong>
                    </span>
                    <span class="chat-time-tag">${timeStr}</span>
                </div>
                <div class="chat-text">${this.escapeHtml(msg.mensagem)}</div>
            `;

            container.appendChild(bubble);
        });

        // Auto-scroll para baixo
        container.scrollTop = container.scrollHeight;
    },

    async sendChatMessage() {
        const input = document.getElementById('room-chat-input');
        const text = input?.value.trim();
        if (!text || !this.activeRoomUuid) return;

        input.value = '';

        try {
            const res = await fetch('api/radio/chat.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: this.activeRoomUuid,
                    mensagem: text,
                    tipo: 'texto'
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.msg_id && data.msg_id > this.lastChatId) {
                    this.lastChatId = data.msg_id - 1;
                }
            }
        } catch (err) {
            console.error('Falha ao enviar mensagem de chat:', err);
        }
    },

    sendReaction(emoji) {
        if (!this.activeRoomUuid) return;

        // Dispara efeito visual local imediatamente
        this.spawnFloatingSpark(emoji);

        // Envia para o servidor transmitir aos demais ouvintes
        fetch('api/radio/chat.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uuid: this.activeRoomUuid,
                mensagem: emoji,
                tipo: 'reacao'
            })
        }).catch(err => console.warn('Erro ao enviar reação:', err));
    },

    spawnFloatingSpark(emoji) {
        const layer = document.getElementById('room-sparks-layer');
        if (!layer) return;

        const spark = document.createElement('div');
        spark.className = 'floating-spark';
        spark.textContent = emoji;

        // Posição horizontal aleatória entre 15% e 85%
        const leftPct = 15 + Math.random() * 70;
        spark.style.left = `${leftPct}%`;

        layer.appendChild(spark);
        setTimeout(() => {
            spark.remove();
        }, 2400);
    },

    // -------------------------------------------------------------------------
    // 5. AÇÕES DO HOST E DO OUVINTE
    // -------------------------------------------------------------------------
    async sendLike() {
        if (!this.activeRoomUuid) return;
        this.spawnFloatingSpark('❤️');

        try {
            const res = await fetch('api/radio/queue_manage.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: this.activeRoomUuid,
                    action: 'vote_like'
                })
            });
            const data = await res.json();
            if (data.success) {
                const countEl = document.getElementById('room-like-count');
                if (countEl) countEl.textContent = data.likes_count;
            }
        } catch (err) {
            console.error('Erro ao dar like:', err);
        }
    },

    async voteSkip() {
        if (!this.activeRoomUuid) return;

        try {
            const res = await fetch('api/radio/queue_manage.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: this.activeRoomUuid,
                    action: 'vote_skip'
                })
            });
            const data = await res.json();
            if (data.success) {
                const label = document.getElementById('room-vote-skip-label');
                if (label) label.textContent = `Votar Pular (${data.votos_pular}/${data.threshold_required})`;
                if (data.skipped) {
                    alert('Faixa pulada por votação da maioria dos ouvintes!');
                }
            } else {
                alert(data.message || 'Erro ao registrar voto.');
            }
        } catch (err) {
            console.error('Erro ao votar skip:', err);
        }
    },

    async hostTogglePlay() {
        if (!this.activeRoomUuid || !this.isHost) return;
        const isPaused = OSTPlayer?.isPlaying;
        const action = isPaused ? 'pause' : 'resume';

        try {
            await fetch('api/radio/room_action.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: this.activeRoomUuid,
                    action: action
                })
            });
        } catch (err) {
            console.error('Erro ao alternar reprodução da sala:', err);
        }
    },

    async hostSkipTrack() {
        if (!this.activeRoomUuid || !this.isHost) return;

        try {
            await fetch('api/radio/queue_manage.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: this.activeRoomUuid,
                    action: 'skip'
                })
            });
        } catch (err) {
            console.error('Erro ao pular faixa como host:', err);
        }
    },

    async closeRoom() {
        if (!this.activeRoomUuid || !this.isHost) return;
        if (!confirm('Tem certeza de que deseja encerrar esta sala? Ela sairá do ar para todos os ouvintes.')) return;

        try {
            const res = await fetch('api/radio/room_action.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: this.activeRoomUuid,
                    action: 'close_room'
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Sala encerrada com sucesso.');
                this.leaveCurrentRoom(false);
                this.loadRooms(true);
            }
        } catch (err) {
            console.error('Erro ao encerrar sala:', err);
        }
    },

    forceResync() {
        if (this.activeRoomData && this.activeRoomData.tocando_agora) {
            const track = this.activeRoomData.tocando_agora;
            const elapsed = track.tempo_decorrido ?? track.current_seek_sec ?? 0;
            if (typeof OSTPlayer !== 'undefined' && OSTPlayer.videoEl) {
                OSTPlayer.videoEl.currentTime = elapsed;
                OSTPlayer.videoEl.playbackRate = 1.0;
            }
            this.updateSyncBadge('synced');
        }
    },

    copyRoomLink() {
        const link = `${window.location.origin}${window.location.pathname}?page=radio&room=${this.activeRoomUuid}`;
        navigator.clipboard?.writeText(link).then(() => {
            alert('Link da sala copiado para a área de transferência!');
        }).catch(() => {
            prompt('Copie o link abaixo para convidar amigos:', link);
        });
    },

    // -------------------------------------------------------------------------
    // 6. FILA E GESTÃO DE MÚSICAS DA SALA
    // -------------------------------------------------------------------------
    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.room-community-card .radio-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.roomTab === tab);
        });
        document.querySelectorAll('.room-community-card .room-tab-content').forEach(content => {
            content.style.display = content.id === `room-tab-${tab}` ? 'flex' : 'none';
        });
    },

    renderRoomQueue(queue) {
        const container = document.getElementById('room-queue-list');
        const countEl = document.getElementById('room-queue-count');
        if (!container) return;

        if (countEl) countEl.textContent = queue.length;

        if (!queue || queue.length === 0) {
            container.innerHTML = `
                <div class="radio-empty-state">
                    <i class="fas fa-list"></i>
                    <p>Nenhuma música na fila a seguir. Seja o primeiro a adicionar!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = queue.map((track, idx) => `
            <div class="radio-track-item">
                <div class="track-item-idx">${idx + 1}</div>
                <img src="${track.capa_url || track.cover_url || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png'}" alt="Capa" class="track-item-cover">
                <div class="track-item-info">
                    <div class="track-item-title-row">
                        <span class="track-badge type-${(track.tipo_tema || track.tema_tipo || 'OP').toLowerCase()}">${track.tipo_tema || track.tema_tipo || 'OP'}${track.tema_numero ? track.tema_numero : ''}</span>
                        <span class="track-item-song">${this.escapeHtml(track.musica_titulo || track.songTitle)}</span>
                    </div>
                    <div class="track-item-sub">${this.escapeHtml(track.anime_titulo || track.animeTitle)} • Pedido por @${this.escapeHtml(track.adicionado_por_nome || 'Ouvinte')}</div>
                </div>
                ${this.isHost ? `
                    <div class="track-item-actions">
                        <button class="track-action-btn" onclick="RadioRooms.removeQueueItem(${track.id})" title="Remover da fila">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    renderRoomListeners(listeners) {
        const grid = document.getElementById('room-listeners-grid');
        const countEl = document.getElementById('room-listeners-count');
        if (!grid) return;

        if (countEl) countEl.textContent = listeners.length;

        grid.innerHTML = listeners.map(mem => `
            <div class="listener-card-neo">
                <img src="${mem.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(mem.username || mem.nome)}" alt="Avatar" class="listener-avatar">
                <div class="listener-details">
                    <span class="listener-name">@${this.escapeHtml(mem.username || mem.nome)}</span>
                    <span class="listener-role">${mem.role === 'host' || mem.papel === 'host' ? '👑 HOST' : 'OUVINTE'}</span>
                </div>
            </div>
        `).join('');
    },

    openAddSongModal() {
        const modal = document.getElementById('modal-add-song');
        if (modal) modal.style.display = 'flex';
    },

    closeAddSongModal() {
        const modal = document.getElementById('modal-add-song');
        if (modal) modal.style.display = 'none';
    },

    async searchForQueue() {
        const input = document.getElementById('room-search-song-input');
        const q = input?.value.trim();
        if (!q) return;

        const resultsEl = document.getElementById('room-add-song-results');
        if (resultsEl) {
            resultsEl.innerHTML = '<div class="carousel-loading"><div class="loader"></div><p>Buscando faixas no catálogo...</p></div>';
        }

        try {
            if (typeof MusicService !== 'undefined' && MusicService.search) {
                const tracks = await MusicService.search(q);
                this.searchQueueResults = tracks || [];
                this.renderSearchQueueResults();
            }
        } catch (err) {
            if (resultsEl) resultsEl.innerHTML = `<p>Erro: ${this.escapeHtml(err.message)}</p>`;
        }
    },

    renderSearchQueueResults() {
        const resultsEl = document.getElementById('room-add-song-results');
        if (!resultsEl) return;

        if (!this.searchQueueResults || this.searchQueueResults.length === 0) {
            resultsEl.innerHTML = '<div class="radio-empty-state"><p>Nenhuma música encontrada.</p></div>';
            return;
        }

        resultsEl.innerHTML = this.searchQueueResults.map((track, idx) => `
            <div class="radio-track-item">
                <img src="${track.cover}" alt="Capa" class="track-item-cover">
                <div class="track-item-info">
                    <div class="track-item-title-row">
                        <span class="track-badge type-${(track.themeType || 'OP').toLowerCase()}">${track.themeSlug || track.themeType}</span>
                        <span class="track-item-song">${this.escapeHtml(track.songTitle)}</span>
                    </div>
                    <div class="track-item-sub">${this.escapeHtml(track.animeTitle)} • ${this.escapeHtml(track.artist)}</div>
                </div>
                <div class="track-item-actions">
                    <button type="button" class="btn-neo-brand btn-sm" onclick="RadioRooms.addTrackToRoomQueue(${idx})">
                        <i class="fas fa-plus"></i> Injetar na Fila
                    </button>
                </div>
            </div>
        `).join('');
    },

    async addTrackToRoomQueue(idx) {
        const track = this.searchQueueResults?.[idx];
        if (!track || !this.activeRoomUuid) return;

        try {
            const res = await fetch('api/radio/queue_manage.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: this.activeRoomUuid,
                    action: 'add',
                    musica_id: track.id,
                    musica_titulo: track.songTitle,
                    anime_titulo: track.animeTitle,
                    artista: track.artist,
                    cover_url: track.cover,
                    audio_url: track.audioUrl || track.videoUrl,
                    video_url: track.videoUrl,
                    tema_tipo: track.themeType || 'OP',
                    tema_slug: track.themeSlug || 'OP1',
                    duracao_segundos: track.duration || 90
                })
            });

            const data = await res.json();
            if (data.success) {
                this.closeAddSongModal();
                this.switchTab('queue');
            } else {
                alert(data.message || 'Erro ao adicionar faixa.');
            }
        } catch (err) {
            console.error('Erro ao adicionar faixa na sala:', err);
        }
    },

    async removeQueueItem(queueId) {
        if (!this.activeRoomUuid || !this.isHost) return;

        try {
            await fetch('api/radio/queue_manage.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: this.activeRoomUuid,
                    action: 'remove',
                    queue_id: queueId
                })
            });
        } catch (err) {
            console.error('Erro ao remover faixa:', err);
        }
    },

    escapeHtml(str) {
        return RadioPage.escapeHtml(str);
    }
};

window.RadioPage = RadioPage;
window.RadioRooms = RadioRooms;

if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        RadioPage.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => RadioPage.init());
    }
}
