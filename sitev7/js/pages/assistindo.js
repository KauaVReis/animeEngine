/**
 * AnimeEngine v7 - Assistindo Page
 * Mostra animes em progresso (watching)
 */

const AssistindoPage = {
    animes: [],

    init() {
        console.log('📺 Loading Assistindo Page...');
        this.loadWatching();
        console.log('✅ Assistindo Page loaded!');
    },

    loadWatching() {
        // Use Storage instead of API
        const list = Storage.getList('watching');
        this.animes = list || [];
        this.render();
    },

    render() {
        const container = document.getElementById('watching-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.animes.length === 0) {
            this.showEmpty();
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = this.animes.map(anime => {
            // Map Storage keys to UI
            const total = anime.totalEpisodes || anime.total_episodes || 0; // handle legacy keys
            const current = anime.progress || 0;
            const percent = total ? Math.round((current / total) * 100) : 0;

            return `
                <div class="watching-card" onclick="window.location='detalhes.php?id=${anime.id}'">
                    <div class="watching-image">
                        <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                    </div>
                    <div class="watching-info">
                        <h3 class="watching-title">${anime.title}</h3>
                        
                        <div class="watching-progress">
                            <span>Episódio ${current} ${total ? `/ ${total}` : ''}</span>
                            <span>${percent}%</span>
                        </div>
                        
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percent}%"></div>
                        </div>
                        
                        <div class="episode-controls">
                            <!-- Minus Button -->
                            <button class="btn-mini" onclick="event.stopPropagation(); AssistindoPage.updateProgress(${anime.id}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            
                            <!-- Display / Edit -->
                            <div class="episode-display" onclick="event.stopPropagation(); AssistindoPage.openEditModal(${anime.id})">
                                <span class="current-ep">${current}</span>
                                <span class="total-ep">/ ${total || '?'}</span>
                                <i class="fas fa-edit edit-icon"></i>
                            </div>
                            
                            <!-- Plus Button -->
                            <button class="btn-mini" onclick="event.stopPropagation(); AssistindoPage.updateProgress(${anime.id}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    showEmpty() {
        const container = document.getElementById('watching-grid');
        const emptyState = document.getElementById('empty-state');

        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
    },

    updateProgress(animeId, change) {
        const anime = this.animes.find(a => a.id == animeId);
        if (!anime) return;

        let newProgress = (anime.progress || 0) + change;
        if (newProgress < 0) newProgress = 0;

        const total = anime.totalEpisodes || anime.total_episodes;
        if (total && newProgress > total) newProgress = total;

        this.saveProgress(anime, newProgress);

        // Notify
        if (change > 0) {
            Common.showNotification(`+1 Episódio! (${newProgress}/${total || '?'})`);
            Storage.addXP(5);
        }
    },

    openEditModal(animeId) {
        const anime = this.animes.find(a => a.id == animeId);
        if (!anime) return;

        const html = `
            <div class="edit-ep-modal">
                <p>Em qual episódio você está?</p>
                <div class="input-group">
                    <input type="number" id="ep-input" value="${anime.progress || 0}" min="0" max="${anime.totalEpisodes || 9999}">
                    <button class="btn btn-primary" onclick="AssistindoPage.confirmEdit(${animeId})">Salvar</button>
                </div>
                <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                    <a href="detalhes.php?id=${anime.id}" class="btn btn-block btn-outline">
                        <i class="fas fa-info-circle"></i> Ver Detalhes do Anime
                    </a>
                </div>
            </div>
        `;

        Common.openModal(html, { title: `📺 ${anime.title}` });
        // Focus input
        setTimeout(() => document.getElementById('ep-input')?.focus(), 100);
    },

    confirmEdit(animeId) {
        const input = document.getElementById('ep-input');
        if (!input) return;

        const val = parseInt(input.value);
        if (isNaN(val) || val < 0) {
            Common.showNotification('Número inválido', 'error');
            return;
        }

        const anime = this.animes.find(a => a.id == animeId);
        if (anime) {
            this.saveProgress(anime, val);
            Common.showNotification(`Progresso atualizado: Ep. ${val}`);
            Common.closeModal();
        }
    },

    saveProgress(anime, newProgress) {
        const total = anime.totalEpisodes || anime.total_episodes;
        anime.progress = newProgress;

        // Check if completed
        if (total && newProgress >= total) {
            // Move to Completed
            Storage.addToList('completed', anime);

            // UI Feedback
            Common.showNotification(`🎉 Parabéns! Você completou ${anime.title}!`);
            Common.addXP(50); // Big XP bonus

            // Remove from current view
            this.animes = this.animes.filter(a => a.id != anime.id);
        } else {
            // Keep in Watching
            Storage.addToList('watching', anime);
        }

        this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => AssistindoPage.init());
