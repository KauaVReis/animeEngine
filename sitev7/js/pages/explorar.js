/**
 * AnimeEngine v7 - Explorar Page
 * Usa AniList API diretamente
 */

const ExplorePage = {
    currentPage: 1,
    currentFilter: 'trending',
    hasMore: true,

    async init() {
        console.log('🔍 Loading Explore Page...');

        // Setup quick filters
        document.querySelectorAll('.quick-filter').forEach(btn => {
            btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
        });

        // Setup genre filters
        document.querySelectorAll('.genre-tag').forEach(btn => {
            btn.addEventListener('click', () => this.toggleGenre(btn));
        });

        // Load more button
        document.getElementById('load-more-btn')?.addEventListener('click', () => this.loadMore());

        // Check for search query
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');

        if (query) {
            this.search(query);
        } else {
            // Initial load
            await this.loadAnimes();
        }

        console.log('✅ Explore Page loaded!');
    },

    search(query) {
        this.currentFilter = 'search';
        this.searchQuery = query;
        this.currentPage = 1;

        // Update UI
        document.querySelector('.page-title').innerHTML = `<i class="fas fa-search"></i> Resultados para: "${query}"`;
        document.querySelectorAll('.quick-filter, .genre-tag').forEach(b => b.classList.remove('active'));

        this.loadAnimes();
    },

    async setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.searchQuery = null;

        // Reset title
        document.querySelector('.page-title').innerHTML = `<i class="fas fa-search"></i> Explorar`;

        // Update URL to remove search param without reload
        window.history.pushState({}, '', 'explorar.php');

        document.querySelectorAll('.quick-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Clear genre selection
        document.querySelectorAll('.genre-tag').forEach(btn => btn.classList.remove('active'));

        await this.loadAnimes();
    },

    toggleGenre(btn) {
        document.querySelectorAll('.genre-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.quick-filter').forEach(b => b.classList.remove('active'));

        // Reset title
        document.querySelector('.page-title').innerHTML = `<i class="fas fa-search"></i> Explorar: ${btn.innerText}`;
        // Update URL to remove search param without reload
        window.history.pushState({}, '', 'explorar.php');

        this.currentFilter = 'genre';
        this.currentPage = 1;
        this.searchQuery = null;
        this.selectedGenre = btn.dataset.genre;

        this.loadAnimes();
    },

    async loadAnimes() {
        const grid = document.getElementById('anime-grid');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (this.currentPage === 1) {
            grid.innerHTML = '<div class="carousel-loading"><div class="loader"></div></div>';
            loadMoreContainer.style.display = 'none';
        }

        try {
            const animes = await this.fetchAnimes();
            this.renderAnimes(animes, this.currentPage > 1);
        } catch (e) {
            console.error('Erro:', e);
            grid.innerHTML = '<p class="empty-message">Erro ao carregar animes</p>';
        }
    },

    async fetchAnimes() {
        let query = '';
        let variables = { page: this.currentPage, perPage: 24 };

        switch (this.currentFilter) {
            case 'search':
                query = `
                    query ($page: Int, $perPage: Int, $search: String) {
                        Page(page: $page, perPage: $perPage) {
                            media(type: ANIME, search: $search, sort: POPULARITY_DESC, isAdult: false) {
                                id
                                title { romaji english }
                                coverImage { large }
                                averageScore
                                episodes
                                status
                                genres
                            }
                            pageInfo { hasNextPage }
                        }
                    }
                `;
                variables.search = this.searchQuery;
                break;

            case 'trending':
                query = `
                    query ($page: Int, $perPage: Int) {
                        Page(page: $page, perPage: $perPage) {
                            media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
                                id
                                title { romaji english }
                                coverImage { large }
                                averageScore
                                episodes
                                status
                                genres
                            }
                            pageInfo { hasNextPage }
                        }
                    }
                `;
                break;

            case 'seasonal':
                const now = new Date();
                const month = now.getMonth();
                const year = now.getFullYear();
                const season = month < 3 ? 'WINTER' : month < 6 ? 'SPRING' : month < 9 ? 'SUMMER' : 'FALL';

                query = `
                    query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int) {
                        Page(page: $page, perPage: $perPage) {
                            media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) {
                                id
                                title { romaji english }
                                coverImage { large }
                                averageScore
                                episodes
                                status
                                genres
                            }
                            pageInfo { hasNextPage }
                        }
                    }
                `;
                variables.season = season;
                variables.year = year;
                break;

            case 'top':
                query = `
                    query ($page: Int, $perPage: Int) {
                        Page(page: $page, perPage: $perPage) {
                            media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
                                id
                                title { romaji english }
                                coverImage { large }
                                averageScore
                                episodes
                                status
                                genres
                            }
                            pageInfo { hasNextPage }
                        }
                    }
                `;
                break;

            case 'upcoming':
                query = `
                    query ($page: Int, $perPage: Int) {
                        Page(page: $page, perPage: $perPage) {
                            media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
                                id
                                title { romaji english }
                                coverImage { large }
                                averageScore
                                episodes
                                status
                                genres
                            }
                            pageInfo { hasNextPage }
                        }
                    }
                `;
                break;

            case 'genre':
                query = `
                    query ($page: Int, $perPage: Int, $genre: String) {
                        Page(page: $page, perPage: $perPage) {
                            media(type: ANIME, genre: $genre, sort: POPULARITY_DESC, isAdult: false) {
                                id
                                title { romaji english }
                                coverImage { large }
                                averageScore
                                episodes
                                status
                                genres
                            }
                            pageInfo { hasNextPage }
                        }
                    }
                `;
                const genreMap = {
                    '1': 'Action', '2': 'Adventure', '4': 'Comedy', '8': 'Drama',
                    '10': 'Fantasy', '14': 'Horror', '22': 'Romance', '24': 'Sci-Fi',
                    '36': 'Slice of Life', '30': 'Sports'
                };
                variables.genre = genreMap[this.selectedGenre] || 'Action';
                break;
        }

        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        this.hasMore = data.data?.Page?.pageInfo?.hasNextPage || false;
        return data.data?.Page?.media || [];
    },

    renderAnimes(animes, append = false) {
        const grid = document.getElementById('anime-grid');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (!append) {
            grid.innerHTML = '';
        }

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
            const animes = await this.fetchAnimes();
            this.renderAnimes(animes, true);
        } catch (e) {
            console.error('Erro:', e);
        }

        btn.innerHTML = '<i class="fas fa-plus"></i> Carregar Mais';
        btn.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', () => ExplorePage.init());
