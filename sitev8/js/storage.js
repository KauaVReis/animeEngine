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
        // Let's keep v6 logic or simple: Level = 1 + floor(sqrt(xp)/10) ? No, let's use the v6 logic if known, or simple linear
        const newLevel = Math.floor(user.xp / 500) + 1;

        if (newLevel > user.level) {
            user.level = newLevel;

            // OLED Game Reward
            if (newLevel >= 30) {
                if (typeof Themes !== 'undefined' && !Themes.isUnlocked('oledMode')) {
                    Themes.unlock('oledMode');
                    if (typeof Common !== 'undefined') {
                        setTimeout(() => Common.showToast('🔋 Level 30 Alcançado! OLED Pitch Black Desbloqueado!'), 1500);
                    }
                }
            }
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
     * Remove anime from all lists
     */
    removeFromAllLists(id) {
        const lists = this.get(this.KEYS.LISTS, {
            watching: [],
            planToWatch: [],
            completed: [],
            dropped: [],
            paused: []
        });

        Object.keys(lists).forEach(key => {
            lists[key] = lists[key].filter(i => i.id != id);
        });

        this.set(this.KEYS.LISTS, lists);
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

        const animeId = anime.id || anime.anime_id;

        // Remove from all other lists first (an anime can only be in one list status)
        Object.keys(lists).forEach(key => {
            lists[key] = lists[key].filter(i => i.id != animeId);
        });

        // Store strict structure
        const item = {
            id: animeId,
            title: anime.title?.romaji || anime.title || anime.title_english,
            image: anime.image || anime.coverImage?.large,
            score: anime.rating || anime.score || null,
            progress: listType === 'completed' ? (anime.episodes || anime.total_episodes || 0) : (anime.progress || 0),
            total_episodes: anime.episodes || anime.total_episodes || anime.totalEpisodes || 0,
            updated_at: new Date().toISOString()
        };

        lists[listType].push(item);
        this.set(this.KEYS.LISTS, lists);

        // Sync with backend
        this.syncWithBackend(animeId, listType, anime);
    },

    /**
     * Move anime between lists with Sync
     */
    moveToList(animeId, fromList, toList) {
        const lists = this.get(this.KEYS.LISTS, {});
        const anime = lists[fromList]?.find(a => a.id == animeId);

        if (anime) {
            // Remove from old
            lists[fromList] = lists[fromList].filter(a => a.id != animeId);

            // Update status and progress if completed
            if (toList === 'completed') {
                anime.progress = anime.total_episodes || anime.episodes || 0;
            }

            // Add to new
            if (!lists[toList]) lists[toList] = [];
            lists[toList].push(anime);

            this.set(this.KEYS.LISTS, lists);

            // Sync with backend
            fetch('api/lists/move.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anime_id: animeId, tipo_lista: toList })
            }).catch(e => console.error('Sync Error:', e));
        }
    },

    /**
     * Helper to sync add/update with backend
     */
    async syncWithBackend(animeId, listType, rawAnime) {
        try {
            return await fetch('api/lists/add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    anime_id: animeId,
                    tipo_lista: listType,
                    anime_data: {
                        id: animeId,
                        title: rawAnime.title?.romaji || rawAnime.title,
                        image: rawAnime.image || rawAnime.coverImage?.large,
                        episodes: rawAnime.episodes || rawAnime.total_episodes || 0,
                        score: rawAnime.averageScore || rawAnime.score || 0,
                        status: rawAnime.status,
                        synopsis: rawAnime.synopsis || rawAnime.description
                    }
                })
            });
        } catch (e) {
            console.error('Backend sync failed:', e);
            throw e;
        }
    },

    /**
     * Mark all episodes as watched
     */
    markAllEpisodesAsWatched(anime) {
        const lists = this.get(this.KEYS.LISTS, {});
        const animeId = anime.id || anime.anime_id;
        let found = false;

        for (const type in lists) {
            const item = lists[type].find(a => a.id == animeId);
            if (item) {
                item.progress = item.total_episodes || anime.episodes || 0;
                found = true;
                break;
            }
        }

        if (found) {
            this.set(this.KEYS.LISTS, lists);

            // Sync with backend
            fetch('api/lists/update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    anime_id: animeId,
                    progresso: anime.episodes || 0
                })
            }).catch(e => console.error('Sync error:', e));
        }
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
    // Favorites are just another list or separate? In v6 it seemed separate.
    // Let's keep it separate or just a boolean flag in lists?
    // v6 had 'favoritos.html', implying a list.
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
        const animeId = anime.id || anime.anime_id;
        const existingIndex = favs.findIndex(f => f.id == animeId);
        let isFavorite = false;

        if (existingIndex >= 0) {
            favs.splice(existingIndex, 1);
            isFavorite = false;
        } else {
            favs.push({
                id: animeId,
                title: anime.title?.romaji || anime.title,
                image: anime.image || anime.coverImage?.large,
                added_at: new Date().toISOString()
            });
            isFavorite = true;
        }

        this.set('animeengine_favorites_v6', favs);

        // Sync with backend
        fetch('api/lists/update.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                anime_id: animeId,
                favorito: isFavorite ? 1 : 0
            })
        }).catch(e => console.error('Sync Error (Favorite):', e));
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
    // EPISODES WATCHED (v7)
    // ========================================
    getWatchedEpisodes(animeId) {
        const key = `watched_eps_${animeId}`;
        return this.get(key, []);
    },

    toggleWatchedEpisode(anime, episodeNumber) {
        const key = `watched_eps_${anime.id}`;
        let watched = this.get(key, []);
        const epNum = parseInt(episodeNumber);

        if (watched.includes(epNum)) {
            watched = watched.filter(n => n !== epNum);
        } else {
            watched.push(epNum);
        }

        this.set(key, watched);

        // Auto-update global progress & sync
        this.updateProgressFromEpisodes(anime, watched);
        return watched.includes(epNum);
    },

    /**
     * Mark all episodes from 1 up to episodeNumber
     */
    markEpisodesUpTo(anime, episodeNumber) {
        const key = `watched_eps_${anime.id}`;
        const total = anime.episodes || anime.total_episodes || 0;
        const target = Math.min(parseInt(episodeNumber), total > 0 ? total : episodeNumber);

        // Generate array from 1 to target
        const watched = Array.from({ length: target }, (_, i) => i + 1);

        this.set(key, watched);
        this.updateProgressFromEpisodes(anime, watched);

        return watched;
    },

    /**
     * Mark all episodes as watched
     */
    markAllEpisodesAsWatched(anime) {
        const total = anime.episodes || anime.total_episodes || 0;
        if (total === 0) return;
        return this.markEpisodesUpTo(anime, total);
    },

    updateProgressFromEpisodes(anime, watched = null) {
        if (!watched) watched = this.getWatchedEpisodes(anime.id);
        const total = anime.episodes || anime.total_episodes || 0;
        const status = this.getAnimeStatus(anime.id);

        const maxWatched = watched.length > 0 ? Math.max(...watched) : 0;
        const isAllWatched = total > 0 && watched.length >= total;

        // Se já está na lista, atualiza o progresso
        if (status) {
            const lists = this.getLists();

            // Se assistiu tudo e não está como completed, movemos
            if (isAllWatched && status !== 'completed') {
                this.addToList('completed', anime);
                return;
            }

            // Caso contrário, apenas atualiza o progresso na lista atual
            const item = lists[status].find(i => i.id == anime.id);
            if (item) {
                item.progress = maxWatched;
                item.updated_at = new Date().toISOString();
                this.set(this.KEYS.LISTS, lists);
            }
        } else {
            // Se não está em nenhuma lista, adiciona como 'watching' ou 'completed'
            const targetList = isAllWatched ? 'completed' : 'watching';
            this.addToList(targetList, { ...anime, progress: maxWatched });
            return; // addToList handles sync
        }

        // Sync progress with backend (Only if we didn't call addToList)
        fetch('api/lists/update.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                anime_id: anime.id,
                progresso: maxWatched
            })
        })
            .then(() => {
                // Se mudou para completo, garante que o tipo_lista também sincronizou
                if (isAllWatched && status !== 'completed') {
                    fetch('api/lists/move.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ anime_id: anime.id, tipo_lista: 'completed' })
                    });
                }
            })
            .catch(e => console.error('Sync error:', e));
    },

    unmarkAllEpisodes(animeId) {
        const key = `watched_eps_${animeId}`;
        localStorage.removeItem(key);

        // Reset progress in the list
        const lists = this.getLists();
        for (const listName in lists) {
            if (Array.isArray(lists[listName])) {
                const item = lists[listName].find(i => i.id == animeId);
                if (item) {
                    item.progress = 0;
                    item.updated_at = new Date().toISOString();
                    this.set(this.KEYS.LISTS, lists);
                    break;
                }
            }
        }
    },

    // ========================================
    // SETTINGS
    // ========================================
    getSettings() {
        return this.get(this.KEYS.SETTINGS, {
            theme: 'default',
            language: 'pt-br', // Default language
            notifications: true,
            sfw: true
        });
    },

    updateSettings(data) {
        const current = this.getSettings();
        this.set(this.KEYS.SETTINGS, { ...current, ...data });
        // Trigger theme update if changed from the current state (prevent infinite loop)
        if (data.theme && data.theme !== current.theme && window.Themes) {
            window.Themes.apply(data.theme);
        }
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
    },

    /**
     * Alias for get (compatibility)
     */
    load(key, defaultValue) {
        return this.get(key, defaultValue);
    }
};

window.Storage = Storage;

