/**
 * AnimeEngine v7 - Assistindo Page
 * Funciona integrado com a API MySQL do Usuário
 */

const AssistindoPage = {
    animes: [],

    async init() {
        console.log('📺 Loading Assistindo Page...');
        await this.loadWatching();
        console.log('✅ Assistindo Page loaded!');
    },

    async loadWatching() {
        try {
            const container = document.getElementById('watching-grid');
            if (container) container.innerHTML = '<div class="carousel-loading"><div class="loader"></div></div>';

            const response = await fetch('api/lists/get.php');
            const data = await response.json();

            if (data.success && data.lists && data.lists.watching) {
                this.animes = data.lists.watching;
            } else {
                this.animes = [];
            }
            this.render();
        } catch (e) {
            console.error('Erro ao carregar lista de assistindo:', e);
            document.getElementById('watching-grid').innerHTML = '<p class="error">Erro de conexão com o servidor.</p>';
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
            const total = anime.episodios_total || anime.total_episodes || 0;
            const current = anime.progresso || anime.progress || 0;
            const percent = total ? Math.round((current / total) * 100) : 0;

            return `
                <div class="watching-card" id="anime-card-${anime.anime_id}" onclick="window.location='detalhes.php?id=${anime.anime_id}'">
                    <div class="watching-image">
                        <img src="${anime.imagem || anime.image}" alt="${anime.titulo}" loading="lazy">
                    </div>
                    <div class="watching-info">
                        <h3 class="watching-title">${anime.titulo}</h3>
                        
                        <div class="watching-progress-info">
                            <div class="watching-meta">
                                <span id="progress-text-${anime.anime_id}">Episódio ${current} ${total ? `/ ${total}` : ''}</span>
                                <span id="percent-text-${anime.anime_id}">${percent}%</span>
                            </div>
                            <div class="progress-track">
                                <div class="progress-fill" id="progress-fill-${anime.anime_id}" style="width: ${percent}%"></div>
                            </div>
                        </div>
                        
                        <div class="episode-controls">
                            <!-- Minus Button -->
                            <button class="btn-control" onclick="event.stopPropagation(); AssistindoPage.updateProgress(${anime.anime_id}, -1, ${total})" title="Diminuir">
                                <i class="fas fa-minus"></i>
                            </button>
                            
                            <!-- Display / Edit -->
                            <div class="episode-number" onclick="event.stopPropagation(); AssistindoPage.openEditModal(${anime.anime_id}, '${anime.titulo.replace(/'/g, "\\'")}', ${current}, ${total})">
                                <span id="display-curr-${anime.anime_id}">${current}</span>
                                <span style="opacity: 0.5; font-size: 0.8em; margin-left: 4px;">/ ${total || '?'}</span>
                            </div>
                            
                            <!-- Plus Button -->
                            <button class="btn-control" onclick="event.stopPropagation(); AssistindoPage.updateProgress(${anime.anime_id}, 1, ${total})" title="Aumentar">
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

    async updateProgress(animeId, change, total) {
        const anime = this.animes.find(a => a.anime_id == animeId);
        if (!anime) return;

        let newProgress = parseInt(anime.progresso || anime.progress || 0) + change;
        if (newProgress < 0) newProgress = 0;
        if (total && newProgress > total) newProgress = total;

        // Se voltar para o mesmo número, ignora.
        if (newProgress == (anime.progresso || 0)) return;

        await this.saveProgress(animeId, newProgress, total, anime);
    },

    openEditModal(animeId, title, current, total) {
        const html = `
            <div class="edit-ep-modal">
                <p>Em qual episódio você está?</p>
                <div class="input-group">
                    <input type="number" id="ep-input-edit" value="${current}" min="0" max="${total || 9999}">
                    <button class="btn btn-primary" onclick="AssistindoPage.confirmEdit(${animeId}, ${total})">Salvar</button>
                </div>
                <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                    <a href="detalhes.php?id=${animeId}" class="btn btn-block btn-outline">
                        <i class="fas fa-info-circle"></i> Ver Detalhes do Anime
                    </a>
                </div>
            </div>
        `;

        Common.openModal(html, { title: `📺 Editar Progresso` });
        setTimeout(() => document.getElementById('ep-input-edit')?.focus(), 100);
    },

    async confirmEdit(animeId, total) {
        const input = document.getElementById('ep-input-edit');
        if (!input) return;

        const val = parseInt(input.value);
        if (isNaN(val) || val < 0) {
            alert('Número inválido');
            return;
        }

        const anime = this.animes.find(a => a.anime_id == animeId);
        if (anime) {
            await this.saveProgress(animeId, val, total, anime);
            Common.closeModal();
        }
    },

    async saveProgress(animeId, newProgress, total, animeRef) {
        // --- Optimistic UI Update ---
        animeRef.progresso = newProgress;
        const percent = total ? Math.round((newProgress / total) * 100) : 0;

        const pt = document.getElementById(`progress-text-${animeId}`);
        const pp = document.getElementById(`percent-text-${animeId}`);
        const pf = document.getElementById(`progress-fill-${animeId}`);
        const dc = document.getElementById(`display-curr-${animeId}`);

        if (pt) pt.innerText = `Episódio ${newProgress} ${total ? `/ ${total}` : ''}`;
        if (pp) pp.innerText = `${percent}%`;
        if (pf) pf.style.width = `${percent}%`;
        if (dc) dc.innerText = newProgress;

        // Se Completou
        if (total && newProgress >= total) {
            document.getElementById(`anime-card-${animeId}`)?.remove();
            this.animes = this.animes.filter(a => a.anime_id != animeId);

            if (window.createParticles) createParticles(20, 'star', ['#ffd700', '#00ff41']);
            alert(`🎉 Parabéns! Você completou ${animeRef.titulo}!`);

            if (this.animes.length === 0) {
                this.showEmpty();
            }

            // Backend: Move para "completed"
            try {
                await fetch('api/lists/move.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ anime_id: animeId, tipo_lista: 'completed' })
                });
            } catch (e) {
                console.error("Erro ao mover para completos:", e);
            }
        } else {
            // Backend: Apenas atualiza o progresso no "watching"
            try {
                await fetch('api/lists/update.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ anime_id: animeId, progresso: newProgress })
                });
            } catch (e) {
                console.error("Erro ao salvar progresso:", e);
                // Falha silenciosa, na próxima load resolve (não atrapalha a UX)
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => AssistindoPage.init());
