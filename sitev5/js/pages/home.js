/**
 * AnimeEngine v5 - Home Page
 * Lógica específica da página inicial
 */

const HomePage = {
    /**
     * Inicializar página
     */
    async init() {
        console.log('🏠 Loading Home Page...');
        
        // Renderizar widget de metas (síncrono)
        this.renderGoalsWidget();
        
        // Carregar dados em paralelo
        await Promise.all([
            this.loadHeroBanner(),
            this.loadWatching(),
            this.loadAnimeOfDay(),
            this.loadTrending(),
            this.loadSeasonal(),
            this.loadTopAnime()
        ]);
        
        console.log('✅ Home Page loaded!');
    },

    /**
     * Renderizar widget de metas
     */
    renderGoalsWidget() {
        const container = document.getElementById('goals-container');
        if (container && typeof Goals !== 'undefined') {
            container.innerHTML = Goals.renderWidget();
        }
    },

    /**
     * Carregar Anime do Dia (random baseado na data)
     */
    async loadAnimeOfDay() {
        const container = document.getElementById('anime-of-day-container');
        if (!container) return;
        
        try {
            // Usar data como seed para "random" consistente no dia
            const today = new Date().toDateString();
            const storedDate = localStorage.getItem('animeOfDay_date');
            const storedAnime = localStorage.getItem('animeOfDay_anime');
            
            let anime;
            
            // Se já tem anime salvo para hoje, usar ele
            if (storedDate === today && storedAnime) {
                anime = JSON.parse(storedAnime);
            } else {
                // Buscar anime random da temporada
                await API.delay();
                const seasonal = await API.getSeasonNow(25);
                
                if (seasonal && seasonal.length > 0) {
                    // Usar hash da data para selecionar o mesmo anime o dia todo
                    const hash = today.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
                    const index = Math.abs(hash) % seasonal.length;
                    anime = API.formatAnime(seasonal[index]);
                    
                    // Salvar no localStorage
                    localStorage.setItem('animeOfDay_date', today);
                    localStorage.setItem('animeOfDay_anime', JSON.stringify(anime));
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
        const status = Storage.getAnimeStatus(anime.id);
        
        // Formatar status
        const mapStatus = {
            'Currently Airing': 'Em lançamento',
            'Finished Airing': 'Finalizado',
            'Not yet aired': 'Não lançado'
        };
        const statusText = mapStatus[anime.status] || anime.status;
        
        container.innerHTML = `
            <div class="anime-of-day">
                <div class="anime-of-day-header">
                    <span class="anime-of-day-badge">🎲 ANIME DO DIA</span>
                    <span class="anime-of-day-date">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                </div>
                <div class="anime-of-day-content" onclick="window.location='detalhes.html?id=${anime.id}'">
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
                            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); Common.openListModal({id: ${anime.id}})">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-secondary btn-sm ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); Common.toggleFavorite(${anime.id})">
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
            const trending = await API.getTrending(5);
            
            if (trending && trending.length > 0) {
                const anime = API.formatAnime(trending[0]);
                this.updateHeroBanner(anime);
                
                // Rotação automática
                let index = 0;
                setInterval(() => {
                    index = (index + 1) % Math.min(5, trending.length);
                    this.updateHeroBanner(API.formatAnime(trending[index]));
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
        const listBtn = document.getElementById('hero-list-btn');
        const favBtn = document.getElementById('hero-fav-btn');
        
        if (banner) {
            banner.style.backgroundImage = `url(${anime.image})`;
        }
        if (title) title.textContent = anime.title;
        if (synopsis) synopsis.textContent = anime.synopsis || '';
        if (score) score.textContent = anime.score || '-';
        if (eps) eps.textContent = anime.episodes || '?';
        
        if (detailsBtn) {
            detailsBtn.href = `detalhes.html?id=${anime.id}`;
        }
        
        if (listBtn) {
            listBtn.onclick = () => Common.openListModal({id: anime.id});
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
            // Esconder seção se vazia
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
                window.location.href = `detalhes.html?id=${anime.id}`;
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
            
            // Atualizar metas
            if (typeof Goals !== 'undefined') {
                Goals.updateProgress('episodes', 1);
                Goals.updateProgress('minutes', 24); // ~24min por episódio
            }
            
            // Verificar se completou
            if (anime.episodes && anime.progress >= anime.episodes) {
                // Mover para completed
                Storage.moveToList(animeId, 'watching', 'completed');
                Common.showNotification(`🎉 "${anime.title}" completo!`);
                
                // Atualizar meta de completados
                if (typeof Goals !== 'undefined') {
                    Goals.updateProgress('completed', 1);
                }
            } else {
                Storage.save('lists', lists);
                Common.showNotification(`EP ${anime.progress}/${anime.episodes || '?'} ✓`);
            }
            
            // Dar XP
            Storage.addXP(2);
            Common.updateLevelBadge();
            
            // Atualizar seção
            this.loadWatching();
            
            // Atualizar widget de metas se existir
            this.renderGoalsWidget();
        }
    },

    /**
     * Carregar "Em Alta"
     */
    async loadTrending() {
        try {
            const data = await API.getTrending(10);
            Common.renderCarousel('carousel-trending', data);
        } catch (error) {
            console.error('Erro ao carregar trending:', error);
            document.getElementById('carousel-trending').innerHTML = 
                '<p class="error-message">Erro ao carregar. Tente novamente.</p>';
        }
    },

    /**
     * Carregar "Temporada Atual"
     */
    async loadSeasonal() {
        try {
            await API.delay(); // Rate limiting
            const data = await API.getSeasonNow(10);
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
            await API.delay(); // Rate limiting
            const data = await API.getTopAnime(10);
            Common.renderCarousel('carousel-top', data);
        } catch (error) {
            console.error('Erro ao carregar top:', error);
        }
    }
};

// Inicializar quando DOM pronto
document.addEventListener('DOMContentLoaded', () => HomePage.init());
