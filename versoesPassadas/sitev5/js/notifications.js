/**
 * AnimeEngine v5 - Notifications Module
 * Sistema de notificações persistentes
 */

const Notifications = {
    // Chave do localStorage
    STORAGE_KEY: 'animeengine_notifications',
    
    // Tipos de notificação
    TYPES: {
        ACHIEVEMENT: 'achievement',
        REMINDER: 'reminder',
        NEW_EPISODE: 'new_episode',
        SYSTEM: 'system'
    },

    /**
     * Inicializar sistema de notificações
     */
    init() {
        this.ensureStorage();
        this.checkReminders();
        console.log('🔔 Notifications system initialized');
    },

    /**
     * Garantir que o storage existe
     */
    ensureStorage() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    },

    /**
     * Obter todas as notificações
     */
    getAll() {
        this.ensureStorage();
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    },

    /**
     * Obter notificações não lidas
     */
    getUnread() {
        return this.getAll().filter(n => !n.read);
    },

    /**
     * Contar não lidas
     */
    getUnreadCount() {
        return this.getUnread().length;
    },

    /**
     * Adicionar nova notificação
     */
    add(notification) {
        const notifications = this.getAll();
        
        const newNotification = {
            id: Date.now(),
            type: notification.type || this.TYPES.SYSTEM,
            title: notification.title,
            message: notification.message,
            icon: notification.icon || '🔔',
            read: false,
            createdAt: new Date().toISOString(),
            data: notification.data || null
        };
        
        // Inserir no início (mais recentes primeiro)
        notifications.unshift(newNotification);
        
        // Limitar a 50 notificações
        if (notifications.length > 50) {
            notifications.pop();
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
        
        // Atualizar badge no header
        this.updateBadge();
        
        return newNotification;
    },

    /**
     * Marcar como lida
     */
    markAsRead(notificationId) {
        const notifications = this.getAll();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
            this.updateBadge();
        }
    },

    /**
     * Marcar todas como lidas
     */
    markAllAsRead() {
        const notifications = this.getAll();
        notifications.forEach(n => n.read = true);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
        this.updateBadge();
    },

    /**
     * Remover notificação
     */
    remove(notificationId) {
        let notifications = this.getAll();
        notifications = notifications.filter(n => n.id !== notificationId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
        this.updateBadge();
    },

    /**
     * Limpar todas
     */
    clearAll() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        this.updateBadge();
    },

    /**
     * Atualizar badge de contagem no header
     */
    updateBadge() {
        const count = this.getUnreadCount();
        const badge = document.getElementById('notifications-count');
        const btn = document.getElementById('notifications-btn');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        if (btn) {
            btn.classList.toggle('has-notifications', count > 0);
        }
    },

    /**
     * Verificar lembretes (animes pausados há muito tempo)
     */
    checkReminders() {
        const lists = Storage.getLists();
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Verificar animes pausados ou em andamento há mais de 7 dias
        const staleAnimes = [...(lists.watching || []), ...(lists.paused || [])].filter(anime => {
            if (!anime.updatedAt) return false;
            const lastUpdate = new Date(anime.updatedAt);
            return lastUpdate < oneWeekAgo;
        });
        
        // Adicionar notificação só se não tiver uma recente do mesmo tipo
        const recentNotifications = this.getAll().filter(n => 
            n.type === this.TYPES.REMINDER && 
            new Date(n.createdAt) > oneWeekAgo
        );
        
        if (staleAnimes.length > 0 && recentNotifications.length === 0) {
            this.add({
                type: this.TYPES.REMINDER,
                title: 'Animes Esquecidos',
                message: `Você tem ${staleAnimes.length} anime(s) parado(s) há mais de uma semana!`,
                icon: '⏰'
            });
        }
    },

    /**
     * Notificar conquista desbloqueada
     */
    notifyAchievement(badge) {
        this.add({
            type: this.TYPES.ACHIEVEMENT,
            title: 'Conquista Desbloqueada!',
            message: `${badge.name} - ${badge.description}`,
            icon: badge.icon,
            data: { badgeId: badge.id }
        });
    },

    /**
     * Formatar data relativa
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    },

    /**
     * Renderizar HTML do dropdown de notificações
     */
    renderDropdown() {
        const notifications = this.getAll().slice(0, 10); // Últimas 10
        const unreadCount = this.getUnreadCount();
        
        if (notifications.length === 0) {
            return `
                <div class="notifications-empty">
                    <span class="notifications-empty-icon">🔕</span>
                    <p>Nenhuma notificação</p>
                </div>
            `;
        }
        
        const notificationsHtml = notifications.map(n => `
            <div class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}" onclick="Notifications.handleClick(${n.id})">
                <div class="notification-icon">${n.icon}</div>
                <div class="notification-content">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-message">${n.message}</div>
                    <div class="notification-time">${this.formatRelativeTime(n.createdAt)}</div>
                </div>
                <button class="notification-dismiss" onclick="event.stopPropagation(); Notifications.remove(${n.id}); Common.renderNotificationsDropdown();">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        return `
            <div class="notifications-header">
                <span>Notificações</span>
                ${unreadCount > 0 ? `<button class="btn-link" onclick="Notifications.markAllAsRead(); Common.renderNotificationsDropdown();">Marcar todas como lidas</button>` : ''}
            </div>
            <div class="notifications-list">
                ${notificationsHtml}
            </div>
            ${notifications.length > 0 ? `
                <div class="notifications-footer">
                    <button class="btn-link" onclick="Notifications.clearAll(); Common.renderNotificationsDropdown();">Limpar todas</button>
                </div>
            ` : ''}
        `;
    },

    /**
     * Handle click em notificação
     */
    handleClick(notificationId) {
        this.markAsRead(notificationId);
        Common.renderNotificationsDropdown();
    }
};

// Expor globalmente
window.Notifications = Notifications;
