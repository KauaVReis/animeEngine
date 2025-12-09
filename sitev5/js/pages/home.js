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
        
        // Carregar dados em paralelo
        await Promise.all([
            this.loadHeroBanner(),
            this.loadWatching(),
            this.loadTrending(),
            this.loadSeasonal(),
            this.loadTopAnime()
        ]);
        
        console.log('✅ Home Page loaded!');
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
            listBtn.onclick = () => Common.addToList(anime.id, 'watching');
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
        
        const card = document.createElement('div');
        card.className = 'anime-card anime-card-watching';
        card.dataset.id = anime.id;
        
        card.innerHTML = `
            <div class="anime-card-image">
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                <div class="watching-progress">
                    <div class="watching-progress-bar" style="width: ${percent}%"></div>
                </div>
                <span class="watching-ep">EP ${progress}/${total}</span>
            </div>
            <div class="anime-card-info">
                <h3 class="anime-card-title" title="${anime.title}">${anime.title}</h3>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `detalhes.html?id=${anime.id}`;
        });
        
        return card;
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
