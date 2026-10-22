/**
 * AnimeEngine v8 - Home Page
 * Lógica principal da Home + Command Strip Neo-Brutalista + Integração OSTPlayer
 */

const HomePage = {
    heroInterval: null,
    _eventsBound: false,

    /**
     * Inicializar página
     */
    async init() {
        console.log('🏠 Loading Home Page v8...');

        if (this.heroInterval) {
            clearInterval(this.heroInterval);
            this.heroInterval = null;
        }

        this.bindEventsOnce();
        this.renderGoalsWidget();
        this.renderCommandStrip();

        if (typeof Airing !== 'undefined' && Airing.init) {
            Airing.init();
        }

        // Carregar dados em paralelo
        await Promise.all([
            this.loadHeroBanner(),
            this.loadWatching(),
            this.loadAnimeOfDay(),
            this.loadTrending(),
            this.loadSeasonal(),
            this.loadTopAnime()
        ]);

        this.updateEngineTelemetry();
        console.log('✅ Home Page v8 loaded!');
    },

    bindEventsOnce() {
        if (this._eventsBound) return;
        this._eventsBound = true;

        window.addEventListener('spa:beforeNavigate', () => {
            if (this.heroInterval) {
                clearInterval(this.heroInterval);
                this.heroInterval = null;
            }
        });

        window.addEventListener('engine:apiStatusChange', () => {
            this.updateEngineTelemetry();
        });

        window.addEventListener('ost:trackchange', () => {
            this.updateRadioCommandCard();
        });
    },

    /**
     * Atualizar Painel de Controle do Dia (Command Strip)
     */
    renderCommandStrip() {
        // 1. Animdle Status
        try {
            const todayKey = new Date().toISOString().slice(0, 10);
            const rawStats = localStorage.getItem('animdle_stats_v8');
            const stats = rawStats ? JSON.parse(rawStats) : null;
            const badgeEl = document.getElementById('cmd-animdle-badge');
            const titleEl = document.getElementById('cmd-animdle-title');
            const subEl = document.getElementById('cmd-animdle-sub');
            const cardEl = document.getElementById('cmd-card-animdle');

            if (stats && stats.lastPlayedDate === todayKey) {
                if (badgeEl) {
                    badgeEl.textContent = stats.lastOutcome === 'win' ? `✅ RESOLVIDO` : 'JOGADO HOJE';
                    badgeEl.classList.add('solved-pill');
                }
                if (titleEl) {
                    titleEl.textContent = `Sequência Atual: 🔥 ${stats.currentStreak || 0} dia(s)`;
                }
                if (subEl) {
                    subEl.textContent = `Vitórias: ${stats.wins || 0}/${stats.played || 0} • Modo Treino livre disponível!`;
                }
            } else {
                if (cardEl) cardEl.classList.add('urgent-highlight');
                if (badgeEl) badgeEl.textContent = '🔥 PENDENTE';
                if (titleEl) {
                    const streak = stats?.currentStreak ? ` (🔥 ${stats.currentStreak}d)` : '';
                    titleEl.textContent = `Desafio do Dia Disponível${streak}`;
                }
            }
        } catch (_) {}

        // 2. Radio Status
        this.updateRadioCommandCard();

        // 3. Engine Telemetry
        this.updateEngineTelemetry();
    },

    updateRadioCommandCard() {
        const stationBadge = document.getElementById('cmd-radio-station');
        const trackTitle = document.getElementById('cmd-radio-track');
        if (!stationBadge || !trackTitle) return;

        try {
            const savedStationId = (typeof OSTPlayer !== 'undefined' && OSTPlayer.currentStation && OSTPlayer.currentStation !== 'random' ? OSTPlayer.currentStation : 'shonen');
            if (typeof MusicService !== 'undefined' && MusicService.getStationById) {
                const st = MusicService.getStationById(savedStationId);
                if (st) {
                    stationBadge.textContent = st.name.toUpperCase();
                }
            }

            if (typeof OSTPlayer !== 'undefined' && OSTPlayer.currentTrack) {
                const t = OSTPlayer.currentTrack;
                trackTitle.textContent = `🎵 ${t.songTitle || t.title} — ${t.animeTitle || t.anime}`;
            }
        } catch (_) {}
    },

    updateEngineTelemetry() {
        const pillEl = document.getElementById('cmd-engine-pill');
        const sourceEl = document.getElementById('cmd-engine-source');
        const descEl = document.getElementById('cmd-engine-desc');
        if (!pillEl || !sourceEl || !descEl || typeof API === 'undefined' || !API.getProviderStatus) return;

        const status = API.getProviderStatus();
        if (status.mode === 'fallback') {
            pillEl.textContent = 'MODO RESERVA';
            pillEl.classList.add('fallback-pill');
            sourceEl.textContent = '⚡ Jikan v4 (MAL) + AnimeThemes';
            descEl.textContent = 'AniList instável — Catálogo e notas servidos via MyAnimeList + AnimeThemes';
        } else {
            pillEl.textContent = 'ONLINE';
            pillEl.classList.remove('fallback-pill');
            sourceEl.textContent = '🟢 AniList GraphQL + AnimeThemes';
            descEl.textContent = 'Catálogo principal sincronizado com failover Jikan v4 pronto';
        }
    },

    /**
     * Sintonizar estação ativa da Rádio FM direto da Home
     */
    async quickTuneRadio() {
        const btn = document.getElementById('cmd-radio-play-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sintonizando...';
        }

        try {
            const stationId = (typeof OSTPlayer !== 'undefined' && OSTPlayer.currentStation && OSTPlayer.currentStation !== 'random' ? OSTPlayer.currentStation : 'shonen');
            if (typeof MusicService !== 'undefined' && typeof OSTPlayer !== 'undefined') {
                const tracks = await MusicService.getStationTracks(stationId, 'ALL');
                if (tracks && tracks.length > 0) {
                    OSTPlayer.setQueue(tracks, 0, true);
                    this.updateRadioCommandCard();
                    const st = MusicService.getStationById(stationId);
                    Common.showToast(`📻 Sintonizado na estação ${st ? st.name : 'Rádio FM'}!`);
                }
            }
        } catch (err) {
            console.error('Erro ao sintonizar rádio rápida:', err);
            Common.showToast('Abrindo Rádio FM...', 'info');
            Common.navigate('?page=radio');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-bolt"></i> Sintonizar Agora';
            }
        }
    },

    /**
     * Roleta de Openings (Descoberta Cega na Home)
     */
    async spinBlindOST() {
        const btn = document.getElementById('cmd-roulette-btn');
        const titleEl = document.getElementById('cmd-roulette-title');
        const subEl = document.getElementById('cmd-roulette-sub');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sorteando...';
        }

        try {
            if (typeof MusicService !== 'undefined' && typeof OSTPlayer !== 'undefined') {
                const tracks = await MusicService.getDiscoveryTracks({ type: 'OP', count: 10 });
                if (tracks && tracks.length > 0) {
                    const pick = tracks[Math.floor(Math.random() * tracks.length)];
                    OSTPlayer.setQueue([pick, ...tracks.filter(t => t.id !== pick.id)], 0, true);

                    if (titleEl) {
                        titleEl.textContent = `🎵 ${pick.songTitle} (${pick.themeLabel || 'OP'})`;
                    }
                    if (subEl) {
                        subEl.innerHTML = `Anime: <strong>${pick.animeTitle}</strong> ${pick.animeId ? `• <a href="?page=detalhes&id=${pick.animeId}" style="color:var(--color-primary);text-decoration:underline;">Ver Detalhes →</a>` : ''}`;
                    }
                    Common.showToast(`🎲 Tocando: ${pick.songTitle} — ${pick.animeTitle}`);
                }
            }
        } catch (err) {
            console.error('Erro na roleta OP:', err);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-dice"></i> Girar Outra OP';
            }
        }
    },

    /**
     * Tocar Opening/Ending oficial de um anime específico no OSTPlayer global
     */
    async playAnimeOST(animeId, title, image) {
        Common.showToast(`🎵 Buscando OP/ED de "${title}"...`);
        try {
            if (typeof MusicService === 'undefined' || typeof OSTPlayer === 'undefined') return;

            let tracks = await MusicService.getThemesForAnime(animeId, {
                id: animeId,
                title,
                image,
                cover: image
            });

            if (!tracks || tracks.length === 0) {
                tracks = await MusicService.searchTracks(title, 'ALL');
            }

            if (tracks && tracks.length > 0) {
                OSTPlayer.setQueue(tracks, 0, true);
                this.updateRadioCommandCard();
                Common.showToast(`▶ Tocando: ${tracks[0].songTitle} (${tracks[0].animeTitle})`);
            } else {
                Common.showToast('Nenhuma OP/ED direta encontrada; sintonizando estação temática!', 'info');
                this.quickTuneRadio();
            }
        } catch (err) {
            console.error('Erro ao tocar OST do anime:', err);
            Common.showToast('Erro ao buscar trilha sonora', 'error');
        }
    },

    /**
     * Renderizar widget de metas
     */
    renderGoalsWidget() {
        const container = document.getElementById('goals-container');
        if (container && typeof Goals !== 'undefined') {
            container.innerHTML = Goals.renderWidget();
        }

        // Render quote widget
        const quoteContainer = document.getElementById('quote-container');
        if (quoteContainer && typeof Quotes !== 'undefined') {
            quoteContainer.innerHTML = Quotes.renderWidget();
        }
    },

    /**
     * Carregar Anime do Dia (random baseado na data)
     */
    async loadAnimeOfDay() {
        const container = document.getElementById('anime-of-day-container');
        if (!container) return;

        try {
            const today = new Date().toDateString();
            const storedDate = localStorage.getItem('animeOfDay_date_v6');
            const storedAnime = localStorage.getItem('animeOfDay_anime_v6');

            let anime;

            if (storedDate === today && storedAnime) {
                try {
                    anime = JSON.parse(storedAnime);
                } catch (_) {
                    anime = null;
                }
            }

            // Se não tem anime salvo para hoje ou se tinha score falso da versão antiga, buscar novo
            if (!anime || !anime.title) {
                const seasonal = await API.getSeasonNow(1, 20);

                if (seasonal && seasonal.length > 0) {
                    const hash = today.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
                    const index = Math.abs(hash) % seasonal.length;
                    anime = seasonal[index];

                    localStorage.setItem('animeOfDay_date_v6', today);
                    localStorage.setItem('animeOfDay_anime_v6', JSON.stringify(anime));
                }
            }

            if (anime) {
                this.renderAnimeOfDay(anime);
            }
        } catch (error) {
            console.error('Erro ao carregar anime do dia:', error);
        }
    },

    /**
     * Renderizar widget de anime do dia
     */
    renderAnimeOfDay(anime) {
        const container = document.getElementById('anime-of-day-container');
        if (!container) return;

        const isFav = Storage.isFavorite(anime.id);

        const mapStatus = {
            'Currently Airing': 'Em lançamento',
            'RELEASING': 'Em lançamento',
            'Finished Airing': 'Finalizado',
            'FINISHED': 'Finalizado',
            'Not yet aired': 'Não lançado',
            'NOT_YET_RELEASED': 'Não lançado'
        };
        const statusText = mapStatus[anime.status] || anime.status || 'Em exibição';
        const safeTitle = (anime.title || '').replace(/'/g, "\\'");
        const safeImage = (anime.image || '').replace(/'/g, "\\'");

        container.innerHTML = `
            <div class="anime-of-day">
                <div class="anime-of-day-header">
                    <span class="anime-of-day-badge">🎲 ANIME DO DIA</span>
                    <span class="anime-of-day-date">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                </div>
                <div class="anime-of-day-content" onclick="Common.navigate('?page=detalhes&id=${anime.id}')">
                    <div class="anime-of-day-image">
                        <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                    </div>
                    <div class="anime-of-day-info">
                        <h3 class="anime-of-day-title">${anime.title}</h3>
                        
                        <div class="anime-of-day-meta-extended">
                            <span>${anime.year || 'N/A'}</span>
                            <span>•</span>
                            <span>${statusText}</span>
                            ${anime.studios && anime.studios.length > 0 ? `<span>•</span><span>${anime.studios[0]}</span>` : ''}
                        </div>

                        <p class="anime-of-day-synopsis extended">${anime.synopsis || 'Sem sinopse disponível.'}</p>
                        
                        <div class="anime-of-day-meta">
                            <span class="anime-of-day-score"><i class="fas fa-star"></i> ${anime.score || '-'}</span>
                            <span><i class="fas fa-tv"></i> ${anime.episodes || '?'} eps</span>
                            ${anime.genres && anime.genres.length > 0 ? `<span class="anime-of-day-genre">${anime.genres[0]}</span>` : ''}
                        </div>
                        <div class="anime-of-day-actions">
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); HomePage.playAnimeOST(${anime.id}, '${safeTitle}', '${safeImage}')" title="Ouvir Opening/Ending oficial">
                                <i class="fas fa-music"></i> Ouvir OP/ED
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); Common.openListModal({id: ${anime.id}})" title="Adicionar à Lista">
                                <i class="fas fa-plus"></i> Lista
                            </button>
                            <button class="btn btn-secondary btn-sm ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); Common.toggleFavorite(${anime.id})" title="Favoritar">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Carregar banner hero
     */
    async loadHeroBanner() {
        try {
            const trending = await API.getTrending(1, 20);

            if (trending && trending.length > 0) {
                const shuffled = [...trending].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 15);

                const anime = selected[0];
                this.updateHeroBanner(anime);

                if (this.heroInterval) clearInterval(this.heroInterval);
                let index = 0;
                this.heroInterval = setInterval(() => {
                    if (!document.getElementById('hero-banner')) {
                        clearInterval(this.heroInterval);
                        this.heroInterval = null;
                        return;
                    }
                    index = (index + 1) % selected.length;
                    this.updateHeroBanner(selected[index]);
                }, 8000);
            }
        } catch (error) {
            console.error('Erro ao carregar hero:', error);
        }
    },

    /**
     * Atualizar hero banner
     */
    updateHeroBanner(anime) {
        const banner = document.getElementById('hero-banner');
        const title = document.getElementById('hero-title');
        const synopsis = document.getElementById('hero-synopsis');
        const score = document.getElementById('hero-score');
        const eps = document.getElementById('hero-eps');
        const detailsBtn = document.getElementById('hero-details-btn');
        const ostBtn = document.getElementById('hero-ost-btn');
        const listBtn = document.getElementById('hero-list-btn');
        const favBtn = document.getElementById('hero-fav-btn');

        if (banner) {
            banner.style.backgroundImage = `url(${anime.banner || anime.image})`;
        }
        if (title) title.textContent = anime.title;
        if (synopsis) synopsis.innerHTML = anime.synopsis || '';
        if (score) score.textContent = anime.score || '-';
        if (eps) eps.textContent = anime.episodes || '?';

        if (detailsBtn) {
            detailsBtn.href = `?page=detalhes&id=${anime.id}`;
        }

        if (ostBtn) {
            ostBtn.onclick = () => this.playAnimeOST(anime.id, anime.title, anime.image);
        }

        if (listBtn) {
            listBtn.onclick = () => Common.openListModal({ id: anime.id });
        }

        if (favBtn) {
            favBtn.onclick = () => Common.toggleFavorite(anime.id);
            favBtn.classList.toggle('active', Storage.isFavorite(anime.id));
        }
    },

    /**
     * Carregar "Continuar Assistindo"
     */
    async loadWatching() {
        const lists = Storage.getLists();
        const watching = lists.watching || [];

        const container = document.getElementById('carousel-watching');
        const section = document.getElementById('section-watching');

        if (!container) return;

        if (watching.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        if (section) section.style.display = 'block';

        container.innerHTML = '';
        watching.slice(0, 10).forEach(anime => {
            const card = this.createWatchingCard(anime);
            container.appendChild(card);
        });
    },

    /**
     * Criar card de "Continuar Assistindo"
     */
    createWatchingCard(anime) {
        const progress = anime.progress || 0;
        const total = anime.episodes || 0;
        const percent = total > 0 ? Math.round((progress / total) * 100) : 0;
        const canAddMore = total === 0 || progress < total;

        const card = document.createElement('div');
        card.className = 'anime-card anime-card-watching';
        card.dataset.id = anime.id;

        card.innerHTML = `
            <div class="anime-card-image">
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                <div class="watching-progress">
                    <div class="watching-progress-bar" style="width: ${percent}%"></div>
                </div>
                <span class="watching-ep">EP ${progress}/${total || '?'}</span>
                ${canAddMore ? `
                    <button class="quick-action-btn" onclick="event.stopPropagation(); HomePage.incrementEpisode(${anime.id})" title="+1 Episódio">
                        <i class="fas fa-plus"></i>
                    </button>
                ` : ''}
            </div>
            <div class="anime-card-info">
                <h3 class="anime-card-title" title="${anime.title}">${anime.title}</h3>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                Common.navigate(`?page=detalhes&id=${anime.id}`);
            }
        });

        return card;
    },

    /**
     * Incrementar episódio diretamente da home
     */
    incrementEpisode(animeId) {
        const lists = Storage.getLists();
        const anime = lists.watching?.find(a => a.id === animeId);

        if (anime) {
            anime.progress = (anime.progress || 0) + 1;
            anime.updatedAt = new Date().toISOString();

            if (typeof Goals !== 'undefined') {
                Goals.updateProgress('episodes', 1);
                Goals.updateProgress('minutes', 24);
            }

            if (anime.episodes && anime.progress >= anime.episodes) {
                Storage.moveToList(animeId, 'watching', 'completed');
                Common.showNotification(`🎉 "${anime.title}" completo!`);

                if (typeof Goals !== 'undefined') {
                    Goals.updateProgress('completed', 1);
                }
            } else {
                Storage.save('lists', lists);
                Common.showNotification(`EP ${anime.progress}/${anime.episodes || '?'} ✓`);
                Storage.updateProgressFromEpisodes(anime, [anime.progress]);
            }

            Storage.addXP(2);
            Common.updateLevelBadge();

            this.loadWatching();
            this.renderGoalsWidget();
        }
    },

    /**
     * Carregar "Em Alta"
     */
    async loadTrending() {
        try {
            const data = await API.getTrending(1, 12);
            Common.renderCarousel('carousel-trending', data);
        } catch (error) {
            console.error('Erro ao carregar trending:', error);
            const el = document.getElementById('carousel-trending');
            if (el) el.innerHTML = '<p class="error-message">Erro ao carregar. Tente novamente.</p>';
        }
    },

    /**
     * Carregar "Temporada Atual"
     */
    async loadSeasonal() {
        try {
            const data = await API.getSeasonNow(1, 12);
            Common.renderCarousel('carousel-seasonal', data);
        } catch (error) {
            console.error('Erro ao carregar seasonal:', error);
        }
    },

    /**
     * Carregar "Mais Bem Avaliados"
     */
    async loadTopAnime() {
        try {
            const data = await API.getTopAnime(1, 12);
            Common.renderCarousel('carousel-top', data);
        } catch (error) {
            console.error('Erro ao carregar top:', error);
        }
    }
};

window.HomePage = HomePage;
if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        HomePage.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => HomePage.init());
    }
}
