/**
 * AnimeEngine v7 - Lista Page (Kanban)
 * Usa API do backend com Drag and Drop (SortableJS)
 */

const ListaPage = {
    lists: {},
    kanbanInstances: [],

    async init() {
        console.log('Loading Kanban List Page...');

        await this.loadLists();

        document.getElementById('list-search')?.addEventListener('input', () => this.renderList());
        this.initSortable();

        console.log('Kanban List Page loaded!');
    },

    async loadLists() {
        try {
            document.querySelectorAll('.kanban-cards-container').forEach(el => {
                if (el) el.innerHTML = this.renderColumnSkeleton();
            });

            const data = await Common.apiFetch('api/lists/get.php');

            if (data.lists) {
                this.lists = data.lists;
                this.updateCounts();
                this.renderList();
            }
        } catch (e) {
            console.error('Erro ao carregar listas:', e);
            document.querySelectorAll('.kanban-cards-container').forEach(el => {
                if (el) {
                    Common.renderEmptyState(el, {
                        icon: 'fas fa-triangle-exclamation',
                        title: 'Erro ao carregar',
                        message: 'Tente recarregar a pagina.'
                    });
                }
            });
        }
    },

    renderColumnSkeleton(count = 3) {
        return Array(count).fill('').map(() => `
            <div class="kanban-card skeleton-list-card" aria-hidden="true">
                <div class="skeleton skeleton-list-image"></div>
                <div class="kanban-card-info">
                    <div class="skeleton skeleton-list-title"></div>
                    <div class="skeleton skeleton-list-meta"></div>
                </div>
            </div>
        `).join('');
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

        if (searchTerm) {
            animes = animes.filter(a => a.titulo?.toLowerCase().includes(searchTerm));
        }

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
                Common.renderEmptyState(container, {
                    icon: 'fas fa-clapperboard',
                    title: 'Nenhum anime aqui',
                    message: 'Arraste cards para esta coluna ou adicione novos animes.'
                });
                return;
            }

            container.innerHTML = animes.map(anime => `
                <div class="kanban-card" data-id="${anime.anime_id}" data-status="${col}" onclick="if(!window.isDragging) window.location='detalhes.php?id=${anime.anime_id}'">
                    <img src="${anime.imagem}" alt="${anime.titulo}" draggable="false" loading="lazy">
                    <div class="kanban-card-info">
                        <h4 class="kanban-card-title">${anime.titulo}</h4>
                        <div class="kanban-card-meta">
                            <span>${anime.nota || '-'} nota</span>
                            <span>${anime.progresso || 0}/${anime.episodios_total || '?'} eps</span>
                        </div>
                    </div>
                </div>
            `).join('');
        });
    },

    initSortable() {
        const columns = ['watching', 'planToWatch', 'completed', 'dropped'];

        columns.forEach(col => {
            const container = document.getElementById(`list-${col}`);
            if (!container) return;

            const sortable = new Sortable(container, {
                group: 'shared',
                animation: 150,
                ghostClass: 'kanban-ghost',
                delayOnTouchOnly: true,
                delay: 150,
                onStart: function () {
                    window.isDragging = true;
                },
                onEnd: async (evt) => {
                    setTimeout(() => window.isDragging = false, 100);

                    const itemEl = evt.item;
                    const toListId = evt.to.id.replace('list-', '');
                    const fromListId = evt.from.id.replace('list-', '');
                    const animeId = itemEl.dataset.id;

                    if (toListId === fromListId) return;

                    itemEl.dataset.status = toListId;

                    try {
                        const result = await Common.apiFetch('api/lists/move.php', {
                            method: 'POST',
                            body: JSON.stringify({
                                anime_id: animeId,
                                tipo_lista: toListId
                            })
                        });

                        if (result.success) {
                            Common.showNotification('Lista atualizada', 'success');
                            this.loadLists();
                        } else {
                            Common.showNotification(result.message || 'Erro ao mover anime', 'error');
                            this.loadLists();
                        }
                    } catch (e) {
                        console.error('Erro ao mover:', e);
                        Common.showNotification(e.message || 'Erro ao mover anime', 'error');
                        this.loadLists();
                    }
                }
            });

            this.kanbanInstances.push(sortable);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ListaPage.init());
