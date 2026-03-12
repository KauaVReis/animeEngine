/**
 * AnimeEngine v7 - Airing Countdown Module
 * Mostra os próximos episódios dos animes que o usuário está assistindo
 */

const Airing = {
    async init() {
        console.log('⏰ Initializing Airing Countdown...');
        const container = document.getElementById('section-airing');
        if (!container) return;

        const watching = Storage.getLists().watching || [];
        if (watching.length === 0) {
            // Se não estiver assistindo nada, mostrar animes em alta que estão lançando
            this.loadTrendingAiring();
            return;
        }

        this.loadWatchingAiring(watching);
    },

    /**
     * Carregar animes que o usuário está assistindo e que estão em lançamento
     */
    async loadWatchingAiring(watching) {
        const container = document.getElementById('section-airing');
        
        try {
            // Filtrar apenas animes que podem ter novos episódios (RELEASING)
            // Nota: No Storage, guardamos o status simplificado, mas o API.formatAnime traz o status original
            // Vamos buscar detalhes atualizados para os 5 primeiros da lista "Watching"
            const limitedWatching = watching.slice(0, 5);
            
            const results = await Promise.all(limitedWatching.map(async (anime) => {
                try {
                    // Buscar dados frescos da API para ter o nextAiringEpisode atualizado
                    return await API.getAnimeById(anime.id);
                } catch (e) {
                    return null;
                }
            }));

            const airingAnimes = results.filter(a => a && a.nextAiringEpisode);

            if (airingAnimes.length === 0) {
                this.loadTrendingAiring(); // Fallback se nenhum do "Watching" tiver data de lançamento
                return;
            }

            // Ordenar por tempo mais próximo
            airingAnimes.sort((a, b) => a.nextAiringEpisode.airingAt - b.nextAiringEpisode.airingAt);

            this.renderAiringSection(airingAnimes, 'BASEADO NO QUE VOCÊ ASSISTE');
        } catch (error) {
            console.error('Erro ao carregar airing assistindo:', error);
            this.loadTrendingAiring();
        }
    },

    /**
     * Fallback: Carregar animes em alta que estão em lançamento
     */
    async loadTrendingAiring() {
        try {
            const trending = await API.getTrending(1, 15);
            const airing = trending.filter(a => a.nextAiringEpisode);
            
            if (airing.length > 0) {
                this.renderAiringSection(airing.slice(0, 5), 'LANÇAMENTOS EM ALTA');
            }
        } catch (error) {
            console.error('Erro ao carregar trending airing:', error);
        }
    },

    /**
     * Renderizar a seção de Airing
     */
    renderAiringSection(animes, subtitle) {
        const container = document.getElementById('section-airing');
        if (!container) return;

        container.style.display = 'block';
        container.innerHTML = `
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-clock"></i> Próximos Episódios</h2>
                <span class="section-subtitle">${subtitle}</span>
            </div>
            <div class="airing-grid">
                ${animes.map(anime => this.createAiringCard(anime)).join('')}
            </div>
        `;

        this.startTimers();
    },

    /**
     * Criar HTML do card de airing
     */
    createAiringCard(anime) {
        const next = anime.nextAiringEpisode;
        return `
            <div class="airing-card" onclick="window.location='detalhes.php?id=${anime.id}'">
                <div class="airing-card-image">
                    <img src="${anime.image}" alt="${anime.title}">
                    <div class="airing-badge">EP ${next.episode}</div>
                </div>
                <div class="airing-card-info">
                    <h3 class="airing-title">${anime.title}</h3>
                    <div class="airing-timer" data-timestamp="${next?.airingAt || 0}">
                        <span class="timer-unit">--d</span>
                        <span class="timer-unit">--h</span>
                        <span class="timer-unit">--m</span>
                        <span class="timer-unit">--s</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Iniciar os cronômetros
     */
    startTimers() {
        const update = () => {
            const now = Math.floor(Date.now() / 1000);
            const timers = document.querySelectorAll('.airing-timer');
            
            timers.forEach(timer => {
                const targetAttr = timer.dataset.timestamp;
                const target = parseInt(targetAttr, 10);
                
                if (isNaN(target) || target === 0) {
                    timer.innerHTML = '<span class="timer-tba">TBA 📡</span>';
                    return;
                }

                const diff = target - now;

                if (diff <= 0) {
                    timer.innerHTML = '<span class="timer-now">LANÇADO! 📺</span>';
                    return;
                }

                const d = Math.floor(diff / (24 * 3600));
                const h = Math.floor((diff % (24 * 3600)) / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = Math.floor(diff % 60);

                timer.innerHTML = `
                    <span class="timer-unit">${d}d</span>
                    <span class="timer-unit">${h.toString().padStart(2, '0')}h</span>
                    <span class="timer-unit">${m.toString().padStart(2, '0')}m</span>
                    <span class="timer-unit">${s.toString().padStart(2, '0')}s</span>
                `;
            });
        };

        update();
        setInterval(update, 1000); // Atualizar a cada segundo para precisão
    }
};

// Inicializar quando o DOM estiver pronto (se estivermos na home)
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('section-airing')) {
        Airing.init();
    }
});
