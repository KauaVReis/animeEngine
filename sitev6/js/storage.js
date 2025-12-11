/**
 * AnimeEngine v6 - Storage Manager
 * Handles LocalStorage with strict data structure.
 */

const Storage = {
    KEYS: {
        USER: 'animeengine_user_v6',
        LISTS: 'animeengine_lists_v6',
        HISTORY: 'animeengine_history_v6',
        SETTINGS: 'animeengine_settings_v6'
    },

    // ========================================
    // USER DATA
    // ========================================
    getUser() {
        const defaultUser = {
            name: 'Visitante',
            level: 1,
            xp: 0,
            avatar: 'default.png',
            joined_at: new Date().toISOString(),
            achievements: [] // Initialize achievements array
        };
        return this.get(this.KEYS.USER, defaultUser);
    },

    updateUser(data) {
        const current = this.getUser();
        this.set(this.KEYS.USER, { ...current, ...data });
    },

    addXP(amount) {
        const user = this.getUser();
        user.xp += amount;
        
        // Simple level up logic: Level N requires N * 100 XP
        // Or cumulative: 100, 300, 600...
        // Let's keep v5 logic or simple: Level = 1 + floor(sqrt(xp)/10) ? No, let's use the v5 logic if known, or simple linear
        const newLevel = Math.floor(user.xp / 500) + 1;
        
        if (newLevel > user.level) {
            user.level = newLevel;
            // Common.showNotification ? We are in storage layer.
            // Dispatch event?
        }
        
        this.set(this.KEYS.USER, user);
    },

    // ========================================
    // LISTS (Watching, Plan to Watch, etc)
    // ========================================
    
    /**
     * Get list items
     */
    getList(type) {
        // type: watching, planToWatch, completed, dropped, paused
        const lists = this.get(this.KEYS.LISTS, {
            watching: [],
            planToWatch: [],
            completed: [],
            dropped: [],
            paused: []
        });
        return lists[type] || [];
    },

    /**
     * Get all lists
     */
    getLists() {
        const lists = this.get(this.KEYS.LISTS, {
            watching: [],
            planToWatch: [],
            completed: [],
            dropped: [],
            paused: []
        });
        // Merge favorites for compatibility
        lists.favorites = this.getFavorites();
        return lists;
    },

    /**
     * Add or Update item in list
     * @param {string} listType 
     * @param {object} anime Anime object (formatted)
     */
    addToList(listType, anime) {
        const lists = this.get(this.KEYS.LISTS, {
            watching: [],
            planToWatch: [],
            completed: [],
            dropped: [],
            paused: []
        });

        // Remove from all other lists first (an anime can only be in one list status)
        Object.keys(lists).forEach(key => {
            lists[key] = lists[key].filter(i => i.id !== anime.id);
        });

        // Add to target list
        // Store strict structure
        const item = {
            id: anime.id,
            title: anime.title || anime.title_english, // Fallback
            image: anime.image,
            score: null, // User score
            progress: 0,
            total_episodes: anime.episodes,
            updated_at: new Date().toISOString(),
            data: anime // Optional: cache full data
        };

        lists[listType].push(item);
        this.set(this.KEYS.LISTS, lists);
    },

    getAnimeStatus(id) {
        const lists = this.get(this.KEYS.LISTS, {});
        for (const [type, items] of Object.entries(lists)) {
            if (items && items.find(i => i.id == id)) return type;
        }
        return null;
    },

    // ========================================
    // FAVORITES
    // ========================================
    // Favorites are just another list or separate? In v5 it seemed separate.
    // Let's keep it separate or just a boolean flag in lists?
    // v5 had 'favoritos.html', implying a list.
    // Let's use a specific key for favorites.

    getFavorites() {
        return this.get('animeengine_favorites_v6', []);
    },

    isFavorite(id) {
        const favs = this.getFavorites();
        return favs.some(f => f.id == id);
    },

    toggleFavorite(anime) {
        let favs = this.getFavorites();
        const existingIndex = favs.findIndex(f => f.id == anime.id);
        
        if (existingIndex >= 0) {
            favs.splice(existingIndex, 1);
        } else {
            favs.push({
                id: anime.id,
                title: anime.title,
                image: anime.image,
                added_at: new Date().toISOString()
            });
        }
        
        this.set('animeengine_favorites_v6', favs);
    },

    // ========================================
    // HISTORY
    // ========================================
    addToHistory(anime, episode) {
        let history = this.get(this.KEYS.HISTORY, []);
        
        // Remove existing entry for this anime
        history = history.filter(h => h.id !== anime.id);
        
        // Add new to top
        history.unshift({
            id: anime.id,
            title: anime.title,
            image: anime.image,
            episode: episode,
            viewed_at: new Date().toISOString()
        });
        
        // Limit to 50
        if (history.length > 50) history.pop();
        
        this.set(this.KEYS.HISTORY, history);
    },

    // ========================================
    // HELPERS
    // ========================================
    get(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage Read Error', e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage Write Error', e);
        }
    },

    /**
     * Alias for set (compatibility)
     */
    save(key, value) {
        this.set(key, value);
    }
};

window.Storage = Storage;
