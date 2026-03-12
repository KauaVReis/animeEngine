/**
 * AnimeEngine v5 - Calendario Page
 * Grade semanal de animes da temporada atual
 */

const CalendarioPage = {
    // Estado
    currentYear: new Date().getFullYear(),
    currentSeason: null,
    animes: [],
    filter: 'all',
    
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
        'Sundays': 'sunday',
        'Mondays': 'monday',
        'Tuesdays': 'tuesday',
        'Wednesdays': 'wednesday',
        'Thursdays': 'thursday',
        'Fridays': 'friday',
        'Saturdays': 'saturday'
    },

    /**
     * Inicializar página
     */
    async init() {
        console.log('📅 Loading Calendario Page...');
        
        // Determinar temporada atual
        this.currentSeason = this.getCurrentSeason();
        
        // Carregar dados
        await this.loadSeason();
        
        console.log('✅ Calendario Page loaded!');
    },

    /**
     * Obter temporada atual baseada no mês
     */
    getCurrentSeason() {
        const month = new Date().getMonth() + 1; // 1-12
        
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
        
        // Mostrar loading
        if (loading) loading.style.display = 'flex';
        if (week) week.style.display = 'none';
        
        // Atualizar display da temporada
        this.updateSeasonDisplay();
        
        try {
            // Buscar animes da temporada
            const data = await API.getSeasonAnimes(this.currentYear, this.currentSeason);
            this.animes = data.data || [];
            
            // Renderizar grade
            this.renderCalendar();
            
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

    /**
     * Temporada anterior
     */
    prevSeason() {
        const currentIndex = this.seasons.indexOf(this.currentSeason);
        if (currentIndex === 0) {
            this.currentSeason = 'fall';
            this.currentYear--;
        } else {
            this.currentSeason = this.seasons[currentIndex - 1];
        }
        this.loadSeason();
    },

    /**
     * Próxima temporada
     */
    nextSeason() {
        const currentIndex = this.seasons.indexOf(this.currentSeason);
        if (currentIndex === 3) {
            this.currentSeason = 'winter';
            this.currentYear++;
        } else {
            this.currentSeason = this.seasons[currentIndex + 1];
        }
        this.loadSeason();
    },

    /**
     * Renderizar calendário
     */
    renderCalendar() {
        // Limpar todos os dias
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        days.forEach(day => {
            const container = document.getElementById(`animes-${day}`);
            const count = document.getElementById(`count-${day}`);
            if (container) container.innerHTML = '';
            if (count) count.textContent = '0';
        });
        
        // Organizar animes por dia
        const animesByDay = {
            sunday: [], monday: [], tuesday: [], wednesday: [],
            thursday: [], friday: [], saturday: [], unknown: []
        };
        
        // Obter lista de animes seguidos
        const following = this.getFollowingIds();
        
        this.animes.forEach(anime => {
            // Verificar broadcast
            const broadcast = anime.broadcast;
            let day = 'unknown';
            
            if (broadcast && broadcast.day) {
                day = this.dayMapping[broadcast.day] || 'unknown';
            }
            
            // Adicionar info de seguindo
            anime.isFollowing = following.includes(anime.mal_id);
            
            // Aplicar filtro
            if (this.filter === 'following' && !anime.isFollowing) return;
            if (this.filter === 'today') {
                const today = new Date().getDay();
                const todayName = days[today];
                if (day !== todayName) return;
            }
            
            if (day !== 'unknown') {
                animesByDay[day].push(anime);
            }
        });
        
        // Renderizar cada dia
        days.forEach(day => {
            const container = document.getElementById(`animes-${day}`);
            const countEl = document.getElementById(`count-${day}`);
            const animes = animesByDay[day];
            
            if (countEl) countEl.textContent = animes.length;
            
            if (container) {
                if (animes.length === 0) {
                    container.innerHTML = '<div class="day-empty">Nenhum anime</div>';
                } else {
                    container.innerHTML = animes.map(anime => this.createAnimeCard(anime)).join('');
                }
            }
        });
        
        // Destacar dia atual
        this.highlightToday();
    },

    /**
     * Criar card de anime para o calendário
     */
    createAnimeCard(anime) {
        const time = anime.broadcast?.time || '??:??';
        const episodes = anime.episodes || '?';
        
        return `
            <div class="calendar-anime ${anime.isFollowing ? 'following' : ''}" onclick="window.location='detalhes.html?id=${anime.mal_id}'">
                <img src="${anime.images?.jpg?.image_url || ''}" alt="${anime.title}" loading="lazy">
                <div class="calendar-anime-info">
                    <div class="calendar-anime-title">${anime.title}</div>
                    <div class="calendar-anime-meta">
                        <span class="calendar-time"><i class="fas fa-clock"></i> ${time}</span>
                        <span class="calendar-eps">${episodes} eps</span>
                    </div>
                </div>
                <button class="calendar-follow-btn ${anime.isFollowing ? 'active' : ''}" 
                        onclick="event.stopPropagation(); CalendarioPage.toggleFollow(${anime.mal_id}, '${anime.title.replace(/'/g, "\\'")}', '${anime.images?.jpg?.image_url || ''}', ${anime.episodes || 0})"
                        title="${anime.isFollowing ? 'Deixar de seguir' : 'Seguir'}">
                    <i class="fas ${anime.isFollowing ? 'fa-bell-slash' : 'fa-bell'}"></i>
                </button>
            </div>
        `;
    },

    /**
     * Destacar dia atual
     */
    highlightToday() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        
        document.querySelectorAll('.calendar-day').forEach(el => {
            el.classList.remove('today');
            if (el.dataset.day === today) {
                el.classList.add('today');
            }
        });
    },

    /**
     * Filtrar por dia
     */
    filterDay(filter) {
        this.filter = filter;
        
        // Atualizar botões
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Re-renderizar
        this.renderCalendar();
    },

    /**
     * Obter IDs de animes seguidos
     */
    getFollowingIds() {
        const lists = Storage.getLists();
        const watching = lists.watching || [];
        return watching.map(a => a.id);
    },

    /**
     * Toggle seguir anime
     */
    toggleFollow(animeId, title, image, episodes) {
        const lists = Storage.getLists();
        const index = lists.watching.findIndex(a => a.id === animeId);
        
        if (index >= 0) {
            // Remover
            lists.watching.splice(index, 1);
            Common.showNotification('Anime removido de Assistindo');
        } else {
            // Adicionar
            lists.watching.unshift({
                id: animeId,
                title: title,
                image: image,
                episodes: episodes,
                progress: 0,
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            Common.showNotification('Anime adicionado a Assistindo! 📺');
            
            // Conquista
            Storage.addXP(5);
        }
        
        Storage.save('lists', lists);
        
        // Re-renderizar
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

// Inicializar quando DOM pronto
document.addEventListener('DOMContentLoaded', () => CalendarioPage.init());
