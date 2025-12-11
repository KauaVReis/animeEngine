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
                                    <button onclick="DetalhesPage.addToList('watching')">📺 Assistindo</button>
                                    <button onclick="DetalhesPage.addToList('planToWatch')">📋 Quero Ver</button>
                                    <button onclick="DetalhesPage.addToList('completed')">✅ Completo</button>
                                    <button onclick="DetalhesPage.addToList('paused')">⏸️ Pausado</button>
                                    <button onclick="DetalhesPage.addToList('dropped')">❌ Abandonado</button>
                                    ${listType ? '<div class="dropdown-divider"></div><button class="dropdown-remove" onclick="DetalhesPage.removeFromList()">🗑️ Remover da Lista</button>' : ''}
                                </div>
                            </div>
                            
                            <button class="btn ${isFav ? 'btn-danger' : 'btn-secondary'}" onclick="DetalhesPage.toggleFavorite()">
                                <i class="fas fa-heart"></i> ${isFav ? 'Desfavoritar' : 'Favoritar'}
                            </button>
                            
                            <button class="btn btn-secondary" onclick="DetalhesPage.openStreaming()">
                                <i class="fas fa-play"></i> Assistir
                            </button>
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
                        <h2 class="section-title"><i class="fas fa-film"></i> Trailer</h2>
                        <div class="details-trailer">
                            <iframe 
                                src="${anime.trailer.replace('watch?v=', 'embed/')}" 
                                frameborder="0" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                ` : ''}
                
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
    CHARS_PER_PAGE: 10,
    
    /**
     * Carregar personagens e dubladores
     */
    async loadCharacters() {
        try {
            await API.delay();
            // Using characters data already embedded in this.anime
            const data = this.anime.characters ? this.anime.characters.edges : [];
            const grid = document.getElementById('characters-grid');
            
            if (!data || data.length === 0) {
                document.getElementById('characters-section').style.display = 'none';
                return;
            }
            
            // Armazenar todos os personagens
            this.charactersData = data;
            this.charactersShown = 0;
            
            grid.innerHTML = '';
            
            // Mostrar primeiros 10
            this.showMoreCharacters();
            
            // Adicionar botão "Ver Mais" se houver mais personagens
            if (data.length > this.CHARS_PER_PAGE) {
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
    showMoreCharacters() {
        const grid = document.getElementById('characters-grid');
        const start = this.charactersShown;
        const end = start + this.CHARS_PER_PAGE;
        const chars = this.charactersData.slice(start, end);
        chars.forEach(edge => {
                const char = edge.node;
                const role = edge.role;
                // Get voice actors (Japanese or Portuguese if available in list)
                const vas = edge.voiceActors || [];
                // Look for Japanese as default
                const vaJP = vas.find(v => v.language === 'Japanese');
                // Use first one if JP not found
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
        
        this.charactersShown = end;
        
        // Esconder botão se não houver mais
        const btn = document.getElementById('show-more-chars-btn');
        if (btn && this.charactersShown >= this.charactersData.length) {
            btn.style.display = 'none';
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
                    <div class="relation-card" onclick="window.location.href='detalhes.html?id=${node.id}'" style="cursor: pointer;">
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
    
    async addToList(listName) {
        Storage.addToList(listName, this.anime);
        Storage.addXP(10);
        Common.showNotification(`"${this.anime.title}" adicionado à lista!`);
        Common.updateLevelBadge();
        this.render(); // Re-render para atualizar status
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
    async openCharacterModal(characterId) {
        // Mostrar modal com loading
        const loadingContent = `
            <div class="character-modal-loading">
                <div class="loader"></div>
                <p>Carregando detalhes...</p>
            </div>
        `;
        Common.openModal(loadingContent, { title: 'Personagem' });
        
        try {
            const charData = await API.getCharacter(characterId);
            
            if (!charData) {
                Common.closeModal();
                Common.showToast('Não foi possível carregar os detalhes', 'error');
                return;
            }
            
            // Formatar about (remover spoilers e limpar)
            let about = charData.about || 'Sem informações disponíveis.';
            // Remover spoilers marcados
            about = about.replace(/\(Source:.*?\)/gi, '');
            about = about.replace(/\[Written by.*?\]/gi, '');
            // Limitar tamanho
            if (about.length > 800) {
                about = about.substring(0, 800) + '...';
            }
            
            // Formatar nicknames
            const nicknames = charData.nicknames?.length > 0 
                ? charData.nicknames.slice(0, 5).join(', ') 
                : null;
            
            // Formatar animes
            const animes = charData.anime?.slice(0, 6).map(a => `
                <a href="detalhes.html?id=${a.anime.mal_id}" class="char-anime-link">
                    <img src="${a.anime.images?.jpg?.small_image_url}" alt="${a.anime.title}">
                    <span>${a.anime.title}</span>
                </a>
            `).join('') || '';
            
            // Formatar dubladores
            const voiceActors = charData.voices?.slice(0, 8).map(v => `
                <div class="char-va-item">
                    <img src="${v.person?.images?.jpg?.image_url}" alt="${v.person?.name}">
                    <div class="char-va-info">
                        <span class="char-va-name">${v.person?.name}</span>
                        <span class="char-va-lang">${this.getLanguageFlag(v.language)} ${v.language}</span>
                    </div>
                </div>
            `).join('') || '<p class="text-muted">Nenhum dublador registrado</p>';
            
            const modalContent = `
                <div class="character-modal">
                    <div class="char-modal-header">
                        <div class="char-modal-image">
                            <img src="${charData.images?.jpg?.image_url}" alt="${charData.name}">
                        </div>
                        <div class="char-modal-info">
                            <h2 class="char-modal-name">${charData.name}</h2>
                            ${charData.name_kanji ? `<p class="char-modal-kanji">${charData.name_kanji}</p>` : ''}
                            ${nicknames ? `<p class="char-modal-nicknames"><i class="fas fa-quote-left"></i> ${nicknames}</p>` : ''}
                            <div class="char-modal-stats">
                                <span><i class="fas fa-heart"></i> ${charData.favorites?.toLocaleString() || 0} favoritos</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="char-modal-section">
                        <h3><i class="fas fa-info-circle"></i> Sobre</h3>
                        <p class="char-modal-about">${about}</p>
                    </div>
                    
                    ${animes ? `
                        <div class="char-modal-section">
                            <h3><i class="fas fa-film"></i> Aparece em</h3>
                            <div class="char-anime-grid">${animes}</div>
                        </div>
                    ` : ''}
                    
                    <div class="char-modal-section">
                        <h3><i class="fas fa-microphone-alt"></i> Dubladores</h3>
                        <div class="char-va-grid">${voiceActors}</div>
                    </div>
                </div>
            `;
            
            // Atualizar modal
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = modalContent;
            }
            
        } catch (error) {
            console.error('Erro ao carregar personagem:', error);
            Common.closeModal();
            Common.showToast('Erro ao carregar detalhes do personagem', 'error');
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
    }
};

document.addEventListener('DOMContentLoaded', () => DetalhesPage.init());
