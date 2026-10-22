/**
 * AnimeEngine v8 - Airing Countdown Module
 * Mostra os próximos episódios dos animes que o usuário está assistindo (ou lançamentos em alta)
 */

const Airing = {
    timerInterval: null,

    async init() {
        console.log('⏰ Initializing Airing Countdown...');
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        const container = document.getElementById('section-airing');
        if (!container) return;

        const watching = Storage.getLists().watching || [];
        if (watching.length === 0) {
            this.loadTrendingAiring();
            return;
        }

        this.loadWatchingAiring(watching);
    },

    async loadWatchingAiring(watching) {
        try {
            const limitedWatching = watching.slice(0, 5);
            const results = await Promise.all(limitedWatching.map(async (anime) => {
                try {
                    return await API.getAnimeById(anime.id);
                } catch (e) {
                    return null;
                }
            }));

            const airingAnimes = results.filter(a => a && a.nextAiringEpisode && a.nextAiringEpisode.airingAt);

            if (airingAnimes.length === 0) {
                this.loadTrendingAiring();
                return;
            }

            airingAnimes.sort((a, b) => a.nextAiringEpisode.airingAt - b.nextAiringEpisode.airingAt);
            this.renderAiringSection(airingAnimes, 'BASEADO NO QUE VOCÊ ASSISTE');
        } catch (error) {
            console.error('Erro ao carregar airing assistindo:', error);
            this.loadTrendingAiring();
        }
    },

    async loadTrendingAiring() {
        try {
            const trending = await API.getTrending(1, 15);
            const airing = (trending || []).filter(a => a.nextAiringEpisode && a.nextAiringEpisode.airingAt);

            if (airing.length > 0) {
                airing.sort((a, b) => a.nextAiringEpisode.airingAt - b.nextAiringEpisode.airingAt);
                this.renderAiringSection(airing.slice(0, 5), 'LANÇAMENTOS EM ALTA');
            }
        } catch (error) {
            console.error('Erro ao carregar trending airing:', error);
        }
    },

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

    createAiringCard(anime) {
        const next = anime.nextAiringEpisode;
        return `
            <div class="airing-card" onclick="Common.navigate('?page=detalhes&id=${anime.id}')">
                <div class="airing-card-image">
                    <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                    <div class="airing-badge">EP ${next.episode || '?'}</div>
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

    startTimers() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        const update = () => {
            const timers = document.querySelectorAll('.airing-timer');
            if (timers.length === 0) {
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
                return;
            }

            const now = Math.floor(Date.now() / 1000);
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
        this.timerInterval = setInterval(update, 1000);
    }
};

window.Airing = Airing;
if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (document.getElementById('section-airing')) Airing.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('section-airing')) Airing.init();
        });
    }
}
