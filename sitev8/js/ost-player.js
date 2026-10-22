/**
 * AnimeEngine v8 — OSTPlayer (Motor Musical Global Unificado)
 * 
 * Arquitetura:
 *  - Motor único compartilhado entre a barra global (footer) e a rota ?page=radio
 *  - Prioriza streams nativos .webm (OP/ED reais via AnimeThemes API em <video playsinline>)
 *  - Suporta fallback visível em YouTube IFrame (respeitando diretrizes de incorporação >= 280x158)
 *  - Fila de reprodução, Histórico, Próxima/Anterior, Shuffle, Repeat (off | all | one) e Auto-DJ
 *  - Persistência de estado em localStorage (reidratado em modo pausado para respeitar políticas de Autoplay)
 *  - Barramento de eventos: emite 'ost:stateChange', 'ost:queueChange', 'ost:timeUpdate'
 *    e escuta 'engine:requestAudioExclusive' (emitido pelo Animdle ao tocar snippets)
 */

const OSTPlayer = {
    // Elementos de mídia
    videoEl: null,
    ytPlayer: null,
    ytReady: false,
    isDockedInRadio: false,

    // Estado de reprodução
    currentTrack: null,
    queue: [],
    currentIndex: -1,
    history: [],
    isPlaying: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
    volume: 80,
    isMuted: false,

    // Modos
    shuffle: false,
    repeat: 'off', // 'off' | 'all' | 'one'
    autoDj: true,
    viewMode: 'video', // 'video' | 'visualizer'
    currentStation: 'random',
    typeFilter: 'ALL',

    // Resiliência de Mídia & Circuit Breaker
    consecutiveErrors: 0,
    mediaErrorTimeout: null,
    lastMediaErrorToast: 0,
    activePlayPromise: null,

    progressTimer: null,
    STORAGE_KEY: 'animeengine_ost_state_v8',

    init() {
        if (document.getElementById('ost-player')) return;
        this.createPlayerUI();
        this.bindMediaEvents();
        this.loadSavedState();

        // Escutar pedido de exclusividade de áudio (ex: Animdle iniciando trecho)
        window.addEventListener('engine:requestAudioExclusive', () => {
            if (this.isPlaying) {
                this.pause();
            }
        });

        // Ao sair da página de rádio via SPA, devolver o palco de vídeo para o dock global
        window.addEventListener('spa:beforeNavigate', (e) => {
            if (e.detail?.from === 'radio') {
                this.undockStage();
            }
        });
    },

    createPlayerUI() {
        const playerHTML = `
            <div class="ost-player minimized" id="ost-player">
                <!-- Palco de Vídeo Flutuante (usado quando fora da aba Rádio; min 280x158px) -->
                <div class="ost-video-container" id="ost-video-wrapper">
                    <div class="ost-media-stage" id="ost-media-stage">
                        <video id="ost-html5-video" playsinline webkit-playsinline preload="metadata"></video>
                        <div id="ost-youtube-container" class="ost-youtube-container" style="display:none;">
                            <div id="ost-youtube-iframe"></div>
                        </div>
                        <div class="ost-stage-badge" id="ost-stage-badge">OP</div>
                    </div>
                </div>

                <!-- Barra Principal Neo-Brutalista -->
                <div class="ost-bar">
                    <div class="ost-info" id="ost-info-area">
                        <div class="ost-thumb" id="ost-thumb" title="Abrir Estação de Rádio">
                            <img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png" alt="Capa" id="ost-thumb-img">
                            <div class="ost-playing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div class="ost-details">
                            <div class="ost-title-row">
                                <span class="ost-type-pill" id="ost-type-pill">OP</span>
                                <div class="ost-title" id="ost-title">Rádio AnimeEngine</div>
                            </div>
                            <div class="ost-anime" id="ost-anime">Selecione uma faixa ou abra a Rádio</div>
                        </div>
                    </div>

                    <div class="ost-controls">
                        <button class="ost-btn ost-btn-sm" id="ost-shuffle-btn" onclick="OSTPlayer.toggleShuffle()" title="Ordem Aleatória (Shuffle)">
                            <i class="fas fa-random"></i>
                        </button>
                        <button class="ost-btn" onclick="OSTPlayer.prev()" title="Faixa Anterior">
                            <i class="fas fa-step-backward"></i>
                        </button>
                        <button class="ost-btn ost-play-btn" id="ost-play-btn" onclick="OSTPlayer.togglePlay()" title="Play / Pause">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="ost-btn" onclick="OSTPlayer.next()" title="Próxima Faixa">
                            <i class="fas fa-step-forward"></i>
                        </button>
                        <button class="ost-btn ost-btn-sm" id="ost-repeat-btn" onclick="OSTPlayer.cycleRepeat()" title="Repetição: Desligada">
                            <i class="fas fa-redo"></i>
                        </button>
                        <div class="ost-progress-container" id="ost-progress-container" title="Clique para avançar/retroceder">
                            <div class="ost-progress-bar" id="ost-progress"></div>
                        </div>
                        <span class="ost-time" id="ost-time">0:00 / 0:00</span>
                    </div>

                    <div class="ost-extra">
                        <div class="ost-volume-wrap">
                            <button class="ost-btn ost-btn-sm" id="ost-mute-btn" onclick="OSTPlayer.toggleMute()" title="Mudo">
                                <i class="fas fa-volume-up"></i>
                            </button>
                            <input type="range" class="ost-volume" id="ost-volume" min="0" max="100" value="80" title="Volume">
                        </div>
                        <button class="ost-btn" id="ost-video-btn" onclick="OSTPlayer.toggleVideoPopup()" title="Mostrar/Ocultar Vídeo">
                            <i class="fas fa-tv"></i>
                        </button>
                        <button class="ost-btn" onclick="OSTPlayer.openRadioPage()" title="Abrir Estação de Rádio Completa">
                            <i class="fas fa-broadcast-tower"></i>
                        </button>
                        <button class="ost-btn" onclick="OSTPlayer.minimize()" title="Minimizar">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <button class="ost-btn ost-close" onclick="OSTPlayer.close()" title="Fechar Player">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Botão Flutuante (quando minimizado) -->
                <button class="ost-Expand-btn" onclick="OSTPlayer.restore()" title="Expandir Player Musical">
                    <i class="fas fa-compact-disc fa-spin" id="ost-disc-icon"></i>
                    <span id="ost-mini-label">Rádio</span>
                </button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', playerHTML);
        this.videoEl = document.getElementById('ost-html5-video');

        // Clique na barra de progresso
        const progContainer = document.getElementById('ost-progress-container');
        if (progContainer) {
            progContainer.addEventListener('click', (e) => {
                const rect = progContainer.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                this.seekToPercent(pct);
            });
        }

        // Slider de volume
        const volSlider = document.getElementById('ost-volume');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                this.setVolume(Number(e.target.value));
            });
        }

        // Clique na capa/título abre a página da Rádio
        const thumb = document.getElementById('ost-thumb');
        if (thumb) {
            thumb.addEventListener('click', () => this.openRadioPage());
        }
    },

    bindMediaEvents() {
        if (!this.videoEl) return;

        this.videoEl.addEventListener('loadstart', () => {
            if (this.currentTrack?.sourceType === 'animethemes') {
                this.isLoading = true;
                this.emitState();
            }
        });

        this.videoEl.addEventListener('canplay', () => {
            this.isLoading = false;
            this.duration = this.videoEl.duration || 0;
            this.updateUI();
            this.emitState();
        });

        this.videoEl.addEventListener('play', () => {
            this.isPlaying = true;
            this.isLoading = false;
            this.updateUI();
            this.emitState();
        });

        this.videoEl.addEventListener('pause', () => {
            if (this.currentTrack?.sourceType === 'animethemes') {
                this.isPlaying = false;
                this.updateUI();
                this.emitState();
            }
        });

        this.videoEl.addEventListener('timeupdate', () => {
            if (this.currentTrack?.sourceType === 'animethemes') {
                this.currentTime = this.videoEl.currentTime || 0;
                this.duration = this.videoEl.duration || 0;
                this.updateProgressUI();
                window.dispatchEvent(new CustomEvent('ost:timeUpdate', {
                    detail: {
                        currentTime: this.currentTime,
                        duration: this.duration,
                        percent: this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0
                    }
                }));
            }
        });

        this.videoEl.addEventListener('ended', () => {
            if (this.currentTrack?.sourceType === 'animethemes') {
                this.handleTrackEnded();
            }
        });

        this.videoEl.addEventListener('error', () => {
            if (this.currentTrack?.sourceType === 'animethemes') {
                const mediaErr = this.videoEl.error;
                if (!mediaErr || mediaErr.code === 1 || !this.videoEl.currentSrc) {
                    return;
                }
                console.warn('[OSTPlayer] Erro real no stream HTML5 WebM (código ' + mediaErr.code + '):', this.currentTrack.mediaUrl);
                this.handleMediaError(this.currentTrack);
            }
        });
    },

    // =========================================================
    // DOCK / UNDOCK DO PALCO DE VÍDEO (INTEGRAÇÃO COM ?page=radio)
    // =========================================================
    dockStageTo(targetContainer) {
        const stage = document.getElementById('ost-media-stage');
        if (!stage || !targetContainer) return;
        targetContainer.appendChild(stage);
        this.isDockedInRadio = true;
        document.getElementById('ost-video-wrapper')?.classList.remove('visible');
        this.emitState();
    },

    undockStage() {
        const stage = document.getElementById('ost-media-stage');
        const wrapper = document.getElementById('ost-video-wrapper');
        if (!stage || !wrapper) return;
        if (stage.parentElement !== wrapper) {
            wrapper.appendChild(stage);
        }
        this.isDockedInRadio = false;
        this.emitState();
    },

    openRadioPage() {
        if (typeof Common !== 'undefined' && Common.navigate) {
            Common.navigate('radio');
        } else if (typeof SpaRouter !== 'undefined') {
            SpaRouter.navigateTo('radio');
        } else {
            window.location.href = '?page=radio';
        }
    },

    // =========================================================
    // API PRINCIPAL DE REPRODUÇÃO
    // =========================================================
    /**
     * Aceita um objeto Track do MusicService OU a assinatura legada (videoId, animeTitle, songTitle, thumb)
     */
    async play(trackOrVideoId, animeTitle = '', songTitle = '', thumb = null) {
        if (!document.getElementById('ost-player')) this.init();

        // Caso 1: Objeto Track estruturado
        if (trackOrVideoId && typeof trackOrVideoId === 'object') {
            return this.playTrack(trackOrVideoId);
        }

        // Caso 2: Chamada legada (ex: cards da Home ou Explorar passando YouTube ID + nome)
        const rawId = String(trackOrVideoId || '').trim();
        const queryText = `${animeTitle} ${songTitle}`.replace(/\(Opening.*?\)|\(Ending.*?\)/gi, '').trim();

        this.show();
        this.restore();
        this.isLoading = true;
        this.emitState();

        // Tentar resolver primeiro como OP/ED real na AnimeThemes API via MusicService
        if (typeof MusicService !== 'undefined' && queryText) {
            try {
                const results = await MusicService.searchTracks(queryText, 'ALL');
                if (results && results.length > 0) {
                    // Tentar achar correspondência mais próxima pelo nome da música ou anime
                    const cleanSong = (songTitle || '').replace(/\(.*?\)/g, '').trim().toLowerCase();
                    const bestMatch = results.find(r =>
                        cleanSong && r.songTitle.toLowerCase().includes(cleanSong)
                    ) || results[0];

                    // Guardar o YouTube ID original como backup caso o stream falhe
                    const enrichedTrack = {
                        ...bestMatch,
                        youtubeId: bestMatch.youtubeId || MusicService.extractYouTubeId(rawId),
                        cover: bestMatch.cover || thumb
                    };
                    return this.playTrack(enrichedTrack);
                }
            } catch (e) {
                console.warn('[OSTPlayer] Busca AnimeThemes falhou, usando fallback YouTube:', e);
            }
        }

        // Fallback para YouTube se não encontrou na AnimeThemes
        const ytId = typeof MusicService !== 'undefined'
            ? MusicService.extractYouTubeId(rawId)
            : rawId;

        if (ytId) {
            const fallbackTrack = typeof MusicService !== 'undefined'
                ? MusicService.createYouTubeTrack({
                    youtubeId: ytId,
                    songTitle: songTitle || animeTitle || 'Anime Theme',
                    artist: animeTitle || 'YouTube',
                    animeTitle: animeTitle || 'AnimeEngine',
                    cover: thumb || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
                    themeType: 'OP',
                    themeSlug: 'OP'
                })
                : {
                    id: `yt_${ytId}`,
                    sourceType: 'youtube',
                    themeType: 'OP',
                    themeSlug: 'OP',
                    songTitle: songTitle || animeTitle,
                    artist: animeTitle,
                    animeTitle: animeTitle,
                    cover: thumb || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
                    youtubeId: ytId
                };
            return this.playTrack(fallbackTrack);
        }
    },

    /**
     * Busca e reproduz os temas reais de um anime pelo seu ID do AniList (usado em DetalhesPage)
     */
    async playAnimeThemes(animeId, animeMeta = null, preferredSlug = null) {
        if (!document.getElementById('ost-player')) this.init();
        if (typeof MusicService === 'undefined') return;

        this.show();
        this.restore();
        this.isLoading = true;
        this.updateUI();
        this.emitState();

        if (typeof Common !== 'undefined') {
            Common.showToast(`🎵 Buscando temas de ${animeMeta?.title || 'anime'} na AnimeThemes...`);
        }

        const { themes, trailerFallback } = await MusicService.getThemesByAnimeId(animeId, animeMeta);

        if (themes && themes.length > 0) {
            // Adicionar todos os temas do anime na fila e tocar o escolhido (ou OP1)
            let startIdx = 0;
            if (preferredSlug) {
                const foundIdx = themes.findIndex(t => t.themeSlug === preferredSlug);
                if (foundIdx >= 0) startIdx = foundIdx;
            }
            this.setQueue(themes, startIdx);
            await this.playTrack(themes[startIdx], false);
            return { playedType: 'animethemes', themesCount: themes.length };
        }

        if (trailerFallback) {
            if (typeof Common !== 'undefined') {
                Common.showToast('⚠️ OP/ED não catalogada na AnimeThemes. Reproduzindo Trailer (PV) como alternativa.');
            }
            // No fallback de trailer, garantir que o palco de vídeo esteja visível
            if (!this.isDockedInRadio) {
                document.getElementById('ost-video-wrapper')?.classList.add('visible');
                document.getElementById('ost-video-btn')?.classList.add('active');
            }
            await this.playTrack(trailerFallback);
            return { playedType: 'trailer_fallback', themesCount: 0 };
        }

        this.isLoading = false;
        this.emitState();
        if (typeof Common !== 'undefined') {
            Common.showNotification('Nenhuma Opening/Ending encontrada para este anime.', 'error');
        }
        return { playedType: 'none', themesCount: 0 };
    },

    /**
     * Reproduz um objeto Track normalizado
     */
    async playTrack(track, addToQueueIfMissing = true) {
        if (!track) return;
        if (!document.getElementById('ost-player')) this.init();

        // Pausar qualquer áudio externo exclusivo se necessário
        window.dispatchEvent(new CustomEvent('ost:beforePlay', { detail: { track } }));

        // Adicionar ao histórico se havia faixa anterior diferente
        if (this.currentTrack && this.currentTrack.id !== track.id) {
            this.history = [this.currentTrack, ...this.history.filter(t => t.id !== this.currentTrack.id)].slice(0, 30);
        }

        // Sincronizar com a fila
        const existingIndex = this.queue.findIndex(t => t.id === track.id);
        if (existingIndex >= 0) {
            this.currentIndex = existingIndex;
        } else if (addToQueueIfMissing) {
            this.queue.push(track);
            this.currentIndex = this.queue.length - 1;
        }

        this.currentTrack = track;
        if (this.mediaErrorTimeout) {
            clearTimeout(this.mediaErrorTimeout);
            this.mediaErrorTimeout = null;
        }
        this.isLoading = true;
        this.currentTime = 0;
        this.duration = 0;

        this.show();
        this.restore();
        this.updateUI();
        this.saveState();
        this.emitState();
        this.emitQueue();

        // Escolher motor: HTML5 <video> (AnimeThemes .webm) vs YouTube IFrame
        if (track.sourceType === 'animethemes' && track.mediaUrl) {
            this.stopYouTube();
            const ytContainer = document.getElementById('ost-youtube-container');
            if (ytContainer) ytContainer.style.display = 'none';

            if (this.videoEl) {
                this.videoEl.style.display = 'block';
                this.videoEl.src = track.mediaUrl;
                this.videoEl.volume = this.isMuted ? 0 : (this.volume / 100);
                try {
                    await this.videoEl.play();
                    this.isPlaying = true;
                    this.isLoading = false;
                } catch (err) {
                    this.isLoading = false;
                    this.isPlaying = false;
                    if (err.name === 'NotAllowedError') {
                        console.info('[OSTPlayer] Autoplay bloqueado pelo navegador. Aguardando clique do usuário.');
                    } else if (err.name === 'AbortError') {
                        console.info('[OSTPlayer] Playback assíncrono cancelado por nova ação (AbortError ignorado).');
                        return;
                    } else {
                        console.warn('[OSTPlayer] Falha ao iniciar vídeo WebM:', err);
                        this.handleMediaError(this.currentTrack);
                        return;
                    }
                }
            }
        } else if (track.youtubeId) {
            if (this.videoEl) {
                this.videoEl.pause();
                this.videoEl.removeAttribute('src');
                this.videoEl.style.display = 'none';
            }
            const ytContainer = document.getElementById('ost-youtube-container');
            if (ytContainer) ytContainer.style.display = 'block';

            // Garantir que o container do YouTube esteja visível (>= 280x158px) quando não estiver acoplado na Rádio
            if (!this.isDockedInRadio) {
                document.getElementById('ost-video-wrapper')?.classList.add('visible');
                document.getElementById('ost-video-btn')?.classList.add('active');
            }

            this.playYouTubeFallback(track.youtubeId);
        }

        this.updateUI();
        this.emitState();
    },

    // =========================================================
    // CONTROLES DE REPRODUÇÃO & FILA
    // =========================================================
    async togglePlay() {
        if (!this.currentTrack) {
            // Se não há faixa carregada, sintonizar estação automaticamente
            await this.startAutoStation();
            return;
        }

        if (this.currentTrack.sourceType === 'animethemes' && this.videoEl) {
            if (this.videoEl.paused) {
                if (!this.videoEl.src && this.currentTrack.mediaUrl) {
                    this.videoEl.src = this.currentTrack.mediaUrl;
                }
                try {
                    await this.videoEl.play();
                    this.isPlaying = true;
                } catch (e) {
                    console.warn('[OSTPlayer] Erro ao retomar reprodução:', e);
                }
            } else {
                this.videoEl.pause();
                this.isPlaying = false;
            }
        } else if (this.ytPlayer && this.ytReady) {
            const state = this.ytPlayer.getPlayerState ? this.ytPlayer.getPlayerState() : -1;
            if (state === 1) {
                this.ytPlayer.pauseVideo();
                this.isPlaying = false;
            } else {
                this.ytPlayer.playVideo();
                this.isPlaying = true;
            }
        } else if (this.currentTrack.youtubeId) {
            this.playYouTubeFallback(this.currentTrack.youtubeId);
        }

        this.updateUI();
        this.emitState();
    },

    pause() {
        if (this.videoEl && !this.videoEl.paused) {
            this.videoEl.pause();
        }
        if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.pauseVideo === 'function') {
            this.ytPlayer.pauseVideo();
        }
        this.isPlaying = false;
        this.updateUI();
        this.emitState();
    },

    async next() {
        if (this.queue.length === 0) {
            await this.startAutoStation();
            return;
        }

        if (this.shuffle && this.queue.length > 1) {
            let randomIdx = this.currentIndex;
            while (randomIdx === this.currentIndex) {
                randomIdx = Math.floor(Math.random() * this.queue.length);
            }
            this.currentIndex = randomIdx;
            await this.playTrack(this.queue[this.currentIndex], false);
            return;
        }

        if (this.currentIndex + 1 < this.queue.length) {
            this.currentIndex++;
            await this.playTrack(this.queue[this.currentIndex], false);
            return;
        }

        if (this.repeat === 'all' && this.queue.length > 0) {
            this.currentIndex = 0;
            await this.playTrack(this.queue[0], false);
            return;
        }

        if (this.autoDj && typeof MusicService !== 'undefined') {
            this.isLoading = true;
            this.emitState();
            const moreTracks = await MusicService.getStationTracks(this.currentStation, this.typeFilter);
            if (moreTracks && moreTracks.length > 0) {
                const newOnes = moreTracks.filter(t => !this.queue.some(q => q.mediaUrl && q.mediaUrl === t.mediaUrl));
                const toAdd = newOnes.length > 0 ? newOnes : moreTracks;
                const nextStart = this.queue.length;
                this.queue.push(...toAdd);
                this.currentIndex = nextStart;
                this.emitQueue();
                await this.playTrack(this.queue[this.currentIndex], false);
                return;
            }
        }

        this.pause();
    },

    async prev() {
        // Se já passou de 4 segundos da música, volta para o início da faixa
        if (this.currentTime > 4) {
            this.seekToPercent(0);
            return;
        }

        if (this.currentIndex > 0 && this.queue[this.currentIndex - 1]) {
            this.currentIndex--;
            await this.playTrack(this.queue[this.currentIndex], false);
            return;
        }

        if (this.history.length > 0) {
            const prevTrack = this.history.shift();
            await this.playTrack(prevTrack, true);
            return;
        }

        this.seekToPercent(0);
    },

    seekToPercent(pct) {
        const clamped = Math.max(0, Math.min(1, pct));
        if (this.currentTrack?.sourceType === 'animethemes' && this.videoEl && this.duration > 0) {
            this.videoEl.currentTime = clamped * this.duration;
            this.currentTime = this.videoEl.currentTime;
            this.updateProgressUI();
        } else if (this.ytPlayer && this.ytReady && this.duration > 0) {
            const target = clamped * this.duration;
            this.ytPlayer.seekTo(target, true);
            this.currentTime = target;
            this.updateProgressUI();
        }
    },

    setVolume(val) {
        this.volume = Math.max(0, Math.min(100, Number(val)));
        if (this.volume > 0) this.isMuted = false;

        if (this.videoEl) {
            this.videoEl.volume = this.isMuted ? 0 : (this.volume / 100);
        }
        if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.setVolume === 'function') {
            this.ytPlayer.setVolume(this.isMuted ? 0 : this.volume);
        }

        const slider = document.getElementById('ost-volume');
        if (slider && Number(slider.value) !== this.volume) {
            slider.value = this.volume;
        }

        this.updateMuteIcon();
        this.saveState();
        this.emitState();
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.videoEl) {
            this.videoEl.volume = this.isMuted ? 0 : (this.volume / 100);
        }
        if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.setVolume === 'function') {
            this.ytPlayer.setVolume(this.isMuted ? 0 : this.volume);
        }
        this.updateMuteIcon();
        this.emitState();
    },

    updateMuteIcon() {
        const btn = document.getElementById('ost-mute-btn');
        if (!btn) return;
        if (this.isMuted || this.volume === 0) {
            btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (this.volume < 50) {
            btn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            btn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    },

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        this.updateUI();
        this.saveState();
        this.emitState();
    },

    cycleRepeat() {
        const order = ['off', 'all', 'one'];
        const nextIdx = (order.indexOf(this.repeat) + 1) % order.length;
        this.repeat = order[nextIdx];
        this.updateUI();
        this.saveState();
        this.emitState();
    },

    setQueue(tracks, startIndex = 0, autoPlay = false) {
        if (!Array.isArray(tracks) || tracks.length === 0) return;
        this.queue = [...tracks];
        this.currentIndex = Math.max(0, Math.min(startIndex, this.queue.length - 1));
        this.saveState();
        this.emitQueue();
        if (autoPlay && this.queue[this.currentIndex]) {
            this.playTrack(this.queue[this.currentIndex], false);
        }
    },

    addToQueue(track) {
        if (!track) return;
        this.queue.push(track);
        if (this.currentIndex === -1) {
            this.currentIndex = 0;
        }
        this.saveState();
        this.emitQueue();
        if (typeof Common !== 'undefined') {
            Common.showToast(`➕ "${track.songTitle}" adicionada à fila!`);
        }
    },

    async playQueueAt(index) {
        if (index < 0 || index >= this.queue.length) return;
        this.currentIndex = index;
        await this.playTrack(this.queue[index], false);
    },

    removeFromQueue(index) {
        if (index < 0 || index >= this.queue.length) return;
        this.queue.splice(index, 1);
        if (index < this.currentIndex) {
            this.currentIndex--;
        } else if (index === this.currentIndex && this.queue.length > 0) {
            this.currentIndex = Math.min(this.currentIndex, this.queue.length - 1);
        }
        this.saveState();
        this.emitQueue();
    },

    clearQueue() {
        this.queue = this.currentTrack ? [this.currentTrack] : [];
        this.currentIndex = this.currentTrack ? 0 : -1;
        this.saveState();
        this.emitQueue();
    },

    async startAutoStation(stationId = null, typeFilter = null) {
        if (typeof MusicService === 'undefined') return;
        if (stationId) this.currentStation = stationId;
        if (typeFilter) this.typeFilter = typeFilter;

        this.isLoading = true;
        this.emitState();

        const tracks = await MusicService.getStationTracks(this.currentStation, this.typeFilter);
        if (tracks && tracks.length > 0) {
            this.setQueue(tracks, 0);
            await this.playTrack(tracks[0], false);
        } else {
            this.isLoading = false;
            this.emitState();
        }
    },

    async handleTrackEnded() {
        if (this.repeat === 'one' && this.currentTrack) {
            this.seekToPercent(0);
            if (this.currentTrack.sourceType === 'animethemes' && this.videoEl) {
                try { await this.videoEl.play(); } catch (e) { }
            } else if (this.ytPlayer && this.ytReady) {
                this.ytPlayer.playVideo();
            }
            return;
        }
        await this.next();
    },

    async handleMediaError(failingTrack = null) {
        this.isLoading = false;
        this.isPlaying = false;

        // Se a faixa que falhou já não é a faixa ativa, ignorar
        if (failingTrack && this.currentTrack && failingTrack.id && failingTrack.id !== this.currentTrack.id) {
            return;
        }

        // 1. Tentar fallback de Áudio OGG (a.animethemes.moe) se o vídeo WebM falhou
        if (this.currentTrack && this.currentTrack.audioUrl && this.videoEl && this.videoEl.src !== this.currentTrack.audioUrl) {
            console.info('[OSTPlayer] Vídeo WebM indisponível, tentando stream de áudio OGG alternativo:', this.currentTrack.audioUrl);
            this.videoEl.src = this.currentTrack.audioUrl;
            try {
                const p = this.videoEl.play();
                if (p) {
                    p.then(() => {
                        this.isPlaying = true;
                        this.isLoading = false;
                        this.consecutiveErrors = 0;
                        this.updateUI();
                        this.emitState();
                    }).catch(e => {
                        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
                            this.proceedMediaErrorSkip(failingTrack);
                        }
                    });
                }
                return;
            } catch (_) { }
        }

        this.proceedMediaErrorSkip(failingTrack);
    },

    proceedMediaErrorSkip(failingTrack = null) {
        // Se a faixa tinha um YouTube ID de backup, acionar o YouTube
        if (this.currentTrack && this.currentTrack.youtubeId && this.currentTrack.sourceType !== 'youtube') {
            console.info('[OSTPlayer] Acionando fallback YouTube para:', this.currentTrack.songTitle);
            this.currentTrack.sourceType = 'youtube';
            if (this.videoEl) this.videoEl.style.display = 'none';
            const ytContainer = document.getElementById('ost-youtube-container');
            if (ytContainer) ytContainer.style.display = 'block';
            this.playYouTubeFallback(this.currentTrack.youtubeId);
            return;
        }

        // Circuit breaker: se acumular 3 falhas seguidas, pausar para evitar loop infinito de skips
        this.consecutiveErrors = (this.consecutiveErrors || 0) + 1;
        if (this.consecutiveErrors >= 3) {
            console.warn('[OSTPlayer] Circuit breaker: 3 falhas consecutivas de mídia. Pausando fila.');
            this.consecutiveErrors = 0;
            this.isPlaying = false;
            this.isLoading = false;
            if (typeof Common !== 'undefined' && Common.showToast) {
                Common.showToast('⚠️ Várias mídias indisponíveis no momento. Reprodução pausada.');
            }
            this.updateUI();
            this.emitState();
            return;
        }

        // Debounce de Toast (máximo 1 toast a cada 4 segundos)
        const now = Date.now();
        if (!this.lastMediaErrorToast || (now - this.lastMediaErrorToast) > 4000) {
            this.lastMediaErrorToast = now;
            if (typeof Common !== 'undefined' && Common.showToast) {
                Common.showToast('⚠️ Mídia indisponível no servidor, sintonizando próxima faixa...');
            }
        }

        // Agendar salto para próxima faixa com timer protegido
        if (this.mediaErrorTimeout) {
            clearTimeout(this.mediaErrorTimeout);
        }
        this.mediaErrorTimeout = setTimeout(() => {
            this.mediaErrorTimeout = null;
            if (this.queue.length > 1) {
                this.next();
            }
        }, 1200);
    },

    // =========================================================
    // FALLBACK YOUTUBE IFRAME API (VISÍVEL, SEM 1x1 OCULTO)
    // =========================================================
    playYouTubeFallback(videoId) {
        if (!window.YT || !window.YT.Player) {
            if (!document.getElementById('yt-iframe-api-script')) {
                const tag = document.createElement('script');
                tag.id = 'yt-iframe-api-script';
                tag.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(tag);
            }
            window.onYouTubeIframeAPIReady = () => {
                this.initYouTubePlayer(videoId);
            };
            return;
        }

        if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.loadVideoById === 'function') {
            this.ytPlayer.loadVideoById(videoId);
            this.ytPlayer.setVolume(this.isMuted ? 0 : this.volume);
        } else {
            this.initYouTubePlayer(videoId);
        }
    },

    initYouTubePlayer(videoId) {
        this.ytPlayer = new YT.Player('ost-youtube-iframe', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0
            },
            events: {
                onReady: (e) => {
                    this.ytReady = true;
                    this.isLoading = false;
                    e.target.setVolume(this.isMuted ? 0 : this.volume);
                    e.target.playVideo();
                    this.emitState();
                },
                onStateChange: (e) => {
                    if (e.data === YT.PlayerState.PLAYING) {
                        this.isPlaying = true;
                        this.isLoading = false;
                        this.duration = this.ytPlayer.getDuration() || 0;
                        this.startYouTubeTimer();
                    } else if (e.data === YT.PlayerState.PAUSED) {
                        this.isPlaying = false;
                        this.stopYouTubeTimer();
                    } else if (e.data === YT.PlayerState.ENDED) {
                        this.isPlaying = false;
                        this.stopYouTubeTimer();
                        this.handleTrackEnded();
                    }
                    this.updateUI();
                    this.emitState();
                },
                onError: () => {
                    this.stopYouTubeTimer();
                    this.handleMediaError(this.currentTrack);
                }
            }
        });
    },

    stopYouTube() {
        this.stopYouTubeTimer();
        if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.stopVideo === 'function') {
            try { this.ytPlayer.stopVideo(); } catch (e) { }
        }
    },

    startYouTubeTimer() {
        this.stopYouTubeTimer();
        this.progressTimer = setInterval(() => {
            if (this.ytPlayer && this.ytReady && this.currentTrack?.sourceType === 'youtube') {
                this.currentTime = this.ytPlayer.getCurrentTime ? this.ytPlayer.getCurrentTime() : 0;
                this.duration = this.ytPlayer.getDuration ? this.ytPlayer.getDuration() : 0;
                this.updateProgressUI();
                window.dispatchEvent(new CustomEvent('ost:timeUpdate', {
                    detail: {
                        currentTime: this.currentTime,
                        duration: this.duration,
                        percent: this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0
                    }
                }));
            }
        }, 500);
    },

    stopYouTubeTimer() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
    },

    // =========================================================
    // ATUALIZAÇÃO DE UI & BARRAMENTO DE EVENTOS
    // =========================================================
    updateUI() {
        const track = this.currentTrack;
        const titleEl = document.getElementById('ost-title');
        const animeEl = document.getElementById('ost-anime');
        const pillEl = document.getElementById('ost-type-pill');
        const stageBadgeEl = document.getElementById('ost-stage-badge');
        const thumbImg = document.getElementById('ost-thumb-img');
        const thumbWrap = document.getElementById('ost-thumb');
        const playBtn = document.getElementById('ost-play-btn');
        const shuffleBtn = document.getElementById('ost-shuffle-btn');
        const repeatBtn = document.getElementById('ost-repeat-btn');
        const discIcon = document.getElementById('ost-disc-icon');
        const miniLabel = document.getElementById('ost-mini-label');

        if (track) {
            if (titleEl) titleEl.textContent = track.songTitle || 'Anime Theme';
            if (animeEl) {
                const artistPart = track.artist && track.artist !== track.animeTitle ? ` • ${track.artist}` : '';
                animeEl.textContent = `${track.animeTitle || 'Anime'}${artistPart}`;
            }
            if (pillEl) {
                pillEl.textContent = track.themeSlug || track.themeType || 'OP';
                pillEl.className = `ost-type-pill type-${(track.themeType || 'OP').toLowerCase()}`;
            }
            if (stageBadgeEl) {
                stageBadgeEl.textContent = `${track.animeTitle} — ${track.themeSlug || track.themeType}`;
            }
            if (thumbImg && track.cover) {
                thumbImg.src = track.cover;
            }
            if (miniLabel) {
                miniLabel.textContent = track.songTitle ? track.songTitle.slice(0, 14) : 'Rádio';
            }
        }

        if (playBtn) {
            if (this.isLoading) {
                playBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
            } else {
                playBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            }
        }

        if (thumbWrap) {
            thumbWrap.classList.toggle('playing', this.isPlaying);
        }

        if (discIcon) {
            discIcon.style.animationPlayState = this.isPlaying ? 'running' : 'paused';
        }

        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.shuffle);
        }

        if (repeatBtn) {
            repeatBtn.classList.toggle('active', this.repeat !== 'off');
            if (this.repeat === 'one') {
                repeatBtn.innerHTML = '<i class="fas fa-redo"></i><small style="font-size:0.55rem;margin-left:1px;">1</small>';
                repeatBtn.title = 'Repetição: Faixa Atual (1)';
            } else if (this.repeat === 'all') {
                repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
                repeatBtn.title = 'Repetição: Fila Completa';
            } else {
                repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
                repeatBtn.title = 'Repetição: Desligada';
            }
        }

        this.updateProgressUI();
    },

    updateProgressUI() {
        const bar = document.getElementById('ost-progress');
        const timeEl = document.getElementById('ost-time');
        const pct = this.duration > 0 ? Math.min(100, (this.currentTime / this.duration) * 100) : 0;

        if (bar) bar.style.width = `${pct}%`;
        if (timeEl) {
            timeEl.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;
        }
    },

    formatTime(seconds) {
        if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    },

    toggleVideoPopup() {
        if (this.isDockedInRadio) {
            this.viewMode = this.viewMode === 'video' ? 'visualizer' : 'video';
            this.emitState();
            return;
        }
        const wrapper = document.getElementById('ost-video-wrapper');
        const btn = document.getElementById('ost-video-btn');
        if (wrapper) {
            wrapper.classList.toggle('visible');
            btn?.classList.toggle('active', wrapper.classList.contains('visible'));
        }
    },

    show() {
        document.getElementById('ost-player')?.classList.add('active');
    },

    minimize() {
        const player = document.getElementById('ost-player');
        player?.classList.add('minimized');
        document.getElementById('ost-video-wrapper')?.classList.remove('visible');
        document.getElementById('ost-video-btn')?.classList.remove('active');
    },

    restore() {
        const player = document.getElementById('ost-player');
        player?.classList.add('active');
        player?.classList.remove('minimized');
    },

    close() {
        this.pause();
        const player = document.getElementById('ost-player');
        player?.classList.remove('active');
        document.getElementById('ost-video-wrapper')?.classList.remove('visible');
    },

    // =========================================================
    // PERSISTÊNCIA DE ESTADO (LOCALSTORAGE)
    // =========================================================
    saveState() {
        try {
            const payload = {
                currentTrack: this.currentTrack,
                queue: this.queue.slice(0, 40),
                currentIndex: this.currentIndex,
                history: this.history.slice(0, 20),
                volume: this.volume,
                shuffle: this.shuffle,
                repeat: this.repeat,
                currentStation: this.currentStation,
                typeFilter: this.typeFilter
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
        } catch (e) { }
    },

    loadSavedState() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);

            if (typeof saved.volume === 'number') this.volume = saved.volume;
            if (typeof saved.shuffle === 'boolean') this.shuffle = saved.shuffle;
            if (saved.repeat) this.repeat = saved.repeat;
            if (saved.currentStation) this.currentStation = saved.currentStation;
            if (saved.typeFilter) this.typeFilter = saved.typeFilter;
            if (Array.isArray(saved.queue)) this.queue = saved.queue;
            if (typeof saved.currentIndex === 'number') this.currentIndex = saved.currentIndex;
            if (Array.isArray(saved.history)) this.history = saved.history;

            // Reidratar última faixa em estado PAUSADO (evitando NotAllowedError de autoplay pós-reload)
            if (saved.currentTrack) {
                this.currentTrack = saved.currentTrack;
                this.isPlaying = false;
                // Não carregar videoEl.src aqui para evitar erros de rede falsos ao iniciar a página pausada
                // O src será carregado quando o usuário der Play
                const player = document.getElementById('ost-player');
                player?.classList.add('active', 'minimized');
                this.updateUI();
            }
        } catch (e) { }
    },

    getState() {
        return {
            currentTrack: this.currentTrack,
            queue: this.queue,
            currentIndex: this.currentIndex,
            history: this.history,
            isPlaying: this.isPlaying,
            isLoading: this.isLoading,
            duration: this.duration,
            currentTime: this.currentTime,
            volume: this.volume,
            isMuted: this.isMuted,
            shuffle: this.shuffle,
            repeat: this.repeat,
            autoDj: this.autoDj,
            viewMode: this.viewMode,
            currentStation: this.currentStation,
            typeFilter: this.typeFilter,
            isDockedInRadio: this.isDockedInRadio
        };
    },

    emitState() {
        window.dispatchEvent(new CustomEvent('ost:stateChange', { detail: this.getState() }));
    },

    emitQueue() {
        window.dispatchEvent(new CustomEvent('ost:queueChange', {
            detail: { queue: this.queue, currentIndex: this.currentIndex, history: this.history }
        }));
    },

    async onCoverError(imgElement, animeTitle) {
        if (!imgElement || imgElement.dataset.fallbackAttempted) return;
        imgElement.dataset.fallbackAttempted = 'true';
        imgElement.src = 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png';
        if (animeTitle && typeof API !== 'undefined' && API.searchAnime) {
            try {
                const res = await API.searchAnime(animeTitle, 1, 1);
                if (res && res[0] && res[0].image) {
                    imgElement.src = res[0].image;
                }
            } catch (e) { }
        }
    }
};

window.OSTPlayer = OSTPlayer;

document.addEventListener('DOMContentLoaded', () => {
    OSTPlayer.init();
});
