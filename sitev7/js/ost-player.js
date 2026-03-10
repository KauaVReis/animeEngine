/**
 * AnimeEngine v7 - Global OST Player (Spotify Style)
 * Player persistente entre navegação de páginas PHP
 */

const OSTPlayer = {
    player: null,
    ytPlayer: null,
    isReady: false,
    updateInterval: null,
    state: {
        videoId: null,
        title: null,
        subtitle: null,
        currentTime: 0,
        isPlaying: false,
        cover: 'https://via.placeholder.com/150'
    },

    init() {
        // Load saved state from LocalStorage
        const savedState = localStorage.getItem('ost_engine_state');
        if (savedState) {
            try {
                this.state = JSON.parse(savedState);
            } catch (e) { }
        }

        this.createUI();

        // Load YouTube Iframe API only if a video was played or is playing
        if (this.state.videoId) {
            this.loadYTApi();
        }
    },

    loadYTApi() {
        if (!window.YT && !document.getElementById('yt-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'yt-api-script';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => this.onYTReady();
        } else if (window.YT && window.YT.Player) {
            this.onYTReady();
        }
    },

    createUI() {
        if (document.getElementById('ost-global-player')) return;

        this.player = document.createElement('div');
        this.player.id = 'ost-global-player';
        this.player.className = 'ost-global-player ' + (this.state.videoId ? 'active' : '');

        this.player.innerHTML = `
            <div id="ost-yt-container" class="ost-youtube-hidden"></div>
            
            <div class="ost-info">
                <img src="${this.state.cover}" class="ost-cover ${this.state.isPlaying ? 'playing' : ''}" id="ost-cover-img" alt="Cover" onerror="window.OSTPlayer.onCoverError()">
                <div class="ost-details">
                    <span class="ost-details-title" id="ost-title">${this.state.title || 'Nenhuma música'}</span>
                    <span class="ost-details-sub" id="ost-subtitle">${this.state.subtitle || 'OST'}</span>
                </div>
            </div>

            <div class="ost-controls-center">
                <div class="ost-buttons">
                    <button class="ost-btn" onclick="OSTPlayer.seek(-10)" title="Voltar 10s"><i class="fas fa-backward"></i></button>
                    <button class="ost-btn ost-btn-play" id="ost-btn-play" onclick="OSTPlayer.togglePlay()">
                        <i class="fas fa-${this.state.isPlaying ? 'pause' : 'play'}-circle"></i>
                    </button>
                    <button class="ost-btn" onclick="OSTPlayer.seek(10)" title="Avançar 10s"><i class="fas fa-forward"></i></button>
                    <button class="ost-btn" onclick="OSTPlayer.close()" title="Fechar Player"><i class="fas fa-times"></i></button>
                </div>
                <div class="ost-progress-container">
                    <span class="ost-time" id="ost-time-current">0:00</span>
                    <div class="ost-progress-bar" id="ost-progress-bar" onclick="OSTPlayer.seekTo(event)">
                        <div class="ost-progress-filled" id="ost-progress-filled"></div>
                    </div>
                    <span class="ost-time" id="ost-time-total">0:00</span>
                </div>
            </div>

            <div class="ost-right">
                <i class="fas fa-volume-up" style="color:var(--text-dim)"></i>
                <input type="range" min="0" max="100" value="100" class="volume-slider" id="ost-volume" onchange="OSTPlayer.setVolume(this.value)">
            </div>
        `;

        document.body.appendChild(this.player);
    },

    onYTReady() {
        if (!this.state.videoId) return;

        this.ytPlayer = new YT.Player('ost-yt-container', {
            height: '1',
            width: '1',
            videoId: this.state.videoId,
            playerVars: {
                'autoplay': this.state.isPlaying ? 1 : 0,
                'controls': 0,
                'disablekb': 1,
                'fs': 0,
                'rel': 0,
                'start': Math.floor(this.state.currentTime),
                'modestbranding': 1,
                'origin': window.location.origin // Resolve erro de postMessage no localhost
            },
            events: {
                'onReady': (event) => this.onPlayerReady(event),
                'onStateChange': (event) => this.onPlayerStateChange(event),
                'onError': (event) => console.error("YT Player Error:", event.data)
            }
        });
    },

    onPlayerReady(event) {
        this.isReady = true;
        if (this.state.isPlaying) {
            this.ytPlayer.playVideo();
            this.startInterval();
        }
        this.updateUI();
    },

    onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.state.isPlaying = true;
            this.startInterval();
            document.getElementById('ost-cover-img').classList.add('playing');
        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            this.state.isPlaying = false;
            this.stopInterval();
            document.getElementById('ost-cover-img').classList.remove('playing');
        }
        this.updatePlayButton();
        this.saveState();
    },

    /**
     * Toca uma nova música do zero
     */
    play(videoId, title, subtitle, coverUrl) {
        if (!videoId) return;

        this.state = {
            videoId: videoId,
            title: title || 'Trilha Sonora',
            subtitle: subtitle || 'AnimeEngine',
            currentTime: 0,
            isPlaying: true,
            cover: coverUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        };

        if (this.player) {
            this.player.classList.add('active');
            document.getElementById('ost-title').textContent = this.state.title;
            document.getElementById('ost-subtitle').textContent = this.state.subtitle;
            document.getElementById('ost-cover-img').src = this.state.cover;
        }

        if (this.isReady && this.ytPlayer) {
            this.ytPlayer.loadVideoById(videoId, 0);
        } else {
            this.loadYTApi(); // Tenta carregar se ainda não carregou
        }

        this.saveState();
    },

    /**
     * Fallback reativo: Se a capa falhar (404), tenta buscar o banner do anime
     * @param {HTMLImageElement} imgElement - Opcional: O elemento <img> que disparou o erro
     * @param {string} searchTitle - Opcional: O nome do anime para buscar
     */
    async onCoverError(imgElement = null, searchTitle = null) {
        const targetImg = imgElement || document.getElementById('ost-cover-img');
        const title = searchTitle || this.state.title;

        if (!targetImg || !title) return;
        if (targetImg.dataset.fetching) return;
        targetImg.dataset.fetching = "true";

        console.warn(`⚠️ Capa falhou para "${title}". Buscando banner do anime...`);
        const banner = await this.fetchAnimeBanner(title);

        if (banner) {
            targetImg.src = banner;
            // Se for a imagem do player global, atualiza o estado
            if (targetImg.id === 'ost-cover-img') {
                this.state.cover = banner;
                this.saveState();
            }
        } else {
            // Último recurso: Placeholder
            targetImg.src = 'https://i.ibb.co/LkhYvM8/anime-placeholder.jpg';
        }

        delete targetImg.dataset.fetching;
    },

    async fetchAnimeBanner(search) {
        if (!window.API || !search) return null;

        const query = `
            query ($search: String) {
                Media (search: $search, type: ANIME) {
                    bannerImage
                    coverImage {
                        extraLarge
                    }
                }
            }
        `;

        try {
            const data = await API.query(query, { search });
            return data.Media.bannerImage || data.Media.coverImage.extraLarge;
        } catch (e) {
            console.error('Erro ao buscar banner de fallback:', e);
            return null;
        }
    },

    // NOTE: The user's instruction mentioned adding a 'case 'ost'' to a 'fetchAnimes' function.
    // However, the provided code document does not contain a 'fetchAnimes' function.
    // The snippet provided for this part of the change was syntactically incorrect and
    // out of context for the 'fetchAnimeBanner' function where it was suggested to be placed.
    // To maintain syntactic correctness and avoid introducing new, undefined functions or
    // incorrect logic, this specific part of the instruction cannot be applied as written
    // without further clarification or the full context of the 'fetchAnimes' function.
    // The instruction "Adicionar o case 'ost' no fetchAnimes" implies a function not present.
    // Therefore, only the 'origin' parameter addition has been applied.

    togglePlay() {
        if (!this.isReady || !this.ytPlayer || !this.state.videoId) return;

        if (this.state.isPlaying) {
            this.ytPlayer.pauseVideo();
        } else {
            this.ytPlayer.playVideo();
        }
    },

    seek(seconds) {
        if (!this.isReady || !this.ytPlayer) return;
        const current = this.ytPlayer.getCurrentTime();
        this.ytPlayer.seekTo(current + seconds, true);
    },

    seekTo(event) {
        if (!this.isReady || !this.ytPlayer) return;
        const bar = document.getElementById('ost-progress-bar');
        const rect = bar.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        const duration = this.ytPlayer.getDuration();
        this.ytPlayer.seekTo(pos * duration, true);
    },

    setVolume(vol) {
        if (this.isReady && this.ytPlayer) {
            this.ytPlayer.setVolume(vol);
        }
    },

    close() {
        if (this.isReady && this.ytPlayer) {
            this.ytPlayer.pauseVideo();
        }
        this.state.isPlaying = false;
        this.state.videoId = null;
        this.saveState();
        if (this.player) {
            this.player.classList.remove('active');
        }
    },

    startInterval() {
        this.stopInterval();
        this.updateInterval = setInterval(() => {
            if (this.isReady && this.ytPlayer && this.state.isPlaying) {
                this.state.currentTime = this.ytPlayer.getCurrentTime();
                this.updateUI();
                this.saveState();
            }
        }, 1000);
    },

    stopInterval() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },

    updateUI() {
        if (!this.isReady || !this.ytPlayer) return;

        // Se a duração não está disponível ainda, não quebra
        const duration = this.ytPlayer.getDuration() || 0;
        const current = this.state.currentTime || 0;

        const formatTime = (time) => {
            if (isNaN(time)) return "0:00";
            const m = Math.floor(time / 60);
            const s = Math.floor(time % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        const currentEl = document.getElementById('ost-time-current');
        const totalEl = document.getElementById('ost-time-total');
        const fillEl = document.getElementById('ost-progress-filled');

        if (currentEl) currentEl.textContent = formatTime(current);
        if (totalEl) totalEl.textContent = formatTime(duration);

        if (fillEl && duration > 0) {
            fillEl.style.width = `${(current / duration) * 100}%`;
        }
    },

    updatePlayButton() {
        const btn = document.getElementById('ost-btn-play');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-${this.state.isPlaying ? 'pause' : 'play'}-circle"></i>`;
        }
    },

    saveState() {
        localStorage.setItem('ost_engine_state', JSON.stringify(this.state));
    }
};

// Auto Inicializar Player ao final do carregamento
document.addEventListener('DOMContentLoaded', () => {
    OSTPlayer.init();
});

window.OSTPlayer = OSTPlayer;
