/**
 * AnimeEngine v5 - Common Functions
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
        this.checkAchievements();
        console.log('🚀 AnimeEngine v5 loaded!');
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
    },

    /**
     * Executar busca
     */
    doSearch(query) {
        window.location.href = `explorar.html?q=${encodeURIComponent(query)}`;
    },

    /**
     * Marcar nav item ativo
     */
    markActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
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
                    <button class="btn btn-primary btn-sm" onclick="Common.addToList(${anime.id}, 'watching')">
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
                window.location.href = `detalhes.html?id=${anime.id}`;
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
            const formatted = API.formatAnime(anime);
            const card = this.createAnimeCard(formatted);
            container.appendChild(card);
        });
    },

    // ========================================
    // AÇÕES
    // ========================================

    /**
     * Adicionar à lista
     */
    async addToList(animeId, listName) {
        try {
            const anime = await API.getAnimeById(animeId);
            const formatted = API.formatAnime(anime);
            Storage.addToList(listName, formatted);
            Storage.addXP(10);
            this.showNotification(`"${formatted.title}" adicionado à lista!`);
            this.updateLevelBadge();
        } catch (error) {
            this.showNotification('Erro ao adicionar anime', 'error');
        }
    },

    /**
     * Toggle favorito
     */
    async toggleFavorite(animeId) {
        try {
            const anime = await API.getAnimeById(animeId);
            const formatted = API.formatAnime(anime);
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

    // ========================================
    // NOTIFICAÇÕES
    // ========================================

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
                <div class="modal-content" onclick="event.stopPropagation()">
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
    openSettings() {
        const themes = Themes ? Themes.getAll() : [];
        const badges = Achievements ? Achievements.getAllBadges() : [];
        const user = Storage.getUser();
        
        const themesHTML = themes.map(t => `
            <div class="theme-card ${t.active ? 'active' : ''}" onclick="Common.setTheme('${t.id}')">
                <div class="theme-card-icon">${t.icon}</div>
                <div class="theme-card-name">${t.name}</div>
                <div class="theme-card-desc">${t.description}</div>
            </div>
        `).join('');
        
        const badgesHTML = badges.map(b => `
            <div class="achievement-card ${b.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-card-icon">${b.unlocked ? b.icon : '🔒'}</div>
                <div class="achievement-card-name">${b.name}</div>
                <div class="achievement-card-desc">${b.description}</div>
                <div class="achievement-card-xp">${b.xp} XP</div>
            </div>
        `).join('');
        
        const unlockedCount = badges.filter(b => b.unlocked).length;
        
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">⚙️ SETTINGS</h3>
                <button class="modal-close" onclick="Common.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4 class="settings-section-title">🎨 Tema</h4>
                    <div class="theme-grid">${themesHTML}</div>
                </div>
                
                <div class="settings-section">
                    <h4 class="settings-section-title">🏆 Conquistas</h4>
                    <div class="achievements-stats">
                        <span>${user.xp} XP</span>
                        <span>•</span>
                        <span>Lv.${user.level}</span>
                        <span>•</span>
                        <span>${unlockedCount}/${badges.length} Medalhas</span>
                    </div>
                    <div class="achievements-grid">${badgesHTML}</div>
                </div>
            </div>
        `;
        
        this.openModal(content, { title: '⚙️ SETTINGS' });
    },

    /**
     * Mudar tema
     */
    setTheme(themeId) {
        if (Themes) {
            Themes.apply(themeId);
            this.openSettings(); // Reabrir para atualizar UI
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
    }
};

// Expor globalmente
window.Common = Common;

// Inicializar quando DOM pronto
document.addEventListener('DOMContentLoaded', () => {
    Common.init();
    Common.setupScrollReveal();
});

