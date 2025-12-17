/**
 * AnimeEngine v7 - Favoritos Page
 * Mostra animes favoritos do usuário
 */

const FavoritosPage = {
    animes: [],
    
    async init() {
        console.log('💕 Loading Favoritos Page...');
        await this.loadFavoritos();
        console.log('✅ Favoritos Page loaded!');
    },

    async loadFavoritos() {
        const container = document.getElementById('favorites-grid');
        
        try {
            const response = await fetch('api/lists/get.php');
            const data = await response.json();
            
            if (data.lists && data.lists.favorites) {
                this.animes = data.lists.favorites;
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
        const container = document.getElementById('favorites-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (this.animes.length === 0) {
            this.showEmpty();
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = this.animes.map(anime => `
            <div class="anime-card" onclick="window.location='detalhes.php?id=${anime.anime_id}'">
                <div class="anime-card-image">
                    <img src="${anime.imagem}" alt="${anime.titulo}" loading="lazy">
                    <span class="anime-card-fav"><i class="fas fa-heart"></i></span>
                    ${anime.nota_anime ? `<div class="anime-card-score">★ ${anime.nota_anime}</div>` : ''}
                </div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title">${anime.titulo}</h3>
                    <div class="anime-card-meta">
                        <span>${anime.episodios_total || '?'} eps</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    showEmpty() {
        const container = document.getElementById('favorites-grid');
        const emptyState = document.getElementById('empty-state');
        
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
    }
};

document.addEventListener('DOMContentLoaded', () => FavoritosPage.init());
