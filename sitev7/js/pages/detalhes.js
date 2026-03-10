/**
 * AnimeEngine v6 - Detalhes Page
 */

const DetalhesPage = {
    anime: null,
    animeId: null,
    staff: null,
    fillers: null,

    async init() {
        console.log('📖 Loading Details Page...');

        // Pegar ID da URL
        const params = new URLSearchParams(window.location.search);
        this.animeId = params.get('id');

        if (!this.animeId) {
            this.showError('Anime não especificado');
            return;
        }

        await this.loadAnime();
        console.log('✅ Details Page loaded!');
    },

    async loadAnime() {
        try {
            const data = await API.getAnimeById(this.animeId);
            this.anime = data; // Already formatted
            this.render();

            // Render Timeline
            if (typeof Timeline !== 'undefined') {
                Timeline.render('timeline-container', this.anime.relations);
            }

            // Atualizar título da página
            document.title = `${this.anime.title} - ANIME.ENGINE v6`;
        } catch (error) {
            console.error('Erro ao carregar anime:', error);
            this.showError('Erro ao carregar anime');
        }
    },

    render() {
        const container = document.getElementById('anime-details');
        const anime = this.anime;
        const listType = Storage.getAnimeStatus(anime.id);
        const userAnime = listType ? Storage.getList(listType).find(a => a.id == anime.id) : null;
        const isFav = Storage.isFavorite(anime.id);

        container.innerHTML = `
            <!-- HERO -->
            <div class="details-hero" style="background-image: url('${anime.banner}')">
                <div class="details-hero-overlay"></div>
            </div>
            
            <!-- MAIN INFO -->
            <div class="details-content">
                <div class="details-header">
                    <div class="details-cover">
                        <img src="${anime.image}" alt="${anime.title}">
                    </div>
                    <div class="details-info">
                        <h1 class="details-title">${anime.title}</h1>
                        ${anime.titleEnglish ? `<p class="details-alt-title">${anime.titleEnglish}</p>` : ''}
                        
                        <div class="details-score">
                            <i class="fas fa-star"></i>
                            <span class="score-value">${anime.score || '-'}</span>
                            <span class="score-label">/ 10</span>
                        </div>
                        
                        <div class="details-meta">
                            <span><i class="fas fa-tv"></i> ${anime.episodes || anime.total_episodes || '?'} episódios</span>
                            <span><i class="fas fa-clock"></i> ${anime.duration || '24 min'}</span>
                            <span><i class="fas fa-signal"></i> ${anime.status}</span>
                            <span><i class="fas fa-calendar"></i> ${anime.year || '-'}</span>
                        </div>
                        
                        <div class="details-genres">
                            ${anime.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                        </div>

                        <!-- AIRING STATUS -->
                        ${anime.nextAiringEpisode ? `
                            <div class="airing-status" id="airing-status">
                                <div class="pulse-dot"></div>
                                <span>Ep ${anime.nextAiringEpisode.episode} em: </span>
                                <span class="countdown-timer" id="countdown-timer">Carregando...</span>
                            </div>
                        ` : ''}
                        
                        <!-- STATUS BADGE -->
                        ${listType ? `
                            <div class="details-current-status">
                                <span class="status-badge status-${listType}">
                                    ${this.getStatusLabel(listType)}
                                </span>
                            </div>
                        ` : ''}
                        
                        <!-- RATING STARS -->
                        <div class="details-rating">
                            <span class="rating-label">Sua Avaliação:</span>
                            <div class="rating-stars" id="rating-stars">
                                ${this.renderStars(userAnime?.rating || 0)}
                            </div>
                        </div>
                        
                        <div class="details-actions">
                            <div class="dropdown">
                                <button class="btn btn-primary dropdown-toggle" onclick="DetalhesPage.toggleDropdown()">
                                    <i class="fas fa-list"></i> ${listType ? 'Mover para' : 'Adicionar'}
                                </button>
                                <div class="dropdown-menu" id="list-dropdown">
                                    <button class="${listType === 'watching' ? 'active' : ''}" onclick="DetalhesPage.addToList('watching')">📺 Assistindo</button>
                                    <button class="${listType === 'planToWatch' ? 'active' : ''}" onclick="DetalhesPage.addToList('planToWatch')">📋 Quero Ver</button>
                                    <button class="${listType === 'completed' ? 'active' : ''}" onclick="DetalhesPage.addToList('completed')">✅ Completo</button>
                                    <button class="${listType === 'paused' ? 'active' : ''}" onclick="DetalhesPage.addToList('paused')">⏸️ Pausado</button>
                                    <button class="${listType === 'dropped' ? 'active' : ''}" onclick="DetalhesPage.addToList('dropped')">❌ Abandonado</button>
                                    ${listType ? '<div class="dropdown-divider"></div><button class="dropdown-remove" onclick="DetalhesPage.removeFromList()">🗑️ Remover da Lista</button>' : ''}
                                </div>
                            </div>
                            
                            <button class="btn ${isFav ? 'btn-danger' : 'btn-secondary'}" onclick="DetalhesPage.toggleFavorite()">
                                <i class="fas fa-heart"></i> ${isFav ? 'Desfavoritar' : 'Favoritar'}
                            </button>
                            
                            ${(() => {
                const nextEp = this.getResumeEpisode();
                const isCompleted = listType === 'completed';

                if (isCompleted) {
                    return `
                                        <button class="btn btn-secondary" onclick="DetalhesPage.confirmRewatch()">
                                            <i class="fas fa-redo"></i> Reassistir
                                        </button>
                                    `;
                } else if (nextEp > 1) {
                    return `
                                        <button class="btn resume-btn" onclick="document.getElementById('episodes-section').scrollIntoView({behavior: 'smooth'})">
                                            <i class="fas fa-play"></i> Continuar: Ep ${nextEp}
                                        </button>
                                    `;
                } else {
                    return `
                                        <button class="btn btn-secondary" onclick="document.getElementById('episodes-section').scrollIntoView({behavior: 'smooth'})">
                                            <i class="fas fa-play"></i> Começar Ep 1
                                        </button>
                                    `;
                }
            })()}
                            
                            <button class="btn btn-secondary" onclick="DetalhesPage.openStreaming()" title="Onde Assistir">
                                <i class="fas fa-external-link-alt"></i> Links
                            </button>
                            
                            ${anime.trailer ? `
                                <button class="btn btn-secondary" onclick="DetalhesPage.playOpening()" title="Ouvir Opening">
                                    <i class="fas fa-music"></i> Opening
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- SYNOPSIS -->
                <div class="details-section">
                    <h2 class="section-title"><i class="fas fa-book-open"></i> Sinopse</h2>
                    <p class="details-synopsis">${anime.synopsis || 'Sinopse não disponível.'}</p>
                </div>
                
                <!-- TRAILER -->
                ${anime.trailer ? `
                    <div class="details-section">
                        <h2 class="section-title"><i class="fas fa-film"></i> Trailer <span style="font-size: 0.7rem; color: var(--color-text-muted);">(clique para modo foco)</span></h2>
                        <div class="details-trailer" onclick="DetalhesPage.toggleFocusMode()">
                            <iframe 
                                src="${anime.trailer.replace('watch?v=', 'embed/')}" 
                                frameborder="0" 
                                allowfullscreen>
                            </iframe>
                        </div>
                        <button class="trailer-focus-close" onclick="DetalhesPage.toggleFocusMode()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}
                
                <!-- TIMELINE DE FRANQUIAS -->
                <div class="details-section" id="timeline-container" style="display: none;"></div>
                
                <!-- INFO GRID -->
                <div class="details-section">
                    <h2 class="section-title"><i class="fas fa-info-circle"></i> Informações</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Tipo</span>
                            <span class="info-value">${anime.format || 'TV'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estúdio</span>
                            <span class="info-value">${anime.studios.join(', ') || '-'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rank</span>
                            <span class="info-value">#${anime.rank || '-'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Popularidade</span>
                            <span class="info-value">#${anime.popularity || '-'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- CHARACTERS -->
                <div class="details-section" id="characters-section">
                    <h2 class="section-title"><i class="fas fa-users"></i> Personagens & Dubladores</h2>
                    <div class="characters-grid" id="characters-grid">
                        <div class="carousel-loading"><div class="loader"></div></div>
                    </div>
                </div>
                
                <!-- RELATIONS (Manga, Sequels, etc) -->
                <div class="details-section" id="relations-section">
                    <h2 class="section-title"><i class="fas fa-book"></i> Obras Relacionadas</h2>
                    <div class="relations-grid" id="relations-grid">
                        <div class="carousel-loading"><div class="loader"></div></div>
                    </div>
                </div>
                
                <!-- RECOMMENDATIONS -->
                <div class="details-section" id="recommendations-section">
                    <h2 class="section-title"><i class="fas fa-thumbs-up"></i> Recomendações</h2>
                    <div class="carousel" id="recommendations-carousel">
                        <div class="carousel-loading"><div class="loader"></div></div>
                    </div>
                </div>

                <!-- STAFF (Equipe Técnica) -->
                <div class="details-section" id="staff-section">
                    <h2 class="section-title"><i class="fas fa-hammer"></i> Equipe Técnica</h2>
                    <div class="staff-track" id="staff-track">
                        <div class="skeleton" style="height: 180px; width: 100%; border-radius: 8px;"></div>
                    </div>
                </div>

                <!-- EPISODES & FILLERS -->
                <div class="details-section" id="episodes-section">
                    <div class="section-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
                        <h2 class="section-title" style="margin: 0;"><i class="fas fa-play-circle"></i> Guia de Episódios</h2>
                        <div class="episodes-view-toggle">
                            <button id="btn-grid-view" class="btn-icon active" onclick="DetalhesPage.toggleViewMode('grid')" title="Vista em Grade"><i class="fas fa-th"></i></button>
                            <button id="btn-list-view" class="btn-icon" onclick="DetalhesPage.toggleViewMode('list')" title="Vista em Lista"><i class="fas fa-list"></i></button>
                        </div>
                    </div>

                    <!-- Stats & Filters Bar -->
                    <div class="episodes-toolbox" style="background: var(--color-surface); border: var(--border-width) solid var(--border-color); padding: var(--space-sm); border-radius: 8px; margin-bottom: var(--space-md); box-shadow: var(--shadow-neo);">
                        <div class="stats-row" style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-sm); flex-wrap: wrap;">
                            <div class="filler-meter-container" style="flex-grow: 1; min-width: 200px;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                                    <span>Conteúdo Canon / Filler</span>
                                    <span id="filler-percent">Calculando...</span>
                                </div>
                                <div class="filler-meter-bar" style="height: 8px; background: #eee; border-radius: 4px; overflow: hidden; display: flex;">
                                    <div id="bar-canon" style="height: 100%; background: #33cc66; width: 0%; transition: width 0.5s;"></div>
                                    <div id="bar-mixed" style="height: 100%; background: #ffd700; width: 0%; transition: width 0.5s;"></div>
                                    <div id="bar-filler" style="height: 100%; background: #ff3366; width: 0%; transition: width 0.5s;"></div>
                                </div>
                            </div>
                            <div class="stats-badges" style="display: flex; gap: var(--space-sm);">
                                <div class="stat-badge" style="background: rgba(51, 204, 102, 0.1); border: 1px solid #33cc66; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">
                                    Canon: <strong id="count-canon">-</strong>
                                </div>
                                <div class="stat-badge" style="background: rgba(255, 51, 102, 0.1); border: 1px solid #ff3366; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">
                                    Filler: <strong id="count-filler">-</strong>
                                </div>
                            </div>
                        </div>

                        <div class="filter-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-sm);">
                            <div class="episodes-filters" style="display: flex; gap: var(--space-xs);">
                                <button class="filter-btn active" onclick="DetalhesPage.applyFilter('all')">Todos</button>
                                <button class="filter-btn" onclick="DetalhesPage.applyFilter('canon')">Canon</button>
                                <button class="filter-btn" onclick="DetalhesPage.applyFilter('filler')">Filler</button>
                                <button class="filter-btn" onclick="DetalhesPage.applyFilter('mixed')">Misto</button>
                            </div>
                            <div class="progress-info" style="font-size: 0.75rem; color: var(--color-text-muted);">
                                <i class="fas fa-check-circle"></i> <span id="watched-count">0</span> assistidos
                            </div>
                        </div>
                    </div>

                    <div class="episodes-grid" id="episodes-grid">
                        <div class="carousel-loading"><div class="loader"></div></div>
                    </div>
                </div>
            </div>
        `;

        // Carregar dados adicionais
        this.loadCharacters();
        this.loadRelations();
        this.loadRecommendations();
        this.loadStaff();
        this.fetchFillers(anime.title);

        // Iniciar contador se houver airing info
        if (this.anime && this.anime.nextAiringEpisode) {
            this.startAiringCountdown();
        }
    },

    getResumeEpisode() {
        const watched = Storage.getWatchedEpisodes(this.animeId);
        if (watched.length === 0) return 1;

        const max = Math.max(...watched);
        const total = this.anime.episodes || this.anime.total_episodes || 0;

        return max < total ? max + 1 : max;
    },

    confirmRewatch() {
        Common.confirm({
            title: '🍿 Reassistir Anime?',
            message: 'Você tem certeza que deseja reassistir? Isso resetará seu progresso de episódios vistos para este anime.',
            confirmText: 'Sim, Resetar 🍿',
            cancelText: 'Cancelar',
            onConfirm: () => {
                Storage.unmarkAllEpisodes(this.animeId);
                Storage.addToList('watching', this.anime);

                Common.showNotification('Progresso resetado! Boa maratona 🍿');
                this.render();

                // Scroll para os episódios para começar
                setTimeout(() => {
                    document.getElementById('episodes-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        });
    },

    startAiringCountdown() {
        const airingAt = this.anime.nextAiringEpisode.airingAt * 1000; // to ms
        const timerElement = document.getElementById('countdown-timer');

        if (!timerElement) return;

        const update = () => {
            const now = Date.now();
            const diff = airingAt - now;

            if (diff <= 0) {
                timerElement.textContent = "Lançado!";
                return clearInterval(this.countdownInterval);
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            let timeStr = "";
            if (days > 0) timeStr += `${days}d `;
            timeStr += `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;

            timerElement.textContent = timeStr;
        };

        update();
        this.countdownInterval = setInterval(update, 1000);
    },

    /**
     * Consumir API do AniList para Staff (Equipe Técnica)
     */
    async loadStaff() {
        const id = this.animeId;
        // Evitar chamadas redundantes se já tivermos os dados
        if (this.staff) {
            this.renderStaff();
            return;
        }

        const query = `
        query ($id: Int) {
            Media (id: $id) {
                staff {
                    edges {
                        role
                        node {
                            id
                            name { full }
                            image { medium }
                            description
                        }
                    }
                }
            }
        }`;

        try {
            const data = await API.query(query, { id: parseInt(id) });
            const allStaff = data.Media.staff.edges;

            // Filtrar e Ordenar (Priorizar Criador Original e Direção)
            const mainRolesSort = [
                'Original Creator', 'Story & Art', 'Director',
                'Series Composition', 'Music', 'Character Design', 'Producer'
            ];

            this.staff = allStaff
                .filter(edge => mainRolesSort.some(role => edge.role.includes(role)))
                .sort((a, b) => {
                    const getPriority = (role) => {
                        if (role.toLowerCase().includes('creator') || role.toLowerCase().includes('story')) return 1;
                        if (role.toLowerCase().includes('director')) return 2;
                        return 3;
                    };
                    return getPriority(a.role) - getPriority(b.role);
                });

            // Se o filtro for muito restritivo, mostra os 10 primeiros originais
            if (this.staff.length < 3) {
                this.staff = allStaff.slice(0, 10);
            }

            this.renderStaff();
        } catch (error) {
            console.error('Erro ao buscar staff:', error);
            const section = document.getElementById('staff-section');
            if (section) section.style.display = 'none';
        }
    },

    renderStaff() {
        const track = document.getElementById('staff-track');
        const section = document.getElementById('staff-section');

        if (!track || !this.staff || this.staff.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        const roleTranslations = {
            'Original Creator': 'Criador Original',
            'Story & Art': 'História e Arte',
            'Director': 'Direção',
            'Series Composition': 'Composição',
            'Music': 'Música',
            'Character Design': 'Design de Personagens',
            'Producer': 'Produção',
            'Executive Producer': 'Produção Executiva'
        };

        const translateRole = (role) => {
            for (const [en, pt] of Object.entries(roleTranslations)) {
                if (role.toLowerCase().includes(en.toLowerCase())) return pt;
            }
            return role;
        };

        track.innerHTML = this.staff.map((edge, index) => `
            <div class="staff-card" onclick="DetalhesPage.openStaffModal(${index})">
                <img src="${edge.node.image?.medium || 'https://via.placeholder.com/100x150'}" class="staff-image" alt="${edge.node.name.full}">
                <div class="staff-info-container">
                    <div class="staff-name">${edge.node.name.full}</div>
                    <div class="staff-role">${translateRole(edge.role)}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Limpar descrições (remover markdown/HTML do AniList)
     */
    cleanDescription(text) {
        if (!text) return 'Sem descrição disponível.';
        return text
            .replace(/__|_/g, '') // bold/italic
            .replace(/~{2}/g, '') // lines
            .replace(/!\[.*?\]\(.*?\)/g, '') // images
            .replace(/\[.*?\]\(.*?\)/g, '$1') // links
            .replace(/<br\s*\/?>/gi, '\n') // line breaks
            .replace(/<[^>]+>/g, '') // any other html
            .replace(/\n{3,}/g, '\n\n') // excess lines
            .trim();
    },

    /**
     * Abrir modal com detalhes da Staff
     */
    async openStaffModal(index) {
        const staffMember = this.staff[index];
        if (!staffMember) return;

        const node = staffMember.node;
        let description = this.cleanDescription(node.description);

        const modalContent = `
            <div class="character-modal">
                <div class="char-modal-header">
                    <div class="char-modal-image">
                        <img src="${node.image.medium}" alt="${node.name.full}">
                    </div>
                    <div class="char-modal-info">
                        <h2 class="char-modal-name">${node.name.full}</h2>
                        <p class="char-modal-kanji">${staffMember.role}</p>
                    </div>
                </div>
                
                <div class="char-modal-section">
                    <h3 class="char-section-title"><i class="fas fa-book-open"></i> Biografia</h3>
                    <div class="staff-modal-bio">${description}</div>
                </div>
                
                <div class="char-modal-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 class="char-section-title" style="margin-bottom: 0;"><i class="fas fa-film"></i> Obras Participadas</h3>
                        <select id="staff-media-sort" class="form-control" style="width: auto; padding: 5px; font-size: 0.8rem;" onchange="DetalhesPage.loadStaffMedia(${node.id}, this.value, false)">
                            <option value="START_DATE_DESC">Mais Recentes</option>
                            <option value="POPULARITY_DESC" selected>Popularidade</option>
                            <option value="SCORE_DESC">Maior Nota</option>
                            <option value="FAVOURITES_DESC">Favoritos</option>
                            <option value="START_DATE">Mais Antigas</option>
                        </select>
                    </div>
                    <div class="char-anime-grid" id="staff-media-grid">
                        <div class="loader" style="margin: 20px auto;"></div>
                    </div>
                    <div id="staff-media-load-more-container" style="text-align: center; margin-top: 15px; display: none;">
                        <button class="btn btn-secondary" onclick="DetalhesPage.loadStaffMedia(${node.id}, document.getElementById('staff-media-sort').value, true)" style="display: inline-flex; align-items: center; gap: 8px;">
                            <i class="fas fa-plus"></i> Ver Mais
                        </button>
                    </div>
                </div>
                
                <div class="char-modal-section" style="text-align: center; margin-top: 20px;">
                    <a href="https://anilist.co/staff/${node.id}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i> Ver Perfil Completo
                    </a>
                </div>
            </div>
        `;

        // Traduzir se o serviço estiver disponível
        if (window.Translation && node.description) {
            const translated = await window.Translation.translate(description, `staff_${node.id}`);
            const bioDiv = document.querySelector('.staff-modal-bio');
            if (bioDiv) bioDiv.innerHTML = translated;
        }

        Common.openModal(modalContent, { title: 'Equipe Técnica', className: 'modal-wide' });

        // Reset state for deduplication
        this.currentStaffMap = new Map();
        this.currentStaffPage = 1;

        // Initial load of staff media
        this.loadStaffMedia(node.id, 'POPULARITY_DESC', false);
    },

    /**
     * Carregar Obras da Staff com Ordenação, Deduplicação e Paginação
     */
    async loadStaffMedia(staffId, sort, loadMore = false) {
        const grid = document.getElementById('staff-media-grid');
        const loadMoreContainer = document.getElementById('staff-media-load-more-container');
        if (!grid) return;

        if (!loadMore) {
            this.currentStaffMap = new Map();
            this.currentStaffPage = 1;
            grid.innerHTML = '<div class="loader" style="margin: 20px auto;"></div>';
        } else {
            this.currentStaffPage++;
            const btn = loadMoreContainer.querySelector('button');
            if (btn) btn.innerHTML = '<div class="loader-small"></div> Carregando...';
        }

        try {
            const result = await API.getStaffMedia(staffId, sort, this.currentStaffPage);
            const mediaEdges = result.edges || [];
            const pageInfo = result.pageInfo || { hasNextPage: false };

            if (!loadMore && (!mediaEdges || mediaEdges.length === 0)) {
                grid.innerHTML = '<p style="text-align: center; color: var(--color-text-muted); width: 100%;">Nenhuma obra encontrada.</p>';
                if (loadMoreContainer) loadMoreContainer.style.display = 'none';
                return;
            }

            if (!loadMore) {
                grid.innerHTML = ''; // Clear loader
            }

            // Deduplication logic
            mediaEdges.forEach(edge => {
                const nodeId = edge.node.id;
                if (this.currentStaffMap.has(nodeId)) {
                    // Combine roles
                    const existing = this.currentStaffMap.get(nodeId);
                    if (!existing.staffRole.includes(edge.staffRole || 'Staff')) {
                        existing.staffRole += ', ' + (edge.staffRole || 'Staff');
                    }
                } else {
                    this.currentStaffMap.set(nodeId, {
                        node: edge.node,
                        staffRole: edge.staffRole || 'Staff'
                    });
                }
            });

            grid.innerHTML = Array.from(this.currentStaffMap.values()).map(item => {
                const node = item.node;
                const role = item.staffRole;
                return `
                <a href="detalhes.php?id=${node.id}" class="char-anime-link" title="${node.title.romaji}">
                    <img src="${node.coverImage.medium}" alt="${node.title.romaji}">
                    <span style="display: block; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.title.romaji}</span>
                    <small style="display:block; font-size: 0.65rem; color: var(--color-primary); width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${role}">${role}</small>
                </a>
                `;
            }).join('');

            if (loadMoreContainer) {
                loadMoreContainer.style.display = pageInfo.hasNextPage ? 'block' : 'none';
                const btn = loadMoreContainer.querySelector('button');
                if (btn) btn.innerHTML = '<i class="fas fa-plus"></i> Ver Mais';
            }

        } catch (error) {
            console.error('Erro ao carregar obras da staff:', error);
            if (!loadMore) {
                grid.innerHTML = '<p style="text-align: center; color: var(--color-primary); width: 100%;">Erro ao carregar obras.</p>';
            }
        }
    },

    /**
     * Consumir API PHP para Fillers
     */
    /**
     * Consumir API PHP para Fillers
     */
    async fetchFillers(title) {
        // Evitar chamadas redundantes
        if (this.fillers) {
            this.renderEpisodes(this.fillers);
            return;
        }

        try {
            console.info('Buscando fillers para:', title);
            const response = await fetch(`api/fillers.php?anime=${encodeURIComponent(title)}&t=${Date.now()}`);
            const data = await response.json();

            if (data.error) {
                console.warn('Filler API error:', data.error, 'Slug:', data.attempted_slug || data.slug);
                this.renderEpisodes(null);
                return;
            }

            console.info('Fillers carregados com sucesso. Slug:', data.slug);
            this.fillers = data.episodes;

            // Correção Dinâmica de Episódios (Para animes em lançamento com '?')
            if (!this.anime.episodes && this.fillers && this.fillers.length > 0) {
                this.anime.episodes = this.fillers.length;

                // Atualizar texto na DOM
                const metaSpans = document.querySelectorAll('.details-meta span');
                metaSpans.forEach(span => {
                    if (span.innerHTML.includes('fa-tv')) {
                        span.innerHTML = `<i class="fas fa-tv"></i> ${this.anime.episodes} episódios`;
                    }
                });
            }

            this.renderEpisodes(this.fillers);
        } catch (error) {
            console.error('Erro ao buscar fillers:', error);
            this.renderEpisodes(null);
        }
    },

    renderEpisodes(fillerData) {
        const grid = document.getElementById('episodes-grid');
        const episodesCount = this.anime.episodes || this.anime.total_episodes || 0;

        if (episodesCount === 0) {
            grid.innerHTML = '<p class="info-text">Informação de episódios indisponível.</p>';
            return;
        }

        const watched = Storage.getWatchedEpisodes(this.animeId);
        let counts = { canon: 0, filler: 0, mixed: 0, total: episodesCount };
        let html = '';

        for (let i = 1; i <= episodesCount; i++) {
            let statusClass = '';
            let type = 'canon'; // Default
            let title = `Episódio ${i}`;

            if (fillerData) {
                const epInfo = fillerData.find(e => parseInt(e.number) === i);
                if (epInfo) {
                    type = epInfo.type;
                    statusClass = epInfo.type;
                    title = epInfo.title || title;
                }
            }

            // Update stats
            if (counts[type] !== undefined) counts[type]++;
            const isWatched = watched.includes(i);

            html += `
                <div class="episode-item ${statusClass} ${isWatched ? 'watched' : ''}" 
                     data-number="${i}" 
                     data-type="${type}"
                     title="${title} (${type})"
                     onclick="DetalhesPage.toggleWatched(${i})">
                    <span class="ep-number">${i}</span>
                    <span class="ep-title-hover">${title}</span>
                    <div class="watched-overlay"><i class="fas fa-check"></i></div>
                </div>
            `;
        }
        grid.innerHTML = html;

        // Update Stats UI
        this.updateEpisodesStats(counts, watched.length);
    },

    updateEpisodesStats(counts, watchedCount) {
        const totalRaw = counts.total || 1;
        const pCanon = (counts.canon / totalRaw) * 100;
        const pFiller = (counts.filler / totalRaw) * 100;
        const pMixed = (counts.mixed / totalRaw) * 100;

        document.getElementById('bar-canon').style.width = `${pCanon}%`;
        document.getElementById('bar-filler').style.width = `${pFiller}%`;
        document.getElementById('bar-mixed').style.width = `${pMixed}%`;

        document.getElementById('count-canon').textContent = counts.canon;
        document.getElementById('count-filler').textContent = counts.filler;
        document.getElementById('watched-count').textContent = watchedCount;

        const fillerPercent = Math.round(((counts.filler + counts.mixed) / totalRaw) * 100);
        document.getElementById('filler-percent').textContent = `${fillerPercent}% Filler`;
    },

    toggleWatched(number) {
        const isNowWatched = Storage.toggleWatchedEpisode(this.anime, number);
        const epElement = document.querySelector(`.episode-item[data-number="${number}"]`);

        if (epElement) {
            epElement.classList.toggle('watched', isNowWatched);
        }

        // Update count
        const watched = Storage.getWatchedEpisodes(this.animeId);
        document.getElementById('watched-count').textContent = watched.length;

        // Sync with the main status dropdown if applicable
        this.syncMainProgress(number, isNowWatched);
    },

    syncMainProgress(number, isWatched) {
        // This is a subtle UX: if they mark an episode as watched, 
        // and it's higher than current progress, we could update the UI dropdown info
        // but the storage is already updated by Storage.toggleWatchedEpisode
        console.log(`Progresso sincronizado: Ep ${number} (${isWatched ? 'Visto' : 'Desmarcado'})`);
    },

    applyFilter(type) {
        // Update buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase() === type || (type === 'all' && btn.textContent === 'Todos'));
        });

        const episodes = document.querySelectorAll('.episode-item');
        episodes.forEach(ep => {
            if (type === 'all' || ep.getAttribute('data-type') === type) {
                ep.style.display = 'flex';
            } else {
                ep.style.display = 'none';
            }
        });
    },

    toggleViewMode(mode) {
        const grid = document.getElementById('episodes-grid');
        grid.classList.toggle('list-mode', mode === 'list');

        document.getElementById('btn-grid-view').classList.toggle('active', mode === 'grid');
        document.getElementById('btn-list-view').classList.toggle('active', mode === 'list');
    },

    // Armazenar dados de personagens para paginação
    charactersData: [],
    charactersShown: 0,
    apiPage: 1,
    hasNextPage: false,
    CHARS_PER_PAGE: 10,

    /**
     * Carregar personagens e dubladores
     */
    async loadCharacters() {
        try {
            await API.delay();

            const characters = this.anime.characters;
            const data = characters ? characters.edges : [];
            const grid = document.getElementById('characters-grid');
            const section = document.getElementById('characters-section');

            if (!grid || !section) return;

            if (!data || data.length === 0) {
                section.style.display = 'none';
                return;
            }

            // Initialization
            this.charactersData = data;
            this.charactersShown = 0;
            this.apiPage = 1;

            // Check if there are more pages based on pageInfo
            // pageInfo is now available in the initial query
            if (characters && characters.pageInfo) {
                this.hasNextPage = characters.pageInfo.hasNextPage;
            } else {
                // Fallback if something fails: assume true if full page
                this.hasNextPage = this.charactersData.length >= 25;
            }

            grid.innerHTML = '';

            // Mostrar primeiros 10
            this.showMoreCharacters();

            // Adicionar botão se houver mais
            if (this.hasNextPage || data.length > this.CHARS_PER_PAGE) {
                this.addShowMoreButton();
            }

        } catch (error) {
            console.error('Erro ao carregar personagens:', error);
            document.getElementById('characters-section').style.display = 'none';
        }
    },

    /**
     * Mostrar mais personagens
     */
    async showMoreCharacters() {
        const grid = document.getElementById('characters-grid');
        const btn = document.getElementById('show-more-chars-btn');

        // Check if we need to fetch more data
        // If we are showing everything we have AND there is a next page
        if (this.charactersShown + this.CHARS_PER_PAGE > this.charactersData.length && this.hasNextPage) {
            if (btn) {
                btn.innerHTML = '<div class="loader-sm"></div> Carregando...';
                btn.disabled = true;
            }

            try {
                // Fetch next page
                this.apiPage++;
                const newData = await API.getCharacters(this.animeId, this.apiPage);

                if (newData && newData.edges) {
                    this.charactersData = [...this.charactersData, ...newData.edges];
                    this.hasNextPage = newData.pageInfo.hasNextPage;
                } else {
                    this.hasNextPage = false;
                }

            } catch (error) {
                console.error('Erro ao buscar mais personagens:', error);
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro ao carregar';
                    btn.disabled = false;
                }
                return;
            } finally {
                if (btn) btn.disabled = false;
            }
        }

        const start = this.charactersShown;
        const end = start + this.CHARS_PER_PAGE;
        const chars = this.charactersData.slice(start, end);

        chars.forEach(edge => {
            const char = edge.node;
            const role = edge.role;
            const vas = edge.voiceActors || [];
            const vaJP = vas.find(v => v.language === 'Japanese');
            const va = vaJP || vas[0];
            const vaLang = va ? (va.language === 'Japanese' ? '🇯🇵' : '🌍') : '';

            const roleClass = role === 'MAIN' ? 'main' : '';
            const roleText = role === 'MAIN' ? '⭐ Principal' : 'Secundário';

            grid.innerHTML += `
                    <div class="character-card" onclick="DetalhesPage.openCharacterModal(${char.id})" style="cursor: pointer;">
                        <div class="character-card-image">
                            <img src="${char.image?.large}" alt="${char.name.full}" loading="lazy">
                        </div>
                        <div class="character-card-info">
                            <div class="character-name" title="${char.name.full}">${char.name.full}</div>
                            <div class="character-role ${roleClass}">${roleText}</div>
                            ${va ? `
                                <div class="voice-actor">
                                    <img class="voice-actor-img" src="${va.image?.medium}" alt="${va.name.full}">
                                    <span class="voice-actor-name">${vaLang} ${va.name.full}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
        });

        this.charactersShown = Math.min(end, this.charactersData.length);

        // Update Button Logic
        if (btn) {
            const moreLocal = this.charactersShown < this.charactersData.length;

            if (!moreLocal && !this.hasNextPage) {
                btn.parentElement.style.display = 'none';
            } else {
                btn.parentElement.style.display = 'block';
                // Calculate approximately how many left if we know total, otherwise just "Ver Mais"
                // API v2 pageInfo gives total, but getAnimeById didn't. getCharacters does.
                // Let's just say "Ver Mais" or calculate simple local remaining if no next page

                if (this.hasNextPage) {
                    btn.innerHTML = `<i class="fas fa-plus"></i> Ver Mais`;
                } else {
                    const remaining = this.charactersData.length - this.charactersShown;
                    btn.innerHTML = `<i class="fas fa-plus"></i> Ver Mais (${remaining} restantes)`;
                }
            }
        }
    },

    /**
     * Adicionar botão Ver Mais
     */
    addShowMoreButton() {
        const section = document.getElementById('characters-section');
        const remaining = this.charactersData.length - this.CHARS_PER_PAGE;

        const btnContainer = document.createElement('div');
        btnContainer.className = 'show-more-container';
        btnContainer.innerHTML = `
            <button id="show-more-chars-btn" class="btn btn-secondary show-more-btn" onclick="DetalhesPage.showMoreCharacters()">
                <i class="fas fa-plus"></i> Ver Mais (${remaining} restantes)
            </button>
        `;
        section.appendChild(btnContainer);
    },

    /**
     * Carregar obras relacionadas (manga, sequels, etc)
     */
    async loadRelations() {
        try {
            await API.delay();
            const data = this.anime.relations;
            const grid = document.getElementById('relations-grid');
            const section = document.getElementById('relations-section');

            if (!grid || !section) return;

            if (!data || !data.edges || data.edges.length === 0) {
                section.style.display = 'none';
                return;
            }

            grid.innerHTML = '';

            // AniList relations are in data.edges
            data.edges.forEach(edge => {
                const node = edge.node;
                const relationType = edge.relationType.replace(/_/g, ' ');

                const typeIcon = node.format === 'MANGA' ? '📖' :
                    node.format === 'TV' ? '📺' :
                        node.format === 'NOVEL' ? '📚' : '🎬';

                grid.innerHTML += `
                    <div class="relation-card" onclick="window.location.href='detalhes.php?id=${node.id}'" style="cursor: pointer;">
                        <div class="relation-icon">${typeIcon}</div>
                        <div class="relation-info">
                            <div class="relation-type">${relationType}</div>
                            <div class="relation-title">${node.title.romaji}</div>
                            <div class="relation-meta">${node.format} • ${node.status}</div>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Erro ao carregar relações:', error);
            document.getElementById('relations-section').style.display = 'none';
        }
    },

    async loadRecommendations() {
        try {
            await API.delay();
            const data = this.anime.recommendations;
            const carousel = document.getElementById('recommendations-carousel');
            const section = document.getElementById('recommendations-section');

            if (!carousel || !section) return;

            if (!data || !data.nodes || data.nodes.length === 0) {
                section.style.display = 'none';
                return;
            }

            carousel.innerHTML = '';
            data.nodes.slice(0, 10).forEach(node => {
                const rec = node.mediaRecommendation;
                if (!rec) return;

                const anime = {
                    id: rec.id,
                    title: rec.title.romaji,
                    image: rec.coverImage.large,
                    score: rec.averageScore ? (rec.averageScore / 10).toFixed(1) : null,
                    episodes: null
                };
                const card = Common.createAnimeCard(anime);
                carousel.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao carregar recomendações:', error);
        }
    },

    getStatusLabel(status) {
        const labels = {
            watching: '📺 Assistindo',
            completed: '✅ Completo',
            planToWatch: '📋 Na Lista',
            paused: '⏸️ Pausado',
            dropped: '❌ Abandonado'
        };
        return labels[status] || status;
    },

    /**
     * Adicionar à lista (Local Storage)
     */
    addToList(listName) {
        try {
            const currentStatus = Storage.getAnimeStatus(this.anime.id);

            // LOGIC: Toggle (Remove if clicking same status)
            if (currentStatus === listName) {
                Storage.removeFromAllLists(this.anime.id);
                Common.showNotification('Removido da lista');
                this.render();
                return;
            }

            // Remove from old list if exists
            if (currentStatus) {
                Storage.removeFromAllLists(this.anime.id);
            }

            // Add to new list (Pass raw anime object, Storage handles formatting)
            Storage.addToList(listName, this.anime);

            // LOGIC: If 'completed', mark all episodes as watched
            if (listName === 'completed') {
                Storage.markAllEpisodesAsWatched(this.anime);
                // The render() call below will update the episode grid
            }

            // UI Feedback
            Common.showNotification(`"${this.anime.title}" adicionado à lista!`);
            Storage.addXP(10); // Bonus XP

            // Close dropdown and refresh
            const dropdown = document.getElementById('list-dropdown');
            if (dropdown) dropdown.classList.remove('show');

            this.render(); // Re-render to show updated status

        } catch (error) {
            console.error('Erro ao adicionar à lista:', error);
            Common.showNotification('Erro ao adicionar à lista', 'error');
        }
    },



    async toggleFavorite() {
        const wasFav = Storage.isFavorite(this.anime.id);
        Storage.toggleFavorite(this.anime);

        if (!wasFav) {
            Storage.addXP(5);
            Common.showNotification(`"${this.anime.title}" favoritado!`);
        } else {
            Common.showNotification(`"${this.anime.title}" removido dos favoritos`);
        }

        Common.updateLevelBadge();
        this.render();
    },

    openStreaming() {
        const anime = this.anime;
        const services = [
            { name: 'Crunchyroll', icon: '🟠', url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`, official: true },
            { name: 'Netflix', icon: '🔴', url: `https://www.netflix.com/search?q=${encodeURIComponent(anime.title)}`, official: true },
            { name: 'Better Anime', icon: '🟢', url: `https://betteranime.net/pesquisa?titulo=${encodeURIComponent(anime.title)}`, official: false },
            { name: 'AnimeFire', icon: '🔵', url: `https://animefire.net/pesquisar/${encodeURIComponent(anime.title)}`, official: false }
        ];

        let content = '<div class="streaming-list">';

        content += '<p class="streaming-label">Oficiais:</p>';
        services.filter(s => s.official).forEach(s => {
            content += `<a href="${s.url}" target="_blank" class="streaming-link official">${s.icon} ${s.name}</a>`;
        });

        content += '<p class="streaming-label">Alternativas:</p>';
        services.filter(s => !s.official).forEach(s => {
            content += `<a href="${s.url}" target="_blank" class="streaming-link">${s.icon} ${s.name}</a>`;
        });

        content += '</div>';

        Common.openModal(content, { title: `📺 Onde Assistir: ${anime.title}` });
    },

    // ========================================
    // RATING & LIST MANAGEMENT
    // ========================================

    /**
     * Renderiza estrelas de avaliação (10 estrelas)
     */
    renderStars(rating = 0) {
        let html = '';
        for (let i = 1; i <= 10; i++) {
            const filled = i <= rating;
            html += `<i class="fas fa-star star-btn ${filled ? 'filled' : ''}" onclick="DetalhesPage.setRating(${i})"></i>`;
        }
        return html;
    },

    /**
     * Define avaliação
     */
    setRating(rating) {
        const listType = Storage.getAnimeStatus(this.anime.id);
        if (!listType) {
            Common.showNotification('Adicione o anime à lista primeiro!', 'warning');
            return;
        }

        // Atualizar rating no Storage
        const lists = Storage.getLists();
        const anime = lists[listType].find(a => a.id == this.anime.id);
        if (anime) {
            anime.rating = rating;
            Storage.save(Storage.KEYS.LISTS, lists);
            Storage.addXP(5);
            Common.showNotification(`Avaliação: ${rating} estrelas!`);

            // Atualizar UI
            document.getElementById('rating-stars').innerHTML = this.renderStars(rating);
            Common.updateLevelBadge();
        }
    },

    /**
     * Remover da lista
     */
    removeFromList() {
        Storage.removeFromAllLists(this.anime.id);
        Common.showNotification(`"${this.anime.title}" removido da lista`);
        this.render();
    },

    /**
     * Toggle dropdown de listas
     */
    toggleDropdown() {
        const dropdown = document.getElementById('list-dropdown');
        dropdown.classList.toggle('show');

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                dropdown.classList.remove('show');
            }
        }, { once: true });
    },

    showError(message) {
        const container = document.getElementById('anime-details');
        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <a href="index.php" class="btn btn-primary">Voltar</a>
            </div>
        `;
    },

    /**
     * Abrir modal com detalhes do personagem
     */
    /**
     * Abrir modal com detalhes do personagem
     */
    async openCharacterModal(characterId) {
        // Mostrar modal com loading
        const loadingContent = `
            <div class="character-modal-loading" style="text-align: center; padding: 2rem;">
                <div class="loader" style="margin: 0 auto 1rem;"></div>
                <p>Carregando informações...</p>
            </div>
        `;
        Common.openModal(loadingContent, { title: 'Personagem', className: 'modal-wide' });

        try {
            const char = await API.getCharacterById(characterId);

            if (!char) {
                Common.closeModal();
                Common.showToast('Erro ao carregar personagem', 'error');
                return;
            }

            // Clean and Translate description if available
            let description = this.cleanDescription(char.description);

            // Check translation service availability
            if (window.Translation && char.description) {
                description = await window.Translation.translate(description, `char_${char.id}`);
            }

            // ---------------------------------------------------------
            // 3. Process Voice Actors
            // ---------------------------------------------------------
            // Aggregate unique VAs by ID, prioritizing Japanese, English, Portuguese
            const vaMap = new Map();

            if (char.media && char.media.edges) {
                char.media.edges.forEach(edge => {
                    if (edge.voiceActors) {
                        edge.voiceActors.forEach(va => {
                            if (!vaMap.has(va.id)) {
                                vaMap.set(va.id, va);
                            }
                        });
                    }
                });
            }

            const uniqueVAs = Array.from(vaMap.values());

            // Sort: BR first, then JP, then others
            uniqueVAs.sort((a, b) => {
                const getScore = (lang) => {
                    if (lang === 'Portuguese') return 3;
                    if (lang === 'Japanese') return 2;
                    if (lang === 'English') return 1;
                    return 0;
                };
                return getScore(b.languageV2) - getScore(a.languageV2);
            });

            // ---------------------------------------------------------
            // 4. Render Layout
            // ---------------------------------------------------------
            // ---------------------------------------------------------
            // 4. Render Layout (v5 Style)
            // ---------------------------------------------------------

            // Format nicknames
            const nicknames = char.name.alternative && char.name.alternative.length > 0
                ? char.name.alternative.join(', ')
                : null;

            // Format Animes
            // We use the media pairs we already have. 
            // In v5 it was "Aparece em".
            const animeList = char.media && char.media.edges ? char.media.edges.slice(0, 12).map(edge => `
                <a href="detalhes.php?id=${edge.node.id}" class="char-anime-link" title="${edge.node.title.romaji}">
                    <img src="${edge.node.coverImage.medium}" alt="${edge.node.title.romaji}">
                    <span>${edge.node.title.romaji}</span>
                </a>
            `).join('') : '';

            const modalContent = `
                <div class="character-modal">
                    <!-- HEADER -->
                    <div class="char-modal-header">
                        <div class="char-modal-image">
                            <img src="${char.image.large}" alt="${char.name.full}">
                        </div>
                        <div class="char-modal-info">
                            <h2 class="char-modal-name">${char.name.full}</h2>
                            ${char.name.native ? `<p class="char-modal-kanji">${char.name.native}</p>` : ''}
                            ${nicknames ? `<p class="char-modal-nicknames"><i class="fas fa-quote-left"></i> ${nicknames}</p>` : ''}
                            
                            <div class="char-modal-stats">
                                <span title="Favoritos"><i class="fas fa-heart"></i> ${char.favourites}</span>
                                ${char.age ? `<span><i class="fas fa-birthday-cake"></i> ${char.age}</span>` : ''}
                                ${char.gender ? `<span><i class="fas fa-venus-mars"></i> ${char.gender}</span>` : ''}
                                ${char.bloodType ? `<span><i class="fas fa-tint"></i> ${char.bloodType}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- ABOUT -->
                    <div class="char-modal-section">
                        <h3 class="char-section-title"><i class="fas fa-info-circle"></i> Sobre</h3>
                        <div class="char-modal-about">${description}</div>
                    </div>
                    
                    <!-- ANIMES -->
                    ${animeList ? `
                        <div class="char-modal-section">
                            <h3 class="char-section-title"><i class="fas fa-film"></i> Aparições</h3>
                            <div class="char-anime-grid">${animeList}</div>
                        </div>
                    ` : ''}
                    
                    <!-- VOICE ACTORS -->
                    <div class="char-modal-section">
                        <h3 class="char-section-title"><i class="fas fa-microphone-alt"></i> Dubladores</h3>
                        <div class="char-va-grid">
                            ${uniqueVAs.map(va => `
                                <div class="char-va-item">
                                    <img src="${va.image.medium}" alt="${va.name.full}">
                                    <div class="char-va-info">
                                        <div class="char-va-name">${va.name.full}</div>
                                        <div class="char-va-lang">${this.getLanguageFlag(va.languageV2)} ${va.languageV2}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Hacky update of modal content since Common.openModal replaces everything
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) modalBody.innerHTML = modalContent;

        } catch (error) {
            console.error(error);
            Common.showNotification('Erro ao carregar personagem', 'error');
            Common.closeModal();
        }
    },

    /**
     * Retornar bandeira do idioma
     */
    getLanguageFlag(language) {
        const flags = {
            'Japanese': '🇯🇵',
            'English': '🇺🇸',
            'Portuguese (BR)': '🇧🇷',
            'Spanish': '🇪🇸',
            'French': '🇫🇷',
            'German': '🇩🇪',
            'Italian': '🇮🇹',
            'Korean': '🇰🇷',
            'Portuguese': '🇵🇹',
            'Chinese': '🇨🇳',
            'Hungarian': '🇭🇺'
        };
        return flags[language] || '🌍';
    },

    /**
     * Toggle focus mode for trailer
     */
    toggleFocusMode() {
        document.body.classList.toggle('trailer-focus-mode');

        // Add ESC key listener when entering focus mode
        if (document.body.classList.contains('trailer-focus-mode')) {
            document.addEventListener('keydown', this.handleEscKey);
        } else {
            document.removeEventListener('keydown', this.handleEscKey);
        }
    },

    handleEscKey(e) {
        if (e.key === 'Escape') {
            DetalhesPage.toggleFocusMode();
        }
    },

    /**
     * Play anime opening using OST Player
     */
    playOpening() {
        const anime = this.anime;
        if (!anime || !anime.trailer) {
            Common.showNotification('Opening não disponível', 'error');
            return;
        }

        // Extract video ID from YouTube URL
        let videoId = null;
        const trailer = anime.trailer;

        if (trailer.includes('youtube.com/watch?v=')) {
            videoId = trailer.split('watch?v=')[1].split('&')[0];
        } else if (trailer.includes('youtube.com/embed/')) {
            videoId = trailer.split('embed/')[1].split('?')[0];
        } else if (trailer.includes('youtu.be/')) {
            videoId = trailer.split('youtu.be/')[1].split('?')[0];
        }

        if (videoId && typeof OSTPlayer !== 'undefined') {
            OSTPlayer.play(videoId, anime.title + ' - Opening');
        } else {
            // Fallback: search for opening on YouTube
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' opening full')}`;
            window.open(searchUrl, '_blank');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => DetalhesPage.init());

