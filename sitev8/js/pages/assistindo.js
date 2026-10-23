/**
 * AnimeEngine v8 - Assistindo Page (Aprimorado)
 * Gerenciamento dinâmico de episódios, atalhos de OST e transições de status
 */

const AssistindoPage = {
    animes: [],

    async init() {
        console.log('📺 [AssistindoPage] Inicializando...');
        await this.loadWatching();
        console.log('✅ [AssistindoPage] Carregado com sucesso!');
    },

    async loadWatching() {
        try {
            const container = document.getElementById('watching-grid');
            if (container) {
                container.innerHTML = '<div class="carousel-loading"><div class="loader"></div></div>';
            }

            const response = await fetch('api/lists/get.php');
            const data = await response.json();

            if (data.success && data.lists && Array.isArray(data.lists.watching)) {
                this.animes = data.lists.watching;
            } else {
                this.animes = [];
            }
            this.render();
        } catch (e) {
            console.error('Erro ao carregar lista de assistindo:', e);
            const container = document.getElementById('watching-grid');
            if (container) {
                container.innerHTML = '<p class="error">Erro de sincronização com o servidor.</p>';
            }
        }
    },

    render() {
        const container = document.getElementById('watching-grid');
        const emptyState = document.getElementById('empty-state');

        if (!this.animes || this.animes.length === 0) {
            this.showEmpty();
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (!container) return;

        container.innerHTML = this.animes.map(anime => {
            const total = anime.episodios_total || anime.total_episodes || 0;
            const current = anime.progresso || anime.progress || 0;
            const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
            const hasScore = anime.nota && anime.nota > 0;

            return `
                <div class="watching-card-v8" id="anime-card-${anime.anime_id}">
                    <div class="watching-cover-wrap" onclick="if(window.Common) Common.navigate('detalhes?id=${anime.anime_id}')">
                        <img src="${anime.imagem || 'https://via.placeholder.com/200x300?text=Anime'}" alt="${anime.titulo}" loading="lazy">
                        <div class="watching-badge-rating ${hasScore ? 'has-score' : ''}">
                            ⭐ ${hasScore ? anime.nota : '-'}
                        </div>
                    </div>

                    <div class="watching-body-wrap">
                        <div class="watching-title-row">
                            <h3 class="watching-card-title" onclick="if(window.Common) Common.navigate('detalhes?id=${anime.anime_id}')" title="${anime.titulo}">
                                ${anime.titulo}
                            </h3>
                        </div>

                        <!-- BARRA DE PROGRESSO COM PERCENTUAL -->
                        <div class="watching-progress-block">
                            <div class="watching-progress-meta">
                                <span id="progress-text-${anime.anime_id}">
                                    Episódio <strong>${current}</strong> ${total ? `/ ${total}` : ''}
                                </span>
                                <span class="progress-percent" id="percent-text-${anime.anime_id}">${percent}%</span>
                            </div>
                            <div class="watching-track-bar">
                                <div class="watching-track-fill" id="progress-fill-${anime.anime_id}" style="width: ${percent}%;"></div>
                            </div>
                        </div>

                        <!-- CONTROLES DE EPISÓDIO (+1 / -1 / NÚMERO) -->
                        <div class="watching-controls-row">
                            <div class="episode-stepper">
                                <button class="btn-step" onclick="event.stopPropagation(); AssistindoPage.updateProgress(${anime.anime_id}, -1, ${total})" title="Diminuir 1 episódio">
                                    <i class="fas fa-minus"></i>
                                </button>
                                
                                <div class="step-display" onclick="event.stopPropagation(); AssistindoPage.openEditModal(${anime.anime_id}, '${anime.titulo.replace(/'/g, "\\'")}', ${current}, ${total})" title="Clique para editar número">
                                    <span id="display-curr-${anime.anime_id}">${current}</span>
                                    <span class="step-total">/${total || '?'}</span>
                                </div>

                                <button class="btn-step btn-step-plus" onclick="event.stopPropagation(); AssistindoPage.updateProgress(${anime.anime_id}, 1, ${total})" title="Avançar 1 episódio">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>

                            <!-- ATALHOS RÁPIDOS (OST / NOTA / CONCLUIR) -->
                            <div class="watching-action-btns">
                                <button class="btn-tool" onclick="event.stopPropagation(); AssistindoPage.playAnimeOST('${anime.titulo.replace(/'/g, "\\'")}')" title="Ouvir abertura na Rádio">
                                    <i class="fas fa-music"></i> OST
                                </button>
                                <button class="btn-tool" onclick="event.stopPropagation(); AssistindoPage.quickScore(${anime.anime_id}, ${anime.nota || 0})" title="Avaliar Nota">
                                    <i class="fas fa-star"></i> Nota
                                </button>
                                <button class="btn-tool finish" onclick="event.stopPropagation(); AssistindoPage.markCompleted(${anime.anime_id}, '${anime.titulo.replace(/'/g, "\\'")}')" title="Marcar como Completo">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    showEmpty() {
        const container = document.getElementById('watching-grid');
        const emptyState = document.getElementById('empty-state');
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
    },

    async updateProgress(animeId, change, total) {
        const anime = this.animes.find(a => a.anime_id == animeId);
        if (!anime) return;

        let newProgress = parseInt(anime.progresso || anime.progress || 0) + change;
        if (newProgress < 0) newProgress = 0;
        if (total > 0 && newProgress > total) newProgress = total;

        if (newProgress === (anime.progresso || 0)) return;

        await this.saveProgress(animeId, newProgress, total, anime);
    },

    openEditModal(animeId, title, current, total) {
        const html = `
            <div class="edit-ep-modal" style="padding: 10px 0;">
                <p style="font-weight: 700; margin-bottom: 12px;">Em qual episódio você está de <strong>${title}</strong>?</p>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="ep-input-edit" value="${current}" min="0" max="${total || 9999}" 
                           style="padding: 8px 12px; font-size: 1.1rem; border: 2px solid var(--border-color); background: var(--color-bg); color: #fff; width: 100px; border-radius: 4px;">
                    <button class="btn btn-primary" onclick="AssistindoPage.confirmEdit(${animeId}, ${total})">
                        <i class="fas fa-check"></i> Salvar
                    </button>
                </div>
            </div>
        `;

        if (window.Common && Common.openModal) {
            Common.openModal(html, { title: `📺 Editar Episódio` });
            setTimeout(() => document.getElementById('ep-input-edit')?.focus(), 100);
        } else {
            const input = prompt(`Em qual episódio você está de ${title}?`, current);
            if (input !== null) {
                const val = parseInt(input, 10);
                if (!isNaN(val) && val >= 0) {
                    const anime = this.animes.find(a => a.anime_id == animeId);
                    if (anime) this.saveProgress(animeId, val, total, anime);
                }
            }
        }
    },

    async confirmEdit(animeId, total) {
        const input = document.getElementById('ep-input-edit');
        if (!input) return;

        const val = parseInt(input.value, 10);
        if (isNaN(val) || val < 0) return;

        const anime = this.animes.find(a => a.anime_id == animeId);
        if (anime) {
            await this.saveProgress(animeId, val, total, anime);
            if (window.Common && Common.closeModal) Common.closeModal();
        }
    },

    async saveProgress(animeId, newProgress, total, animeRef) {
        animeRef.progresso = newProgress;
        const percent = total > 0 ? Math.min(100, Math.round((newProgress / total) * 100)) : 0;

        const pt = document.getElementById(`progress-text-${animeId}`);
        const pp = document.getElementById(`percent-text-${animeId}`);
        const pf = document.getElementById(`progress-fill-${animeId}`);
        const dc = document.getElementById(`display-curr-${animeId}`);

        if (pt) pt.innerHTML = `Episódio <strong>${newProgress}</strong> ${total ? `/ ${total}` : ''}`;
        if (pp) pp.innerText = `${percent}%`;
        if (pf) pf.style.width = `${percent}%`;
        if (dc) dc.innerText = newProgress;

        // Se completou a série inteira
        if (total > 0 && newProgress >= total) {
            document.getElementById(`anime-card-${animeId}`)?.remove();
            this.animes = this.animes.filter(a => a.anime_id != animeId);

            if (window.createParticles) createParticles(25, 'star', ['#ffd700', '#ff3366', '#00ff41']);
            alert(`🎉 Parabéns! Você completou "${animeRef.titulo}"! O anime foi movido para Completados.`);

            if (this.animes.length === 0) {
                this.showEmpty();
            }

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
            try {
                await fetch('api/lists/update.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ anime_id: animeId, progresso: newProgress })
                });
            } catch (e) {
                console.error("Erro ao salvar progresso:", e);
            }
        }
    },

    async markCompleted(animeId, title) {
        if (!confirm(`Marcar "${title}" como completado?`)) return;

        document.getElementById(`anime-card-${animeId}`)?.remove();
        this.animes = this.animes.filter(a => a.anime_id != animeId);

        if (this.animes.length === 0) {
            this.showEmpty();
        }

        try {
            await fetch('api/lists/move.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anime_id: animeId, tipo_lista: 'completed' })
            });
        } catch (e) {
            console.error("Erro ao mover:", e);
        }
    },

    async quickScore(animeId, currentScore) {
        const input = prompt('Digite sua nota de 1 a 10 (ou 0 para remover):', currentScore || '');
        if (input === null) return;

        const nota = parseInt(input, 10);
        if (isNaN(nota) || nota < 0 || nota > 10) return;

        try {
            const res = await fetch('api/lists/update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anime_id: animeId, nota: nota })
            });
            const data = await res.json();
            if (data.success) {
                const anime = this.animes.find(a => a.anime_id == animeId);
                if (anime) anime.nota = nota;
                this.render();
            }
        } catch (e) {
            console.error('Erro ao avaliar:', e);
        }
    },

    playAnimeOST(animeTitle) {
        // Redireciona para a Rádio pesquisando as músicas desse anime
        if (window.Common && Common.navigate) {
            Common.navigate('radio');
        } else {
            window.location.href = 'radio';
        }
    }
};

window.AssistindoPage = AssistindoPage;
document.addEventListener('DOMContentLoaded', () => {
    AssistindoPage.init();
});
