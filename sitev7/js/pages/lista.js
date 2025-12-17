/**
 * AnimeEngine v7 - Lista Page
 * Usa API do backend
 */

const ListaPage = {
    currentTab: 'all',
    lists: {},
    
    async init() {
        console.log('📋 Loading Lista Page...');
        
        // Carregar listas do backend
        await this.loadLists();
        
        // Setup tabs
        document.querySelectorAll('.list-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.list));
        });
        
        // Search
        document.getElementById('list-search')?.addEventListener('input', () => this.renderList());
        document.getElementById('list-sort')?.addEventListener('change', () => this.renderList());
        
        console.log('✅ Lista Page loaded!');
    },

    async loadLists() {
        try {
            const response = await fetch('api/lists/get.php');
            const data = await response.json();
            
            if (data.lists) {
                this.lists = data.lists;
                this.updateCounts();
                this.renderList();
            }
        } catch (e) {
            console.error('Erro ao carregar listas:', e);
            document.getElementById('list-grid').innerHTML = '<p class="empty-message">Erro ao carregar listas</p>';
        }
    },

    updateCounts() {
        const tabs = ['watching', 'planToWatch', 'completed', 'paused', 'dropped'];
        let total = 0;
        
        tabs.forEach(tab => {
            const count = this.lists[tab]?.length || 0;
            total += count;
            const el = document.getElementById(`count-${tab}`);
            if (el) el.textContent = count;
        });
        
        // Total count for "all"
        const allEl = document.getElementById('count-all');
        if (allEl) allEl.textContent = total;
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        
        document.querySelectorAll('.list-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.list === tabName);
        });
        
        this.renderList();
    },

    getFilteredAnimes() {
        let animes = [];
        
        if (this.currentTab === 'all') {
            // Combinar todas as listas
            const tabs = ['watching', 'planToWatch', 'completed', 'paused', 'dropped'];
            tabs.forEach(tab => {
                const listAnimes = this.lists[tab] || [];
                listAnimes.forEach(a => {
                    animes.push({ ...a, listType: tab });
                });
            });
        } else {
            animes = (this.lists[this.currentTab] || []).map(a => ({ ...a, listType: this.currentTab }));
        }
        
        const searchTerm = document.getElementById('list-search')?.value?.toLowerCase() || '';
        const sortBy = document.getElementById('list-sort')?.value || 'recent';
        
        // Filtrar por busca
        if (searchTerm) {
            animes = animes.filter(a => 
                a.titulo?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Ordenar
        animes.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return (a.titulo || '').localeCompare(b.titulo || '');
                case 'score':
                    return (b.nota || 0) - (a.nota || 0);
                case 'progress':
                    const progA = a.episodios_total ? (a.progresso / a.episodios_total) : 0;
                    const progB = b.episodios_total ? (b.progresso / b.episodios_total) : 0;
                    return progB - progA;
                case 'recent':
                default:
                    return new Date(b.atualizado_em || 0) - new Date(a.atualizado_em || 0);
            }
        });
        
        return animes;
    },

    getStatusLabel(status) {
        const labels = {
            watching: '📺',
            planToWatch: '📋',
            completed: '✅',
            paused: '⏸️',
            dropped: '❌'
        };
        return labels[status] || '';
    },

    renderList() {
        const container = document.getElementById('list-grid');
        const emptyState = document.getElementById('empty-state');
        const animes = this.getFilteredAnimes();
        
        if (animes.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        container.innerHTML = animes.map(anime => `
            <div class="anime-card" onclick="window.location='detalhes.php?id=${anime.anime_id}'">
                <div class="anime-card-image">
                    <img src="${anime.imagem}" alt="${anime.titulo}" loading="lazy">
                    ${anime.nota ? `<div class="anime-card-score">★ ${anime.nota}</div>` : ''}
                    ${this.currentTab === 'all' ? `<div class="anime-card-status">${this.getStatusLabel(anime.listType)}</div>` : ''}
                </div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title">${anime.titulo}</h3>
                    <div class="anime-card-meta">
                        <span>${anime.progresso || 0}/${anime.episodios_total || '?'} eps</span>
                    </div>
                    ${anime.listType === 'watching' || this.currentTab === 'watching' ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${anime.episodios_total ? (anime.progresso / anime.episodios_total * 100) : 0}%"></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => ListaPage.init());

