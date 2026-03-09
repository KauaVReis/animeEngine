/**
 * AnimeEngine v6 - Common Functions
 * Funções compartilhadas entre todas as páginas
 */

const Common = {
    /**
     * Inicialização comum
     */
    init() {
        this.updateLevelBadge();
        this.setupSearch();
        this.markActiveNav();
        this.createSettingsButton();
        this.createNotificationsButton();
        this.createMobileRandomButton(); // Mobile Header
        this.createSidebarRandomButton(); // Desktop Sidebar
        this.initNotifications();
        this.setupEasterEggs();
        this.checkAchievements();
        console.log('🚀 AnimeEngine v6 loaded!');
    },

    /**
     * Easter Eggs & Caçador de Temas Secretos
     */
    setupEasterEggs() {
        // 1. A Hora Espectral (Blood Moon)
        const hour = new Date().getHours();
        if (hour === 3 && typeof Themes !== 'undefined') {
            if (!Themes.isUnlocked('bloodMoon')) {
                Themes.unlock('bloodMoon');
                this.showToast('🩸 A Lua de Sangue Ascendeu... Tema Blood Moon desbloqueado!');
                Themes.apply('bloodMoon');
            }
        }

        // 2. Konami Code -> Arcade Mode
        let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiPosition = 0;
        document.addEventListener('keydown', (e) => {
            if (e.key === konamiCode[konamiPosition]) {
                konamiPosition++;
                if (konamiPosition === konamiCode.length) {
                    if (typeof Themes !== 'undefined' && !Themes.isUnlocked('arcadeMode')) {
                        Themes.unlock('arcadeMode');
                        this.showToast('🕹️ Konami Code Inserido! Modo Arcade Desbloqueado!');
                        Themes.apply('arcadeMode');
                    }
                    konamiPosition = 0;
                }
            } else {
                konamiPosition = 0;
            }
        });

        // 3. Espancador de Logo -> Glitch Mode
        const logos = document.querySelectorAll('.logo, .navbar-brand');
        let logoClicks = 0;
        let logoTimer;
        logos.forEach(logo => {
            logo.addEventListener('click', (e) => {
                logoClicks++;
                clearTimeout(logoTimer);
                logoTimer = setTimeout(() => logoClicks = 0, 1000);
                if (logoClicks >= 10) {
                    e.preventDefault();
                    if (typeof Themes !== 'undefined' && !Themes.isUnlocked('glitchMode')) {
                        Themes.unlock('glitchMode');
                        this.showToast('👾 O sistema foi corrompido... Tema Glitch Desbloqueado!');
                        Themes.apply('glitchMode');
                    }
                    logoClicks = 0;
                }
            });
        });

        // 4. Modo Desenvolvedor -> Developer Mode
        const footers = document.querySelectorAll('.footer-copyright, footer p, footer');
        let footerClicks = 0;
        let footerTimer;
        footers.forEach(footer => {
            footer.addEventListener('click', (e) => {
                footerClicks++;
                clearTimeout(footerTimer);
                footerTimer = setTimeout(() => footerClicks = 0, 1500);
                if (footerClicks >= 5) {
                    if (typeof Themes !== 'undefined' && !Themes.isUnlocked('developerMode')) {
                        Themes.unlock('developerMode');
                        this.showToast('👨‍💻 Console aberto. Tema Developer ativado.');
                        Themes.apply('developerMode');
                    }
                    footerClicks = 0;
                }
            });
        });
    },

    /**
     * Atualizar badge de nível no header
     */
    updateLevelBadge() {
        const user = Storage.getUser();
        const badge = document.getElementById('level-badge');

        if (badge) {
            const levelIcons = ['🌱', '🌿', '🌳', '⭐', '🌟', '💫', '🔥', '💎', '👑', '🏆'];
            const icon = levelIcons[Math.min(user.level - 1, levelIcons.length - 1)];

            badge.innerHTML = `
                <span class="level-icon">${icon}</span>
                <span class="level-text">Lv.${user.level}</span>
            `;

            // Click para abrir modal de achievements
            badge.style.cursor = 'pointer';
            badge.onclick = () => this.openAchievementsModal();
        }
    },

    /**
     * Setup da busca
     */
    setupSearch() {
        const input = document.getElementById('search-input');
        const btn = document.querySelector('.search-btn');

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    this.doSearch(input.value.trim());
                }
            });
        }

        if (btn) {
            btn.addEventListener('click', () => {
                if (input?.value.trim()) {
                    this.doSearch(input.value.trim());
                }
            });
        }

        // Live Search / Suggestions
        if (input) {
            const debouncedSearch = this.debounce(async (text) => {
                if (text.length < 3) {
                    this.closeSearchSuggestions();
                    return;
                }
                await this.fetchSearchSuggestions(text);
            }, 300);

            input.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));

            // Close on click outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    this.closeSearchSuggestions();
                }
            });

            // Restore if focused
            input.addEventListener('focus', () => {
                if (input.value.trim().length >= 3) {
                    this.fetchSearchSuggestions(input.value.trim());
                }
            });
        }

        // Mobile Search Toggle
        this.createMobileSearchToggle();
    },

    /**
     * Buscar sugestões na AniList
     */
    async fetchSearchSuggestions(query) {
        const gql = `
            query ($search: String) {
                Page(page: 1, perPage: 5) {
                    media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title { romaji }
                        coverImage { medium }
                        format
                        seasonYear
                    }
                }
            }
        `;

        try {
            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: gql, variables: { search: query } })
            });

            const data = await response.json();
            const results = data.data?.Page?.media || [];
            this.renderSearchSuggestions(results);
        } catch (e) {
            console.error('Erro na busca live:', e);
        }
    },

    /**
     * Renderizar dropdown de sugestões
     */
    renderSearchSuggestions(results) {
        let dropdown = document.querySelector('.search-results-dropdown');
        const container = document.querySelector('.search-container');

        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-results-dropdown';
            container.appendChild(dropdown);
            // Ensure container has relative position for absolute dropdown
            container.style.position = 'relative';
        }

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="search-no-results">Nenhum resultado encontrado</div>';
            dropdown.classList.add('visible');
            return;
        }

        dropdown.innerHTML = results.map(anime => `
            <a href="detalhes.php?id=${anime.id}" class="search-result-item">
                <img src="${anime.coverImage.medium}" alt="${anime.title.romaji}">
                <div class="search-result-info">
                    <div class="search-result-title">${anime.title.romaji}</div>
                    <div class="search-result-meta">
                        ${anime.seasonYear || ''} • ${anime.format || 'TV'}
                    </div>
                </div>
            </a>
        `).join('');

        // Add "View all" link
        dropdown.innerHTML += `
            <a href="#" onclick="event.preventDefault(); Common.doSearch('${document.getElementById('search-input').value}')" class="search-result-all">
                Ver todos os resultados <i class="fas fa-arrow-right"></i>
            </a>
        `;

        dropdown.classList.add('visible');
    },

    /**
     * Fechar sugestões
     */
    closeSearchSuggestions() {
        const dropdown = document.querySelector('.search-results-dropdown');
        if (dropdown) {
            dropdown.classList.remove('visible');
            setTimeout(() => dropdown.remove(), 200); // Wait for fade out
        }
    },

    /**
     * Criar botão de busca mobile
     */
    createMobileSearchToggle() {
        const headerContent = document.querySelector('.header-content');
        const searchContainer = document.querySelector('.search-container');

        if (headerContent && searchContainer && !document.querySelector('.search-toggle-mobile')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'search-toggle-mobile';
            toggleBtn.innerHTML = '<i class="fas fa-search"></i>';

            // Inserir antes da user area (ou depois do container de busca)
            headerContent.insertBefore(toggleBtn, document.querySelector('.user-area'));

            toggleBtn.addEventListener('click', () => {
                searchContainer.classList.toggle('open');
                if (searchContainer.classList.contains('open')) {
                    setTimeout(() => document.getElementById('search-input')?.focus(), 100);
                }
            });
        }
    },

    /**
     * Criar botão Aleatório mobile (header)
     */
    createMobileRandomButton() {
        const headerContent = document.querySelector('.header-content');

        // Evitar duplicar
        if (headerContent && !document.querySelector('.random-btn-mobile')) {
            const randomBtn = document.createElement('button');
            randomBtn.className = 'random-btn-mobile';
            randomBtn.innerHTML = '<i class="fas fa-dice"></i>';
            randomBtn.title = 'Anime Aleatório';

            // Inserir antes da user area
            headerContent.insertBefore(randomBtn, document.querySelector('.user-area'));

            randomBtn.addEventListener('click', () => {
                this.goToRandomAnime();
            });
        }
    },

    /**
     * Criar botão Aleatório na Sidebar (Desktop)
     */
    createSidebarRandomButton() {
        const sidebar = document.querySelector('.sidebar');
        // Check if exists using link text or href logic is harder, but simplified check:
        // We look for a nav-item with onclick containing 'Random' or specific class.
        // Assuming index.html hardcoded one doesn't have a specific ID, we can check by text content?

        if (sidebar) {
            // Check if already has one (e.g. hardcoded in index.html)
            const existing = Array.from(sidebar.querySelectorAll('.nav-item')).find(el => el.textContent.includes('Aleatório'));

            if (!existing) {
                const link = document.createElement('a');
                link.href = '#';
                link.className = 'nav-item';
                link.innerHTML = '<i class="fas fa-dice"></i><span>Aleatório</span>';
                link.onclick = (e) => {
                    e.preventDefault();
                    this.goToRandomAnime();
                };

                // Insert before divider if exists, else append
                const divider = sidebar.querySelector('.nav-divider');
                if (divider) {
                    sidebar.insertBefore(link, divider);
                } else {
                    // Start inserting before theme selector if exists
                    const themeSel = sidebar.querySelector('.theme-selector');
                    if (themeSel) {
                        // Or just append to sidebar logic
                        sidebar.insertBefore(link, themeSel);
                    } else {
                        sidebar.appendChild(link);
                    }
                }
            }
        }
    },

    /**
     * Executar busca
     */
    doSearch(query) {
        window.location.href = `explorar.php?q=${encodeURIComponent(query)}`;
    },

    /**
     * Marcar nav item ativo
     */
    markActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.php';

        // Sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === currentPage) {
                item.classList.add('active');
            }
        });

        // Bottom nav
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === currentPage) {
                item.classList.add('active');
            }
        });
    },

    // ========================================
    // COMPONENTES
    // ========================================

    /**
     * Criar card de anime
     */
    createAnimeCard(anime) {
        const isFav = Storage.isFavorite(anime.id);
        const status = Storage.getAnimeStatus(anime.id);

        const card = document.createElement('div');
        card.className = 'anime-card';
        card.dataset.id = anime.id;

        card.innerHTML = `
            <div class="anime-card-image">
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                <div class="anime-card-overlay">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); Common.openListModal({id: ${anime.id}})">
                        <i class="fas fa-plus"></i> Lista
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="Common.toggleFavorite(${anime.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                ${isFav ? '<span class="anime-card-fav"><i class="fas fa-heart"></i></span>' : ''}
            </div>
            <div class="anime-card-info">
                <h3 class="anime-card-title" title="${anime.title}">${anime.title}</h3>
                <div class="anime-card-meta">
                    <span class="anime-card-score"><i class="fas fa-star"></i> ${anime.score || '-'}</span>
                    <span>${anime.episodes || '?'} eps</span>
                </div>
            </div>
        `;

        // Click para detalhes
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                window.location.href = `detalhes.php?id=${anime.id}`;
            }
        });

        return card;
    },

    /**
     * Renderizar carrossel
     */
    renderCarousel(containerId, animes) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!animes || animes.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum anime encontrado</p>';
            return;
        }

        animes.forEach(anime => {
            // const formatted = API.formatAnime(anime); // Data is already formatted by API
            const card = this.createAnimeCard(anime);
            container.appendChild(card);
        });
    },

    /**
     * Renderizar skeleton cards para loading
     */
    renderSkeletonCards(containerId, count = 6) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = Array(count).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-card-image">
                    <div class="skeleton"></div>
                </div>
                <div class="skeleton-card-info">
                    <div class="skeleton skeleton-card-title"></div>
                    <div class="skeleton skeleton-card-meta"></div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Renderizar loader melhorado
     */
    renderLoader(containerId, text = 'Carregando...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="loader-container">
                <div class="loader-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="loader-text">${text}</span>
            </div>
        `;
    },

    // ========================================
    // AÇÕES
    // ========================================

    /**
     * Adicionar à lista (usa API do backend)
     */
    async addToList(animeId, listName) {
        try {
            // Buscar dados do anime
            const animeData = await API.getAnimeById(animeId);

            // Chamar API do backend
            const response = await fetch('api/lists/add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    anime_id: animeId,
                    tipo_lista: listName,
                    anime_data: animeData
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`"${animeData.title}" adicionado à lista!`);
                this.closeModal();
            } else {
                this.showNotification(result.message || 'Erro ao adicionar', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showNotification('Erro ao adicionar anime', 'error');
        }
    },

    /**
     * Abrir modal de seleção de lista
     */
    async openListModal(anime) {
        const status = Storage.getAnimeStatus(anime.id);
        const lists = [
            { id: 'watching', name: 'Assistindo', icon: '📺' },
            { id: 'planToWatch', name: 'Quero Ver', icon: '📋' },
            { id: 'completed', name: 'Completo', icon: '✅' },
            { id: 'paused', name: 'Pausado', icon: '⏸️' },
            { id: 'dropped', name: 'Abandonado', icon: '❌' }
        ];

        let html = `
            <div class="list-selection-grid" style="display: grid; grid-template-columns: 1fr; gap: 10px;">
        `;

        lists.forEach(list => {
            const isActive = status === list.id;
            html += `
                <button class="btn btn-${isActive ? 'primary' : 'outline'} btn-block" 
                        onclick="Common.addToList(${anime.id}, '${list.id}')"
                        style="justify-content: flex-start; text-align: left;">
                    <span style="font-size: 1.2rem; margin-right: 10px;">${list.icon}</span>
                    <span>${list.name}</span>
                    ${isActive ? '<i class="fas fa-check" style="margin-left: auto;"></i>' : ''}
                </button>
            `;
        });

        html += '</div>';

        this.openModal(html, { title: `📝 Adicionar à Lista` });
    },

    /**
     * Toggle favorito
     */
    async toggleFavorite(animeId) {
        try {
            // API now returns formatted anime
            const formatted = await API.getAnimeById(animeId);
            // const formatted = API.formatAnime(anime);
            const wasFav = Storage.isFavorite(animeId);
            Storage.toggleFavorite(formatted);

            if (!wasFav) {
                Storage.addXP(5);
                this.showNotification(`"${formatted.title}" favoritado!`);
            } else {
                this.showNotification(`"${formatted.title}" removido dos favoritos`);
            }

            this.updateLevelBadge();
        } catch (error) {
            this.showNotification('Erro ao favoritar', 'error');
        }
    },

    /**
     * Ir para Anime Aleatório
     */
    async goToRandomAnime() {
        try {
            const anime = await API.getRandomAnime();
            if (anime) {
                window.location.href = `detalhes.php?id=${anime.id}`;
            }
        } catch (error) {
            console.error('Erro random:', error);
            this.showToast('Erro ao buscar anime aleatório', 'error');
        }
    },

    // ========================================
    // NOTIFICAÇÕES
    // ========================================

    /**
     * Mostrar notificação toast
     */
    showToast(message, type = 'success') {
        this.showNotification(message, type);
    },

    /**
     * Mostrar notificação toast
     */
    showNotification(message, type = 'success') {
        // Remover existente
        const existing = document.querySelector('.notification-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => toast.classList.add('show'), 10);

        // Remover após 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ========================================
    // MODAL
    // ========================================

    /**
     * Abrir modal genérico
     */
    openModal(content, options = {}) {
        const container = document.getElementById('modal-container');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay" onclick="Common.closeModal()">
                <div class="modal-content ${options.className || ''}" onclick="event.stopPropagation()">
                    ${options.title ? `<h2 class="modal-title">${options.title}</h2>` : ''}
                    <button class="modal-close" onclick="Common.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        container.classList.add('open');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Fechar modal
     */
    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) {
            container.classList.remove('open');
            document.body.style.overflow = '';
        }
    },

    /**
     * Modal de confirmação customizado
     */
    confirm(options = {}) {
        const {
            title = 'Confirmação',
            message = 'Você tem certeza?',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            onConfirm = () => { }
        } = options;

        const content = `
            <div class="confirm-modal">
                <p style="margin-bottom: var(--space-lg); font-size: 1rem; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: var(--space-md); justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="Common.closeModal()">${cancelText}</button>
                    <button class="btn btn-primary" id="btn-modal-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        this.openModal(content, { title });

        const confirmBtn = document.getElementById('btn-modal-confirm');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                onConfirm();
                this.closeModal();
            };
        }
    },

    /**
     * Abrir modal de conquistas/achievements
     */
    openAchievementsModal() {
        const user = Storage.getUser();
        const badges = Achievements.getAllBadges();
        const currentLevel = Achievements.getLevel(user.xp);
        const nextLevel = Achievements.getNextLevel(user.xp);
        const progressPercent = Achievements.getLevelProgress(user.xp);

        const unlockedCount = badges.filter(b => b.unlocked).length;

        const badgesHtml = badges.map(badge => `
            <div class="achievement-card-mini ${badge.unlocked ? 'unlocked' : 'locked'}" title="${badge.description}">
                <div class="achievement-mini-icon">${badge.icon}</div>
                <div class="achievement-mini-name">${badge.name}</div>
                <div class="achievement-mini-xp">+${badge.xp}</div>
            </div>
        `).join('');

        const content = `
            <div class="achievements-header">
                <div class="achievements-level">
                    <div class="level-big-icon">${currentLevel.icon}</div>
                    <div class="level-details">
                        <div class="level-name">${currentLevel.name}</div>
                        <div class="level-number">Nível ${currentLevel.level}</div>
                    </div>
                </div>
                <div class="achievements-xp">
                    <div class="xp-current">${user.xp} XP</div>
                    ${nextLevel ? `
                        <div class="xp-progress-bar">
                            <div class="xp-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="xp-next">Próximo nível: ${nextLevel.xpRequired} XP</div>
                    ` : '<div class="xp-max">Nível Máximo! 🏆</div>'}
                </div>
            </div>
            <div class="achievements-count">${unlockedCount}/${badges.length} conquistas desbloqueadas</div>
            <div class="achievements-list">
                ${badgesHtml}
            </div>
        `;

        this.openModal(content, { title: '🏆 Conquistas' });
    },

    // ========================================
    // SKELETON LOADERS
    // ========================================

    /**
     * Criar skeleton card
     */
    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton-image skeleton"></div>
            <div class="skeleton-text skeleton"></div>
            <div class="skeleton-text-sm skeleton"></div>
        `;
        return card;
    },

    /**
     * Renderizar skeleton carousel
     */
    renderSkeletonCarousel(containerId, count = 6) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.appendChild(this.createSkeletonCard());
        }
    },

    // ========================================
    // SCROLL REVEAL
    // ========================================

    /**
     * Setup scroll reveal
     */
    setupScrollReveal() {
        const elements = document.querySelectorAll('.scroll-reveal');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => observer.observe(el));
    },

    // ========================================
    // UTILITIES
    // ========================================

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Format date
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },

    /**
     * Format time
     */
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    },

    // ========================================
    // SETTINGS
    // ========================================

    /**
     * Criar botão de settings flutuante
     */
    createSettingsButton() {
        // Evitar duplicar
        if (document.querySelector('.settings-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'settings-btn';
        btn.innerHTML = '<i class="fas fa-cog"></i>';
        btn.onclick = () => this.openSettings();
        document.body.appendChild(btn);
    },

    /**
     * Abrir modal de settings
     */
    /**
     * Abrir modal de configurações (Tabbed Version)
     */
    openSettings(activeTab = 'appearance') {
        const content = `
            <div class="settings-layout">
                <aside class="settings-sidebar">
                    <button class="settings-tab ${activeTab === 'appearance' ? 'active' : ''}" data-tab-id="appearance" onclick="Common.switchSettingsTab('appearance')">
                        <i class="fas fa-palette"></i> Aparência
                    </button>
                    <button class="settings-tab ${activeTab === 'profile' ? 'active' : ''}" data-tab-id="profile" onclick="Common.switchSettingsTab('profile')">
                        <i class="fas fa-user"></i> Perfil
                    </button>
                    <button class="settings-tab ${activeTab === 'general' ? 'active' : ''}" data-tab-id="general" onclick="Common.switchSettingsTab('general')">
                        <i class="fas fa-cog"></i> Geral
                    </button>
                    <button class="settings-tab ${activeTab === 'content' ? 'active' : ''}" data-tab-id="content" onclick="Common.switchSettingsTab('content')">
                        <i class="fas fa-shield-alt"></i> Conteúdo
                    </button>
                </aside>
                <main class="settings-content" id="settings-content-area">
                    ${this.renderSettingsTab(activeTab)}
                </main>
            </div>
        `;

        this.openModal(content, { title: '⚙️ Configurações', className: 'settings-modal' });
    },

    /**
     * Trocar apenas o conteúdo da aba sem fechar a modal
     */
    switchSettingsTab(tabId) {
        // Atualizar conteúdo
        const contentArea = document.getElementById('settings-content-area');
        if (contentArea) {
            contentArea.innerHTML = this.renderSettingsTab(tabId);
        }

        // Atualizar botões ativos
        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab-id') === tabId);
        });
    },

    /**
     * Renderiza o conteúdo de uma aba específica
     */
    renderSettingsTab(tabId) {
        const settings = Storage.getSettings();
        const user = Storage.getUser();

        switch (tabId) {
            case 'appearance':
                const themes = typeof Themes !== 'undefined' ? Themes.themes : {};
                const unlockedThemes = typeof Themes !== 'undefined' ? Themes.getUnlockedThemes() : [];

                let themesHTML = '';
                Object.entries(themes).forEach(([key, theme]) => {
                    const isSecret = theme.secret === true;
                    const isUnlocked = unlockedThemes.includes(key);
                    const currentTheme = typeof Themes !== 'undefined' ? Themes.getCurrent() : (settings.theme || 'default');
                    const isActive = currentTheme === key;

                    if (isSecret && !isUnlocked) {
                        themesHTML += `
                            <div class="theme-card locked" title="Tema Secreto">
                                <div class="theme-card-icon">🔒</div>
                                <div class="theme-card-name">Bloqueado</div>
                                <div class="theme-card-hint">Dica: Calculadora</div>
                            </div>
                        `;
                    } else {
                        themesHTML += `
                            <div class="theme-card ${isActive ? 'active' : ''}" 
                                 onclick="Common.setTheme('${key}')"
                                 onmouseenter="Common.previewTheme('${key}')"
                                 onmouseleave="Common.resetTheme()">
                                <div class="theme-card-icon">${theme.icon || '🎨'}</div>
                                <div class="theme-card-name">${theme.name}</div>
                                <div class="theme-card-desc">${theme.description || ''}</div>
                                <div class="theme-card-accent" style="background: var(--color-primary)"></div>
                            </div>
                        `;
                    }
                });

                return `
                    <div class="settings-section">
                        <h4 class="settings-section-title">🎨 Temas e Visual</h4>
                        <div class="theme-grid">${themesHTML}</div>
                    </div>
                    <div class="settings-section">
                        <h4 class="settings-section-title">✨ Efeitos</h4>
                        <div class="settings-option">
                            <div class="settings-option-info">
                                <span class="settings-option-name">Partículas de Fundo</span>
                                <span class="settings-option-desc">Animações baseadas no tema</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" ${typeof Particles !== 'undefined' && Particles.enabled ? 'checked' : ''} onchange="Common.toggleParticles(this.checked)">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                `;

            case 'profile':
                return `
                    <div class="settings-section">
                        <h4 class="settings-section-title">📊 Seu Progresso</h4>
                        <div class="profile-stats-mini">
                            <div class="level-badge big">
                                ${user.level || 1}
                            </div>
                            <div class="xp-info">
                                <div class="xp-label">XP Total: ${user.xp || 0}</div>
                                <div class="xp-bar-container">
                                    <div class="xp-bar-fill" style="width: ${(user.xp % 100)}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

            case 'general':
                return `
                    <div class="settings-section">
                        <h4 class="settings-section-title">🌐 Idioma</h4>
                        <select class="settings-select" onchange="Common.setLanguage(this.value)">
                            <option value="pt-br" ${settings.language === 'pt-br' ? 'selected' : ''}>🇧🇷 Português (BR)</option>
                            <option value="en" ${settings.language === 'en' ? 'selected' : ''}>🇺🇸 English</option>
                            <option value="es" ${settings.language === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
                        </select>
                    </div>
                `;

            case 'content':
                return `
                    <div class="settings-section">
                        <h4 class="settings-section-title">🛡️ Filtros</h4>
                        <div class="settings-option">
                            <div class="settings-option-info">
                                <span class="settings-option-name">Modo SFW (Família)</span>
                                <span class="settings-option-desc">Ocultar animes ecchi/adultos</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" ${settings.sfw !== false ? 'checked' : ''} onchange="Common.toggleSFW(this.checked)">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                `;
        }
    },

    /**
     * Pré-visualização temporária do tema
     */
    previewTheme(theme) {
        if (window.innerWidth <= 768) return; // Desativa hover effect em mobile
        document.documentElement.setAttribute('data-theme', theme);
    },

    /**
     * Reseta para o tema original
     */
    resetTheme() {
        if (window.innerWidth <= 768) return; // Desativa hover effect em mobile
        const settings = Storage.getSettings();
        const savedTheme = localStorage.getItem('animeengine_theme') || settings.theme || 'default';
        document.documentElement.setAttribute('data-theme', savedTheme);
    },

    /**
     * Toggle partículas
     */
    toggleParticles(enabled) {
        if (typeof Particles !== 'undefined') {
            if (enabled && !Particles.enabled) {
                Particles.toggle();
            } else if (!enabled && Particles.enabled) {
                Particles.toggle();
            }
            this.showToast(enabled ? '✨ Partículas ativadas!' : '✨ Partículas desativadas');
        }
    },

    /**
     * Alternar modo SFW
     */
    toggleSFW(enabled) {
        const user = Storage.getUser();
        const settings = user.settings || {};
        settings.sfw = enabled;

        Storage.updateUser({ settings });

        if (!enabled) {
            Achievements.unlock('safado');
            if (typeof Themes !== 'undefined' && !Themes.isUnlocked('yandereMode')) {
                Themes.unlock('yandereMode');
                setTimeout(() => this.showToast('🔪 Yandere Mode desbloqueado... doce, mas letal.'), 1000);
            }
        }

        this.showToast(enabled ? 'Modo SFW ativado 😇' : 'Modo SFW desativado 😈');
    },

    /**
     * Definir idioma da tradução
     */
    setLanguage(lang) {
        Storage.updateSettings({ language: lang });
        this.showToast(`Idioma alterado para ${lang.toUpperCase()}. Recarregue para aplicar.`);
    },

    /**
     * Mudar tema
     */
    setTheme(themeId) {
        if (Themes) {
            Themes.apply(themeId);

            // Remover classe active de todos os cards
            document.querySelectorAll('.theme-card').forEach(card => card.classList.remove('active'));
            // Adicionar clase active apenas no card clicado (se estiver aberto renderizando os temas)
            const activeCard = document.querySelector(`.theme-card[onclick="Common.setTheme('${themeId}')"]`);
            if (activeCard) {
                activeCard.classList.add('active');
            }

            this.checkAchievements(); // Checar achievement de tema
        }
    },

    /**
     * Checar achievements
     */
    checkAchievements() {
        if (Achievements) {
            setTimeout(() => Achievements.checkAchievements(), 1000);
        }
    },

    // ========================================
    // NOTIFICATIONS
    // ========================================

    /**
     * Inicializar sistema de notificações
     */
    initNotifications() {
        if (typeof Notifications !== 'undefined') {
            Notifications.init();
        }
    },

    /**
     * Criar botão de notificações no header
     */
    createNotificationsButton() {
        const userArea = document.querySelector('.user-area');
        if (!userArea || document.getElementById('notifications-btn')) return;

        const btn = document.createElement('div');
        btn.className = 'notifications-wrapper';
        btn.innerHTML = `
            <button class="notifications-btn" id="notifications-btn" onclick="Common.toggleNotifications()">
                <i class="fas fa-bell"></i>
                <span class="notifications-count" id="notifications-count" style="display: none;">0</span>
            </button>
            <div class="notifications-dropdown" id="notifications-dropdown"></div>
        `;

        // Insert after Level Badge if exists, otherwise at start
        const levelBadge = document.getElementById('level-badge');
        if (levelBadge && levelBadge.parentNode === userArea) {
            levelBadge.insertAdjacentElement('afterend', btn);
        } else {
            userArea.insertBefore(btn, userArea.firstChild);
        }

        // Atualizar badge
        if (typeof Notifications !== 'undefined') {
            setTimeout(() => Notifications.updateBadge(), 100);
        }

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notifications-dropdown');
            const btn = document.getElementById('notifications-btn');
            if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    },

    /**
     * Toggle dropdown de notificações
     */
    toggleNotifications() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (!dropdown) return;

        dropdown.classList.toggle('open');

        if (dropdown.classList.contains('open')) {
            this.renderNotificationsDropdown();
        }
    },

    /**
     * Renderizar dropdown de notificações
     */
    renderNotificationsDropdown() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (!dropdown || typeof Notifications === 'undefined') return;

        dropdown.innerHTML = Notifications.renderDropdown();
    },

    /**
     * Toggle popup do menu "Mais" na bottom-nav
     */
    toggleBottomNavMore() {
        const popup = document.getElementById('bottom-nav-popup');
        if (popup) {
            popup.classList.toggle('open');
        }
    }
};

// Expor globalmente
window.Common = Common;

// Inicializar quando DOM pronto
document.addEventListener('DOMContentLoaded', () => {
    Common.init();
    Common.setupScrollReveal();
});


