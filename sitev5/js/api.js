/**
 * AnimeEngine v5 - Jikan API Integration
 * API Docs: https://docs.api.jikan.moe/
 */

const API = {
    BASE_URL: 'https://api.jikan.moe/v4',
    cache: new Map(),
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
    
    // Rate limiting
    lastRequestTime: 0,
    MIN_REQUEST_INTERVAL: 400, // 400ms entre requests (max 2.5 req/s)
    requestQueue: [],
    isProcessingQueue: false,

    /**
     * Busca com cache, rate limiting e retry
     */
    async fetch(endpoint, useCache = true) {
        const cacheKey = endpoint;
        
        // Verificar cache primeiro
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
                console.log(`📦 Cache hit: ${endpoint}`);
                return cached.data;
            }
        }

        // Adicionar à fila e processar
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ endpoint, resolve, reject, retries: 0 });
            this.processQueue();
        });
    },

    /**
     * Processar fila de requests com rate limiting
     */
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            
            // Respeitar rate limit
            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
                await this.delay(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
            }
            
            try {
                const data = await this.doFetch(request.endpoint);
                request.resolve(data);
            } catch (error) {
                // Retry em caso de 429
                if (error.message.includes('429') && request.retries < 3) {
                    request.retries++;
                    const backoffTime = Math.pow(2, request.retries) * 1000; // 2s, 4s, 8s
                    console.log(`⏳ Rate limited. Retry ${request.retries}/3 em ${backoffTime/1000}s...`);
                    await this.delay(backoffTime);
                    this.requestQueue.unshift(request); // Voltar ao início da fila
                } else {
                    request.reject(error);
                }
            }
            
            this.lastRequestTime = Date.now();
        }
        
        this.isProcessingQueue = false;
    },

    /**
     * Fazer a requisição de fato
     */
    async doFetch(endpoint) {
        console.log(`🌐 Fetching: ${endpoint}`);
        const response = await fetch(`${this.BASE_URL}${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        
        // Salvar no cache
        this.cache.set(endpoint, {
            data: json.data,
            timestamp: Date.now()
        });

        return json.data;
    },

    /**
     * Delay helper
     */
    async delay(ms = 400) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // ========================================
    // ENDPOINTS
    // ========================================

    /**
     * Animes em alta (airing + popular)
     */
    async getTrending(limit = 10) {
        const data = await this.fetch(`/top/anime?filter=airing&limit=${limit}`);
        return data;
    },

    /**
     * Temporada atual
     */
    async getSeasonNow(limit = 10) {
        const data = await this.fetch(`/seasons/now?limit=${limit}`);
        return data;
    },

    /**
     * Animes de uma temporada específica (para o calendário)
     */
    async getSeasonAnimes(year, season) {
        // Retornar objeto com data array para manter compatibilidade
        const data = await this.fetch(`/seasons/${year}/${season}?limit=25`);
        return { data: data };
    },

    /**
     * Top animes de todos os tempos
     */
    async getTopAnime(limit = 10) {
        const data = await this.fetch(`/top/anime?limit=${limit}`);
        return data;
    },

    /**
     * Detalhes completos de um anime
     */
    async getAnimeById(id) {
        const data = await this.fetch(`/anime/${id}/full`);
        return data;
    },

    /**
     * Buscar animes por nome
     */
    async searchAnime(query, limit = 20) {
        const data = await this.fetch(`/anime?q=${encodeURIComponent(query)}&limit=${limit}`);
        return data;
    },

    /**
     * Recomendações para um anime
     */
    async getRecommendations(id) {
        const data = await this.fetch(`/anime/${id}/recommendations`);
        return data;
    },

    /**
     * Episódios de um anime
     */
    async getEpisodes(id, page = 1) {
        const data = await this.fetch(`/anime/${id}/episodes?page=${page}`);
        return data;
    },

    /**
     * Animes por gênero
     */
    async getByGenre(genreId, limit = 20) {
        const data = await this.fetch(`/anime?genres=${genreId}&limit=${limit}`);
        return data;
    },

    /**
     * Lista de gêneros
     */
    async getGenres() {
        const data = await this.fetch('/genres/anime');
        return data;
    },

    /**
     * Personagens de um anime
     */
    async getCharacters(id) {
        const data = await this.fetch(`/anime/${id}/characters`);
        return data;
    },

    /**
     * Staff/Produção de um anime
     */
    async getStaff(id) {
        const data = await this.fetch(`/anime/${id}/staff`);
        return data;
    },

    /**
     * Relações (inclui manga source)
     */
    async getRelations(id) {
        const data = await this.fetch(`/anime/${id}/relations`);
        return data;
    },

    // ========================================
    // HELPERS
    // ========================================

    /**
     * Formatar dados do anime para uso interno
     */
    formatAnime(anime) {
        return {
            id: anime.mal_id,
            title: anime.title,
            titleEnglish: anime.title_english,
            image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
            synopsis: anime.synopsis,
            score: anime.score,
            episodes: anime.episodes,
            status: anime.status,
            airing: anime.airing,
            year: anime.year || anime.aired?.prop?.from?.year,
            season: anime.season,
            genres: anime.genres?.map(g => g.name) || [],
            studios: anime.studios?.map(s => s.name) || [],
            trailer: anime.trailer?.url,
            duration: anime.duration,
            rating: anime.rating,
            rank: anime.rank,
            popularity: anime.popularity
        };
    }
};

// Expor globalmente
window.API = API;
