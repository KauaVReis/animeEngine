/**
 * AnimeEngine v5 - Goals Module
 * Sistema de metas e desafios semanais
 */

const Goals = {
    // Chave do localStorage
    STORAGE_KEY: 'animeengine_goals',
    
    // Metas disponíveis
    availableGoals: [
        {
            id: 'watch_5_eps',
            title: 'Maratonista Leve',
            description: 'Assistir 5 episódios',
            icon: '📺',
            target: 5,
            unit: 'episódios',
            type: 'episodes',
            xp: 25
        },
        {
            id: 'watch_15_eps',
            title: 'Maratonista',
            description: 'Assistir 15 episódios',
            icon: '🎬',
            target: 15,
            unit: 'episódios',
            type: 'episodes',
            xp: 50
        },
        {
            id: 'complete_1_anime',
            title: 'Finalizador',
            description: 'Completar 1 anime',
            icon: '✅',
            target: 1,
            unit: 'anime',
            type: 'completed',
            xp: 40
        },
        {
            id: 'add_3_animes',
            title: 'Explorador',
            description: 'Adicionar 3 animes na lista',
            icon: '📋',
            target: 3,
            unit: 'animes',
            type: 'added',
            xp: 20
        },
        {
            id: 'watch_2_hours',
            title: 'Dedicado',
            description: 'Assistir 2 horas no total',
            icon: '⏱️',
            target: 120,
            unit: 'minutos',
            type: 'minutes',
            xp: 35
        }
    ],

    /**
     * Inicializar sistema de metas
     */
    init() {
        this.ensureStorage();
        this.checkWeekReset();
        console.log('🎯 Goals system initialized');
    },

    /**
     * Garantir que o storage existe
     */
    ensureStorage() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.createNewWeek();
        }
    },

    /**
     * Criar nova semana de metas
     */
    createNewWeek(existingHistory = []) {
        // Selecionar 3 metas aleatórias para a semana
        const shuffled = [...this.availableGoals].sort(() => 0.5 - Math.random());
        const selectedGoals = shuffled.slice(0, 3).map(goal => ({
            ...goal,
            progress: 0,
            completed: false,
            claimedXP: false
        }));
        
        const weekData = {
            weekStart: this.getWeekStart().toISOString(),
            goals: selectedGoals,
            history: existingHistory
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(weekData));
        return weekData;
    },

    /**
     * Obter início da semana atual (domingo)
     */
    getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    },

    /**
     * Verificar se precisa resetar a semana
     */
    checkWeekReset() {
        const data = this.getData();
        const currentWeekStart = this.getWeekStart().toISOString();
        
        if (data.weekStart !== currentWeekStart) {
            // Salvar semana anterior no histórico
            this.saveToHistory(data);
            // Criar nova semana mantendo o histórico
            this.createNewWeek(data.history || []);
            
            // Notificar usuário
            if (typeof Notifications !== 'undefined') {
                Notifications.add({
                    type: 'system',
                    title: 'Novas Metas Semanais!',
                    message: 'Suas metas foram renovadas. Boa sorte! 🎯',
                    icon: '🎯'
                });
            }
        }
    },

    /**
     * Obter dados atuais (sem criar se não existir)
     */
    getRawData() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    /**
     * Obter dados atuais (cria se não existir)
     */
    getData() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
        return this.createNewWeek([]);
    },

    /**
     * Obter metas atuais
     */
    getCurrentGoals() {
        return this.getData().goals;
    },

    /**
     * Obter histórico de semanas (direto do raw data)
     */
    getHistory() {
        const data = this.getRawData();
        return data ? (data.history || []) : [];
    },

    /**
     * Salvar semana no histórico
     */
    saveToHistory(weekData) {
        const history = this.getHistory();
        
        // Calcular resumo da semana
        const completedCount = weekData.goals.filter(g => g.completed).length;
        const totalXP = weekData.goals.filter(g => g.claimedXP).reduce((sum, g) => sum + g.xp, 0);
        
        history.unshift({
            weekStart: weekData.weekStart,
            completedCount,
            totalGoals: weekData.goals.length,
            xpEarned: totalXP
        });
        
        // Manter apenas últimas 10 semanas
        if (history.length > 10) {
            history.pop();
        }
        
        const data = this.getData();
        data.history = history;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },

    /**
     * Atualizar progresso de uma meta
     */
    updateProgress(goalType, amount = 1) {
        const data = this.getData();
        let updated = false;
        
        data.goals.forEach(goal => {
            if (goal.type === goalType && !goal.completed) {
                goal.progress = Math.min(goal.progress + amount, goal.target);
                
                if (goal.progress >= goal.target) {
                    goal.completed = true;
                    updated = true;
                    
                    // Notificar
                    if (typeof Notifications !== 'undefined') {
                        Notifications.add({
                            type: 'achievement',
                            title: 'Meta Completada! 🎯',
                            message: `${goal.title}: ${goal.description}`,
                            icon: goal.icon
                        });
                    }
                    
                    // Mostrar toast
                    if (typeof Common !== 'undefined') {
                        Common.showNotification(`Meta completada: ${goal.title}! 🎯`);
                    }
                }
            }
        });
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        return updated;
    },

    /**
     * Reivindicar XP de meta completada
     */
    claimXP(goalId) {
        const data = this.getData();
        const goal = data.goals.find(g => g.id === goalId);
        
        if (goal && goal.completed && !goal.claimedXP) {
            goal.claimedXP = true;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            
            // Adicionar XP
            if (typeof Storage !== 'undefined') {
                Storage.addXP(goal.xp);
            }
            
            return goal.xp;
        }
        
        return 0;
    },

    /**
     * Reivindicar todos os XP pendentes
     */
    claimAllXP() {
        const data = this.getData();
        let totalXP = 0;
        
        data.goals.forEach(goal => {
            if (goal.completed && !goal.claimedXP) {
                goal.claimedXP = true;
                totalXP += goal.xp;
            }
        });
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        
        if (totalXP > 0 && typeof Storage !== 'undefined') {
            Storage.addXP(totalXP);
        }
        
        return totalXP;
    },

    /**
     * Calcular dias restantes na semana
     */
    getDaysRemaining() {
        const now = new Date();
        const nextSunday = new Date(this.getWeekStart());
        nextSunday.setDate(nextSunday.getDate() + 7);
        
        const diff = nextSunday - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },

    /**
     * Calcular progresso geral da semana
     */
    getWeekProgress() {
        const goals = this.getCurrentGoals();
        const completed = goals.filter(g => g.completed).length;
        return {
            completed,
            total: goals.length,
            percentage: Math.round((completed / goals.length) * 100)
        };
    },

    /**
     * Renderizar HTML do widget de metas
     */
    renderWidget() {
        const goals = this.getCurrentGoals();
        const daysLeft = this.getDaysRemaining();
        const progress = this.getWeekProgress();
        
        const goalsHtml = goals.map(goal => {
            const percent = Math.round((goal.progress / goal.target) * 100);
            const statusClass = goal.completed ? 'completed' : '';
            const canClaim = goal.completed && !goal.claimedXP;
            
            return `
                <div class="goal-item ${statusClass}">
                    <div class="goal-icon">${goal.icon}</div>
                    <div class="goal-content">
                        <div class="goal-header">
                            <span class="goal-title">${goal.title}</span>
                            ${goal.completed ? '<span class="goal-check">✓</span>' : ''}
                        </div>
                        <div class="goal-desc">${goal.description}</div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${percent}%"></div>
                        </div>
                        <div class="goal-meta">
                            <span class="goal-count">${goal.progress}/${goal.target}</span>
                            ${canClaim ? 
                                `<button class="goal-claim-btn" onclick="Goals.claimXP('${goal.id}'); Common.updateLevelBadge(); this.parentElement.parentElement.parentElement.querySelector('.goal-claim-btn').remove(); Common.showNotification('+${goal.xp} XP! 🎉');">+${goal.xp} XP</button>` : 
                                goal.claimedXP ? '<span class="goal-claimed">✓ XP</span>' : `<span class="goal-xp">🏆 ${goal.xp} XP</span>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="goals-widget">
                <div class="goals-header">
                    <div class="goals-title">
                        <span class="goals-icon">🎯</span>
                        <span>Metas da Semana</span>
                    </div>
                    <div class="goals-timer">
                        <i class="fas fa-clock"></i>
                        <span>${daysLeft}d restantes</span>
                    </div>
                </div>
                <div class="goals-overview">
                    <div class="goals-overview-bar">
                        <div class="goals-overview-fill" style="width: ${progress.percentage}%"></div>
                    </div>
                    <span class="goals-overview-text">${progress.completed}/${progress.total} completas</span>
                </div>
                <div class="goals-list">
                    ${goalsHtml}
                </div>
            </div>
        `;
    }
};

// Expor globalmente
window.Goals = Goals;

// Inicializar quando DOM pronto
document.addEventListener('DOMContentLoaded', () => Goals.init());
