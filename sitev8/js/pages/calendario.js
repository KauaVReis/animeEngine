/**
 * AnimeEngine v8 - Calendario Page
 * Grade semanal e guia de transmissão de animes da temporada
 */

const CalendarioPage = {
    // Estado
    currentYear: new Date().getFullYear(),
    currentSeason: null,
    animes: [],
    filter: 'all',          // 'all', 'today', 'following'
    searchQuery: '',
    selectedDay: 'sunday',  // dia selecionado para o modo dia
    viewMode: 'week',       // 'week' ou 'day'
    countdownInterval: null,

    // Temporadas
    seasons: ['winter', 'spring', 'summer', 'fall'],
    seasonNames: {
        winter: { name: 'Inverno', icon: '❄️', months: 'Jan - Mar' },
        spring: { name: 'Primavera', icon: '🌸', months: 'Abr - Jun' },
        summer: { name: 'Verão', icon: '☀️', months: 'Jul - Set' },
        fall: { name: 'Outono', icon: '🍂', months: 'Out - Dez' }
    },

    // Dias da semana
    days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    dayNamesPt: {
        sunday: 'Domingo',
        monday: 'Segunda-feira',
        tuesday: 'Terça-feira',
        wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira',
        friday: 'Sexta-feira',
        saturday: 'Sábado'
    },
    dayMapping: {
        'Sundays': 'sunday', 'Mondays': 'monday', 'Tuesdays': 'tuesday',
        'Wednesdays': 'wednesday', 'Thursdays': 'thursday',
        'Fridays': 'friday', 'Saturdays': 'saturday'
    },

    /**
     * Inicialização
     */
    async init() {
        console.log('📅 Loading Calendario Page v8...');
        
        // Determinar dia de hoje
        const todayIdx = new Date().getDay();
        this.selectedDay = this.days[todayIdx];

        // Se tela mobile, padrão sugerido é 'day'
        if (window.innerWidth <= 768) {
            this.viewMode = 'day';
        }

        this.currentSeason = this.getCurrentSeason();
        this.updateViewModeButtons();
        this.highlightDayTab(this.selectedDay);

        await this.loadSeason();
        console.log('✅ Calendario Page v8 pronta!');
    },

    /**
     * Desmontagem / Limpeza de timers
     */
    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
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
     * Carregar animes da temporada via API
     */
    async loadSeason() {
        const loading = document.getElementById('calendar-loading');
        const week = document.getElementById('calendar-week');
        const dayView = document.getElementById('calendar-day-view');

        if (loading) loading.style.display = 'flex';
        if (week) week.style.display = 'none';
        if (dayView) dayView.style.display = 'none';

        this.updateSeasonDisplay();

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        try {
            const data = await API.getSeason(this.currentYear, this.currentSeason, 1, 50);
            this.animes = data || [];
            this.render();
            this.startCountdowns();
        } catch (error) {
            console.error('Erro ao carregar temporada:', error);
            this.showError();
        } finally {
            if (loading) loading.style.display = 'none';
            this.applyViewModeVisibility();
        }
    },

    /**
     * Atualizar display da temporada atual
     */
    updateSeasonDisplay() {
        const season = this.seasonNames[this.currentSeason];
        const iconEl = document.getElementById('season-icon');
        const nameEl = document.getElementById('season-name');
        const monthsEl = document.getElementById('season-months');

        if (iconEl) iconEl.textContent = season.icon;
        if (nameEl) nameEl.textContent = `${season.name} ${this.currentYear}`;
        if (monthsEl) monthsEl.textContent = season.months;
    },

    prevSeason() {
        const idx = this.seasons.indexOf(this.currentSeason);
        if (idx === 0) {
            this.currentSeason = 'fall';
            this.currentYear--;
        } else {
            this.currentSeason = this.seasons[idx - 1];
        }
        this.loadSeason();
    },

    nextSeason() {
        const idx = this.seasons.indexOf(this.currentSeason);
        if (idx === 3) {
            this.currentSeason = 'winter';
            this.currentYear++;
        } else {
            this.currentSeason = this.seasons[idx + 1];
        }
        this.loadSeason();
    },

    showSeasonPickerModal() {
        let seasonsHtml = `<div class="season-picker-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 14px;">`;
        this.seasons.forEach(s => {
            const info = this.seasonNames[s];
            const isCurrent = s === this.currentSeason;
            seasonsHtml += `
                <button type="button" class="btn" style="background: ${isCurrent ? 'var(--color-primary)' : 'var(--color-surface)'}; border: 2px solid var(--border-color); padding: 14px; text-align: center; cursor: pointer;" onclick="CalendarioPage.selectSeason('${s}')">
                    <span style="font-size: 1.8rem; display: block;">${info.icon}</span>
                    <strong style="color: #fff; font-size: 0.95rem; text-transform: uppercase;">${info.name}</strong>
                    <span style="font-size: 0.72rem; color: #aaa; display: block;">${info.months}</span>
                </button>
            `;
        });
        seasonsHtml += `</div>`;

        const content = `
            <div style="padding: 10px;">
                <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 12px;">
                    <button class="btn btn-secondary" onclick="CalendarioPage.changeYear(-1)"><i class="fas fa-minus"></i></button>
                    <span style="font-size: 1.4rem; font-weight: 900; color: var(--color-primary);">${this.currentYear}</span>
                    <button class="btn btn-secondary" onclick="CalendarioPage.changeYear(1)"><i class="fas fa-plus"></i></button>
                </div>
                ${seasonsHtml}
            </div>
        `;

        Common.showModal('ESCOLHER TEMPORADA', content);
    },

    changeYear(delta) {
        this.currentYear += delta;
        if (Common.closeModal) Common.closeModal();
        this.showSeasonPickerModal();
    },

    selectSeason(season) {
        this.currentSeason = season;
        if (Common.closeModal) Common.closeModal();
        this.loadSeason();
    },

    /**
     * Obter IDs de animes da lista "watching"
     */
    getFollowingIds() {
        try {
            if (typeof Storage !== 'undefined' && Storage.getList) {
                const watching = Storage.getList('watching') || [];
                return watching.map(a => parseInt(a.id || a.anime_id));
            }
        } catch (e) {}
        return [];
    },

    // ========================================
    // RENDERIZAÇÃO
    // ========================================

    render() {
        const following = this.getFollowingIds();
        const now = Date.now() / 1000;
        const todayIdx = new Date().getDay();
        const todayDay = this.days[todayIdx];

        // Agrupar animes por dia
        const animesByDay = {
            sunday: [], monday: [], tuesday: [], wednesday: [],
            thursday: [], friday: [], saturday: [], unknown: []
        };

        let liveTodayCount = 0;

        this.animes.forEach(anime => {
            let day = 'unknown';
            let airingAt = null;

            if (anime.nextAiringEpisode && anime.nextAiringEpisode.airingAt) {
                airingAt = anime.nextAiringEpisode.airingAt;
                const date = new Date(airingAt * 1000);
                day = this.days[date.getDay()];
            } else if (anime.broadcast && anime.broadcast.day) {
                day = this.dayMapping[anime.broadcast.day] || 'unknown';
            }

            anime.airingAt = airingAt;
            anime.isLive = airingAt && (now - airingAt) >= 0 && (now - airingAt) <= 3600;
            anime.isFuture = airingAt && airingAt > now;
            anime.isFollowing = following.includes(parseInt(anime.id));

            if (day === todayDay) {
                liveTodayCount++;
            }

            // Filtro de Busca
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const titleStr = (anime.title || '').toLowerCase();
                if (!titleStr.includes(q)) return;
            }

            // Filtro de Status
            if (this.filter === 'following' && !anime.isFollowing) return;
            if (this.filter === 'today' && day !== todayDay) return;

            if (day !== 'unknown') {
                animesByDay[day].push(anime);
            }
        });

        // Atualizar contador do topo
        const liveCountEl = document.getElementById('calendar-live-count');
        if (liveCountEl) {
            liveCountEl.textContent = `${liveTodayCount} animes no ar hoje`;
        }

        // Ordenar e renderizar colunas da grade semanal
        this.days.forEach(day => {
            animesByDay[day].sort((a, b) => (a.airingAt || 0) - (b.airingAt || 0));

            const container = document.getElementById(`animes-${day}`);
            const countEl = document.getElementById(`count-${day}`);
            const tabCountEl = document.getElementById(`tab-count-${day}`);
            const animes = animesByDay[day];

            if (countEl) countEl.textContent = animes.length;
            if (tabCountEl) tabCountEl.textContent = animes.length;

            if (container) {
                if (animes.length === 0) {
                    container.innerHTML = '<div class="day-col-empty">Nenhum anime</div>';
                } else {
                    container.innerHTML = animes.map(a => this.createAnimeCard(a)).join('');
                }
            }
        });

        // Renderizar a visualização focada no dia (Modo Dia)
        this.renderDayView(animesByDay[this.selectedDay]);

        // Destacar dia de hoje nos seletores
        this.highlightToday();
    },

    /**
     * Renderizar visão focada em um dia único
     */
    renderDayView(animes) {
        const titleEl = document.getElementById('day-view-title');
        const countEl = document.getElementById('day-view-count');
        const container = document.getElementById('day-view-cards');

        if (titleEl) titleEl.textContent = `Lançamentos de ${this.dayNamesPt[this.selectedDay]}`;
        if (countEl) countEl.textContent = `${(animes || []).length} títulos`;

        if (!container) return;

        if (!animes || animes.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--color-text-muted);">
                    <i class="fas fa-calendar-times" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5; display: block;"></i>
                    <p>Nenhum lançamento previsto para este dia com os filtros atuais.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = animes.map(a => this.createAnimeCard(a)).join('');
    },

    /**
     * Criar card de anime no padrão Neo-Brutalist
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
                badgeHtml = `<span class="badge-live-tag">🔴 NO AR</span>`;
            } else if (anime.isFuture) {
                const diff = anime.airingAt - now;
                countdownHtml = `<span class="countdown" data-airing="${anime.airingAt}"><i class="fas fa-clock"></i> ${this.formatCountdown(diff)}</span>`;
            }
        }

        const scoreBadge = anime.score || anime.averageScore 
            ? `<span class="badge-score-tag">★ ${(anime.score || anime.averageScore / 10).toFixed(1)}</span>`
            : '';

        const episodes = anime.episodes || '?';
        const image = anime.image || (anime.coverImage && anime.coverImage.large) || 'img/placeholder.jpg';
        const nextEp = anime.nextAiringEpisode ? `Ep. ${anime.nextAiringEpisode.episode}` : '';

        const safeTitle = (anime.title || '').replace(/'/g, "\\'");

        return `
            <div class="calendar-card ${anime.isFollowing ? 'following' : ''} ${anime.isLive ? 'is-live' : ''}"
                 onclick="Common.navigate('?page=detalhes&id=${anime.id}')">
                <img src="${image}" alt="${anime.title}" class="calendar-card-cover" loading="lazy" onerror="this.src='img/placeholder.jpg'">
                <div class="calendar-card-body">
                    <div>
                        <div class="calendar-card-badges">
                            ${badgeHtml}
                            ${scoreBadge}
                        </div>
                        <div class="calendar-card-title" title="${anime.title}">${anime.title}</div>
                    </div>
                    <div>
                        <div class="calendar-card-meta">
                            <span class="calendar-card-time"><i class="fas fa-clock"></i> ${timeLabel}</span>
                            <span class="calendar-card-ep">${nextEp || episodes + ' eps'}</span>
                        </div>
                        ${countdownHtml ? `<div class="calendar-card-countdown">${countdownHtml}</div>` : ''}
                    </div>
                </div>
                <button type="button" class="calendar-card-btn-follow ${anime.isFollowing ? 'active' : ''}"
                        onclick="event.stopPropagation(); CalendarioPage.toggleFollow(${anime.id}, '${safeTitle}', '${image}', ${anime.episodes || 0})"
                        title="${anime.isFollowing ? 'Remover de Assistindo' : 'Adicionar a Assistindo'}">
                    <i class="fas ${anime.isFollowing ? 'fa-bell-slash' : 'fa-bell'}"></i>
                </button>
            </div>
        `;
    },

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

    startCountdowns() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        this.countdownInterval = setInterval(() => {
            const hasGrid = document.getElementById('calendar-week');
            const hasDayView = document.getElementById('calendar-day-view');

            // Autolimpeza caso usuário tenha navegado para outra página
            if (!hasGrid && !hasDayView) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                return;
            }

            const now = Date.now() / 1000;
            document.querySelectorAll('.countdown[data-airing]').forEach(el => {
                const airingAt = parseFloat(el.dataset.airing);
                const diff = airingAt - now;

                if (diff <= 0) {
                    clearInterval(this.countdownInterval);
                    this.render();
                    this.startCountdowns();
                } else {
                    el.innerHTML = `<i class="fas fa-clock"></i> ${this.formatCountdown(diff)}`;
                }
            });
        }, 1000);
    },

    // ========================================
    // TABS & VIEW MODES
    // ========================================

    setViewMode(mode) {
        this.viewMode = mode;
        this.updateViewModeButtons();
        this.applyViewModeVisibility();
        this.render();
    },

    updateViewModeButtons() {
        const btnWeek = document.getElementById('btn-view-week');
        const btnDay = document.getElementById('btn-view-day');

        if (btnWeek) btnWeek.classList.toggle('active', this.viewMode === 'week');
        if (btnDay) btnDay.classList.toggle('active', this.viewMode === 'day');
    },

    applyViewModeVisibility() {
        const week = document.getElementById('calendar-week');
        const dayView = document.getElementById('calendar-day-view');

        if (this.viewMode === 'week') {
            if (week) week.style.display = 'grid';
            if (dayView) dayView.style.display = 'none';
        } else {
            if (week) week.style.display = 'none';
            if (dayView) dayView.style.display = 'block';
        }
    },

    selectDayTab(day) {
        this.selectedDay = day;
        this.highlightDayTab(day);

        if (this.viewMode === 'week') {
            // Em modo semana, focar e rolar até a coluna do dia
            const col = document.querySelector(`.calendar-day-col[data-day="${day}"]`);
            if (col) {
                col.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        } else {
            // Em modo dia, re-renderizar para o dia selecionado
            this.render();
        }
    },

    highlightDayTab(day) {
        document.querySelectorAll('.day-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.day === day);
        });
    },

    highlightToday() {
        const todayIdx = new Date().getDay();
        const today = this.days[todayIdx];

        document.querySelectorAll('.calendar-day-col').forEach(el => {
            el.classList.toggle('today', el.dataset.day === today);
        });

        document.querySelectorAll('.day-tab-btn').forEach(el => {
            el.classList.toggle('today', el.dataset.day === today);
        });
    },

    // ========================================
    // BUSCA E FILTROS
    // ========================================

    onSearchInput(val) {
        this.searchQuery = (val || '').trim();
        const clearBtn = document.getElementById('calendar-search-clear');
        if (clearBtn) clearBtn.style.display = this.searchQuery ? 'block' : 'none';
        this.render();
    },

    clearSearch() {
        const input = document.getElementById('calendar-search-input');
        if (input) input.value = '';
        this.onSearchInput('');
    },

    filterDay(filter) {
        this.filter = filter;
        document.querySelectorAll('.filter-chip-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    },

    /**
     * Seguir / Notificar anime
     */
    async toggleFollow(animeId, title, image, episodes) {
        const status = typeof Storage !== 'undefined' && Storage.getAnimeStatus
            ? Storage.getAnimeStatus(animeId)
            : null;

        if (status === 'watching') {
            if (typeof Storage !== 'undefined' && Storage.removeFromAllLists) {
                Storage.removeFromAllLists(animeId);
                fetch('api/lists/delete.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ anime_id: animeId })
                }).catch(() => {});
            }
            Common.showNotification('Removido de Assistindo', 'info');
        } else {
            if (typeof Storage !== 'undefined' && Storage.addToList) {
                await Storage.addToList('watching', {
                    id: animeId,
                    title: { romaji: title },
                    coverImage: { large: image },
                    episodes: episodes
                });
            }
            Common.showNotification('Adicionado a Assistindo! 📺', 'success');
            if (Storage.addXP) Storage.addXP(5);
        }

        this.render();
    },

    showError() {
        const week = document.getElementById('calendar-week');
        if (week) {
            week.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: var(--color-surface); border: 2px solid #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 12px; display: block;"></i>
                    <p style="font-weight: 800; font-size: 1rem;">Erro ao conectar à AniList para obter a programação</p>
                    <button class="btn btn-primary" onclick="CalendarioPage.loadSeason()" style="margin-top: 10px;">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            `;
            week.style.display = 'block';
        }
    }
};

window.CalendarioPage = CalendarioPage;
if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        CalendarioPage.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => CalendarioPage.init());
    }
}
