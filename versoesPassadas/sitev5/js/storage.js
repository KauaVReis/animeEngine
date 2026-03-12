/**
 * AnimeEngine v5 - Storage Module
 * LocalStorage com estrutura para listas e dados do usuário
 */

const Storage = {
    KEYS: {
        USER: 'animeengine_user',
        LISTS: 'animeengine_lists',
        SETTINGS: 'animeengine_settings',
        CACHE: 'animeengine_cache'
    },

    // Estrutura padrão
    defaultData: {
        user: {
            name: 'Otaku',
            avatar: '🎭',
            xp: 0,
            level: 1,
            achievements: [],
            createdAt: null
        },
        lists: {
            watching: [],    // Em progresso
            completed: [],   // Completos
            planToWatch: [], // Quero assistir
            paused: [],      // Pausados
            dropped: [],     // Abandonados
            favorites: []    // Favoritos (separado dos status)
        },
        settings: {
            theme: 'default',
            preferredStreaming: null,
            notifications: true,
            sfw: true
        }
    },

    /**
     * Inicializar storage
     */
    init() {
        // Verificar se já existe dados
        if (!localStorage.getItem(this.KEYS.USER)) {
            this.save('user', {
                ...this.defaultData.user,
                createdAt: new Date().toISOString()
            });
        }

        if (!localStorage.getItem(this.KEYS.LISTS)) {
            this.save('lists', this.defaultData.lists);
        }

        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            this.save('settings', this.defaultData.settings);
        }

        console.log('💾 Storage initialized');
    },

    /**
     * Salvar dados
     */
    save(key, data) {
        try {
            const storageKey = this.KEYS[key.toUpperCase()];
            localStorage.setItem(storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    /**
     * Carregar dados
     */
    load(key) {
        try {
            const storageKey = this.KEYS[key.toUpperCase()];
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    },

    // ========================================
    // USER
    // ========================================

    getUser() {
        return this.load('user') || this.defaultData.user;
    },

    updateUser(updates) {
        const user = this.getUser();
        const updated = { ...user, ...updates };
        this.save('user', updated);
        return updated;
    },

    addXP(amount) {
        const user = this.getUser();
        user.xp += amount;
        
        // Verificar level up (100 XP por nível)
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > user.level) {
            user.level = newLevel;
            console.log(`🎉 Level Up! Agora você é nível ${newLevel}`);
        }
        
        this.save('user', user);
        return user;
    },

    // ========================================
    // LISTS
    // ========================================

    getLists() {
        return this.load('lists') || this.defaultData.lists;
    },

    /**
     * Adicionar anime a uma lista
     */
    addToList(listName, anime) {
        const lists = this.getLists();
        
        // Verificar se já existe em alguma lista
        this.removeFromAllLists(anime.id);
        
        // Adicionar à nova lista
        const newLists = this.getLists(); // Recarregar após remoção
        
        if (!newLists[listName]) {
            newLists[listName] = [];
        }
        
        // Se for completed, setar progresso igual ao total de episódios
        const progress = listName === 'completed' ? (anime.episodes || 0) : 0;
        
        // Adicionar com metadados extras
        newLists[listName].unshift({
            ...anime,
            addedAt: new Date().toISOString(),
            progress: progress,
            rating: 0,
            notes: ''
        });
        
        this.save('lists', newLists);
        console.log(`✅ "${anime.title}" adicionado à lista "${listName}"`);
        return newLists;
    },

    /**
     * Remover anime de todas as listas
     */
    removeFromAllLists(animeId) {
        const lists = this.getLists();
        
        Object.keys(lists).forEach(listName => {
            lists[listName] = lists[listName].filter(a => a.id !== animeId);
        });
        
        this.save('lists', lists);
        return lists;
    },

    /**
     * Atualizar progresso de um anime
     */
    updateProgress(animeId, progress, listName = 'watching') {
        const lists = this.getLists();
        
        const anime = lists[listName]?.find(a => a.id === animeId);
        if (anime) {
            anime.progress = progress;
            anime.updatedAt = new Date().toISOString();
            
            // Se completou, mover para completed
            if (progress >= anime.episodes && listName !== 'completed') {
                this.moveToList(animeId, listName, 'completed');
            } else {
                this.save('lists', lists);
            }
        }
        
        return lists;
    },

    /**
     * Mover anime entre listas
     */
    moveToList(animeId, fromList, toList) {
        const lists = this.getLists();
        
        const index = lists[fromList]?.findIndex(a => a.id === animeId);
        if (index > -1) {
            const [anime] = lists[fromList].splice(index, 1);
            anime.movedAt = new Date().toISOString();
            
            // Se movendo para completed, setar progresso como total
            if (toList === 'completed' && anime.episodes) {
                anime.progress = anime.episodes;
            }
            
            if (!lists[toList]) lists[toList] = [];
            lists[toList].unshift(anime);
            
            this.save('lists', lists);
            console.log(`📦 "${anime.title}" movido para "${toList}"`);
        }
        
        return lists;
    },

    /**
     * Verificar se anime está em alguma lista
     */
    getAnimeStatus(animeId) {
        const lists = this.getLists();
        
        for (const [listName, animes] of Object.entries(lists)) {
            const anime = animes.find(a => a.id === animeId);
            if (anime) {
                return { list: listName, anime };
            }
        }
        
        return null;
    },

    /**
     * Toggle favorito
     */
    toggleFavorite(anime) {
        const lists = this.getLists();
        const index = lists.favorites.findIndex(a => a.id === anime.id);
        
        if (index > -1) {
            lists.favorites.splice(index, 1);
            console.log(`💔 "${anime.title}" removido dos favoritos`);
        } else {
            lists.favorites.unshift({
                ...anime,
                favoritedAt: new Date().toISOString()
            });
            console.log(`❤️ "${anime.title}" adicionado aos favoritos`);
        }
        
        this.save('lists', lists);
        return lists;
    },

    /**
     * Verificar se é favorito
     */
    isFavorite(animeId) {
        const lists = this.getLists();
        return lists.favorites.some(a => a.id === animeId);
    },

    // ========================================
    // SETTINGS
    // ========================================

    getSettings() {
        return this.load('settings') || this.defaultData.settings;
    },

    updateSettings(updates) {
        const settings = this.getSettings();
        const updated = { ...settings, ...updates };
        this.save('settings', updated);
        return updated;
    },

    // ========================================
    // MIGRATION (v4 → v5)
    // ========================================

    migrateFromV4() {
        const oldData = localStorage.getItem('animeEngineData');
        if (!oldData) return false;

        try {
            const v4 = JSON.parse(oldData);
            console.log('🔄 Migrando dados do v4...');
            
            // Migrar playlist para watching
            if (v4.playlist?.length > 0) {
                const lists = this.getLists();
                v4.playlist.forEach(anime => {
                    lists.watching.push({
                        id: anime.id || Date.now(),
                        title: anime.title,
                        image: anime.image,
                        episodes: anime.eps,
                        progress: 0,
                        addedAt: new Date().toISOString()
                    });
                });
                this.save('lists', lists);
            }

            // Migrar histórico
            if (v4.history?.length > 0) {
                const lists = this.getLists();
                v4.history.forEach(anime => {
                    lists.completed.push({
                        ...anime,
                        addedAt: anime.completedDate || new Date().toISOString()
                    });
                });
                this.save('lists', lists);
            }

            // Migrar achievements
            if (v4.achievements) {
                const user = this.getUser();
                user.xp = v4.achievements.xp || 0;
                user.achievements = v4.achievements.unlocked || [];
                this.save('user', user);
            }

            // Migrar tema
            if (v4.theme) {
                this.updateSettings({ theme: v4.theme });
            }

            console.log('✅ Migração concluída!');
            return true;
        } catch (error) {
            console.error('❌ Erro na migração:', error);
            return false;
        }
    }
};

// Inicializar ao carregar
Storage.init();

// Expor globalmente
window.Storage = Storage;
