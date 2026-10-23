/**
 * AnimeEngine v8 - Home Page
 * Lógica principal da Home Reimaginada + Hero Spotlight Dinâmico +
 * Rail Lateral + Vibe Discovery Matrix + Pódio Semanal Top 10 + Command Hub
 */

const HomePage = {
    heroInterval: null,
    _eventsBound: false,
    spotlightList: [],
    currentSpotlightIndex: 0,
    currentVibe: 'shonen',

    /**
     * Inicializar página
     */
    async init() {
        console.log('🏠 Loading Home Page v8 (Reimaginada)...');

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

        // Carregar blocos em paralelo
        await Promise.all([
            this.loadHeroSpotlight(),
            this.loadVibeDiscovery('shonen'),
            this.loadTop10Ranking(),
            this.loadWatching(),
            this.loadAnimeOfDay(),
            this.loadTrending(),
            this.loadSeasonal(),
            this.loadTopAnime()
        ]);

        this.updateEngineTelemetry();
        console.log('✅ Home Page v8 loaded com sucesso!');
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
     * 1. HERO SPOTLIGHT DINÂMICO & RAIL DE DESTAQUES
     */
    async loadHeroSpotlight() {
        try {
            const trending = await API.getTrending(1, 12);
            if (!trending || trending.length === 0) return;

            // Selecionar os 4 melhores para o spotlight
            this.spotlightList = trending.slice(0, 4);
            this.currentSpotlightIndex = 0;

            this.updateHeroSpotlight(this.spotlightList[0], 0);
            this.renderSpotlightRail(this.spotlightList, 0);

            // Auto-rotate a cada 9 segundos
            if (this.heroInterval) clearInterval(this.heroInterval);
            this.heroInterval = setInterval(() => {
                if (!document.getElementById('hero-spotlight')) {
                    clearInterval(this.heroInterval);
                    this.heroInterval = null;
                    return;
                }
                const nextIdx = (this.currentSpotlightIndex + 1) % this.spotlightList.length;
                this.switchSpotlight(nextIdx);
            }, 9000);

        } catch (error) {
            console.error('Erro ao carregar Hero Spotlight:', error);
        }
    },

    switchSpotlight(index) {
        if (!this.spotlightList || !this.spotlightList[index]) return;
        this.currentSpotlightIndex = index;
        this.updateHeroSpotlight(this.spotlightList[index], index);

        // Atualizar classes ativas no rail
        document.querySelectorAll('.rail-item').forEach((item, idx) => {
            item.classList.toggle('active', idx === index);
        });

        const counter = document.getElementById('hero-rail-counter');
        if (counter) counter.textContent = `${index + 1} / ${this.spotlightList.length}`;
    },

    updateHeroSpotlight(anime, index) {
        const backdrop = document.getElementById('hero-backdrop');
        const badge = document.getElementById('hero-badge');
        const format = document.getElementById('hero-format');
        const year = document.getElementById('hero-year');
        const title = document.getElementById('hero-title');
        const romaji = document.getElementById('hero-romaji');
        const synopsis = document.getElementById('hero-synopsis');
        const score = document.getElementById('hero-score');
        const eps = document.getElementById('hero-eps');
        const studio = document.getElementById('hero-studio');
        const detailsBtn = document.getElementById('hero-details-btn');
        const ostBtn = document.getElementById('hero-ost-btn');
        const listBtn = document.getElementById('hero-list-btn');

        if (backdrop) {
            const bgImg = anime.banner || anime.image;
            backdrop.style.backgroundImage = `url(${bgImg})`;
        }

        if (badge) {
            const badges = ['🔥 DESTAQUE #1 DA SEMANA', '⚡ SUPREMO EM ALTA', '⭐ RECOMENDAÇÃO CRÍTICA', '🏆 TOP POPULARIDADE'];
            badge.textContent = badges[index] || '🔥 EM DESTAQUE';
        }

        if (format) format.textContent = anime.format || 'TV';
        if (year) year.textContent = anime.year || anime.seasonYear || '2026';
        if (title) title.textContent = anime.title || 'Sem título';
        if (romaji) romaji.textContent = anime.title_romaji || anime.title_native || (anime.genres ? anime.genres.slice(0, 3).join(' • ') : 'Anime em Destaque');

        if (synopsis) {
            const rawSyn = (anime.synopsis || '').replace(/<[^>]*>/g, '').trim();
            synopsis.textContent = rawSyn.slice(0, 220) + (rawSyn.length > 220 ? '...' : '');
        }

        if (score) score.textContent = anime.score || '8.8';
        if (eps) eps.textContent = (anime.episodes || '?') + ' eps';
        if (studio) studio.textContent = (anime.studios && anime.studios[0]) ? anime.studios[0] : (anime.genres ? anime.genres[0] : 'Japão');

        if (detailsBtn) {
            detailsBtn.href = `?page=detalhes&id=${anime.id}`;
        }

        if (ostBtn) {
            ostBtn.onclick = () => this.playAnimeOST(anime.id, anime.title, anime.image);
        }

        if (listBtn) {
            listBtn.onclick = () => Common.openListModal({ id: anime.id });
        }
    },

    renderSpotlightRail(animes, activeIdx) {
        const container = document.getElementById('hero-rail-items');
        if (!container) return;

        container.innerHTML = animes.map((a, idx) => `
            <div class="rail-item ${idx === activeIdx ? 'active' : ''}" onclick="HomePage.switchSpotlight(${idx})">
                <div class="rail-thumb">
                    <img src="${a.image || 'img/placeholder.jpg'}" alt="${a.title}" loading="lazy" />
                </div>
                <div class="rail-info">
                    <span class="rail-title">${a.title}</span>
                    <span class="rail-meta">
                        <i class="fas fa-star"></i> ${a.score || '-'} • ${a.format || 'TV'}
                    </span>
                </div>
            </div>
        `).join('');
    },

    /**
     * 2. DISCOVERY MATRIX (DESCOBERTA POR VIBE / MOOD)
     */
    async loadVibeDiscovery(vibeKey) {
        const carousel = document.getElementById('carousel-vibe');
        if (!carousel) return;

        carousel.innerHTML = '<div class="carousel-loading"><div class="loader"></div></div>';

        const vibeGenres = {
            'shonen': 'Action',
            'cyberpunk': 'Sci-Fi',
            'cozy': 'Slice of Life',
            'drama': 'Drama',
            'mindfuck': 'Mystery',
            'fantasy': 'Fantasy'
        };

        const targetGenre = vibeGenres[vibeKey] || 'Action';

        try {
            let data = [];
            if (typeof API.getAnimeByGenre === 'function') {
                data = await API.getAnimeByGenre(targetGenre, 1, 10);
            }
            
            if (!data || data.length === 0) {
                // Fallback para getSeasonNow ou Trending filtrado
                const fallbackList = await API.getSeasonNow(1, 16);
                data = fallbackList.filter(a => (a.genres || []).some(g => g.toLowerCase() === targetGenre.toLowerCase()));
                if (data.length === 0) data = fallbackList.slice(0, 10);
            }

            Common.renderCarousel('carousel-vibe', data);
        } catch (error) {
            console.error('Erro ao carregar vibe:', error);
            carousel.innerHTML = '<p class="error-message">Não foi possível carregar a vibe selecionada.</p>';
        }
    },

    selectVibe(vibeKey, btnEl) {
        this.currentVibe = vibeKey;

        document.querySelectorAll('.vibe-pill').forEach(btn => {
            btn.classList.toggle('active', btn === btnEl);
        });

        this.loadVibeDiscovery(vibeKey);
    },

    /**
     * 3. TOP 10 SEMANAL COM PÓDIO VISUAL (#1, #2, #3)
     */
    async loadTop10Ranking() {
        const container = document.getElementById('home-ranking-podium');
        if (!container) return;

        try {
            const data = await API.getTopAnime(1, 10);
            if (!data || data.length === 0) {
                container.innerHTML = '<p class="empty-state">Ranking temporariamente indisponível.</p>';
                return;
            }

            const top3 = data.slice(0, 3);
            const others = data.slice(3, 10);

            let html = '';

            // Top 3 Podium Cards
            top3.forEach((anime, idx) => {
                const rankNum = idx + 1;
                html += `
                    <div class="podium-card rank-${rankNum}">
                        <div class="podium-rank-tag">#${rankNum}</div>
                        <div class="podium-cover">
                            <img src="${anime.image}" alt="${anime.title}" loading="lazy" />
                        </div>
                        <h3 class="podium-title text-truncate">${anime.title}</h3>
                        <div class="podium-metrics">
                            <span class="podium-score"><i class="fas fa-star"></i> ${anime.score || '9.0'}</span>
                            <span style="font-size: 0.72rem; color: var(--color-text-muted);">• ${anime.format || 'TV'}</span>
                        </div>
                        <div style="display: flex; gap: 6px; margin-top: auto;">
                            <a href="?page=detalhes&id=${anime.id}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;">
                                Detalhes
                            </a>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="HomePage.playAnimeOST(${anime.id}, '${(anime.title || '').replace(/'/g, "\\'")}', '${anime.image}')" title="Ouvir Abertura">
                                <i class="fas fa-music"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            // Mini-table para Ranks 4 a 10
            html += `<div class="ranking-mini-list">`;
            others.forEach((anime, idx) => {
                const rankNum = idx + 4;
                html += `
                    <a href="?page=detalhes&id=${anime.id}" class="ranking-mini-row">
                        <span class="mini-row-num">#${rankNum}</span>
                        <span class="mini-row-title text-truncate">${anime.title}</span>
                        <span class="mini-row-score"><i class="fas fa-star"></i> ${anime.score || '-'}</span>
                    </a>
                `;
            });
            html += `</div>`;

            container.innerHTML = html;

        } catch (error) {
            console.error('Erro ao carregar Top 10 ranking:', error);
            container.innerHTML = '<p class="error-message">Erro ao carregar o pódio semanal.</p>';
        }
    },

    /**
     * 4. COMMAND STRIP UTILITIES (RÁDIO, ANIMDLE, ROLETA, MOTOR)
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

            if (stats && stats.lastPlayedDate === todayKey) {
                if (badgeEl) {
                    badgeEl.textContent = stats.todaySolved ? 'RESOLVIDO' : 'JOGADO';
                    badgeEl.className = 'command-status-pill ' + (stats.todaySolved ? 'solved-pill' : 'live-pill');
                }
                if (titleEl) {
                    titleEl.textContent = stats.todaySolved ? '🎉 Desafio Concluído!' : 'Desafio Tentado!';
                }
                if (subEl) {
                    subEl.textContent = `Streak atual: ${stats.streak || 1} dia(s) consecutivo(s)`;
                }
            } else {
                if (titleEl) titleEl.textContent = 'Animdle — Desafio Diário';
            }
        } catch (_) {}

        this.updateRadioCommandCard();
    },

    updateRadioCommandCard() {
        try {
            const stationEl = document.getElementById('cmd-radio-station');
            const trackEl = document.getElementById('cmd-radio-track');

            if (typeof MusicService !== 'undefined' && MusicService.getStationById) {
                const stId = MusicService.currentStation || 'shonen';
                const st = MusicService.getStationById(stId);
                if (st && stationEl) {
                    stationEl.textContent = st.shortName || st.name;
                }
            }

            if (typeof OSTPlayer !== 'undefined' && OSTPlayer.currentTrack) {
                const track = OSTPlayer.currentTrack;
                if (trackEl && track.songTitle) {
                    trackEl.textContent = `Tocando: ${track.songTitle} (${track.animeTitle || ''})`;
                }
            }
        } catch (_) {}
    },

    updateEngineTelemetry() {
        const pill = document.getElementById('cmd-engine-pill');
        const src = document.getElementById('cmd-engine-source');
        const desc = document.getElementById('cmd-engine-desc');

        if (!pill || !src) return;

        const cdVal = Number(sessionStorage.getItem('ae_anilist_cooldown') || 0);
        const isAnilistCooldown = cdVal > Date.now();
        if (isAnilistCooldown) {
            pill.textContent = 'FALLBACK';
            pill.className = 'command-status-pill fallback-pill';
            src.textContent = 'AnimeThemes HD (Resiliente)';
            if (desc) desc.textContent = 'AniList em cooldown temporário. Motor operando via AnimeThemes HD.';
        } else {
            pill.textContent = 'ONLINE';
            pill.className = 'command-status-pill live-pill';
            src.textContent = 'AniList GraphQL (Primária)';
            if (desc) desc.textContent = 'Catálogo de alta fidelidade sincronizado diretamente com AniList GraphQL oficial.';
        }
    },

    async quickTuneRadio() {
        const btn = document.getElementById('cmd-radio-play-btn');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sintonizando...';

        try {
            if (typeof MusicService !== 'undefined' && typeof OSTPlayer !== 'undefined') {
                const station = MusicService.currentStation || 'shonen';
                const tracks = await MusicService.loadStationTracks(station);
                if (tracks && tracks.length > 0) {
                    OSTPlayer.setPlaylist(tracks);
                    OSTPlayer.playIndex(0);
                    OSTPlayer.show();
                    Common.showNotification('📻 Rádio FM sintonizada com sucesso!');
                }
            }
        } catch (err) {
            console.error('Erro ao sintonizar rádio:', err);
            Common.showNotification('Erro ao conectar à rádio', 'error');
        } finally {
            if (btn) btn.innerHTML = '<i class="fas fa-bolt"></i> Sintonizar';
        }
    },

    async spinBlindOST() {
        const btn = document.getElementById('cmd-roulette-btn');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sorteando...';

        try {
            if (typeof MusicService !== 'undefined' && typeof OSTPlayer !== 'undefined') {
                const stations = ['shonen', 'cyberpunk', 'nostalgia', 'hype', 'dark'];
                const randStation = stations[Math.floor(Math.random() * stations.length)];
                const tracks = await MusicService.loadStationTracks(randStation);
                if (tracks && tracks.length > 0) {
                    const randTrack = tracks[Math.floor(Math.random() * tracks.length)];
                    OSTPlayer.setPlaylist([randTrack]);
                    OSTPlayer.playIndex(0);
                    OSTPlayer.show();

                    const titleEl = document.getElementById('cmd-roulette-title');
                    const subEl = document.getElementById('cmd-roulette-sub');
                    if (titleEl) titleEl.textContent = `🎯 Sorteado: ${randTrack.songTitle}`;
                    if (subEl) subEl.textContent = `Anime: ${randTrack.animeTitle}`;

                    Common.showNotification(`🎲 Roleta: Tocando ${randTrack.songTitle}!`);
                }
            }
        } catch (err) {
            console.error('Erro na Roleta:', err);
            Common.showNotification('Erro ao sortear música', 'error');
        } finally {
            if (btn) btn.innerHTML = '<i class="fas fa-dice"></i> Girar Roleta';
        }
    },

    async playAnimeOST(animeId, title, image) {
        try {
            Common.showNotification(`🔍 Buscando abertura oficial de ${title}...`);
            const tracks = await API.getAnimeThemes(animeId);
            if (!tracks || tracks.length === 0) {
                Common.showNotification('Nenhuma abertura encontrada para esta obra.', 'info');
                return;
            }

            const formatted = tracks.map(t => ({
                id: t.id || Math.random(),
                songTitle: t.song?.title || t.title || 'Tema Oficial',
                animeTitle: title,
                themeLabel: t.slug || t.type || 'OP',
                audioUrl: t.audioUrl || (t.animethemeentries?.[0]?.videos?.[0]?.audio?.link) || (t.videos?.[0]?.link),
                videoUrl: t.videoUrl || (t.animethemeentries?.[0]?.videos?.[0]?.link) || (t.videos?.[0]?.link),
                coverImage: image
            })).filter(t => t.audioUrl || t.videoUrl);

            if (tracks && tracks.length > 0 && typeof OSTPlayer !== 'undefined') {
                OSTPlayer.setPlaylist(formatted);
                OSTPlayer.playIndex(0);
                OSTPlayer.show();
                Common.showNotification(`🎵 Tocando abertura oficial de ${title}!`);
            }
        } catch (err) {
            console.error('Erro ao tocar OST:', err);
            Common.showNotification('Erro ao carregar trilha sonora.', 'error');
        }
    },

    renderGoalsWidget() {
        try {
            const container = document.getElementById('goals-container');
            if (container && typeof Goals !== 'undefined') {
                if (typeof Goals.render === 'function') {
                    Goals.render('goals-container');
                } else if (typeof Goals.renderWidget === 'function') {
                    container.innerHTML = Goals.renderWidget();
                }
            }

            const quoteContainer = document.getElementById('quote-container');
            if (quoteContainer && typeof Quotes !== 'undefined') {
                if (typeof Quotes.render === 'function') {
                    Quotes.render('quote-container');
                } else if (typeof Quotes.renderWidget === 'function') {
                    quoteContainer.innerHTML = Quotes.renderWidget();
                }
            }
        } catch (err) {
            console.warn('[Home] Erro não-bloqueante no widget de metas/quotes:', err);
        }
    },

    async loadAnimeOfDay() {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem('aotd_date');
        const storedAnime = localStorage.getItem('aotd_data');

        if (storedDate === today && storedAnime) {
            try {
                this.renderAnimeOfDay(JSON.parse(storedAnime));
                return;
            } catch (_) {}
        }

        try {
            let anime = await API.getRandomAnime();
            if (!anime || !anime.title) {
                const seasonal = await API.getSeasonNow(1, 10);
                if (seasonal && seasonal.length > 0) {
                    anime = seasonal[Math.floor(Math.random() * seasonal.length)];
                }
            }

            if (anime) {
                localStorage.setItem('aotd_date', today);
                localStorage.setItem('aotd_data', JSON.stringify(anime));
                this.renderAnimeOfDay(anime);
            }
        } catch (error) {
            console.error('Erro ao carregar anime do dia:', error);
        }
    },

    renderAnimeOfDay(anime) {
        const container = document.getElementById('anime-of-day-container');
        if (!container) return;

        const cleanSynopsis = (anime.synopsis || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\(Source:.*?\)/gi, '').trim();
        const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
        
        const genres = Array.isArray(anime.genres) ? anime.genres.slice(0, 3) : (typeof anime.genres === 'string' ? anime.genres.split(',').slice(0, 3) : []);
        const genresHtml = genres.map(g => `<span class="aotd-genre-pill">${g.trim()}</span>`).join('');

        container.innerHTML = `
            <div class="anime-of-day">
                <div class="anime-of-day-header">
                    <div class="anime-of-day-badge">
                        <i class="fas fa-star"></i> DESTAQUE ESPECIAL DO DIA
                    </div>
                    <div class="anime-of-day-date">
                        <i class="fas fa-calendar-day"></i> ${dateStr}
                    </div>
                </div>
                <div class="anime-of-day-content">
                    <div class="anime-of-day-image" onclick="Common.navigate('?page=detalhes&id=${anime.id}')" title="Ver ${anime.title}">
                        <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                        <span class="anime-of-day-format-badge">${anime.format || 'TV'}</span>
                    </div>
                    <div class="anime-of-day-info">
                        <div class="anime-of-day-meta-tags">
                            <span class="aotd-score-badge"><i class="fas fa-star"></i> ${anime.score || '-'} / 10</span>
                            ${anime.year ? `<span class="aotd-meta-pill"><i class="fas fa-calendar"></i> ${anime.year}</span>` : ''}
                            ${anime.episodes ? `<span class="aotd-meta-pill"><i class="fas fa-layer-group"></i> ${anime.episodes} eps</span>` : ''}
                            ${genresHtml}
                        </div>
                        <h3 class="anime-of-day-title" onclick="Common.navigate('?page=detalhes&id=${anime.id}')">${anime.title}</h3>
                        ${anime.title_english && anime.title_english !== anime.title ? `<div class="anime-of-day-sub">${anime.title_english}</div>` : ''}
                        <p class="anime-of-day-synopsis">${cleanSynopsis || 'Sem sinopse disponível para este anime.'}</p>
                        <div class="anime-of-day-actions">
                            <a href="?page=detalhes&id=${anime.id}" class="btn btn-primary">
                                <i class="fas fa-info-circle"></i> Ver Detalhes
                            </a>
                            <button type="button" class="btn btn-secondary" onclick="HomePage.playAnimeOST(${anime.id}, '${(anime.title || '').replace(/'/g, "\\'")}', '${anime.image}')">
                                <i class="fas fa-music"></i> Ouvir Abertura
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

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

    createWatchingCard(anime) {
        const progress = anime.progress || 0;
        const total = anime.episodes || 0;
        const percent = total > 0 ? Math.round((progress / total) * 100) : 0;
        const canAddMore = total === 0 || progress < total;

        const card = document.createElement('div');
        card.className = 'watching-card';
        card.innerHTML = `
            <div class="watching-cover-wrap">
                <img src="${anime.image}" alt="${anime.title}" class="watching-cover" loading="lazy">
                <button class="watching-btn-add ${!canAddMore ? 'disabled' : ''}" 
                        onclick="HomePage.incrementEpisode(${anime.id})"
                        title="${canAddMore ? 'Marcar +1 ep' : 'Concluído'}">
                    <i class="fas ${canAddMore ? 'fa-plus' : 'fa-check'}"></i>
                </button>
            </div>
            <div class="watching-info">
                <h4 class="watching-title text-truncate" title="${anime.title}">${anime.title}</h4>
                <div class="watching-progress-bar">
                    <div class="watching-progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="watching-meta">
                    <span class="watching-eps">Ep ${progress}${total ? '/' + total : ''}</span>
                    <a href="?page=detalhes&id=${anime.id}" class="watching-link">Abrir →</a>
                </div>
            </div>
        `;
        return card;
    },

    incrementEpisode(animeId) {
        const anime = Storage.getAnime('watching', animeId);
        if (anime) {
            anime.progress = (anime.progress || 0) + 1;
            Storage.updateProgress('watching', animeId, anime.progress);

            if (typeof Goals !== 'undefined') {
                Goals.increment('episodes_watched');
            }

            if (anime.episodes && anime.progress >= anime.episodes) {
                Storage.moveToList('watching', 'completed', animeId);
                Common.showNotification(`🎉 Parabéns! Você concluiu ${anime.title}!`, 'success');
                if (typeof Goals !== 'undefined') {
                    Goals.increment('animes_completed');
                }
            } else {
                Common.showNotification(`Episódio ${anime.progress} marcado!`);
            }

            this.loadWatching();
        }
    },

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

    async loadSeasonal() {
        try {
            const data = await API.getSeasonNow(1, 12);
            Common.renderCarousel('carousel-seasonal', data);
        } catch (error) {
            console.error('Erro ao carregar seasonal:', error);
        }
    },

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
