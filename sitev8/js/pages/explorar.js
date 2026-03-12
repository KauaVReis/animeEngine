/**
 * AnimeEngine v7 - Explorar Page
 * Usa AniList API diretamente
 */

const ExplorePage = {
    currentPage: 1,
    currentFilter: 'trending',
    selectedGenres: [],
    selectedFormat: null,
    currentSort: 'POPULARITY_DESC',
    searchQuery: null,
    hasMore: true,

    // New Advanced Filters State
    selectedSeason: '',
    selectedYear: '',
    selectedStatus: '',
    selectedSource: '',
    minScore: 0,
    isAdult: false,

    async init() {
        console.log('🔍 Loading Explore Page Overhaul...');

        // Setup quick filters
        document.querySelectorAll('.quick-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('ost-btn')) return;
                this.setFilter(btn.dataset.filter);
            });
        });

        // Setup format filters
        document.querySelectorAll('.format-tag').forEach(btn => {
            btn.addEventListener('click', () => this.setFormat(btn));
        });

        // Setup genre filters
        document.querySelectorAll('.genre-tag').forEach(btn => {
            btn.addEventListener('click', () => this.toggleGenre(btn));
        });

        // Setup sort select
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.loadAnimes();
            });
        }

        // Load more button
        document.getElementById('load-more-btn')?.addEventListener('click', () => this.loadMore());

        // Setup Advanced Listeners
        this.setupAdvancedListeners();

        // Check SFW/Adult Setting
        this.checkAdultSetting();

        // Check for search query
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');

        if (query) {
            this.search(query);
        } else {
            await this.loadAnimes();
        }

        console.log('✅ Explore Page Overhaul Ready!');
    },

    setupAdvancedListeners() {
        // Season
        document.getElementById('season-select')?.addEventListener('change', (e) => {
            this.selectedSeason = e.target.value;
            this.resetAndLoad();
        });

        // Year
        document.getElementById('year-input')?.addEventListener('input', Common.debounce((e) => {
            this.selectedYear = e.target.value;
            this.resetAndLoad();
        }, 500));

        // Status
        document.getElementById('status-select')?.addEventListener('change', (e) => {
            this.selectedStatus = e.target.value;
            this.resetAndLoad();
        });

        // Source
        document.getElementById('source-select')?.addEventListener('change', (e) => {
            this.selectedSource = e.target.value;
            this.resetAndLoad();
        });

        // Score Slider
        const scoreSlider = document.getElementById('score-slider');
        const scoreValue = document.getElementById('score-value');
        if (scoreSlider) {
            scoreSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                if (scoreValue) scoreValue.textContent = (val / 10).toFixed(1);
            });
            scoreSlider.addEventListener('change', (e) => {
                this.minScore = parseInt(e.target.value);
                this.resetAndLoad();
            });
        }

        // Adult Toggle
        document.getElementById('adult-toggle')?.addEventListener('click', (e) => {
            this.isAdult = !this.isAdult;
            e.target.classList.toggle('active', this.isAdult);
            e.target.innerHTML = this.isAdult ? '🔞 Adulto: ON' : '🔞 Adulto: OFF';
            this.resetAndLoad();
        });
    },

    checkAdultSetting() {
        const settings = Storage.getSettings();
        const container = document.getElementById('adult-filter-container');
        if (container && settings.sfw === false) {
            container.style.display = 'flex';
        }
    },

    resetAndLoad() {
        this.currentPage = 1;
        this.renderChips();
        this.loadAnimes();
    },

    search(query) {
        this.currentFilter = 'search';
        this.searchQuery = query;
        this.selectedGenres = [];
        this.selectedFormat = null;
        this.currentPage = 1;

        // Update UI
        document.querySelector('.page-title').innerHTML = `<i class="fas fa-search"></i> Resultados para: "${query}"`;
        document.querySelectorAll('.quick-filter, .genre-tag, .format-tag').forEach(b => b.classList.remove('active'));
        this.renderChips();
        this.loadAnimes();
    },

    async setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.searchQuery = null;

        document.querySelectorAll('.quick-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.updateTitle();
        this.renderChips();
        await this.loadAnimes();
    },

    setFormat(btn) {
        const format = btn.dataset.format;
        if (this.selectedFormat === format) {
            this.selectedFormat = null;
            btn.classList.remove('active');
        } else {
            this.selectedFormat = format;
            document.querySelectorAll('.format-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        this.currentPage = 1;
        this.updateTitle();
        this.renderChips();
        this.loadAnimes();
    },

    toggleGenre(btn) {
        const genreId = btn.dataset.genre;
        const index = this.selectedGenres.indexOf(genreId);

        if (index >= 0) {
            this.selectedGenres.splice(index, 1);
            btn.classList.remove('active');
        } else {
            this.selectedGenres.push(genreId);
            btn.classList.add('active');
        }

        this.currentPage = 1;
        this.updateTitle();
        this.renderChips();
        this.loadAnimes();
    },

    removeFilter(type, value) {
        if (type === 'genre') {
            this.selectedGenres = this.selectedGenres.filter(g => g !== value);
            document.querySelector(`.genre-tag[data-genre="${value}"]`)?.classList.remove('active');
        } else if (type === 'format') {
            this.selectedFormat = null;
            document.querySelectorAll('.format-tag').forEach(b => b.classList.remove('active'));
        } else if (type === 'season') {
            this.selectedSeason = '';
            document.getElementById('season-select').value = '';
        } else if (type === 'year') {
            this.selectedYear = '';
            document.getElementById('year-input').value = '';
        } else if (type === 'status') {
            this.selectedStatus = '';
            document.getElementById('status-select').value = '';
        } else if (type === 'source') {
            this.selectedSource = '';
            document.getElementById('source-select').value = '';
        } else if (type === 'score') {
            this.minScore = 0;
            document.getElementById('score-slider').value = 0;
            document.getElementById('score-value').textContent = '0';
        }

        this.resetAndLoad();
    },

    renderChips() {
        const container = document.getElementById('active-chips');
        if (!container) return;

        const genreMap = {
            '1': 'Ação', '2': 'Aventura', '4': 'Comédia', '8': 'Drama',
            '10': 'Fantasia', '14': 'Terror', '22': 'Romance', '24': 'Sci-Fi',
            '36': 'Slice of Life', '30': 'Esportes'
        };

        const formatMap = {
            'TV': 'TV', 'MOVIE': 'Filme', 'OVA': 'OVA', 'ONA': 'ONA', 'SPECIAL': 'Especial'
        };

        const seasonMap = {
            'WINTER': 'Inverno', 'SPRING': 'Primavera', 'SUMMER': 'Verão', 'FALL': 'Outono'
        };

        const statusMap = {
            'FINISHED': 'Finalizado', 'RELEASING': 'Lançando', 'NOT_YET_RELEASED': 'Em Breve', 'CANCELLED': 'Cancelado'
        };

        let chipsHtml = '';

        if (this.selectedFormat) {
            chipsHtml += `
                <div class="filter-chip">
                    ${formatMap[this.selectedFormat]} 
                    <i class="fas fa-times" onclick="ExplorePage.removeFilter('format', '${this.selectedFormat}')"></i>
                </div>
            `;
        }

        if (this.selectedSeason) {
            chipsHtml += `
                <div class="filter-chip">
                    ${seasonMap[this.selectedSeason]} 
                    <i class="fas fa-times" onclick="ExplorePage.removeFilter('season')"></i>
                </div>
            `;
        }

        if (this.selectedYear) {
            chipsHtml += `
                <div class="filter-chip">
                    Ano: ${this.selectedYear} 
                    <i class="fas fa-times" onclick="ExplorePage.removeFilter('year')"></i>
                </div>
            `;
        }

        if (this.selectedStatus) {
            chipsHtml += `
                <div class="filter-chip">
                    Status: ${statusMap[this.selectedStatus]} 
                    <i class="fas fa-times" onclick="ExplorePage.removeFilter('status')"></i>
                </div>
            `;
        }

        if (this.selectedSource) {
            chipsHtml += `
                <div class="filter-chip">
                    Origem: ${this.selectedSource.replace('_', ' ')} 
                    <i class="fas fa-times" onclick="ExplorePage.removeFilter('source')"></i>
                </div>
            `;
        }

        if (this.minScore > 0) {
            chipsHtml += `
                <div class="filter-chip">
                    Nota: ${(this.minScore / 10).toFixed(1)}+ 
                    <i class="fas fa-times" onclick="ExplorePage.removeFilter('score')"></i>
                </div>
            `;
        }

        this.selectedGenres.forEach(id => {
            chipsHtml += `
                <div class="filter-chip">
                    ${genreMap[id]} 
                    <i class="fas fa-times" onclick="ExplorePage.removeFilter('genre', '${id}')"></i>
                </div>
            `;
        });

        container.innerHTML = chipsHtml;
    },

    updateTitle() {
        const filterLabels = {
            'trending': 'Em Alta',
            'seasonal': 'Temporada',
            'top': 'Top Avaliados',
            'upcoming': 'Em Breve'
        };

        let title = `<i class="fas fa-search"></i> Explorar`;
        if (filterLabels[this.currentFilter]) {
            title += `: ${filterLabels[this.currentFilter]}`;
        }

        document.querySelector('.page-title').innerHTML = title;
    },

    async loadAnimes() {
        const grid = document.getElementById('anime-grid');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (this.currentPage === 1) {
            this.renderSkeletons();
            loadMoreContainer.style.display = 'none';
        }

        try {
            const result = await this.fetchAnimes();
            this.renderAnimes(result.media, this.currentPage > 1);

            // Update results count
            const countEl = document.getElementById('results-count');
            if (countEl && result.pageInfo) {
                const total = result.pageInfo.total || 0;
                countEl.innerHTML = `${total.toLocaleString()} ENCONTRADOS`;
            }
        } catch (e) {
            console.error('Erro:', e);
            grid.innerHTML = '<p class="empty-message">Erro ao carregar animes</p>';
        }
    },

    renderSkeletons(count = 12) {
        const grid = document.getElementById('anime-grid');
        grid.innerHTML = Array(count).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-img skeleton"></div>
                <div class="skeleton-text-block">
                    <div class="skeleton-title skeleton shimmer"></div>
                    <div class="skeleton-meta skeleton shimmer"></div>
                </div>
            </div>
        `).join('');
    },

    async fetchAnimes() {
        let variables = {
            page: this.currentPage,
            perPage: 24,
            sort: [this.currentSort]
        };

        const genreMap = {
            '1': 'Action', '2': 'Adventure', '4': 'Comedy', '8': 'Drama',
            '10': 'Fantasy', '14': 'Horror', '22': 'Romance', '24': 'Sci-Fi',
            '36': 'Slice of Life', '30': 'Sports'
        };

        if (this.selectedGenres.length > 0) {
            variables.genre_in = this.selectedGenres.map(id => genreMap[id]);
        }

        if (this.selectedFormat) {
            variables.format = this.selectedFormat;
        }

        if (this.selectedSeason) variables.season = this.selectedSeason;
        if (this.selectedYear) variables.seasonYear = parseInt(this.selectedYear);
        if (this.selectedStatus) variables.status = this.selectedStatus;
        if (this.selectedSource) variables.source = this.selectedSource;
        if (this.minScore > 0) variables.averageScore_greater = this.minScore;

        // Use local isAdult or fall back to SFW setting
        const settings = Storage.getSettings();
        variables.isAdult = this.isAdult || (settings.sfw === false ? undefined : false);

        switch (this.currentFilter) {
            case 'search':
                variables.search = this.searchQuery;
                break;
            case 'seasonal':
                const now = new Date();
                const month = now.getMonth();
                variables.seasonYear = now.getFullYear();
                variables.season = month < 3 ? 'WINTER' : month < 6 ? 'SPRING' : month < 9 ? 'SUMMER' : 'FALL';
                break;
            case 'upcoming':
                variables.status = 'NOT_YET_RELEASED';
                break;
        }

        const query = `
            query ($page: Int, $perPage: Int, $search: String, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $genre_in: [String], $format: MediaFormat, $source: MediaSource, $averageScore_greater: Int, $isAdult: Boolean) {
                Page(page: $page, perPage: $perPage) {
                    media(
                        type: ANIME, 
                        search: $search, 
                        sort: $sort, 
                        season: $season, 
                        seasonYear: $seasonYear, 
                        status: $status, 
                        genre_in: $genre_in,
                        format: $format,
                        source: $source,
                        averageScore_greater: $averageScore_greater,
                        isAdult: $isAdult
                    ) {
                        id
                        title { romaji english }
                        coverImage { large }
                        averageScore
                        episodes
                        status
                        genres
                    }
                    pageInfo { hasNextPage total }
                }
            }
        `;

        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        this.hasMore = data.data?.Page?.pageInfo?.hasNextPage || false;
        return {
            media: data.data?.Page?.media || [],
            pageInfo: data.data?.Page?.pageInfo
        };
    },

    renderAnimes(animes, append = false) {
        const grid = document.getElementById('anime-grid');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (!append) grid.innerHTML = '';

        if (animes.length === 0 && !append) {
            grid.innerHTML = '<p class="empty-message">Nenhum anime encontrado</p>';
            loadMoreContainer.style.display = 'none';
            return;
        }

        animes.forEach(anime => {
            const card = document.createElement('div');
            card.className = 'anime-card';
            card.onclick = () => window.location = `detalhes.php?id=${anime.id}`;

            card.innerHTML = `
                <div class="anime-card-image">
                    <img src="${anime.coverImage.large}" alt="${anime.title.romaji}" loading="lazy">
                    ${anime.averageScore ? `<div class="anime-card-score">★ ${(anime.averageScore / 10).toFixed(1)}</div>` : ''}
                </div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title">${anime.title.romaji}</h3>
                    <div class="anime-card-meta">
                        <span>${anime.episodes || '?'} eps</span>
                        <span>${anime.genres?.[0] || ''}</span>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

        loadMoreContainer.style.display = this.hasMore ? 'flex' : 'none';
    },

    async loadMore() {
        const btn = document.getElementById('load-more-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
        btn.disabled = true;

        this.currentPage++;

        try {
            const result = await this.fetchAnimes();
            this.renderAnimes(result.media, true);
        } catch (e) {
            console.error('Erro:', e);
        }

        btn.innerHTML = '<i class="fas fa-plus"></i> Carregar Mais';
        btn.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', () => ExplorePage.init());
