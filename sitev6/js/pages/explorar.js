/**
 * AnimeEngine v5 - Explorar Page
 */

const ExplorePage = {
    currentPage: 1,
    currentFilter: 'trending',
    searchQuery: '',
    genres: [],

    async init() {
        console.log('🔍 Loading Explore Page...');
        
        // Verificar query params
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        const filter = params.get('filter');
        
        if (query) {
            this.searchQuery = query;
            document.getElementById('search-input').value = query;
            await this.searchAnimes(query);
        } else if (filter) {
            await this.quickFilter(filter);
        } else {
            await this.quickFilter('trending');
        }
        
        // Carregar gêneros
        await this.loadGenres();
        
        console.log('✅ Explore Page loaded!');
    },

    async loadGenres() {
        try {
            const genres = await API.getGenres();
            const select = document.getElementById('filter-genre');
            
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.mal_id;
                option.textContent = genre.name;
                select.appendChild(option);
            });
            
            this.genres = genres;
            
            // Popular anos (últimos 30 anos)
            this.populateYears();
        } catch (error) {
            console.error('Erro ao carregar gêneros:', error);
        }
    },

    /**
     * Popular select de anos
     */
    populateYears() {
        const select = document.getElementById('filter-year');
        if (!select) return;
        
        const currentYear = new Date().getFullYear();
        for (let year = currentYear + 1; year >= 1980; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    },

    async quickFilter(filterType) {
        this.currentFilter = filterType;
        this.currentPage = 1;
        
        // Atualizar UI
        document.querySelectorAll('.quick-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterType);
        });
        
        this.showLoading();
        
        try {
            let data;
            switch (filterType) {
                case 'trending':
                    data = await API.getTrending(24);
                    break;
                case 'seasonal':
                    data = await API.getSeasonNow(24);
                    break;
                case 'top':
                    data = await API.getTopAnime(24);
                    break;
                case 'upcoming':
                    data = await API.fetch('/seasons/upcoming?limit=24');
                    break;
                default:
                    data = await API.getTopAnime(24);
            }
            
            this.renderResults(data);
            this.updateResultsInfo(data.length, filterType);
        } catch (error) {
            this.showError();
        }
    },

    async searchAnimes(query) {
        if (!query.trim()) return;
        
        this.searchQuery = query;
        this.currentPage = 1;
        
        this.showLoading();
        
        try {
            const data = await API.searchAnime(query, 24);
            this.renderResults(data);
            this.updateResultsInfo(data.length, `Resultados para "${query}"`);
        } catch (error) {
            this.showError();
        }
    },

    search() {
        const input = document.getElementById('search-input');
        if (input.value.trim()) {
            this.searchAnimes(input.value.trim());
        }
    },

    async applyFilters() {
        const type = document.getElementById('filter-type')?.value || '';
        const genre = document.getElementById('filter-genre')?.value || '';
        const status = document.getElementById('filter-status')?.value || '';
        const year = document.getElementById('filter-year')?.value || '';
        const order = document.getElementById('filter-order')?.value || 'score';
        
        this.showLoading();
        
        try {
            let endpoint = '/anime?limit=24';
            if (type) endpoint += `&type=${type}`;
            if (genre) endpoint += `&genres=${genre}`;
            if (status) endpoint += `&status=${status}`;
            if (year) endpoint += `&start_date=${year}-01-01&end_date=${year}-12-31`;
            if (order) endpoint += `&order_by=${order}&sort=desc`;
            
            const data = await API.fetch(endpoint);
            this.renderResults(data);
            
            // Construir texto de contexto
            const typeLabels = { tv: 'TV', movie: 'Filmes', ova: 'OVA', ona: 'ONA', special: 'Especiais', music: 'Música' };
            let context = 'Filtrado';
            if (type) context = typeLabels[type] || type;
            if (year) context += ` (${year})`;
            
            this.updateResultsInfo(data.length, context);
        } catch (error) {
            this.showError();
        }
    },

    clearFilters() {
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-genre').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-year').value = '';
        document.getElementById('filter-order').value = 'score';
        this.quickFilter('trending');
    },

    renderResults(animes) {
        const grid = document.getElementById('anime-grid');
        grid.innerHTML = '';
        
        if (!animes || animes.length === 0) {
            grid.innerHTML = '<p class="empty-message">Nenhum anime encontrado</p>';
            return;
        }
        
        animes.forEach(anime => {
            const formatted = API.formatAnime(anime);
            const card = Common.createAnimeCard(formatted);
            grid.appendChild(card);
        });
        
        // Mostrar botão "Carregar Mais" se houver resultados
        const loadMoreContainer = document.getElementById('load-more-container');
        loadMoreContainer.style.display = animes.length >= 24 ? 'flex' : 'none';
    },

    updateResultsInfo(count, context) {
        const info = document.getElementById('results-info');
        info.innerHTML = `<span id="results-count">${count} animes • ${context}</span>`;
    },

    showLoading() {
        const grid = document.getElementById('anime-grid');
        grid.innerHTML = '<div class="grid-loading"><div class="loader"></div></div>';
    },

    showError() {
        const grid = document.getElementById('anime-grid');
        grid.innerHTML = '<p class="error-message">Erro ao carregar. Tente novamente.</p>';
    },

    async loadMore() {
        this.currentPage++;
        // Implementar paginação se necessário
        Common.showNotification('Carregando mais...', 'info');
    }
};

document.addEventListener('DOMContentLoaded', () => ExplorePage.init());

// Enter para buscar
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'search-input') {
        ExplorePage.search();
    }
});
