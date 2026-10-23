/**
 * AnimeEngine v8 - Lista Page (Kanban Interativo Aprimorado)
 * Suporte completo a 5 colunas, drag-and-drop SortableJS, controle de episódios e notas
 */

const ListaPage = {
    lists: {
        watching: [],
        planToWatch: [],
        completed: [],
        paused: [],
        dropped: []
    },
    sortableInstances: [],

    async init() {
        console.log('📋 [ListaPage] Inicializando Kanban v8...');
        await this.loadLists();

        const searchInput = document.getElementById('list-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderList());
        }

        this.initSortable();
        console.log('✅ [ListaPage] Kanban carregado!');
    },

    async loadLists() {
        try {
            const response = await fetch('api/lists/get.php');
            const data = await response.json();

            if (data.lists) {
                this.lists = {
                    watching: data.lists.watching || [],
                    planToWatch: data.lists.planToWatch || [],
                    completed: data.lists.completed || [],
                    paused: data.lists.paused || [],
                    dropped: data.lists.dropped || []
                };
                this.updateCounts();
                this.renderList();
            }
        } catch (e) {
            console.error('Erro ao carregar listas do backend:', e);
            document.querySelectorAll('.kanban-cards-track').forEach(el => {
                el.innerHTML = '<p class="empty-column-message">Erro ao sincronizar listas</p>';
            });
        }
    },

    updateCounts() {
        const columns = ['watching', 'planToWatch', 'completed', 'paused', 'dropped'];
        columns.forEach(col => {
            const count = this.lists[col]?.length || 0;
            const el = document.getElementById(`count-${col}`);
            if (el) el.textContent = count;
        });
    },

    getFilteredAnimes(columnId) {
        let animes = [...(this.lists[columnId] || [])];
        const searchTerm = document.getElementById('list-search')?.value?.trim().toLowerCase() || '';
        const sortType = document.getElementById('sort-select')?.value || 'recentes';

        if (searchTerm) {
            animes = animes.filter(a => (a.titulo || '').toLowerCase().includes(searchTerm));
        }

        // Ordenação
        switch (sortType) {
            case 'nota_desc':
                animes.sort((a, b) => (b.nota || 0) - (a.nota || 0));
                break;
            case 'titulo_asc':
                animes.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''));
                break;
            case 'progresso_desc':
                animes.sort((a, b) => (b.progresso || 0) - (a.progresso || 0));
                break;
            case 'recentes':
            default:
                animes.sort((a, b) => new Date(b.atualizado_em || 0) - new Date(a.atualizado_em || 0));
                break;
        }

        return animes;
    },

    renderList() {
        const columns = ['watching', 'planToWatch', 'completed', 'paused', 'dropped'];
        const colFilter = document.getElementById('status-filter')?.value || 'all';

        columns.forEach(col => {
            const colElem = document.getElementById(`col-${col}`);
            const container = document.getElementById(`list-${col}`);
            if (!colElem || !container) return;

            // Filtragem visual por coluna
            if (colFilter !== 'all' && colFilter !== col) {
                colElem.style.display = 'none';
                return;
            } else {
                colElem.style.display = 'flex';
            }

            const animes = this.getFilteredAnimes(col);

            if (animes.length === 0) {
                container.innerHTML = `
                    <div class="empty-column-box">
                        <span class="empty-col-icon">📭</span>
                        <p>Nenhum anime nesta coluna</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = animes.map(anime => {
                const totalEps = anime.episodios_total || anime.total_episodes || 0;
                const progress = anime.progresso || 0;
                const hasScore = anime.nota && anime.nota > 0;

                return `
                    <div class="kanban-card-neo" data-id="${anime.anime_id}" data-status="${col}" onclick="if(!window.isDragging && window.Common) Common.navigate('detalhes?id=${anime.anime_id}')">
                        <div class="card-cover-thumb">
                            <img src="${anime.imagem || 'https://via.placeholder.com/150x220?text=Anime'}" alt="${anime.titulo}" draggable="false" loading="lazy">
                            <div class="card-rating-badge ${hasScore ? 'has-score' : ''}">
                                ⭐ ${hasScore ? anime.nota : '-'}
                            </div>
                        </div>
                        <div class="card-content-body">
                            <h4 class="card-title-text" title="${anime.titulo}">${anime.titulo}</h4>
                            
                            <div class="card-progress-row">
                                <div class="card-progress-numbers">
                                    <i class="fas fa-play"></i>
                                    <span>${progress} / ${totalEps || '?'} eps</span>
                                </div>
                                <button class="btn-quick-plus" onclick="event.stopPropagation(); ListaPage.incrementEpisode(${anime.anime_id}, ${progress}, ${totalEps})" title="Assistir +1 episódio">
                                    +1
                                </button>
                            </div>

                            <div class="card-quick-actions">
                                <button class="btn-card-action" onclick="event.stopPropagation(); ListaPage.quickPromptScore(${anime.anime_id}, ${anime.nota || 0})" title="Avaliar Nota">
                                    <i class="fas fa-star"></i> Nota
                                </button>
                                <button class="btn-card-action delete-act" onclick="event.stopPropagation(); ListaPage.deleteAnime(${anime.anime_id}, '${anime.titulo.replace(/'/g, "\\'")}')" title="Remover da lista">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        });
    },

    initSortable() {
        if (typeof Sortable === 'undefined') {
            console.warn('SortableJS não carregado ainda');
            return;
        }

        // Destruir instâncias antigas se houver
        this.sortableInstances.forEach(inst => {
            try { inst.destroy(); } catch (_) {}
        });
        this.sortableInstances = [];

        const columns = ['watching', 'planToWatch', 'completed', 'paused', 'dropped'];

        columns.forEach(col => {
            const el = document.getElementById(`list-${col}`);
            if (!el) return;

            const inst = new Sortable(el, {
                group: 'kanban-lists',
                animation: 180,
                ghostClass: 'kanban-ghost',
                chosenClass: 'kanban-chosen',
                dragClass: 'kanban-drag',
                handle: '.kanban-card-neo',
                onStart: () => {
                    window.isDragging = true;
                },
                onEnd: async (evt) => {
                    setTimeout(() => { window.isDragging = false; }, 200);

                    const itemEl = evt.item;
                    const animeId = parseInt(itemEl.getAttribute('data-id'));
                    const targetCol = evt.to.closest('.kanban-col')?.getAttribute('data-status');
                    const sourceCol = evt.from.closest('.kanban-col')?.getAttribute('data-status');

                    if (!targetCol || !animeId || targetCol === sourceCol) return;

                    // Mover internamente no array para refletir imediatamente
                    const animeIndex = (this.lists[sourceCol] || []).findIndex(a => a.anime_id === animeId);
                    if (animeIndex > -1) {
                        const [movedAnime] = this.lists[sourceCol].splice(animeIndex, 1);
                        movedAnime.tipo_lista = targetCol;
                        if (targetCol === 'completed' && movedAnime.episodios_total) {
                            movedAnime.progresso = movedAnime.episodios_total;
                        }
                        this.lists[targetCol].unshift(movedAnime);
                        this.updateCounts();
                    }

                    // Enviar requisição para a API
                    try {
                        const response = await fetch('api/lists/move.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ anime_id: animeId, tipo_lista: targetCol })
                        });
                        const res = await response.json();
                        if (!res.success) {
                            console.error('Falha ao mover anime:', res.message);
                            await this.loadLists();
                        }
                    } catch (e) {
                        console.error('Erro de conexão ao mover:', e);
                        await this.loadLists();
                    }
                }
            });

            this.sortableInstances.push(inst);
        });
    },

    async incrementEpisode(animeId, currentProg, total) {
        const newProg = currentProg + 1;
        if (total > 0 && newProg > total) return;

        try {
            const res = await fetch('api/lists/update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anime_id: animeId, progresso: newProg })
            });
            const data = await res.json();
            if (data.success) {
                // Atualizar no estado local
                for (const col of Object.keys(this.lists)) {
                    const item = this.lists[col].find(a => a.anime_id === animeId);
                    if (item) {
                        item.progresso = newProg;
                        break;
                    }
                }
                this.renderList();
            }
        } catch (e) {
            console.error('Erro ao incrementar episódio:', e);
        }
    },

    async quickPromptScore(animeId, currentScore) {
        const input = prompt('Digite sua nota de 1 a 10 (ou 0 para remover nota):', currentScore || '');
        if (input === null) return;

        const nota = parseInt(input, 10);
        if (isNaN(nota) || nota < 0 || nota > 10) {
            alert('Por favor digite um número inteiro entre 0 e 10.');
            return;
        }

        try {
            const res = await fetch('api/lists/update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anime_id: animeId, nota: nota })
            });
            const data = await res.json();
            if (data.success) {
                for (const col of Object.keys(this.lists)) {
                    const item = this.lists[col].find(a => a.anime_id === animeId);
                    if (item) {
                        item.nota = nota;
                        break;
                    }
                }
                this.renderList();
            }
        } catch (e) {
            console.error('Erro ao avaliar:', e);
        }
    },

    async deleteAnime(animeId, titulo) {
        if (!confirm(`Deseja remover "${titulo}" da sua biblioteca?`)) return;

        try {
            const res = await fetch('api/lists/remove.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anime_id: animeId })
            });
            const data = await res.json();
            if (data.success) {
                for (const col of Object.keys(this.lists)) {
                    this.lists[col] = this.lists[col].filter(a => a.anime_id !== animeId);
                }
                this.updateCounts();
                this.renderList();
            }
        } catch (e) {
            console.error('Erro ao remover anime:', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ListaPage.init();
});
