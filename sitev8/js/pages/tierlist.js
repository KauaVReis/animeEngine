/**
 * AnimeEngine v7 - Tier List Logic
 * Handles drag & drop ranking for completed animes
 */

const TierListPage = {
    animes: [],
    tiers: {
        S: [], A: [], B: [], C: [], D: [], F: []
    },
    STORAGE_KEY: 'animeengine_tierlist_v7',

    async init() {
        console.log('🏆 Initializing Tier List...');
        this.loadSavedState();
        await this.loadCompletedAnimes();
        this.initSortable();
    },

    loadSavedState() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.tiers = JSON.parse(saved);
        }
    },

    saveState() {
        // Collect current IDs from each tier container
        const newState = { S: [], A: [], B: [], C: [], D: [], F: [] };

        Object.keys(newState).forEach(tier => {
            const container = document.getElementById(`tier-list-${tier}`);
            const cards = container.querySelectorAll('.tier-card');
            cards.forEach(card => {
                const animeId = card.getAttribute('data-id');
                const anime = this.animes.find(a => a.anime_id == animeId);
                if (anime) {
                    newState[tier].push({
                        anime_id: anime.anime_id,
                        titulo: anime.titulo,
                        imagem: anime.imagem
                    });
                }
            });
        });

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
        this.tiers = newState;
    },

    async loadCompletedAnimes() {
        const pool = document.getElementById('anime-pool');

        try {
            const response = await fetch('api/lists/get.php');
            const data = await response.json();

            if (data.success && data.lists && data.lists.completed) {
                this.animes = data.lists.completed;
                this.render();
            } else {
                pool.innerHTML = '<p class="text-muted">Nenhum anime completo encontrado. Complete alguns animes primeiro! 📺</p>';
            }
        } catch (e) {
            console.error('Erro ao carregar animes:', e);
            pool.innerHTML = '<p class="text-danger">Erro ao carregar seus animes.</p>';
        }
    },

    render() {
        const pool = document.getElementById('anime-pool');

        // Filter out animes already in tiers
        const tieredIds = new Set();
        Object.values(this.tiers).forEach(list => {
            list.forEach(a => tieredIds.add(String(a.anime_id)));
        });

        const poolAnimes = this.animes.filter(a => !tieredIds.has(String(a.anime_id)));

        // Render Pool
        pool.innerHTML = poolAnimes.map(anime => this.createCardHTML(anime)).join('');

        // Render Tiers
        Object.keys(this.tiers).forEach(tier => {
            const container = document.getElementById(`tier-list-${tier}`);
            container.innerHTML = this.tiers[tier].map(anime => this.createCardHTML(anime)).join('');
        });
    },

    createCardHTML(anime) {
        return `
            <div class="tier-card" data-id="${anime.anime_id}" title="${anime.titulo}">
                <img src="${anime.imagem}" alt="${anime.titulo}" loading="lazy">
                <div class="tier-card-title">${anime.titulo}</div>
            </div>
        `;
    },

    initSortable() {
        const lists = document.querySelectorAll('.sortable-list');

        lists.forEach(list => {
            new Sortable(list, {
                group: 'tierlist',
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                onEnd: () => {
                    this.saveState();
                    Common.showToast('✅ Ranking atualizado!');
                }
            });
        });
    },

    resetConfirm() {
        Common.confirm({
            title: '🔥 Tem certeza?',
            message: 'Isso moverá todos os animes de volta para a reserva e limpará seu ranking. Continuar?',
            confirmText: 'Sim, Resetar Agora! 🔥',
            onConfirm: () => {
                localStorage.removeItem(this.STORAGE_KEY);
                this.tiers = { S: [], A: [], B: [], C: [], D: [], F: [] };
                this.render();
                Common.showNotification('Tier List resetada com sucesso!');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => TierListPage.init());
