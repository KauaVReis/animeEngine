/**
 * AnimeEngine v7 - Calendario Page
 * Grade semanal de animes da temporada atual
 */

const CalendarioPage = {
    // Estado
    currentYear: new Date().getFullYear(),
    currentSeason: null,
    animes: [],
    filter: 'all',
    countdownInterval: null,
    animesByDay: {},

    // Mapping de temporadas
    seasons: ['winter', 'spring', 'summer', 'fall'],
    seasonNames: {
        winter: { name: 'Inverno', icon: '❄️', months: 'Jan-Mar' },
        spring: { name: 'Primavera', icon: '🌸', months: 'Abr-Jun' },
        summer: { name: 'Verão', icon: '☀️', months: 'Jul-Set' },
        fall: { name: 'Outono', icon: '🍂', months: 'Out-Dez' }
    },

    // Mapping de dias
    dayMapping: {
        'Sundays': 'sunday', 'Mondays': 'monday', 'Tuesdays': 'tuesday',
        'Wednesdays': 'wednesday', 'Thursdays': 'thursday',
        'Fridays': 'friday', 'Saturdays': 'saturday'
    },

    /**
     * Inicializar página
     */
    async init() {
        console.log('📅 Loading Calendario Page...');
        this.currentSeason = this.getCurrentSeason();
        await this.loadSeason();
        console.log('✅ Calendario Page loaded!');
    },

    /**
     * Determinar temporada pelo mês atual
     */
    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 1 && month <= 3) return 'winter';
        if (month >= 4 && month <= 6) return 'spring';
        if (month >= 7 && month <= 9) return 'summer';
        return 'fall';
    },

    /**
     * Carregar animes da temporada
     */
    async loadSeason() {
        const loading = document.getElementById('calendar-loading');
        const week = document.getElementById('calendar-week');

        if (loading) loading.style.display = 'flex';
        if (week) week.style.display = 'none';

        this.updateSeasonDisplay();

        // Parar countdown anterior
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        try {
            const data = await API.getSeason(this.currentYear, this.currentSeason, 1, 50);
            this.animes = data || [];
            this.renderCalendar();
            this.startCountdowns();
        } catch (error) {
            console.error('Erro ao carregar temporada:', error);
            this.showError();
        } finally {
            if (loading) loading.style.display = 'none';
            if (week) week.style.display = 'grid';
        }
    },

    /**
     * Atualizar display da temporada
     */
    updateSeasonDisplay() {
        const display = document.getElementById('season-display');
        if (!display) return;

        const season = this.seasonNames[this.currentSeason];
        display.innerHTML = `
            <span class="season-icon">${season.icon}</span>
            <div class="season-info">
                <span class="season-name">${season.name} ${this.currentYear}</span>
                <span class="season-months">${season.months}</span>
            </div>
        `;
    },

    prevSeason() {
        const idx = this.seasons.indexOf(this.currentSeason);
        if (idx === 0) { this.currentSeason = 'fall'; this.currentYear--; }
        else { this.currentSeason = this.seasons[idx - 1]; }
        this.loadSeason();
    },

    nextSeason() {
        const idx = this.seasons.indexOf(this.currentSeason);
        if (idx === 3) { this.currentSeason = 'winter'; this.currentYear++; }
        else { this.currentSeason = this.seasons[idx + 1]; }
        this.loadSeason();
    },

    /**
     * Obter IDs de animes da lista "watching" do usuário
     */
    getFollowingIds() {
        try {
            // Tenta via Storage v7 (KEYS.LISTS)
            if (typeof Storage !== 'undefined' && Storage.getLists) {
                const lists = Storage.getLists();
                const watching = lists.watching || [];
                return watching.map(a => parseInt(a.id || a.anime_id));
            }
        } catch (e) {}
        return [];
    },

    /**
     * Renderizar calendário completo
     */
    renderCalendar() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        days.forEach(day => {
            const container = document.getElementById(`animes-${day}`);
            const count = document.getElementById(`count-${day}`);
            if (container) container.innerHTML = '';
            if (count) count.textContent = '0';
        });

        const animesByDay = {
            sunday: [], monday: [], tuesday: [], wednesday: [],
            thursday: [], friday: [], saturday: [], unknown: []
        };

        const following = this.getFollowingIds();
        const now = Date.now() / 1000; // Unix timestamp atual

        this.animes.forEach(anime => {
            let day = 'unknown';
            let airingAt = null;

            if (anime.nextAiringEpisode && anime.nextAiringEpisode.airingAt) {
                airingAt = anime.nextAiringEpisode.airingAt;
                const date = new Date(airingAt * 1000);
                day = days[date.getDay()];
            } else if (anime.broadcast && anime.broadcast.day) {
                day = this.dayMapping[anime.broadcast.day] || 'unknown';
            }

            // Status de transmissão
            anime.airingAt = airingAt;
            anime.isLive = airingAt && (now - airingAt) >= 0 && (now - airingAt) <= 3600; // passou há menos de 1h
            anime.isPast = airingAt && (now - airingAt) > 3600;
            anime.isFuture = airingAt && airingAt > now;
            anime.isFollowing = following.includes(parseInt(anime.id));

            // Aplicar filtros
            if (day !== 'unknown') animesByDay[day].push(anime);
        });

        this.animesByDay = animesByDay;
        this.updateOverview(animesByDay);
        this.updateDayTabs(animesByDay);

        // Ordenar por horário de exibição
        days.forEach(day => {
            animesByDay[day].sort((a, b) => (a.airingAt || 0) - (b.airingAt || 0));

            const container = document.getElementById(`animes-${day}`);
            const countEl = document.getElementById(`count-${day}`);
            const dayEl = document.querySelector(`.calendar-day[data-day="${day}"]`);
            const visible = this.shouldShowDay(day);
            const animes = visible ? animesByDay[day].filter(anime => this.shouldShowAnime(anime, day)) : [];

            if (dayEl) dayEl.style.display = visible ? '' : 'none';

            if (countEl) countEl.textContent = animes.length;

            if (container) {
                if (animes.length === 0) {
                    container.innerHTML = '<div class="day-empty">Nenhum anime neste filtro</div>';
                } else {
                    container.innerHTML = animes.map(anime => this.createAnimeCard(anime)).join('');
                }
            }
        });

        this.highlightToday();
        this.updateFilterState();
    },

    shouldShowDay(day) {
        const dayFilters = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return !dayFilters.includes(this.filter) || this.filter === day;
    },

    shouldShowAnime(anime, day) {
        const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
        if (this.filter === 'following') return anime.isFollowing;
        if (this.filter === 'today') return day === today;
        if (this.filter === 'live') return anime.isLive;
        if (this.filter === 'upcoming') return anime.isFuture;
        if (this.filter === 'past') return anime.isPast;
        return true;
    },

    updateOverview(animesByDay) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const all = days.flatMap(day => animesByDay[day] || []);
        const today = days[new Date().getDay()];
        const todayCount = (animesByDay[today] || []).length;
        const liveCount = all.filter(anime => anime.isLive).length;
        const followingCount = all.filter(anime => anime.isFollowing).length;
        const next = all
            .filter(anime => anime.airingAt && anime.isFuture)
            .sort((a, b) => a.airingAt - b.airingAt)[0];

        const stats = document.getElementById('calendar-season-stats');
        if (stats) {
            stats.innerHTML = `
                <div class="calendar-stat"><strong>${all.length}</strong><span>Total</span></div>
                <div class="calendar-stat"><strong>${todayCount}</strong><span>Hoje</span></div>
                <div class="calendar-stat"><strong>${liveCount}</strong><span>No ar</span></div>
                <div class="calendar-stat"><strong>${followingCount}</strong><span>Seguindo</span></div>
            `;
        }

        const nextCard = document.getElementById('calendar-next-card');
        if (!nextCard) return;

        if (!next) {
            nextCard.onclick = null;
            nextCard.innerHTML = `
                <div class="calendar-next-icon"><i class="fas fa-moon"></i></div>
                <div class="calendar-next-info">
                    <span class="calendar-eyebrow">Agenda tranquila</span>
                    <strong>Nenhum próximo episódio encontrado</strong>
                    <small>Tente outra temporada ou veja os episódios já exibidos.</small>
                </div>
            `;
            return;
        }

        const date = new Date(next.airingAt * 1000);
        nextCard.innerHTML = `
            <img src="${next.image || 'assets/logo.png'}" alt="${next.title}" onerror="this.onerror=null;this.src='assets/logo.png';">
            <div class="calendar-next-info">
                <span class="calendar-eyebrow">Próximo episódio</span>
                <strong>${next.title}</strong>
                <small>${date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • ${next.nextAiringEpisode ? `Ep. ${next.nextAiringEpisode.episode}` : 'Novo episódio'}</small>
            </div>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); Common.goToAnimeDetails(${next.id}, document.getElementById('calendar-next-card'))">
                <i class="fas fa-play"></i> Ver
            </button>
        `;
        nextCard.onclick = () => Common.goToAnimeDetails(next.id, nextCard);
    },

    updateDayTabs(animesByDay) {
        document.querySelectorAll('.calendar-day-tab').forEach(tab => {
            const filter = tab.dataset.filter;
            const count = tab.querySelector('span');
            if (count && animesByDay[filter]) count.textContent = animesByDay[filter].length;
        });
    },

    updateFilterState() {
        document.querySelectorAll('.filter-btn, .calendar-day-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.filter);
        });
    },

    /**
     * Criar card de anime para o calendário
     */
    createAnimeCard(anime) {
        const now = Date.now() / 1000;
        let timeLabel = '??:??';
        let countdownHtml = '';
        let badgeHtml = '';

        if (anime.airingAt) {
            const date = new Date(anime.airingAt * 1000);
            timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            if (anime.isLive) {
                badgeHtml = `<span class="badge-live">🔴 NO AR</span>`;
            } else if (anime.isFuture) {
                const diff = anime.airingAt - now;
                countdownHtml = `<span class="countdown" data-airing="${anime.airingAt}">${this.formatCountdown(diff)}</span>`;
            }
        }

        const episodes = anime.episodes || '?';
        const image = anime.image || 'assets/logo.png';
        const nextEp = anime.nextAiringEpisode ? `Ep. ${anime.nextAiringEpisode.episode}` : '';

        return `
            <div class="calendar-anime ${anime.isFollowing ? 'following' : ''} ${anime.isLive ? 'is-live' : ''}"
                 onclick="window.location='detalhes.php?id=${anime.id}'">
                <img src="${image}" alt="${anime.title}" loading="lazy" onerror="this.onerror=null;this.src='assets/logo.png';">
                <div class="calendar-anime-info">
                    ${badgeHtml}
                    <div class="calendar-anime-title">${anime.title}</div>
                    <div class="calendar-anime-meta">
                        <span class="calendar-time"><i class="fas fa-clock"></i> ${timeLabel}</span>
                        <span class="calendar-eps">${nextEp || episodes + ' eps'}</span>
                    </div>
                    ${countdownHtml ? `<div class="calendar-countdown"><i class="fas fa-hourglass-half"></i> ${countdownHtml}</div>` : ''}
                </div>
                <button class="calendar-follow-btn ${anime.isFollowing ? 'active' : ''}"
                        onclick="event.stopPropagation(); CalendarioPage.toggleFollow(${anime.id}, '${anime.title.replace(/'/g, "\\'")}', '${image}', ${anime.episodes || 0})"
                        title="${anime.isFollowing ? 'Remover de Assistindo' : 'Adicionar a Assistindo'}">
                    <i class="fas ${anime.isFollowing ? 'fa-bell-slash' : 'fa-bell'}"></i>
                </button>
            </div>
        `;
    },

    /**
     * Formatar contagem regressiva
     */
    formatCountdown(seconds) {
        if (seconds <= 0) return 'agora';
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    },

    /**
     * Iniciar atualização dos countdowns a cada segundo
     */
    startCountdowns() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        this.countdownInterval = setInterval(() => {
            const now = Date.now() / 1000;
            document.querySelectorAll('.countdown[data-airing]').forEach(el => {
                const airingAt = parseFloat(el.dataset.airing);
                const diff = airingAt - now;

                if (diff <= 0) {
                    // Passou agora! Atualizar card para "NO AR"
                    clearInterval(this.countdownInterval);
                    this.renderCalendar();
                    this.startCountdowns();
                } else {
                    el.textContent = this.formatCountdown(diff);
                }
            });
        }, 1000);
    },

    /**
     * Destacar dia atual
     */
    highlightToday() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];

        document.querySelectorAll('.calendar-day').forEach(el => {
            el.classList.remove('today');
            if (el.dataset.day === today) el.classList.add('today');
        });

        // Scroll automático para o dia de hoje
        const todayEl = document.querySelector(`.calendar-day[data-day="${today}"]`);
        const week = document.getElementById('calendar-week');
        if (todayEl && week && this.filter === 'all') {
            setTimeout(() => {
                week.scrollTo({
                    left: Math.max(todayEl.offsetLeft - week.offsetLeft - 16, 0),
                    behavior: 'smooth'
                });
            }, 300);
        }
    },

    /**
     * Filtrar por dia/tipo
     */
    filterDay(filter) {
        this.filter = filter;
        this.renderCalendar();
    },

    /**
     * Toggle seguir anime (integração com Storage v7)
     */
    async toggleFollow(animeId, title, image, episodes) {
        const status = typeof Storage !== 'undefined' && Storage.getAnimeStatus
            ? Storage.getAnimeStatus(animeId)
            : null;

        if (status === 'watching') {
            Common.confirm({
                title: 'Remover de Assistindo',
                message: `Remover "${title}" da lista Assistindo?`,
                confirmText: 'Remover',
                onConfirm: async () => {
                    if (typeof Storage !== 'undefined' && Storage.removeFromAllLists) {
                        Storage.removeFromAllLists(animeId);

                        try {
                            await Common.apiFetch('api/lists/delete.php', {
                                method: 'POST',
                                body: JSON.stringify({ anime_id: animeId })
                            });
                            Common.showNotification('Removido de Assistindo');
                        } catch (e) {
                            Common.showNotification(e.message || 'Erro ao remover', 'error');
                        }
                    }
                }
            });
        } else {
            // Adicionar a "watching"
            if (typeof Storage !== 'undefined' && Storage.addToList) {
                await Storage.addToList('watching', {
                    id: animeId,
                    title: { romaji: title },
                    coverImage: { large: image },
                    episodes: episodes
                });
            }
            Common.showNotification('Adicionado a Assistindo! 📺');
            Storage.addXP && Storage.addXP(5);
        }

        this.renderCalendar();
    },

    /**
     * Mostrar erro
     */
    showError() {
        const week = document.getElementById('calendar-week');
        if (week) {
            week.innerHTML = `
                <div class="error-container" style="grid-column: 1/-1;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar animes da temporada</p>
                    <button class="btn btn-primary" onclick="CalendarioPage.loadSeason()">
                        <i class="fas fa-redo"></i> Tentar novamente
                    </button>
                </div>
            `;
            week.style.display = 'block';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => CalendarioPage.init());
