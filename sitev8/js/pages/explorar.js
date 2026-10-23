/**
 * AnimeEngine v8 - Explorar Page
 * Integrado com a camada Tri-API (AniList GraphQL -> Jikan v4 REST -> AnimeThemes REST)
 * + Descoberta Sonora (Roleta de Openings)
 */

const ExplorePage = {
    currentPage: 1,
    currentFilter: 'trending',
    selectedGenres: [],
    selectedFormat: null,
    currentSort: 'POPULARITY_DESC',
    searchQuery: null,
    hasMore: true,

    selectedSeason: '',
    selectedYear: '',
    selectedStatus: '',
    selectedSource: '',
    minScore: 0,
    isAdult: false,
    viewMode: 'grid',
    currentAnimes: [],

    async init() {
        console.log('🔍 Loading Explore Page v8...');

        this.currentPage = 1;
        this.selectedGenres = [];
        this.selectedFormat = null;
        this.selectedSeason = '';
        this.selectedYear = '';
        this.selectedStatus = '';
        this.selectedSource = '';
        this.minScore = 0;
        this.currentAnimes = [];

        // Inicializar modo de exibição (Grade vs Lista)
        try {
            this.viewMode = localStorage.getItem('ae_explore_view_mode') || 'grid';
        } catch (_) {
            this.viewMode = 'grid';
        }
        this.setViewMode(this.viewMode, false);

        // Setup quick filters
        document.querySelectorAll('.quick-filter[data-filter]').forEach(btn => {
            btn.onclick = () => this.setFilter(btn.dataset.filter);
        });

        // Setup format filters
        document.querySelectorAll('.format-tag').forEach(btn => {
            btn.onclick = () => this.setFormat(btn);
        });

        // Setup genre filters
        document.querySelectorAll('.genre-tag').forEach(btn => {
            btn.onclick = () => this.toggleGenre(btn);
        });

        // Setup sort select
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.onchange = (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.loadAnimes();
            };
        }

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.onclick = () => this.loadMore();
        }

        this.setupAdvancedListeners();
        this.checkAdultSetting();

        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        const filterParam = urlParams.get('filter');

        if (query) {
            this.search(query);
        } else if (filterParam && ['trending', 'seasonal', 'top', 'upcoming'].includes(filterParam)) {
            await this.setFilter(filterParam);
        } else {
            await this.setFilter('trending');
        }

        console.log('✅ Explore Page v8 Ready!');
    },

    setupAdvancedListeners() {
        const seasonSelect = document.getElementById('season-select');
        if (seasonSelect) {
            seasonSelect.onchange = (e) => {
                this.selectedSeason = e.target.value;
                this.resetAndLoad();
            };
        }

        const yearInput = document.getElementById('year-input');
        if (yearInput) {
            yearInput.oninput = Common.debounce((e) => {
                this.selectedYear = e.target.value;
                this.resetAndLoad();
            }, 500);
        }

        const statusSelect = document.getElementById('status-select');
        if (statusSelect) {
            statusSelect.onchange = (e) => {
                this.selectedStatus = e.target.value;
                this.resetAndLoad();
            };
        }

        const sourceSelect = document.getElementById('source-select');
        if (sourceSelect) {
            sourceSelect.onchange = (e) => {
                this.selectedSource = e.target.value;
                this.resetAndLoad();
            };
        }

        const scoreSlider = document.getElementById('score-slider');
        const scoreValue = document.getElementById('score-value');
        if (scoreSlider) {
            scoreSlider.oninput = (e) => {
                const val = e.target.value;
                if (scoreValue) scoreValue.textContent = (val / 10).toFixed(1);
            };
            scoreSlider.onchange = (e) => {
                this.minScore = parseInt(e.target.value, 10) || 0;
                this.resetAndLoad();
            };
        }

        const adultToggle = document.getElementById('adult-toggle');
        if (adultToggle) {
            adultToggle.onclick = (e) => {
                this.isAdult = !this.isAdult;
                e.target.classList.toggle('active', this.isAdult);
                e.target.innerHTML = this.isAdult ? '🔞 Adulto: ON' : '🔞 Adulto: OFF';
                this.resetAndLoad();
            };
        }
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

        const titleEl = document.querySelector('.page-title');
        if (titleEl) {
            titleEl.innerHTML = `<i class="fas fa-search"></i> Resultados para: "${query}"`;
        }
        document.querySelectorAll('.quick-filter, .genre-tag, .format-tag').forEach(b => b.classList.remove('active'));
        this.renderChips();
        this.loadAnimes();
    },

    async setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.searchQuery = null;

        document.querySelectorAll('.quick-filter[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Sincronizar ordenação padrão com o filtro rápido
        const sortSelect = document.getElementById('sort-select');
        if (filter === 'top') {
            this.currentSort = 'SCORE_DESC';
            if (sortSelect) sortSelect.value = 'SCORE_DESC';
        } else if (filter === 'trending') {
            this.currentSort = 'TRENDING_DESC';
            if (sortSelect) sortSelect.value = 'TRENDING_DESC';
        } else {
            this.currentSort = 'POPULARITY_DESC';
            if (sortSelect) sortSelect.value = 'POPULARITY_DESC';
        }

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
            const el = document.getElementById('season-select');
            if (el) el.value = '';
        } else if (type === 'year') {
            this.selectedYear = '';
            const el = document.getElementById('year-input');
            if (el) el.value = '';
        } else if (type === 'status') {
            this.selectedStatus = '';
            const el = document.getElementById('status-select');
            if (el) el.value = '';
        } else if (type === 'source') {
            this.selectedSource = '';
            const el = document.getElementById('source-select');
            if (el) el.value = '';
        } else if (type === 'score') {
            this.minScore = 0;
            const s = document.getElementById('score-slider');
            const v = document.getElementById('score-value');
            if (s) s.value = 0;
            if (v) v.textContent = '0.0';
        } else if (type === 'search') {
            this.searchQuery = null;
            this.currentFilter = 'trending';
        }

        this.resetAndLoad();
    },

    clearAllFilters() {
        this.searchQuery = null;
        this.selectedGenres = [];
        this.selectedFormat = null;
        this.selectedSeason = '';
        this.selectedYear = '';
        this.selectedStatus = '';
        this.selectedSource = '';
        this.minScore = 0;

        document.querySelectorAll('.genre-tag, .format-tag').forEach(b => b.classList.remove('active'));

        const seasonSelect = document.getElementById('season-select');
        if (seasonSelect) seasonSelect.value = '';

        const yearInput = document.getElementById('year-input');
        if (yearInput) yearInput.value = '';

        const statusSelect = document.getElementById('status-select');
        if (statusSelect) statusSelect.value = '';

        const sourceSelect = document.getElementById('source-select');
        if (sourceSelect) sourceSelect.value = '';

        const scoreSlider = document.getElementById('score-slider');
        const scoreVal = document.getElementById('score-value');
        if (scoreSlider) scoreSlider.value = 0;
        if (scoreVal) scoreVal.textContent = '0.0';

        this.currentFilter = 'trending';
        document.querySelectorAll('.quick-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'trending');
        });

        this.resetAndLoad();
    },

    setViewMode(mode, triggerRender = true) {
        this.viewMode = mode === 'list' ? 'list' : 'grid';
        try {
            localStorage.setItem('ae_explore_view_mode', this.viewMode);
        } catch (_) {}

        const btnGrid = document.getElementById('btn-view-grid');
        const btnList = document.getElementById('btn-view-list');
        if (btnGrid) btnGrid.classList.toggle('active', this.viewMode === 'grid');
        if (btnList) btnList.classList.toggle('active', this.viewMode === 'list');

        const gridContainer = document.getElementById('anime-grid');
        const tableContainer = document.getElementById('anime-table-container');

        if (this.viewMode === 'grid') {
            if (gridContainer) gridContainer.style.display = 'grid';
            if (tableContainer) tableContainer.style.display = 'none';
        } else {
            if (gridContainer) gridContainer.style.display = 'none';
            if (tableContainer) tableContainer.style.display = 'block';
        }

        if (triggerRender && this.currentAnimes && this.currentAnimes.length > 0) {
            this.renderAnimes(this.currentAnimes, false);
        }
    },

    renderChips() {
        const container = document.getElementById('active-chips');
        if (!container) return;

        const genreMap = {
            '1': 'Ação', '2': 'Aventura', '4': 'Comédia', '8': 'Drama',
            '10': 'Fantasia', '14': 'Terror', '22': 'Romance', '24': 'Sci-Fi',
            '36': 'Slice of Life', '30': 'Esportes', '40': 'Suspense', '7': 'Mistério'
        };

        const formatMap = {
            'TV': 'TV', 'MOVIE': 'Filme', 'OVA': 'OVA', 'ONA': 'ONA', 'SPECIAL': 'Especial'
        };

        const seasonMap = {
            'WINTER': 'Inverno ❄️', 'SPRING': 'Primavera 🌸', 'SUMMER': 'Verão ☀️', 'FALL': 'Outono 🍂'
        };

        const statusMap = {
            'FINISHED': 'Finalizado ✅', 'RELEASING': 'Em Lançamento 📺', 'NOT_YET_RELEASED': 'Em Breve 🕒', 'CANCELLED': 'Cancelado'
        };

        let chipsHtml = '';

        if (this.searchQuery) {
            chipsHtml += `
                <div class="active-chip">
                    Busca: "${this.searchQuery}"
                    <button type="button" onclick="ExplorePage.removeFilter('search')">×</button>
                </div>
            `;
        }

        if (this.selectedFormat) {
            chipsHtml += `
                <div class="active-chip">
                    ${formatMap[this.selectedFormat] || this.selectedFormat} 
                    <button type="button" onclick="ExplorePage.removeFilter('format', '${this.selectedFormat}')">×</button>
                </div>
            `;
        }

        if (this.selectedSeason) {
            chipsHtml += `
                <div class="active-chip">
                    ${seasonMap[this.selectedSeason]} 
                    <button type="button" onclick="ExplorePage.removeFilter('season')">×</button>
                </div>
            `;
        }

        if (this.selectedYear) {
            chipsHtml += `
                <div class="active-chip">
                    Ano: ${this.selectedYear} 
                    <button type="button" onclick="ExplorePage.removeFilter('year')">×</button>
                </div>
            `;
        }

        if (this.selectedStatus) {
            chipsHtml += `
                <div class="active-chip">
                    Status: ${statusMap[this.selectedStatus]} 
                    <button type="button" onclick="ExplorePage.removeFilter('status')">×</button>
                </div>
            `;
        }

        if (this.selectedSource) {
            chipsHtml += `
                <div class="active-chip">
                    Origem: ${this.selectedSource.replace('_', ' ')} 
                    <button type="button" onclick="ExplorePage.removeFilter('source')">×</button>
                </div>
            `;
        }

        if (this.minScore > 0) {
            chipsHtml += `
                <div class="active-chip">
                    Nota: ${(this.minScore / 10).toFixed(1)}+ 
                    <button type="button" onclick="ExplorePage.removeFilter('score')">×</button>
                </div>
            `;
        }

        this.selectedGenres.forEach(id => {
            chipsHtml += `
                <div class="active-chip">
                    ${genreMap[id] || id} 
                    <button type="button" onclick="ExplorePage.removeFilter('genre', '${id}')">×</button>
                </div>
            `;
        });

        const hasAnyFilter = Boolean(
            this.searchQuery || this.selectedFormat || this.selectedSeason ||
            this.selectedYear || this.selectedStatus || this.selectedSource ||
            this.minScore > 0 || (this.selectedGenres && this.selectedGenres.length > 0)
        );

        if (hasAnyFilter) {
            chipsHtml += `
                <button type="button" class="btn-clear-all" onclick="ExplorePage.clearAllFilters()" title="Remover todos os filtros aplicados">
                    <i class="fas fa-trash-alt"></i> Limpar Filtros
                </button>
            `;
        }

        container.innerHTML = chipsHtml;
    },

    updateTitle() {
        const filterLabels = {
            'trending': 'Em Alta',
            'seasonal': 'Temporada Atual',
            'top': 'Top Avaliados',
            'upcoming': 'Em Breve'
        };

        let title = `<i class="fas fa-compass"></i> Explorar`;
        if (filterLabels[this.currentFilter]) {
            title += `: ${filterLabels[this.currentFilter]}`;
        }

        const el = document.querySelector('.page-title');
        if (el) el.innerHTML = title;
    },

    async loadAnimes() {
        const grid = document.getElementById('anime-grid');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (this.currentPage === 1) {
            this.renderSkeletons();
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        }

        try {
            const result = await this.fetchAnimes();
            this.renderAnimes(result.items, this.currentPage > 1);

            const countEl = document.getElementById('results-count');
            if (countEl) {
                const shown = document.querySelectorAll('#anime-grid .anime-card').length;
                countEl.innerHTML = `${shown} EXIBIDOS`;
            }

            const srcBadge = document.getElementById('explore-api-source');
            if (srcBadge) {
                if (result.source === 'anilist') {
                    srcBadge.textContent = '🟢 FONTE: ANILIST';
                } else if (result.source === 'jikan') {
                    srcBadge.textContent = '⚡ FONTE: JIKAN v4 (MAL)';
                } else {
                    srcBadge.textContent = '🎵 FONTE: ANIMETHEMES';
                }
            }
        } catch (e) {
            console.error('Erro em ExplorePage.loadAnimes:', e);
            if (grid) grid.innerHTML = '<p class="empty-message">Erro ao carregar animes. Tente ajustar os filtros.</p>';
        }
    },

    renderSkeletons(count = 12) {
        const grid = document.getElementById('anime-grid');
        if (!grid) return;
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
        const genreMap = {
            '1': 'Action', '2': 'Adventure', '4': 'Comedy', '8': 'Drama',
            '10': 'Fantasy', '14': 'Horror', '22': 'Romance', '24': 'Sci-Fi',
            '36': 'Slice of Life', '30': 'Sports'
        };

        const genres = this.selectedGenres.map(id => genreMap[id]).filter(Boolean);
        let season = this.selectedSeason || null;
        let year = this.selectedYear ? parseInt(this.selectedYear, 10) : null;
        let status = this.selectedStatus || null;
        let sort = this.currentSort || 'POPULARITY_DESC';
        let search = this.searchQuery || null;

        if (this.currentFilter === 'seasonal' && !season && !year) {
            status = status || 'RELEASING';
        } else if (this.currentFilter === 'upcoming' && !status) {
            status = 'NOT_YET_RELEASED';
        } else if (this.currentFilter === 'top' && sort === 'POPULARITY_DESC') {
            sort = 'SCORE_DESC';
        }

        const response = await API.exploreAnimes({
            page: this.currentPage,
            perPage: 24,
            search,
            genres,
            year,
            season,
            format: this.selectedFormat || null,
            status,
            sort
        });

        let items = response.items || [];
        if (this.minScore > 0) {
            const minVal = this.minScore / 10;
            items = items.filter(a => {
                const sc = parseFloat(a.score);
                return !isNaN(sc) && sc >= minVal;
            });
        }

        this.hasMore = Boolean(response.hasNextPage);
        return {
            items,
            source: response.source || 'anilist'
        };
    },

    renderAnimes(animes, append = false) {
        if (!append) this.currentAnimes = animes || [];
        else this.currentAnimes = [...(this.currentAnimes || []), ...(animes || [])];

        const grid = document.getElementById('anime-grid');
        const tableContainer = document.getElementById('anime-table-container');
        const tbody = document.getElementById('anime-table-body');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (!append) {
            if (grid) grid.innerHTML = '';
            if (tbody) tbody.innerHTML = '';
        }

        if ((!animes || animes.length === 0) && !append) {
            if (grid) grid.innerHTML = '<p class="empty-message">Nenhum anime encontrado para estes filtros.</p>';
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">Nenhum anime encontrado para estes filtros.</td></tr>';
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }

        // 1. Renderizar Modo Grade
        if (grid) {
            animes.forEach(anime => {
                const card = document.createElement('div');
                card.className = 'anime-card';
                const safeTitle = (anime.title || 'Anime').replace(/'/g, "\\'");
                const safeImg = (anime.image || '').replace(/'/g, "\\'");

                card.innerHTML = `
                    <div class="card-poster-wrapper">
                        <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                        ${anime.score && anime.score !== '?' ? `<div class="card-badge-score"><i class="fas fa-star"></i> ${anime.score}</div>` : ''}
                        <div class="card-badge-format">${anime.format || 'TV'}</div>
                        <button type="button" class="card-audio-preview-btn" onclick="event.stopPropagation(); ExplorePage.playCardOST(${anime.id}, '${safeTitle}', '${safeImg}')" title="Ouvir Opening/Ending oficial">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <div>
                            <h3 class="card-title" title="${anime.title}">${anime.title}</h3>
                            <div class="card-meta-row">
                                <span><i class="fas fa-layer-group"></i> ${anime.episodes || anime.total_episodes || '?'} eps</span>
                                <span><i class="fas fa-calendar"></i> ${anime.year || '-'}</span>
                            </div>
                        </div>
                        <div class="card-actions-row">
                            <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation(); Common.navigate('?page=detalhes&id=${anime.id}')">
                                Detalhes
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); Common.openListModal({id: ${anime.id}})" title="Salvar na lista">
                                <i class="fas fa-plus"></i> Lista
                            </button>
                        </div>
                    </div>
                `;

                card.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        Common.navigate(`?page=detalhes&id=${anime.id}`);
                    }
                });

                grid.appendChild(card);
            });
        }

        // 2. Renderizar Modo Tabela / Lista Compacta
        if (tbody) {
            animes.forEach(anime => {
                const tr = document.createElement('tr');
                const safeTitle = (anime.title || 'Anime').replace(/'/g, "\\'");
                const safeImg = (anime.image || '').replace(/'/g, "\\'");

                tr.innerHTML = `
                    <td>
                        <img src="${anime.image}" alt="${anime.title}" class="table-cover-thumb" loading="lazy">
                    </td>
                    <td>
                        <a href="?page=detalhes&id=${anime.id}" class="table-anime-title" onclick="event.preventDefault(); Common.navigate('?page=detalhes&id=${anime.id}');">
                            ${anime.title}
                        </a>
                        ${anime.titleEnglish ? `<span class="table-anime-sub">${anime.titleEnglish}</span>` : ''}
                    </td>
                    <td><span class="badge" style="font-size: 0.72rem; padding: 2px 6px;">${anime.format || 'TV'}</span></td>
                    <td>${anime.season ? anime.season + ' ' : ''}${anime.year || '-'}</td>
                    <td>${anime.episodes || anime.total_episodes || '?'} eps</td>
                    <td>
                        <strong style="color: var(--color-primary); font-size: 0.95rem;">
                            <i class="fas fa-star" style="color: #eab308; font-size: 0.75rem;"></i> ${anime.score || '-'}
                        </strong>
                    </td>
                    <td><span class="badge" style="font-size: 0.7rem; background: var(--color-surface);">${anime.status || '-'}</span></td>
                    <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 4px;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); ExplorePage.playCardOST(${anime.id}, '${safeTitle}', '${safeImg}')" title="Ouvir Opening/Ending oficial">
                                <i class="fas fa-play"></i> OP
                            </button>
                            <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation(); Common.openListModal({id: ${anime.id}})" title="Salvar na lista">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </td>
                `;

                tr.addEventListener('click', (e) => {
                    if (!e.target.closest('button') && !e.target.closest('a')) {
                        Common.navigate(`?page=detalhes&id=${anime.id}`);
                    }
                });

                tbody.appendChild(tr);
            });
        }

        if (loadMoreContainer) {
            loadMoreContainer.style.display = this.hasMore ? 'flex' : 'none';
        }
    },

    async playCardOST(animeId, title, image) {
        Common.showToast(`🎵 Buscando OP/ED de "${title}"...`);
        try {
            if (typeof MusicService === 'undefined' || typeof OSTPlayer === 'undefined') return;
            let tracks = await MusicService.getThemesForAnime(animeId, { id: animeId, title, image, cover: image });
            if (!tracks || tracks.length === 0) {
                tracks = await MusicService.searchTracks(title, 'ALL');
            }
            if (tracks && tracks.length > 0) {
                OSTPlayer.setQueue(tracks, 0, true);
                Common.showToast(`▶ Tocando: ${tracks[0].songTitle} — ${tracks[0].animeTitle}`);
            } else {
                Common.showToast('Tema direto não encontrado; abrindo estação na Rádio FM!', 'info');
            }
        } catch (e) {
            console.error(e);
        }
    },

    /**
     * Descoberta Sonora (Roleta de Openings no Explorar)
     */
    async spinSoundtrackRoulette() {
        const banner = document.getElementById('soundtrack-roulette-banner');
        const btn = document.getElementById('explore-roulette-btn');
        if (!banner) return;

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sorteando OP...';
        }

        try {
            if (typeof MusicService !== 'undefined' && typeof OSTPlayer !== 'undefined') {
                const tracks = await MusicService.getDiscoveryTracks({ type: 'OP', count: 12 });
                if (tracks && tracks.length > 0) {
                    const pick = tracks[Math.floor(Math.random() * tracks.length)];
                    OSTPlayer.setQueue([pick, ...tracks.filter(t => t.id !== pick.id)], 0, true);

                    banner.style.display = 'flex';
                    banner.innerHTML = `
                        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:16px;flex-wrap:wrap;">
                            <div style="display:flex;align-items:center;gap:14px;">
                                <img src="${pick.cover}" alt="${pick.animeTitle}" style="width:56px;height:76px;object-fit:cover;border:2px solid var(--border-color);">
                                <div>
                                    <div style="font-size:0.72rem;font-weight:800;color:var(--color-primary);text-transform:uppercase;letter-spacing:0.06em;">
                                        🎧 DESCOBERTA SONORA ATIVA • TOCANDO AGORA NO PLAYER
                                    </div>
                                    <h3 style="margin:2px 0;font-size:1.1rem;font-weight:800;">${pick.songTitle} (${pick.themeLabel || 'OP'})</h3>
                                    <div style="font-size:0.85rem;color:var(--color-text-secondary);">
                                        Anime: <strong>${pick.animeTitle}</strong> ${pick.artistName ? `• Artista: ${pick.artistName}` : ''}
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex;gap:8px;align-items:center;">
                                ${pick.animeId ? `<a href="?page=detalhes&id=${pick.animeId}" class="btn btn-primary btn-sm"><i class="fas fa-info-circle"></i> Ver Anime</a>` : ''}
                                <button class="btn btn-secondary btn-sm" onclick="ExplorePage.spinSoundtrackRoulette()">
                                    <i class="fas fa-random"></i> Outra OP
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('soundtrack-roulette-banner').style.display='none'">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('Erro na roleta sonora:', err);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-record-vinyl"></i> Descoberta Sonora (OP)';
            }
        }
    },

    async loadMore() {
        const btn = document.getElementById('load-more-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
            btn.disabled = true;
        }

        this.currentPage++;

        try {
            const result = await this.fetchAnimes();
            this.renderAnimes(result.items, true);
            const countEl = document.getElementById('results-count');
            if (countEl) {
                const shown = document.querySelectorAll('#anime-grid .anime-card').length;
                countEl.innerHTML = `${shown} EXIBIDOS`;
            }
        } catch (e) {
            console.error('Erro:', e);
        }

        if (btn) {
            btn.innerHTML = '<i class="fas fa-plus"></i> Carregar Mais';
            btn.disabled = false;
        }
    }
};

window.ExplorePage = ExplorePage;
if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        ExplorePage.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => ExplorePage.init());
    }
}
