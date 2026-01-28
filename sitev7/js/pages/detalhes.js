/**
 * AnimeEngine v6 - Detalhes Page
 */

const DetalhesPage = {
    anime: null,
    animeId: null,

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
            <div class="details-hero" style="background-image: url('${anime.image}')">
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
                            
                            <button class="btn btn-secondary" onclick="DetalhesPage.openStreaming()">
                                <i class="fas fa-play"></i> Assistir
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
            </div>
        `;

        // Carregar dados adicionais
        this.loadCharacters();
        this.loadRelations();
        this.loadRecommendations();
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

            // Initial data from getAnimeById (Page 1)
            const characters = this.anime.characters;
            const data = characters ? characters.edges : [];
            const grid = document.getElementById('characters-grid');

            if (!data || data.length === 0) {
                document.getElementById('characters-section').style.display = 'none';
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
            // Use relations from this.anime
            const data = this.anime.relations;
            const grid = document.getElementById('relations-grid');

            if (!data || !data.edges || data.edges.length === 0) {
                document.getElementById('relations-section').style.display = 'none';
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
            // Use recommendations from this.anime
            const data = this.anime.recommendations;
            const carousel = document.getElementById('recommendations-carousel');

            if (!data || !data.nodes || data.nodes.length === 0) {
                document.getElementById('recommendations-section').style.display = 'none';
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
                <a href="index.html" class="btn btn-primary">Voltar</a>
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

            // Translate description if available
            let description = char.description || 'Sem descrição.';

            // Check translation service availability
            if (window.Translation) {
                // If description is super long, the translator might skip it (returns original)
                // which is fine.
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

