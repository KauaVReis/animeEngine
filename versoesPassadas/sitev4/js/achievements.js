/**
 * AnimeEngine v4 - Achievements Module
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

    // Lista de achievements
    badges: [
        {
            id: "first_step",
            name: "Primeiro Passo",
            description: "Assista seu primeiro episódio",
            icon: "🚀",
            xp: 10,
            condition: (stats) => stats.totalEpisodes >= 1
        },
        {
            id: "getting_started",
            name: "Começando a Jornada",
            description: "Assista 10 episódios",
            icon: "📺",
            xp: 25,
            condition: (stats) => stats.totalEpisodes >= 10
        },
        {
            id: "dedicated_viewer",
            name: "Espectador Dedicado",
            description: "Assista 50 episódios",
            icon: "🎬",
            xp: 50,
            condition: (stats) => stats.totalEpisodes >= 50
        },
        {
            id: "centurion",
            name: "Centurião",
            description: "Assista 100 episódios",
            icon: "💯",
            xp: 100,
            condition: (stats) => stats.totalEpisodes >= 100
        },
        {
            id: "marathon_runner",
            name: "Maratonista",
            description: "Assista 10 episódios em um dia",
            icon: "🏃",
            xp: 50,
            condition: (stats) => stats.episodesToday >= 10
        },
        {
            id: "collector",
            name: "Colecionador",
            description: "Tenha 5 animes na Stack",
            icon: "📚",
            xp: 25,
            condition: (stats) => stats.stackSize >= 5
        },
        {
            id: "big_stack",
            name: "Stack Master",
            description: "Tenha 10 animes na Stack",
            icon: "🗄️",
            xp: 50,
            condition: (stats) => stats.stackSize >= 10
        },
        {
            id: "time_10h",
            name: "10 Horas",
            description: "Acumule 10 horas de anime",
            icon: "⏰",
            xp: 30,
            condition: (stats) => stats.totalMinutes >= 600
        },
        {
            id: "time_50h",
            name: "50 Horas",
            description: "Acumule 50 horas de anime",
            icon: "⏳",
            xp: 75,
            condition: (stats) => stats.totalMinutes >= 3000
        },
        {
            id: "time_100h",
            name: "100 Horas",
            description: "Acumule 100 horas de anime",
            icon: "🕐",
            xp: 150,
            condition: (stats) => stats.totalMinutes >= 6000
        },
        {
            id: "shounen_hero",
            name: "Shounen Hero",
            description: "Tenha Naruto, One Piece ou Bleach na Stack",
            icon: "⚔️",
            xp: 50,
            condition: (stats) => stats.hasShounen
        },
        {
            id: "night_owl",
            name: "Coruja Noturna",
            description: "Assista entre 00h e 5h da manhã",
            icon: "🦉",
            xp: 15,
            condition: (stats) => stats.isNightTime
        },
        {
            id: "speed_demon",
            name: "Speed Demon",
            description: "Use o modo Speedrun (Skip OP/ED)",
            icon: "⚡",
            xp: 10,
            condition: (stats) => stats.usedSpeedrun
        },
        {
            id: "filler_skipper",
            name: "Filler Skipper",
            description: "Pule fillers de um anime",
            icon: "🚫",
            xp: 15,
            condition: (stats) => stats.usedFillerSkip
        },
        {
            id: "critic",
            name: "Crítico",
            description: "Avalie 5 animes",
            icon: "📝",
            xp: 50,
            condition: (stats) => stats.ratedCount >= 5
        },
        {
            id: "masterpiece_hunter",
            name: "Caçador de Obras-Primas",
            description: "Dê 5 estrelas para 3 animes",
            icon: "💎",
            xp: 100,
            condition: (stats) => stats.fiveStarCount >= 3
        },
        {
            id: "curator",
            name: "Curador",
            description: "Adicione 5 animes aos favoritos",
            icon: "⭐",
            xp: 75,
            condition: (stats) => stats.favoritesCount >= 5
        },
        {
            id: "completionist",
            name: "Complecionista",
            description: "Complete 10 animes",
            icon: "🏁",
            xp: 150,
            condition: (stats) => stats.completedCount >= 10
        }
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
        
        if (!next) return 100; // Max level
        
        const xpInCurrentLevel = xp - current.xpRequired;
        const xpNeededForNext = next.xpRequired - current.xpRequired;
        
        return Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
    },

    /**
     * Verifica e desbloqueia achievements
     * @returns {Array} Novos achievements desbloqueados
     */
    checkAchievements(stats, unlockedIds = []) {
        const newUnlocks = [];
        
        for (const badge of this.badges) {
            if (!unlockedIds.includes(badge.id) && badge.condition(stats)) {
                newUnlocks.push(badge);
            }
        }
        
        return newUnlocks;
    },

    /**
     * Gera stats para checagem de achievements
     */
    generateStats(appState) {
        const hour = new Date().getHours();
        const isNightTime = hour >= 0 && hour < 5;
        
        // Verificar se tem shounen na stack
        const shounenTitles = ['Naruto', 'One Piece', 'Bleach', 'Dragon Ball', 'My Hero Academia'];
        const hasShounen = appState.playlist.some(anime => 
            shounenTitles.some(title => anime.title.toLowerCase().includes(title.toLowerCase()))
        );

        // Stats de listas
        const completedCount = appState.history ? appState.history.length : 0;
        const favoritesCount = appState.history ? appState.history.filter(a => a.favorite).length : 0;
        const ratedCount = appState.history ? appState.history.filter(a => a.rating > 0).length : 0;
        const fiveStarCount = appState.history ? appState.history.filter(a => a.rating === 5).length : 0;

        return {
            totalEpisodes: appState.achievements?.totalEpisodes || 0,
            totalMinutes: appState.achievements?.totalMinutes || 0,
            stackSize: appState.playlist?.length || 0,
            episodesToday: appState.achievements?.episodesToday || 0,
            isNightTime: isNightTime,
            hasShounen: hasShounen,
            usedSpeedrun: appState.settings?.skipOP || false,
            usedFillerSkip: appState.settings?.skipFillers || false,
            completedCount,
            favoritesCount,
            ratedCount,
            fiveStarCount
        };
    },

    /**
     * Mostra notificação de achievement desbloqueado
     */
    showUnlockNotification(badge) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${badge.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">🏆 Achievement Desbloqueado!</div>
                <div class="achievement-name">${badge.name}</div>
                <div class="achievement-xp">+${badge.xp} XP</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remover após 4 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    },

    /**
     * Renderiza o badge de nível no header
     */
    renderLevelBadge(xp) {
        const level = this.getLevel(xp);
        const progress = this.getLevelProgress(xp);
        const nextLevel = this.getNextLevel(xp);
        
        const container = document.getElementById('level-badge');
        if (!container) return;
        
        const xpText = nextLevel 
            ? `${xp}/${nextLevel.xpRequired} XP` 
            : `${xp} XP (MAX)`;
        
        container.innerHTML = `
            <div class="level-icon">${level.icon}</div>
            <div class="level-info">
                <div class="level-name">Lv.${level.level} ${level.name}</div>
                <div class="level-progress-bar">
                    <div class="level-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="level-xp">${xpText}</div>
            </div>
        `;
    },

    /**
     * Renderiza o modal de achievements
     */
    renderAchievementsModal(unlockedIds = [], xp = 0) {
        const modal = document.getElementById('achievements-modal');
        if (!modal) return;
        
        const level = this.getLevel(xp);
        
        let badgesHTML = this.badges.map(badge => {
            const isUnlocked = unlockedIds.includes(badge.id);
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-card-icon">${isUnlocked ? badge.icon : '🔒'}</div>
                    <div class="achievement-card-name">${badge.name}</div>
                    <div class="achievement-card-desc">${badge.description}</div>
                    <div class="achievement-card-xp">${badge.xp} XP</div>
                </div>
            `;
        }).join('');
        
        modal.querySelector('.achievements-grid').innerHTML = badgesHTML;
        modal.querySelector('.achievements-stats').innerHTML = `
            <span>${level.icon} Lv.${level.level} ${level.name}</span>
            <span>•</span>
            <span>${xp} XP Total</span>
            <span>•</span>
            <span>${unlockedIds.length}/${this.badges.length} Medalhas</span>
        `;
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Achievements;
}
