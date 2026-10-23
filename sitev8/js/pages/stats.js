/**
 * AnimeEngine v8 - Statistics & Analytics Page
 * Renderiza métricas analíticas e gráficos via Chart.js
 */

const StatsPage = {
    charts: {},

    async init() {
        console.log('📊 [StatsPage] Inicializando painel analítico...');
        await this.loadStats();
    },

    async loadStats() {
        try {
            const res = await fetch('api/users/stats.php');
            const stats = await res.json();

            this.renderKPIs(stats);
            this.renderStatusBar(stats);
            this.renderGenresChart(stats);
            this.renderScoresChart(stats);
            this.renderFormatsChart(stats);
            this.renderTopRated(stats.topRated || []);

            console.log('✅ [StatsPage] Métricas renderizadas com sucesso!');
        } catch (e) {
            console.error('Erro ao carregar estatísticas:', e);
        }
    },

    renderKPIs(stats) {
        const valTime = document.getElementById('val-time');
        const valDays = document.getElementById('val-days');
        const valAnimes = document.getElementById('val-total-animes');
        const valCompleted = document.getElementById('val-completed-animes');
        const valEps = document.getElementById('val-episodes');
        const valMean = document.getElementById('val-mean-score');
        const valRated = document.getElementById('val-rated-count');
        const valLevel = document.getElementById('val-level');
        const valXp = document.getElementById('val-xp');
        const valAch = document.getElementById('val-achievements');

        if (valTime) valTime.textContent = (stats.totalHours || 0) + 'h';
        if (valDays) valDays.textContent = `${stats.daysWatched || 0} dias de vídeo`;
        if (valAnimes) valAnimes.textContent = stats.totalAnimes || 0;
        if (valCompleted) valCompleted.textContent = `${stats.completed || 0} completados`;
        if (valEps) valEps.textContent = stats.totalEpisodes || 0;
        if (valMean) valMean.textContent = (stats.meanScore ? stats.meanScore.toFixed(1) : '0.0');
        if (valRated) valRated.textContent = `${stats.totalRated || 0} avaliados`;
        if (valLevel) valLevel.textContent = `Lv.${stats.level || 1}`;
        if (valXp) valXp.textContent = `${stats.xp || 0} XP acumulado`;
        if (valAch) valAch.textContent = stats.achievements || 0;
    },

    renderStatusBar(stats) {
        const total = stats.totalAnimes || 0;
        const totalLabel = document.getElementById('status-total-label');
        if (totalLabel) totalLabel.textContent = `Total: ${total} animes`;

        const watching = stats.watching || 0;
        const completed = stats.completed || 0;
        const plan = stats.planToWatch || 0;
        const paused = stats.paused || 0;
        const dropped = stats.dropped || 0;

        const legW = document.getElementById('leg-watching');
        const legC = document.getElementById('leg-completed');
        const legP = document.getElementById('leg-plan');
        const legPa = document.getElementById('leg-paused');
        const legD = document.getElementById('leg-dropped');

        if (legW) legW.textContent = watching;
        if (legC) legC.textContent = completed;
        if (legP) legP.textContent = plan;
        if (legPa) legPa.textContent = paused;
        if (legD) legD.textContent = dropped;

        if (total > 0) {
            const pctW = ((watching / total) * 100).toFixed(1);
            const pctC = ((completed / total) * 100).toFixed(1);
            const pctP = ((plan / total) * 100).toFixed(1);
            const pctPa = ((paused / total) * 100).toFixed(1);
            const pctD = ((dropped / total) * 100).toFixed(1);

            const segW = document.getElementById('seg-watching');
            const segC = document.getElementById('seg-completed');
            const segP = document.getElementById('seg-plan');
            const segPa = document.getElementById('seg-paused');
            const segD = document.getElementById('seg-dropped');

            if (segW) segW.style.width = pctW + '%';
            if (segC) segC.style.width = pctC + '%';
            if (segP) segP.style.width = pctP + '%';
            if (segPa) segPa.style.width = pctPa + '%';
            if (segD) segD.style.width = pctD + '%';
        }
    },

    renderGenresChart(stats) {
        const canvas = document.getElementById('chart-genres');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const genres = stats.genres || {};
        const labels = Object.keys(genres);
        const values = Object.values(genres);

        const listContainer = document.getElementById('top-genres-list');
        if (listContainer) {
            if (labels.length === 0) {
                listContainer.innerHTML = '<span class="empty-badge">Sem gêneros registrados</span>';
            } else {
                listContainer.innerHTML = labels.slice(0, 6).map((g, idx) => `
                    <span class="genre-pill">
                        <strong class="genre-rank">#${idx + 1}</strong> ${g} (${genres[g]})
                    </span>
                `).join('');
            }
        }

        if (labels.length === 0) {
            canvas.parentElement.innerHTML = '<div class="chart-empty-state"><i class="fas fa-tags"></i><p>Adicione animes para mapear seus gêneros favoritos</p></div>';
            return;
        }

        if (this.charts.genres) this.charts.genres.destroy();

        this.charts.genres = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Animes',
                    data: values,
                    backgroundColor: 'rgba(255, 51, 102, 0.25)',
                    borderColor: '#ff3366',
                    pointBackgroundColor: '#ff3366',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#ff3366',
                    pointRadius: 4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: {
                            color: '#e2e8f0',
                            font: { family: 'Space Grotesk', size: 11, weight: 'bold' }
                        },
                        ticks: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    renderScoresChart(stats) {
        const canvas = document.getElementById('chart-scores');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const dist = stats.scoreDistribution || {};
        const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const data = labels.map(n => dist[n] || 0);

        const hasAnyScore = data.some(v => v > 0);
        if (!hasAnyScore) {
            canvas.parentElement.innerHTML = '<div class="chart-empty-state"><i class="fas fa-star-half-alt"></i><p>Avalie animes com notas de 1 a 10 para ver sua distribuição</p></div>';
            return;
        }

        if (this.charts.scores) this.charts.scores.destroy();

        this.charts.scores = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(l => `⭐ ${l}`),
                datasets: [{
                    label: 'Quantidade',
                    data: data,
                    backgroundColor: [
                        '#ef4444', '#ef4444', '#f97316', '#f97316', '#eab308',
                        '#eab308', '#84cc16', '#10b981', '#06b6d4', '#ff3366'
                    ],
                    borderWidth: 2,
                    borderColor: '#000000'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#e2e8f0', font: { family: 'Space Grotesk', weight: 'bold' } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },
                        ticks: { color: '#9ca3af', stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    renderFormatsChart(stats) {
        const canvas = document.getElementById('chart-formats');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const formats = stats.formats || {};
        const labels = Object.keys(formats);
        const values = Object.values(formats);

        if (labels.length === 0) {
            canvas.parentElement.innerHTML = '<div class="chart-empty-state"><i class="fas fa-film"></i><p>Formatos serão mapeados conforme você adiciona animes</p></div>';
            return;
        }

        if (this.charts.formats) this.charts.formats.destroy();

        this.charts.formats = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#ff3366', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderWidth: 3,
                    borderColor: '#000000'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#ffffff',
                            font: { family: 'Space Grotesk', weight: 'bold' },
                            boxWidth: 14
                        }
                    }
                }
            }
        });
    },

    renderTopRated(topRated) {
        const grid = document.getElementById('top-rated-grid');
        if (!grid) return;

        if (!Array.isArray(topRated) || topRated.length === 0) {
            grid.innerHTML = '<p class="empty-column-message">Nenhum anime avaliado ainda. Dê estrelas aos seus animes favoritos!</p>';
            return;
        }

        grid.innerHTML = topRated.map(anime => `
            <div class="top-rated-item" onclick="if(window.Common) Common.navigate('detalhes?id=${anime.anime_id}')">
                <div class="top-rated-cover-wrap">
                    <img src="${anime.imagem}" alt="${anime.titulo}" loading="lazy">
                    <span class="top-rated-score">⭐ ${anime.nota}</span>
                </div>
                <div class="top-rated-info">
                    <span class="top-rated-title">${anime.titulo}</span>
                    <span class="top-rated-format">${anime.formato || 'TV'}</span>
                </div>
            </div>
        `).join('');
    }
};

// Auto-inicializar quando a página for montada
document.addEventListener('DOMContentLoaded', () => {
    StatsPage.init();
});
