/**
 * AnimeEngine v7 - Assistindo Page
 * Mostra animes em progresso (watching)
 */

const AssistindoPage = {
    animes: [],
    
    async init() {
        console.log('📺 Loading Assistindo Page...');
        await this.loadWatching();
        console.log('✅ Assistindo Page loaded!');
    },

    async loadWatching() {
        const container = document.getElementById('watching-grid');
        
        try {
            const response = await fetch('api/lists/get.php');
            const data = await response.json();
            
            if (data.lists && data.lists.watching) {
                this.animes = data.lists.watching;
                this.render();
            } else {
                this.showEmpty();
            }
        } catch (e) {
            console.error('Erro:', e);
            container.innerHTML = '<p class="empty-message">Erro ao carregar</p>';
        }
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
            const percent = anime.episodios_total ? 
                Math.round((anime.progresso / anime.episodios_total) * 100) : 0;
            
            return `
                <div class="watching-card" onclick="window.location='detalhes.php?id=${anime.anime_id}'">
                    <div class="watching-image">
                        <img src="${anime.imagem}" alt="${anime.titulo}" loading="lazy">
                    </div>
                    <div class="watching-info">
                        <h3 class="watching-title">${anime.titulo}</h3>
                        <div class="watching-progress">
                            <span>${anime.progresso || 0} / ${anime.episodios_total || '?'} eps</span>
                            <span>${percent}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percent}%"></div>
                        </div>
                        <button class="btn-ep" onclick="event.stopPropagation(); AssistindoPage.addProgress(${anime.anime_id})">
                            <i class="fas fa-plus"></i> +1 EP
                        </button>
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

    async addProgress(animeId) {
        const anime = this.animes.find(a => a.anime_id === animeId);
        if (!anime) return;
        
        const newProgress = (anime.progresso || 0) + 1;
        
        try {
            const response = await fetch('api/lists/update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    anime_id: animeId,
                    progresso: newProgress
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                anime.progresso = newProgress;
                Common.showNotification(`+1 Episódio! (${newProgress}/${anime.episodios_total || '?'})`);
                this.render();
            }
        } catch (e) {
            console.error('Erro:', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => AssistindoPage.init());
