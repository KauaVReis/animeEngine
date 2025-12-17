/**
 * AnimeEngine v7 - API Client
 * Cliente para comunicação com o backend PHP
 */

const ApiClient = {
    baseUrl: '/kaua1/Testes/animeEngine/sitev7/api',
    
    /**
     * Fazer requisição à API
     */
    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Importante para enviar cookies de sessão
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(this.baseUrl + endpoint, options);
            const result = await response.json();
            
            if (response.status === 401) {
                // Sessão expirada
                console.warn('Sessão expirada');
                return { error: true, message: 'Sessão expirada. Faça login novamente.' };
            }
            
            return result;
        } catch (error) {
            console.error('Erro na API:', error);
            return { error: true, message: 'Erro de conexão' };
        }
    },
    
    // ========================================
    // AUTENTICAÇÃO
    // ========================================
    
    async login(email, senha) {
        return this.request('/auth/login.php', 'POST', { email, senha });
    },
    
    async register(username, email, senha) {
        return this.request('/auth/register.php', 'POST', { username, email, senha });
    },
    
    async logout() {
        return this.request('/auth/logout.php', 'POST');
    },
    
    // ========================================
    // LISTAS
    // ========================================
    
    /**
     * Obter todas as listas do usuário
     */
    async getLists() {
        return this.request('/lists/get.php');
    },
    
    /**
     * Adicionar anime à lista
     */
    async addToList(animeId, tipoLista, animeData) {
        return this.request('/lists/add.php', 'POST', {
            anime_id: animeId,
            tipo_lista: tipoLista,
            anime_data: animeData
        });
    },
    
    /**
     * Atualizar progresso/nota
     */
    async updateProgress(animeId, progresso, nota = null) {
        const data = { anime_id: animeId };
        if (progresso !== null) data.progresso = progresso;
        if (nota !== null) data.nota = nota;
        return this.request('/lists/update.php', 'POST', data);
    },
    
    /**
     * Toggle favorito
     */
    async toggleFavorite(animeId, favorito) {
        return this.request('/lists/update.php', 'POST', {
            anime_id: animeId,
            favorito: favorito ? 1 : 0
        });
    },
    
    /**
     * Mover entre listas
     */
    async moveToList(animeId, tipoLista) {
        return this.request('/lists/move.php', 'POST', {
            anime_id: animeId,
            tipo_lista: tipoLista
        });
    },
    
    /**
     * Remover da lista
     */
    async removeFromList(animeId) {
        return this.request('/lists/remove.php', 'POST', {
            anime_id: animeId
        });
    }
};

// ========================================
// STORAGE WRAPPER (Compatibilidade com v6)
// ========================================

/**
 * Wrapper para manter compatibilidade com código existente
 * Usa localStorage como fallback se não logado
 */
const StorageV7 = {
    _cache: null,
    _isLoggedIn: false,
    
    async init() {
        // Tentar carregar listas do servidor
        const result = await ApiClient.getLists();
        if (!result.error) {
            this._cache = result;
            this._isLoggedIn = true;
        } else {
            // Fallback para localStorage
            this._cache = this._loadFromLocalStorage();
            this._isLoggedIn = false;
        }
    },
    
    _loadFromLocalStorage() {
        const stored = localStorage.getItem('animeengine_lists');
        return stored ? JSON.parse(stored) : {
            watching: [],
            planToWatch: [],
            completed: [],
            paused: [],
            dropped: [],
            favorites: []
        };
    },
    
    _saveToLocalStorage() {
        localStorage.setItem('animeengine_lists', JSON.stringify(this._cache));
    },
    
    getLists() {
        return this._cache || this._loadFromLocalStorage();
    },
    
    async addToList(tipoLista, anime) {
        if (this._isLoggedIn) {
            const result = await ApiClient.addToList(anime.id, tipoLista, anime);
            if (result.success) {
                // Recarregar cache
                this._cache = await ApiClient.getLists();
            }
            return result;
        } else {
            // Fallback localStorage
            if (!this._cache[tipoLista]) this._cache[tipoLista] = [];
            const exists = this._cache[tipoLista].find(a => a.id === anime.id);
            if (!exists) {
                this._cache[tipoLista].push(anime);
                this._saveToLocalStorage();
            }
            return { success: true };
        }
    },
    
    async updateProgress(animeId, progresso) {
        if (this._isLoggedIn) {
            return ApiClient.updateProgress(animeId, progresso);
        } else {
            // Fallback
            for (const list of Object.values(this._cache)) {
                const anime = list.find(a => a.id === animeId);
                if (anime) {
                    anime.progress = progresso;
                    this._saveToLocalStorage();
                    break;
                }
            }
            return { success: true };
        }
    },
    
    async moveToList(animeId, novaLista) {
        if (this._isLoggedIn) {
            const result = await ApiClient.moveToList(animeId, novaLista);
            if (result.success) {
                this._cache = await ApiClient.getLists();
            }
            return result;
        } else {
            // Fallback
            let anime = null;
            for (const [listName, list] of Object.entries(this._cache)) {
                const idx = list.findIndex(a => a.id === animeId);
                if (idx > -1) {
                    anime = list.splice(idx, 1)[0];
                    break;
                }
            }
            if (anime) {
                this._cache[novaLista].push(anime);
                this._saveToLocalStorage();
            }
            return { success: true };
        }
    },
    
    async removeFromList(animeId) {
        if (this._isLoggedIn) {
            return ApiClient.removeFromList(animeId);
        } else {
            for (const list of Object.values(this._cache)) {
                const idx = list.findIndex(a => a.id === animeId);
                if (idx > -1) {
                    list.splice(idx, 1);
                    this._saveToLocalStorage();
                    break;
                }
            }
            return { success: true };
        }
    },
    
    isLoggedIn() {
        return this._isLoggedIn;
    }
};

// Exportar globalmente
window.ApiClient = ApiClient;
window.StorageV7 = StorageV7;
