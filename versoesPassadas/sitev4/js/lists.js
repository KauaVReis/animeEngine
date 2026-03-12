/**
 * AnimeEngine v4 - Lists & Ratings Module
 * Gerencia histórico, favoritos e avaliações
 */

const Lists = {
    // Estado temporário para o modal
    ratingContext: null,

    /**
     * Inicializa o módulo
     */
    init() {
        this.renderHistory();
        this.renderFavorites();
        console.log('📚 Lists system loaded!');
    },

    /**
     * Abre o modal de avaliação para um anime
     * @param {Object} anime - Objeto do anime
     * @param {string} source - 'calculator' ou 'edit'
     */
    openRatingModal(anime, source = 'calculator') {
        this.ratingContext = { anime, source };
        
        const modal = document.getElementById('rating-modal');
        const titleEl = document.getElementById('rating-anime-title');
        const starInputs = document.querySelectorAll('input[name="rating"]');
        const favInput = document.getElementById('rating-favorite');
        
        if (titleEl) titleEl.innerText = anime.title;
        
        // Reset inputs
        starInputs.forEach(input => input.checked = false);
        if (favInput) favInput.checked = false;
        
        // Se já tiver rating (edição), preencher
        if (anime.rating) {
            const ratingInput = document.querySelector(`input[name="rating"][value="${anime.rating}"]`);
            if (ratingInput) ratingInput.checked = true;
        }
        if (anime.favorite && favInput) {
            favInput.checked = true;
        }

        modal.classList.add('open');
    },

    /**
     * Salva a avaliação e move para histórico (se vier da calculadora)
     */
    saveRating() {
        if (!this.ratingContext) return;
        
        const { anime, source } = this.ratingContext;
        const ratingInput = document.querySelector('input[name="rating"]:checked');
        const favInput = document.getElementById('rating-favorite');
        
        const rating = ratingInput ? parseInt(ratingInput.value) : 0;
        const isFavorite = favInput ? favInput.checked : false;

        // Atualizar objeto anime
        anime.rating = rating;
        anime.favorite = isFavorite;
        anime.completedDate = new Date().toLocaleDateString('pt-BR');

        if (source === 'calculator') {
            // Remover da Stack
            appState.playlist = appState.playlist.filter(a => a.id !== anime.id);
            // Adicionar ao Histórico
            if (!appState.history) appState.history = [];
            appState.history.unshift(anime);
        } else if (source === 'manual') {
            // Adicionar manualmente ao histórico
            if (!appState.history) appState.history = [];
            appState.history.unshift(anime);
        } else {
            // Apenas atualizando item existente no histórico
            const idx = appState.history.findIndex(a => a.id === anime.id || a.title === anime.title);
            if (idx !== -1) appState.history[idx] = anime;
        }

        // Salvar e atualizar UI
        saveData();
        this.closeRatingModal();
        this.renderHistory();
        this.renderFavorites();
        updateUI();
        
        // Notificar
        if (typeof Share !== 'undefined') {
            Share.showNotification('✅ Anime salvo no Histórico!');
        }
    },

    /**
     * Fecha o modal
     */
    closeRatingModal() {
        const modal = document.getElementById('rating-modal');
        modal.classList.remove('open');
        this.ratingContext = null;
    },

    /**
     * Alterna status de favorito direto da lista
     */
    toggleFavorite(index) {
        if (!appState.history[index]) return;
        
        appState.history[index].favorite = !appState.history[index].favorite;
        saveData();
        this.renderHistory();
        this.renderFavorites();
    },

    /**
     * Renderiza a lista de Histórico
     */
    renderHistory() {
        const container = document.getElementById('history-grid');
        if (!container) return;

        const list = appState.history || [];
        
        if (list.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 opacity-40">
                    <i class="fas fa-history text-5xl mb-3"></i>
                    <p class="font-bold text-sm uppercase">Nenhum anime completo</p>
                </div>`;
            return;
        }

        container.innerHTML = list.map((anime, index) => this.createAnimeCard(anime, index)).join('');
    },

    /**
     * Renderiza a lista de Favoritos
     */
    renderFavorites() {
        const container = document.getElementById('favorites-grid');
        if (!container) return;

        const list = (appState.history || []).filter(a => a.favorite);
        
        if (list.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 opacity-40">
                    <i class="fas fa-heart text-5xl mb-3"></i>
                    <p class="font-bold text-sm uppercase">Nenhum favorito</p>
                </div>`;
            return;
        }

        // Usamos o index original do histórico para o toggle funcionar? 
        // Melhor passar o objeto e buscar index no toggle, ou re-mapear.
        // Simplificação: Cards de favoritos apenas exibem, click abre edição? 
        // Vamos permitir apenas visualizar por enquanto.
        container.innerHTML = list.map((anime) => this.createAnimeCard(anime, -1, true)).join('');
    },

    /**
     * Cria o HTML de um card de anime
     */
    createAnimeCard(anime, index, isFavoriteView = false) {
        const stars = '★'.repeat(anime.rating) + '☆'.repeat(5 - anime.rating);
        const favClass = anime.favorite ? 'text-red-500' : 'text-gray-300';
        const date = anime.completedDate || '-';
        
        // Placeholder de cor baseada no título (hash simples)
        const hue = anime.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
        const colorStyle = `background: hsl(${hue}, 70%, 85%)`;

        // Se for na view de favoritos, não passamos index para toggle direto (por enquanto)
        const favAction = isFavoriteView ? '' : `onclick="Lists.toggleFavorite(${index}); event.stopPropagation()"`;
        const editAction = isFavoriteView ? '' : `onclick="Lists.openRatingModal(appState.history[${index}], 'edit')"`;

        return `
            <div class="neo-box bg-white p-3 flex flex-col gap-2 cursor-pointer hover:translate-y-[-2px] transition" ${editAction}>
                <div class="h-24 w-full border-2 border-black flex items-center justify-center relative overflow-hidden" style="${colorStyle}">
                    <span class="font-display text-4xl opacity-20">${anime.title[0]}</span>
                    <button class="absolute top-1 right-1 bg-white border-2 border-black w-6 h-6 flex items-center justify-center rounded-full hover:scale-110 transition ${favClass}" ${favAction}>
                        <i class="fas fa-heart text-[10px]"></i>
                    </button>
                </div>
                
                <div>
                    <h4 class="font-bold text-xs uppercase truncate" title="${anime.title}">${anime.title}</h4>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-neo-yellow text-xs tracking-tighter">${stars}</span>
                        <span class="text-[8px] font-mono text-gray-500">${date}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Abre modal para adicionar anime manualmente ao histórico
     */
    openAddManualModal() {
        const title = prompt('Digite o nome do anime:');
        if (!title || title.trim() === '') return;
        
        const eps = prompt('Quantos episódios tem?', '12');
        const epsNum = parseInt(eps) || 12;

        // Criar objeto anime manual
        const anime = {
            id: Date.now(), // ID único baseado em timestamp
            title: title.trim(),
            eps: epsNum,
            status: 'Finished',
            image: '',
            rating: 0,
            favorite: false,
            completedDate: new Date().toLocaleDateString('pt-BR')
        };

        // Abrir modal de rating para completar
        this.openRatingModal(anime, 'manual');
    }
};

// Expor globalmente
window.Lists = Lists;

