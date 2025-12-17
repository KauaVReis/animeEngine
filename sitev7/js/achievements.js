/**
 * AnimeEngine v6 - Achievements Module
 * Sistema de gamificação com XP, níveis e medalhas
 */

const Achievements = {
    // Configuração de níveis
    levels: [
        { level: 1, name: "Novato", xpRequired: 0, icon: "🌱" },
        { level: 2, name: "Iniciante", xpRequired: 50, icon: "🌿" },
        { level: 3, name: "Casual", xpRequired: 150, icon: "🍃" },
        { level: 4, name: "Entusiasta", xpRequired: 300, icon: "🔥" },
        { level: 5, name: "Dedicado", xpRequired: 500, icon: "⚡" },
        { level: 6, name: "Hardcore", xpRequired: 800, icon: "💎" },
        { level: 7, name: "Veterano", xpRequired: 1200, icon: "🏆" },
        { level: 8, name: "Mestre", xpRequired: 1800, icon: "👑" },
        { level: 9, name: "Lenda", xpRequired: 2500, icon: "🌟" },
        { level: 10, name: "Otaku Supremo", xpRequired: 3500, icon: "🐉" }
    ],

    // Lista de achievements (expandida)
    badges: [
        // === PRIMEIROS PASSOS ===
        { id: "first_step", name: "Primeiro Passo", description: "Adicione seu primeiro anime", icon: "🚀", xp: 10, condition: (stats) => stats.totalAnimes >= 1 },
        { id: "explorer", name: "Explorador", description: "Adicione 3 animes", icon: "🧭", xp: 15, condition: (stats) => stats.totalAnimes >= 3 },
        { id: "collector", name: "Colecionador", description: "Tenha 5 animes na lista", icon: "📚", xp: 25, condition: (stats) => stats.totalAnimes >= 5 },
        { id: "hoarder", name: "Acumulador", description: "Tenha 15 animes", icon: "🗄️", xp: 50, condition: (stats) => stats.totalAnimes >= 15 },
        { id: "library", name: "Biblioteca Viva", description: "Tenha 30 animes", icon: "🏛️", xp: 100, condition: (stats) => stats.totalAnimes >= 30 },
        
        // === EPISÓDIOS ===
        { id: "started", name: "Começando", description: "Assista 10 episódios", icon: "▶️", xp: 15, condition: (stats) => stats.totalEpisodes >= 10 },
        { id: "dedicated_viewer", name: "Espectador Dedicado", description: "Assista 50 episódios", icon: "🎬", xp: 50, condition: (stats) => stats.totalEpisodes >= 50 },
        { id: "centurion", name: "Centurião", description: "Assista 100 episódios", icon: "💯", xp: 100, condition: (stats) => stats.totalEpisodes >= 100 },
        { id: "marathon", name: "Maratonista", description: "Assista 200 episódios", icon: "🏃", xp: 150, condition: (stats) => stats.totalEpisodes >= 200 },
        { id: "binge_master", name: "Mestre da Maratona", description: "Assista 500 episódios", icon: "🏆", xp: 300, condition: (stats) => stats.totalEpisodes >= 500 },
        { id: "legend", name: "Lenda", description: "Assista 1000 episódios", icon: "👑", xp: 500, condition: (stats) => stats.totalEpisodes >= 1000 },
        
        // === TEMPO ===
        { id: "time_5h", name: "5 Horas", description: "Acumule 5 horas de anime", icon: "🕐", xp: 15, condition: (stats) => stats.totalHours >= 5 },
        { id: "time_10h", name: "10 Horas", description: "Acumule 10 horas", icon: "⏰", xp: 30, condition: (stats) => stats.totalHours >= 10 },
        { id: "time_24h", name: "Um Dia Inteiro", description: "24 horas de anime!", icon: "🌍", xp: 50, condition: (stats) => stats.totalHours >= 24 },
        { id: "time_50h", name: "50 Horas", description: "Meio centenário", icon: "⏳", xp: 75, condition: (stats) => stats.totalHours >= 50 },
        { id: "time_100h", name: "Centenário", description: "100 horas de anime", icon: "💎", xp: 150, condition: (stats) => stats.totalHours >= 100 },
        
        // === COMPLETOS ===
        { id: "finisher", name: "Finalizador", description: "Complete 1 anime", icon: "🎯", xp: 20, condition: (stats) => stats.completedCount >= 1 },
        { id: "dedicated", name: "Dedicado", description: "Complete 5 animes", icon: "🏅", xp: 75, condition: (stats) => stats.completedCount >= 5 },
        { id: "completionist", name: "Complecionista", description: "Complete 10 animes", icon: "🏁", xp: 150, condition: (stats) => stats.completedCount >= 10 },
        { id: "master", name: "Mestre", description: "Complete 25 animes", icon: "🎖️", xp: 300, condition: (stats) => stats.completedCount >= 25 },
        
        // === FAVORITOS ===
        { id: "first_love", name: "Primeiro Amor", description: "Adicione 1 favorito", icon: "💕", xp: 10, condition: (stats) => stats.favoritesCount >= 1 },
        { id: "curator", name: "Curador", description: "5 animes favoritos", icon: "⭐", xp: 75, condition: (stats) => stats.favoritesCount >= 5 },
        { id: "top_fan", name: "Super Fã", description: "10 animes favoritos", icon: "💖", xp: 100, condition: (stats) => stats.favoritesCount >= 10 },
        
        // === AVALIAÇÕES ===
        { id: "first_review", name: "Primeira Opinião", description: "Avalie 1 anime", icon: "✍️", xp: 10, condition: (stats) => stats.ratedCount >= 1 },
        { id: "critic", name: "Crítico", description: "Avalie 5 animes", icon: "📝", xp: 50, condition: (stats) => stats.ratedCount >= 5 },
        { id: "expert", name: "Especialista", description: "Avalie 15 animes", icon: "🎓", xp: 100, condition: (stats) => stats.ratedCount >= 15 },
        
        // === GÊNEROS ===
        { id: "shounen_hero", name: "Shounen Hero", description: "Naruto, One Piece ou Bleach", icon: "⚔️", xp: 50, condition: (stats) => stats.hasShounen },
        
        // === ESPECIAIS ===
        { id: "night_owl", name: "Coruja Noturna", description: "Use entre 00h e 5h", icon: "🦉", xp: 15, condition: (stats) => stats.isNightTime },
        { id: "theme_changer", name: "Estilista", description: "Mude o tema do app", icon: "🎨", xp: 10, condition: (stats) => stats.changedTheme },
        { id: "calculator", name: "Calculista", description: "Use a calculadora", icon: "🧮", xp: 15, condition: (stats) => stats.usedCalculator },
        { id: "weekender", name: "Fim de Semana", description: "Use no sábado ou domingo", icon: "🎉", xp: 10, condition: (stats) => stats.isWeekend },
        { id: "safado", name: "Safado", description: "Desativou o filtro de conteúdo adulto", icon: "🔞", xp: 69, condition: (stats) => false } // Desbloqueio manual
    ],

    /**
     * Calcula o nível atual baseado no XP
     */
    getLevel(xp) {
        let currentLevel = this.levels[0];
        for (const level of this.levels) {
            if (xp >= level.xpRequired) {
                currentLevel = level;
            } else {
                break;
            }
        }
        return currentLevel;
    },

    /**
     * Calcula o próximo nível
     */
    getNextLevel(xp) {
        const currentLevel = this.getLevel(xp);
        const nextIndex = this.levels.findIndex(l => l.level === currentLevel.level) + 1;
        return nextIndex < this.levels.length ? this.levels[nextIndex] : null;
    },

    /**
     * Calcula progresso para o próximo nível (0-100%)
     */
    getLevelProgress(xp) {
        const current = this.getLevel(xp);
        const next = this.getNextLevel(xp);
        
        if (!next) return 100;
        
        const xpInCurrentLevel = xp - current.xpRequired;
        const xpNeededForNext = next.xpRequired - current.xpRequired;
        
        return Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
    },

    /**
     * Gera stats para checagem de achievements
     */
    generateStats() {
        const user = Storage.getUser();
        const lists = Storage.getLists();
        const hour = new Date().getHours();
        
        // Contagem total de animes
        const allAnimes = [...lists.watching, ...lists.planToWatch, ...lists.completed, ...lists.paused, ...lists.dropped];
        const uniqueAnimes = [...new Map(allAnimes.map(a => [a.id, a])).values()];
        
        // Episódios assistidos
        let totalEpisodes = 0;
        lists.watching.forEach(a => totalEpisodes += (a.currentEp || 0));
        lists.completed.forEach(a => totalEpisodes += (a.episodes || 0));
        
        // Shounen check
        const shounenTitles = ['naruto', 'one piece', 'bleach', 'dragon ball', 'my hero'];
        const hasShounen = uniqueAnimes.some(a => 
            shounenTitles.some(t => a.title.toLowerCase().includes(t))
        );

        return {
            totalAnimes: uniqueAnimes.length,
            totalEpisodes,
            totalHours: Math.round(totalEpisodes * 24 / 60),
            completedCount: lists.completed.length,
            favoritesCount: lists.favorites.length,
            ratedCount: uniqueAnimes.filter(a => a.rating > 0).length,
            hasShounen,
            isNightTime: hour >= 0 && hour < 5,
            changedTheme: localStorage.getItem('animeengine_theme') !== null,
            usedCalculator: localStorage.getItem('animeengine_calcStack') !== null,
            isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6
        };
    },

    /**
     * Verifica e desbloqueia achievements
     */
    checkAchievements() {
        const user = Storage.getUser();
        const stats = this.generateStats();
        const newUnlocks = [];
        
        for (const badge of this.badges) {
            if (!user.achievements.includes(badge.id) && badge.condition(stats)) {
                newUnlocks.push(badge);
                user.achievements.push(badge.id);
                user.xp += badge.xp;
            }
        }
        
        // Atualizar nível
        user.level = this.getLevel(user.xp).level;
        
        // Salvar
        Storage.updateUser(user);
        
        // Mostrar notificações
        newUnlocks.forEach((badge, i) => {
            setTimeout(() => this.showUnlockNotification(badge), i * 1500);
        });
        
        return newUnlocks;
    },

    /**
     * Mostra notificação de achievement desbloqueado
     */
    showUnlockNotification(badge) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${badge.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">🏆 Achievement!</div>
                <div class="achievement-name">${badge.name}</div>
                <div class="achievement-xp">+${badge.xp} XP</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    },

    /**
     * Obter todos os badges com status
     */
    getAllBadges() {
        const user = Storage.getUser();
        return this.badges.map(badge => ({
            ...badge,
            unlocked: user.achievements.includes(badge.id)
        }));
    }
};

// Expor globalmente
window.Achievements = Achievements;

