/**
 * AnimeEngine v7 - Lista Page (Kanban)
 * Usa API do backend com Drag and Drop (SortableJS)
 */

const ListaPage = {
    lists: {},
    kanbanInstances: [],

    async init() {
        console.log('📋 Loading Kanban List Page...');

        // Carregar listas do backend
        await this.loadLists();

        // Search
        document.getElementById('list-search')?.addEventListener('input', () => this.renderList());

        // Init SortableJS
        this.initSortable();

        console.log('✅ Kanban List Page loaded!');
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
            document.querySelectorAll('.kanban-cards-container').forEach(el => {
                if (el) el.innerHTML = '<p class="empty-message">Erro ao carregar listas</p>';
            });
        }
    },

    updateCounts() {
        const columns = ['watching', 'planToWatch', 'completed', 'dropped'];

        columns.forEach(col => {
            const count = this.lists[col]?.length || 0;
            const el = document.getElementById(`count-${col}`);
            if (el) el.textContent = count;
        });
    },

    getFilteredAnimes(columnId) {
        let animes = this.lists[columnId] || [];
        const searchTerm = document.getElementById('list-search')?.value?.toLowerCase() || '';

        // Filtrar por busca
        if (searchTerm) {
            animes = animes.filter(a =>
                a.titulo?.toLowerCase().includes(searchTerm)
            );
        }

        // Ordenar por data de atualização (mais recentes primeiro)
        animes.sort((a, b) => new Date(b.atualizado_em || 0) - new Date(a.atualizado_em || 0));

        return animes;
    },

    renderList() {
        const columns = ['watching', 'planToWatch', 'completed', 'dropped'];

        columns.forEach(col => {
            const container = document.getElementById(`list-${col}`);
            if (!container) return;

            const animes = this.getFilteredAnimes(col);

            if (animes.length === 0) {
                if (container) container.innerHTML = `<div class="empty-column-message">Nenhum anime aqui</div>`;
                return;
            }

            if (container) {
                container.innerHTML = animes.map(anime => `
                    <div class="kanban-card" data-id="${anime.anime_id}" data-status="${col}" onclick="if(!window.isDragging) window.location='detalhes.php?id=${anime.anime_id}'">
                        <img src="${anime.imagem}" alt="${anime.titulo}" draggable="false" loading="lazy">
                        <div class="kanban-card-info">
                            <h4 class="kanban-card-title">${anime.titulo}</h4>
                            <div class="kanban-card-meta">
                                <span>⭐ ${anime.nota || '-'}</span>
                                <span>${anime.progresso || 0}/${anime.episodios_total || '?'} eps</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        });
    },

    initSortable() {
        const columns = ['watching', 'planToWatch', 'completed', 'dropped'];

        columns.forEach(col => {
            const container = document.getElementById(`list-${col}`);
            if (!container) return;

            const sortable = new Sortable(container, {
                group: 'shared', // set both lists to same group
                animation: 150,
                ghostClass: 'kanban-ghost',
                delayOnTouchOnly: true, // Atraso para mobile não arrastar sem querer ao rolar
                delay: 150, // milissegundos
                onStart: function () {
                    window.isDragging = true;
                },
                onEnd: async (evt) => {
                    setTimeout(() => window.isDragging = false, 100);

                    const itemEl = evt.item;  // elemento arrastado
                    const toListId = evt.to.id.replace('list-', ''); // Ex: list-completed -> completed
                    const fromListId = evt.from.id.replace('list-', '');
                    const animeId = itemEl.dataset.id;

                    if (toListId === fromListId) return; // Não mudou de coluna

                    console.log(`Movendo Anime ID ${animeId} de ${fromListId} para ${toListId}`);

                    // Atualiza contadores instantaneamente na UI (Optimistic UI)
                    itemEl.dataset.status = toListId;

                    // Dispara a chamada de API
                    try {
                        const response = await fetch('api/lists/move.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                anime_id: animeId,
                                tipo_lista: toListId
                            })
                        });

                        const result = await response.json();
                        if (result.success) {
                            console.log('Movimentação salva com sucesso no banco!');
                            // Recarrega as listas silenciosamente para garantir sincronia
                            this.loadLists();
                        } else {
                            alert('Erro ao mover anime: ' + (result.error || 'Desconhecido'));
                            this.loadLists(); // Reverte
                        }
                    } catch (e) {
                        console.error('Erro fatal ao mover:', e);
                        this.loadLists(); // Reverte
                    }
                }
            });

            this.kanbanInstances.push(sortable);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ListaPage.init());

