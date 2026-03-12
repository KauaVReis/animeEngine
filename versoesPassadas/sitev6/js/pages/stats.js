/**
 * AnimeEngine v6 - Statistics Page
 * Personal anime statistics with charts
 */

const StatsPage = {
    async init() {
        console.log('📊 Loading Stats Page...');
        this.renderStats();
    },

    renderStats() {
        const container = document.getElementById('stats-container');
        if (!container) return;
        
        const lists = Storage.getLists();
        const favorites = Storage.getFavorites();
        
        // Calculate stats
        const stats = this.calculateStats(lists, favorites);
        
        container.innerHTML = `
            <!-- Overview Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📺</div>
                    <div class="stat-value">${stats.totalAnimes}</div>
                    <div class="stat-label">Animes na Lista</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-value">${stats.completed}</div>
                    <div class="stat-label">Completos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-value">${stats.totalHours}h</div>
                    <div class="stat-label">Tempo Total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📼</div>
                    <div class="stat-value">${stats.totalEpisodes}</div>
                    <div class="stat-label">Episódios</div>
                </div>
            </div>
            
            <!-- Distribution -->
            <div class="stats-section">
                <h2 class="section-title"><i class="fas fa-chart-pie"></i> Distribuição por Status</h2>
                <div class="stats-chart-bar">
                    ${this.renderStatusBars(stats)}
                </div>
            </div>
            
            <!-- Genres -->
            <div class="stats-section">
                <h2 class="section-title"><i class="fas fa-tags"></i> Gêneros Favoritos</h2>
                <div class="genre-chart">
                    ${this.renderGenreChart(stats.genres)}
                </div>
            </div>
            
            <!-- Top Rated -->
            <div class="stats-section">
                <h2 class="section-title"><i class="fas fa-star"></i> Seus Melhores Avaliados</h2>
                <div class="top-rated-list">
                    ${this.renderTopRated(stats.topRated)}
                </div>
            </div>
        `;
    },
    
    calculateStats(lists, favorites) {
        const allAnimes = [
            ...lists.watching,
            ...lists.completed,
            ...lists.planToWatch,
            ...lists.paused,
            ...lists.dropped
        ];
        
        // Unique animes
        const uniqueMap = new Map();
        allAnimes.forEach(a => uniqueMap.set(a.id, a));
        const uniqueAnimes = [...uniqueMap.values()];
        
        // Episodes
        let totalEpisodes = 0;
        lists.watching.forEach(a => totalEpisodes += (a.progress || 0));
        lists.completed.forEach(a => totalEpisodes += (a.episodes || 12));
        
        // Genres count
        const genreCount = {};
        uniqueAnimes.forEach(anime => {
            (anime.genres || []).forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        });
        
        // Sort genres
        const sortedGenres = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        // Top rated by user
        const rated = uniqueAnimes.filter(a => a.rating > 0)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5);
        
        return {
            totalAnimes: uniqueAnimes.length,
            watching: lists.watching.length,
            completed: lists.completed.length,
            planToWatch: lists.planToWatch.length,
            paused: lists.paused.length,
            dropped: lists.dropped.length,
            favorites: favorites.length,
            totalEpisodes,
            totalHours: Math.round(totalEpisodes * 24 / 60),
            genres: sortedGenres,
            topRated: rated
        };
    },
    
    renderStatusBars(stats) {
        const total = Math.max(1, stats.totalAnimes);
        const items = [
            { name: 'Assistindo', count: stats.watching, color: '#3b82f6' },
            { name: 'Completos', count: stats.completed, color: '#22c55e' },
            { name: 'Quero Ver', count: stats.planToWatch, color: '#f59e0b' },
            { name: 'Pausados', count: stats.paused, color: '#6b7280' },
            { name: 'Abandonados', count: stats.dropped, color: '#ef4444' }
        ];
        
        return items.map(item => {
            const percent = Math.round((item.count / total) * 100);
            return `
                <div class="status-bar-item">
                    <div class="status-bar-label">
                        <span>${item.name}</span>
                        <span>${item.count} (${percent}%)</span>
                    </div>
                    <div class="status-bar-track">
                        <div class="status-bar-fill" style="width: ${percent}%; background: ${item.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    renderGenreChart(genres) {
        if (genres.length === 0) {
            return '<p class="empty-message">Nenhum gênero ainda</p>';
        }
        
        const maxCount = genres[0][1];
        const colors = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#6366f1', '#14b8a6', '#f43f5e', '#8b5cf6', '#06b6d4'];
        
        return genres.map(([genre, count], i) => {
            const percent = Math.round((count / maxCount) * 100);
            return `
                <div class="genre-bar-item">
                    <div class="genre-bar-label">${genre}</div>
                    <div class="genre-bar-track">
                        <div class="genre-bar-fill" style="width: ${percent}%; background: ${colors[i % colors.length]};"></div>
                    </div>
                    <div class="genre-bar-count">${count}</div>
                </div>
            `;
        }).join('');
    },
    
    renderTopRated(animes) {
        if (animes.length === 0) {
            return '<p class="empty-message">Você ainda não avaliou nenhum anime</p>';
        }
        
        return animes.map((anime, i) => `
            <div class="top-rated-item" onclick="window.location='detalhes.html?id=${anime.id}'">
                <span class="top-rated-rank">#${i + 1}</span>
                <img src="${anime.image}" alt="${anime.title}">
                <div class="top-rated-info">
                    <div class="top-rated-title">${anime.title}</div>
                    <div class="top-rated-rating">
                        ${'⭐'.repeat(anime.rating)}
                    </div>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => StatsPage.init());
