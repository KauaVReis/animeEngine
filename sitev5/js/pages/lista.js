/**
 * AnimeEngine v5 - Lista Page
 * Gerencia todas as listas do usuário
 */

const ListaPage = {
    currentTab: 'all',

    init() {
        console.log('📋 Loading Lista Page...');
        this.updateCounts();
        this.switchTab('all');
        console.log('✅ Lista Page loaded!');
    },

    updateCounts() {
        const lists = Storage.getLists();
        
        let total = 0;
        Object.keys(lists).forEach(key => {
            if (key !== 'favorites') {
                const count = lists[key]?.length || 0;
                total += count;
                const el = document.getElementById(`count-${key}`);
                if (el) el.textContent = count;
            }
        });
        
        document.getElementById('count-all').textContent = total;
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tabs UI
        document.querySelectorAll('.list-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.list === tabName);
        });
        
        // Render list
        this.renderList();
    },

    renderList() {
        const lists = Storage.getLists();
        const container = document.getElementById('anime-list');
        
        let animes = [];
        
        if (this.currentTab === 'all') {
            // Combinar todas as listas (exceto favoritos)
            ['watching', 'planToWatch', 'completed', 'paused', 'dropped'].forEach(key => {
                if (lists[key]) {
                    animes = animes.concat(lists[key].map(a => ({ ...a, listType: key })));
                }
            });
        } else {
            animes = (lists[this.currentTab] || []).map(a => ({ ...a, listType: this.currentTab }));
        }
        
        if (animes.length === 0) {
            container.innerHTML = `
                <p class="empty-message">
                    Nenhum anime nesta lista. 
                    <a href="explorar.html">Explore animes</a> para adicionar!
                </p>
            `;
            return;
        }
        
        container.innerHTML = '';
        animes.forEach(anime => {
            const item = this.createListItem(anime);
            container.appendChild(item);
        });
    },

    createListItem(anime) {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.dataset.id = anime.id;
        
        const progress = anime.progress || 0;
        const total = anime.episodes || '?';
        const percent = total !== '?' ? Math.round((progress / total) * 100) : 0;
        
        const statusLabels = {
            watching: '📺 Assistindo',
            planToWatch: '📋 Quero Ver',
            completed: '✅ Completo',
            paused: '⏸️ Pausado',
            dropped: '❌ Dropado'
        };
        
        item.innerHTML = `
            <div class="list-item-image" onclick="window.location='detalhes.html?id=${anime.id}'">
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
            </div>
            <div class="list-item-info">
                <h3 class="list-item-title" onclick="window.location='detalhes.html?id=${anime.id}'">${anime.title}</h3>
                <div class="list-item-meta">
                    <span class="list-item-status">${statusLabels[anime.listType] || anime.listType}</span>
                    <span class="list-item-progress">${progress}/${total} eps</span>
                    ${anime.rating ? `<span class="list-item-rating">★ ${anime.rating}/10</span>` : ''}
                </div>
                <div class="list-item-progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn-sm" onclick="ListaPage.openEditModal(${anime.id}, '${anime.listType}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-sm btn-danger" onclick="ListaPage.removeFromList(${anime.id})" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return item;
    },

    openEditModal(animeId, listType) {
        const lists = Storage.getLists();
        const anime = lists[listType]?.find(a => a.id === animeId);
        
        if (!anime) return;
        
        const content = `
            <div class="edit-form">
                <div class="form-group">
                    <label>Status</label>
                    <select id="edit-status">
                        <option value="watching" ${listType === 'watching' ? 'selected' : ''}>📺 Assistindo</option>
                        <option value="planToWatch" ${listType === 'planToWatch' ? 'selected' : ''}>📋 Quero Ver</option>
                        <option value="completed" ${listType === 'completed' ? 'selected' : ''}>✅ Completo</option>
                        <option value="paused" ${listType === 'paused' ? 'selected' : ''}>⏸️ Pausado</option>
                        <option value="dropped" ${listType === 'dropped' ? 'selected' : ''}>❌ Dropado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Episódios Assistidos</label>
                    <div class="progress-input">
                        <input type="number" id="edit-progress" value="${anime.progress || 0}" min="0" max="${anime.episodes || 9999}">
                        <span>/ ${anime.episodes || '?'}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Minha Nota</label>
                    <div class="rating-input" id="rating-input">
                        ${this.createRatingStars(anime.rating || 0)}
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="Common.closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="ListaPage.saveEdit(${animeId}, '${listType}')">Salvar</button>
                </div>
            </div>
        `;
        
        Common.openModal(content, { title: anime.title });
    },

    createRatingStars(currentRating) {
        let html = '';
        for (let i = 1; i <= 10; i++) {
            const filled = i <= currentRating;
            html += `<span class="rating-star ${filled ? 'filled' : ''}" data-value="${i}" onclick="ListaPage.setRating(${i})">★</span>`;
        }
        return html;
    },

    setRating(value) {
        document.querySelectorAll('.rating-star').forEach((star, index) => {
            star.classList.toggle('filled', index < value);
        });
        document.getElementById('rating-input').dataset.value = value;
    },

    saveEdit(animeId, oldListType) {
        const newStatus = document.getElementById('edit-status').value;
        const progress = parseInt(document.getElementById('edit-progress').value) || 0;
        const rating = parseInt(document.getElementById('rating-input').dataset.value) || 0;
        
        const lists = Storage.getLists();
        
        // Encontrar o anime
        const index = lists[oldListType]?.findIndex(a => a.id === animeId);
        if (index === -1) return;
        
        const anime = lists[oldListType][index];
        anime.progress = progress;
        anime.rating = rating;
        anime.updatedAt = new Date().toISOString();
        
        // Se mudou de lista
        if (newStatus !== oldListType) {
            lists[oldListType].splice(index, 1);
            if (!lists[newStatus]) lists[newStatus] = [];
            lists[newStatus].unshift(anime);
        }
        
        Storage.save('lists', lists);
        Common.closeModal();
        Common.showNotification('Anime atualizado!');
        
        this.updateCounts();
        this.renderList();
    },

    removeFromList(animeId) {
        if (!confirm('Remover este anime da lista?')) return;
        
        Storage.removeFromAllLists(animeId);
        Common.showNotification('Anime removido da lista');
        
        this.updateCounts();
        this.renderList();
    }
};

document.addEventListener('DOMContentLoaded', () => ListaPage.init());
