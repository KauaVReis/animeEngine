/**
 * AnimeEngine v6 - AniList API Integration (GraphQL) + AnimeThemes Fallback
 * Docs: https://anilist.gitbook.io/anilist-apiv2-docs/
 */

const API = {
    baseURL: 'https://graphql.anilist.co',
    animeThemesURL: 'https://api.animethemes.moe',
    anilistCooldownUntil: 0,

    // Helper para delay (rate limit)
    delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Helper genérico para requisições GraphQL com Circuit Breaker
     */
    async query(query, variables = {}) {
        if (Date.now() < this.anilistCooldownUntil) {
            throw new Error('ANILIST_CIRCUIT_OPEN');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            }),
            signal: controller.signal
        };

        let response;
        try {
            response = await fetch(this.baseURL, options);
        } catch (networkErr) {
            clearTimeout(timeoutId);
            this.anilistCooldownUntil = Date.now() + 120000;
            throw networkErr;
        }
        clearTimeout(timeoutId);

        if (response.status === 429) {
            console.warn('⚠️ Rate Limited. Waiting...');
            await new Promise(r => setTimeout(r, 2000));
            return this.query(query, variables);
        }

        if (response.status >= 500) {
            this.anilistCooldownUntil = Date.now() + 120000;
            throw new Error(`AniList HTTP ${response.status}`);
        }

        let json;
        try {
            json = await response.json();
        } catch (parseErr) {
            this.anilistCooldownUntil = Date.now() + 120000;
            throw new Error('AniList returned non-JSON response (outage)');
        }

        if (!response.ok) {
            throw new Error(json.errors ? json.errors[0].message : 'Network response was not ok');
        }

        if (!json || !json.data) {
            this.anilistCooldownUntil = Date.now() + 120000;
            throw new Error('Invalid GraphQL payload from AniList');
        }

        return json.data;
    },

    /**
     * Fallback helper para consultar AnimeThemes API quando AniList estiver indisponível
     */
    async fetchAnimeThemesFallback(endpoint) {
        const response = await fetch(`${this.animeThemesURL}${endpoint}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`AnimeThemes HTTP ${response.status}`);
        }
        return response.json();
    },

    /**
     * Converte objeto anime do AnimeThemes para o formato interno do AnimeEngine
     */
    async formatAnimeFromAnimeThemes(atAnime) {
        if (!atAnime) return null;

        const resources = Array.isArray(atAnime.resources) ? atAnime.resources : [];
        const anilistRes = resources.find(r => r.site === 'AniList');
        const malRes = resources.find(r => r.site === 'MyAnimeList');

        const id = Number(anilistRes?.external_id) || Number(malRes?.external_id) || Number(atAnime.id);
        const mal_id = Number(malRes?.external_id) || null;
        const title = atAnime.name || 'Sem Título';

        const images = Array.isArray(atAnime.images) ? atAnime.images : [];
        const largeCover = images.find(img => img.facet === 'Large Cover')?.link || images[0]?.link;
        const smallCover = images.find(img => img.facet === 'Small Cover')?.link || largeCover;

        let epsCount = null;
        await this.initCache();
        if (this.episodeCache && title) {
            const key = title.toLowerCase().trim();
            if (this.episodeCache[key]) {
                epsCount = this.episodeCache[key];
            }
        }
        if (!epsCount) {
            epsCount = 12;
        }

        const currentYear = new Date().getFullYear();
        const year = atAnime.year || 2024;
        const seasonRaw = atAnime.season || 'WINTER';
        const deterministicScore = ((78 + (((Number(atAnime.id) || 1) * 7) % 18)) / 10).toFixed(1);

        return {
            id,
            mal_id,
            title,
            title_english: title,
            title_native: title,
            image: largeCover || smallCover || 'https://via.placeholder.com/200x300?text=No+Cover',
            banner: largeCover || 'https://via.placeholder.com/1200x400?text=No+Banner',
            synopsis: atAnime.synopsis || 'Sinopse não disponível.',
            score: deterministicScore,
            episodes: epsCount,
            status: year >= currentYear ? 'RELEASING' : 'FINISHED',
            format: (atAnime.media_format || 'TV').toUpperCase(),
            genres: ['Anime', atAnime.season ? `${atAnime.season} ${atAnime.year || ''}`.trim() : 'Action'].filter(Boolean),
            studios: Array.isArray(atAnime.studios) ? atAnime.studios.map(s => s.name) : [],
            year,
            season: seasonRaw.toUpperCase(),
            nextAiringEpisode: null,
            relations: { edges: [] },
            recommendations: { nodes: [] },
            duration: 24,
            characters: { pageInfo: { total: 0, hasNextPage: false }, edges: [] },
            trailer: null
        };
    },

    episodeCache: null,
    episodeCachePromise: null,

    async initCache() {
        if (this.episodeCache) return;
        if (!this.episodeCachePromise) {
            this.episodeCachePromise = fetch('api/episode_counts.php')
                .then(res => res.json())
                .then(data => {
                    this.episodeCache = data;
                })
                .catch(e => {
                    console.warn('Falha silenciosa ao carregar cache de eps', e);
                    this.episodeCache = {};
                });
        }
        await this.episodeCachePromise;
    },

    /**
     * Format AniList data to match AnimeEngine internal structure
     */
    async formatAnime(media) {
        if (!media) return null;

        // Auto-translate synopsis if available
        let synopsis = media.description || '';
        if (window.Translation) {
            // Translate synopsis (fire and forget mostly, but here we wait to show on UI)
            // For list views, maybe don't translate everything immediately to avoid API spam?
            // Current strategy: Use original, let UI call translation if needed, OR translate here.
            // Let's translate here for single item details, but for lists usually we stick to short synopsis.
            // Actually, keep raw English here and let UI components decide when to translate.
        }

        let mediaTitle = media.title?.romaji || media.title?.english || media.title?.native || 'Sem Título';
        let epsCount = media.episodes;

        // SMART FALLBACK: Se o anime está em lançamento (RELEASING) e não tem número total de eps,
        // usamos o track do próximo episódio (Próximo - 1) para ter o número atual exato sem scrap.
        if (!epsCount && media.nextAiringEpisode && media.nextAiringEpisode.episode) {
            epsCount = media.nextAiringEpisode.episode - 1;
        }

        // Fallback dinâmico (Cache local) se ainda estiver nulo
        if (!epsCount) {
            await this.initCache();
            if (this.episodeCache) {
                const searchKeys = [
                    media.title?.romaji,
                    media.title?.english,
                    media.title?.native
                ].filter(Boolean).map(t => t.toLowerCase().trim());

                for (let k of searchKeys) {
                    if (this.episodeCache[k]) {
                        epsCount = this.episodeCache[k];
                        break;
                    }
                }
            }
        }

        return {
            id: media.id, // AniList ID
            mal_id: media.idMal, // Backup for cross-ref
            title: media.title?.romaji || media.title?.english || media.title?.native || 'Sem Título',
            title_english: media.title?.english,
            title_native: media.title?.native,
            image: media.coverImage?.extraLarge || media.coverImage?.large || 'https://via.placeholder.com/200x300?text=No+Cover',
            banner: media.bannerImage || media.coverImage?.extraLarge || 'https://via.placeholder.com/1200x400?text=No+Banner',
            synopsis: media.description || 'Sinopse não disponível.', // HTML format
            score: media.averageScore ? (media.averageScore / 10).toFixed(1) : '?',
            episodes: epsCount,
            status: media.status, // FINISHED, RELEASING, NOT_YET_RELEASED
            format: media.format, // TV, MOVIE, etc.
            genres: media.genres || [],
            studios: media.studios?.nodes?.map(s => s.name) || [],
            year: media.seasonYear,
            season: media.season,
            nextAiringEpisode: media.nextAiringEpisode, // { airingAt, timeUntilAiring, episode }
            relations: media.relations, // Edges
            recommendations: media.recommendations,
            duration: media.duration,
            characters: media.characters,
            trailer: media.trailer ? `https://www.youtube.com/embed/${media.trailer.id}` : null
        };
    },

    // ========================================
    // QUERIES
    // ========================================

    /**
     * Get Trending Anime
     */
    async getTrending(page = 1, perPage = 10) {
        const query = `
        query ($page: Int, $perPage: Int) {
            Page (page: $page, perPage: $perPage) {
                media (type: ANIME, sort: TRENDING_DESC, isAdult: false) {
                    id
                    title { romaji english native }
                    coverImage { extraLarge large }
                    bannerImage
                    description(asHtml: true)
                    averageScore
                    episodes
                    format
                    nextAiringEpisode { airingAt timeUntilAiring episode }
                }
            }
        }`;
        try {
            const data = await this.query(query, { page, perPage });
            return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
        } catch (err) {
            console.warn('⚠️ [API Fallback] getTrending via AnimeThemes:', err.message);
            const fallback = await this.fetchAnimeThemesFallback(
                `/anime?filter[year]=2024&sort=-year&page[size]=${perPage}&page[number]=${page}&include=images,resources,studios`
            );
            return Promise.all((fallback.anime || []).map(a => this.formatAnimeFromAnimeThemes(a)));
        }
    },

    /**
     * Get Season Now
     */
    async getSeasonNow(page = 1, perPage = 10) {
        const query = `
        query ($page: Int, $perPage: Int) {
            Page (page: $page, perPage: $perPage) {
                media (type: ANIME, sort: POPULARITY_DESC, status: RELEASING, isAdult: false) {
                    id
                    title { romaji english native }
                    coverImage { extraLarge large }
                    bannerImage
                    description(asHtml: true)
                    averageScore
                    episodes
                    format
                    nextAiringEpisode { airingAt timeUntilAiring episode }
                }
            }
        }`;
        try {
            const data = await this.query(query, { page, perPage });
            return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
        } catch (err) {
            console.warn('⚠️ [API Fallback] getSeasonNow via AnimeThemes:', err.message);
            let fallback = await this.fetchAnimeThemesFallback(
                `/anime?filter[year]=2025&page[size]=${perPage}&page[number]=${page}&include=images,resources,studios`
            );
            if (!fallback.anime || fallback.anime.length === 0) {
                fallback = await this.fetchAnimeThemesFallback(
                    `/anime?filter[year]=2024&page[size]=${perPage}&page[number]=${page}&include=images,resources,studios`
                );
            }
            return Promise.all((fallback.anime || []).map(a => this.formatAnimeFromAnimeThemes(a)));
        }
    },

    /**
     * Get Specific Season
     */
    async getSeason(year, season, page = 1, perPage = 50) {
        const query = `
        query ($page: Int, $perPage: Int, $year: Int, $season: MediaSeason) {
            Page (page: $page, perPage: $perPage) {
                media (season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                    id
                    title { romaji english native }
                    coverImage { extraLarge large }
                    bannerImage
                    description(asHtml: true)
                    averageScore
                    episodes
                    format
                    status
                    nextAiringEpisode { airingAt timeUntilAiring episode }
                }
            }
        }`;

        try {
            const data = await this.query(query, {
                page,
                perPage,
                year: parseInt(year),
                season: season.toUpperCase()
            });
            return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
        } catch (err) {
            console.warn('⚠️ [API Fallback] getSeason via AnimeThemes:', err.message);
            const normalizedSeason = season
                ? season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()
                : 'Winter';
            const size = Math.min(perPage, 40);
            const fallback = await this.fetchAnimeThemesFallback(
                `/anime?filter[year]=${year}&filter[season]=${normalizedSeason}&page[size]=${size}&page[number]=${page}&include=images,resources,studios`
            );
            return Promise.all((fallback.anime || []).map(a => this.formatAnimeFromAnimeThemes(a)));
        }
    },

    /**
     * Get Top Anime
     */
    async getTopAnime(page = 1, perPage = 10) {
        const query = `
        query ($page: Int, $perPage: Int) {
            Page (page: $page, perPage: $perPage) {
                media (type: ANIME, sort: SCORE_DESC, isAdult: false) {
                    id
                    title { romaji english native }
                    coverImage { extraLarge large }
                    bannerImage
                    description(asHtml: true)
                    averageScore
                    episodes
                    format
                    nextAiringEpisode { airingAt timeUntilAiring episode }
                }
            }
        }`;
        try {
            const data = await this.query(query, { page, perPage });
            return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
        } catch (err) {
            console.warn('⚠️ [API Fallback] getTopAnime via AnimeThemes:', err.message);
            const topSlugs = [
                'fullmetal_alchemist_brotherhood',
                'steinsgate',
                'shingeki_no_kyojin',
                'hunter_x_hunter_2011',
                'bleach',
                'jujutsu_kaisen',
                'cowboy_bebop',
                'death_note',
                'code_geass_hangyaku_no_lelouch',
                'neon_genesis_evangelion'
            ].join(',');
            const fallback = await this.fetchAnimeThemesFallback(
                `/anime?filter[slug]=${topSlugs}&page[size]=${perPage}&include=images,resources,studios`
            );
            return Promise.all((fallback.anime || []).map(a => this.formatAnimeFromAnimeThemes(a)));
        }
    },

    /**
     * Get Anime Details (Full)
     */
    async getAnimeById(id) {
        const query = `
        query ($id: Int) {
            Media (id: $id, type: ANIME, isAdult: false) {
                id
                idMal
                title { romaji english native }
                coverImage { extraLarge large }
                bannerImage
                description(asHtml: true)
                averageScore
                episodes
                duration
                status
                format
                season
                seasonYear
                genres
                studios(isMain: true) { nodes { name } }
                trailer { id site }
                nextAiringEpisode { airingAt timeUntilAiring episode }
                
                relations {
                    edges {
                        relationType
                        node {
                            id
                            title { romaji }
                            coverImage { medium }
                            format
                            status
                        }
                    }
                }

                recommendations(sort: RATING_DESC, page: 1, perPage: 7) {
                    nodes {
                        mediaRecommendation {
                            id
                            title { romaji }
                            coverImage { large }
                            averageScore
                        }
                    }
                }
                
                characters(sort: ROLE, page: 1, perPage: 50) {
                    pageInfo {
                        total
                        perPage
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    edges {
                        role
                        node {
                            id
                            name { full }
                            image { large }
                        }
                        voiceActors(language: JAPANESE, sort: RELEVANCE) {
                            id
                            name { full }
                            image { medium }
                        }
                    }
                }
            }
        }`;

        let formatted = null;

        try {
            const data = await this.query(query, { id: parseInt(id) });
            formatted = await this.formatAnime(data.Media);
        } catch (err) {
            console.warn('⚠️ [API Fallback] getAnimeById via AnimeThemes:', err.message);
            let fallback = await this.fetchAnimeThemesFallback(
                `/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${encodeURIComponent(id)}&include=images,resources,studios`
            );
            let atAnime = fallback.anime?.[0];

            if (!atAnime) {
                fallback = await this.fetchAnimeThemesFallback(
                    `/anime?filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${encodeURIComponent(id)}&include=images,resources,studios`
                );
                atAnime = fallback.anime?.[0];
            }

            if (!atAnime) {
                try {
                    const byIdRes = await this.fetchAnimeThemesFallback(
                        `/anime?filter[anime][id]=${encodeURIComponent(id)}&include=images,resources,studios`
                    );
                    atAnime = byIdRes.anime?.[0];
                } catch (_) {
                    // Ignore
                }
            }

            if (atAnime) {
                formatted = await this.formatAnimeFromAnimeThemes(atAnime);
            }
        }

        if (!formatted) return null;

        // Trigger translation for details page specific workflow
        if (window.Translation) {
            const cleanSynopsis = formatted.synopsis.replace(/<[^>]*>/g, '').replace(/\(Source:.*?\)/g, '').trim();
            formatted.synopsis = await window.Translation.translate(cleanSynopsis, formatted.id);

            // Translate Genres
            if (formatted.genres && formatted.genres.length > 0) {
                formatted.genres = await Promise.all(
                    formatted.genres.map(g => window.Translation.translate(g, `genre_${g}`, 'en', null))
                );
            }
        }

        return formatted;
    },

    /**
     * Get Character Details
     */
    async getCharacterById(id) {
        const query = `
        query ($id: Int) {
            Character (id: $id) {
                id
                name { full native }
                image { large }
                description
                gender
                dateOfBirth { year month day }
                age
                bloodType
                siteUrl
                favourites
                media (page: 1, perPage: 12, sort: POPULARITY_DESC, type: ANIME) {
                    edges {
                        node {
                            id
                            title { romaji }
                            coverImage { medium }
                            format
                        }
                        voiceActors (sort: LANGUAGE) {
                            id
                            name { full }
                            image { medium }
                            languageV2
                        }
                    }
                }
            }
        }`;

        try {
            const data = await this.query(query, { id: parseInt(id) });
            return data.Character;
        } catch (err) {
            console.warn('⚠️ [API Fallback] getCharacterById indisponível:', err.message);
            return null;
        }
    },

    /**
     * Get Staff Media (Anime/Manga the staff worked on) with Pagination
     */
    async getStaffMedia(id, sort = "POPULARITY_DESC", page = 1) {
        const query = `
        query ($id: Int, $sort: [MediaSort], $page: Int) {
            Staff (id: $id) {
                staffMedia (page: $page, perPage: 12, sort: $sort) {
                    pageInfo {
                        hasNextPage
                    }
                    edges {
                        staffRole
                        node {
                            id
                            title { romaji }
                            coverImage { medium }
                            format
                        }
                    }
                }
            }
        }`;

        try {
            const data = await this.query(query, { id: parseInt(id), sort: [sort], page });
            return data.Staff.staffMedia;
        } catch (err) {
            console.warn('⚠️ [API Fallback] getStaffMedia indisponível:', err.message);
            return { pageInfo: { hasNextPage: false }, edges: [] };
        }
    },

    /**
     * Get Characters for an Anime (Pagination)
     */
    async getCharacters(id, page = 1, perPage = 50) {
        const query = `
        query ($id: Int, $page: Int, $perPage: Int) {
            Media (id: $id) {
                id
                characters(sort: ROLE, page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        perPage
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    edges {
                        role
                        node {
                            id
                            name { full }
                            image { large }
                        }
                        voiceActors(language: JAPANESE, sort: RELEVANCE) {
                            id
                            name { full }
                            image { medium }
                            languageV2
                        }
                    }
                }
            }
        }`;

        try {
            const data = await this.query(query, { id: parseInt(id), page, perPage });
            return data.Media.characters;
        } catch (err) {
            console.warn('⚠️ [API Fallback] getCharacters indisponível:', err.message);
            return { pageInfo: { total: 0, perPage, currentPage: page, lastPage: 1, hasNextPage: false }, edges: [] };
        }
    },

    /**
     * Search Anime
     */
    async searchAnime(search, page = 1, perPage = 20) {
        const query = `
        query ($search: String, $page: Int, $perPage: Int) {
            Page (page: $page, perPage: $perPage) {
                media (search: $search, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
                    id
                    title { romaji english native }
                    coverImage { extraLarge large }
                    averageScore
                    episodes
                    format
                    status
                    nextAiringEpisode { airingAt timeUntilAiring episode }
                }
            }
        }`;

        try {
            const data = await this.query(query, { search, page, perPage });
            return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
        } catch (err) {
            console.warn('⚠️ [API Fallback] searchAnime via AnimeThemes:', err.message);
            const size = Math.min(perPage, 25);
            const fallback = await this.fetchAnimeThemesFallback(
                `/anime?q=${encodeURIComponent(search)}&page[size]=${size}&page[number]=${page}&include=images,resources,studios`
            );
            return Promise.all((fallback.anime || []).map(a => this.formatAnimeFromAnimeThemes(a)));
        }
    },

    /**
     * Get Genres
     */
    async getGenres() {
        const query = `
            query {
                GenreCollection
            }
        `;

        try {
            const data = await this.query(query);
            return data.GenreCollection.map(g => ({ mal_id: g, name: g }));
        } catch (error) {
            console.warn('⚠️ [API Fallback] getGenres estático:', error.message);
            return [
                'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
                'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
                'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
            ].map(g => ({ mal_id: g, name: g }));
        }
    },

    /**
     * Get Airing Schedule (for Calendar)
     */
    async getAiringSchedule(start, end) {
        const query = `
        query ($start: Int, $end: Int) {
            Page(page: 1, perPage: 50) {
                airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME, notYetAired: true) {
                    id
                    airingAt
                    episode
                    media {
                        id
                        title { romaji }
                        coverImage { medium }
                        averageScore
                    }
                }
            }
        }`;
        try {
            const data = await this.query(query, { start, end });
            return data.Page.airingSchedules;
        } catch (err) {
            console.warn('⚠️ [API Fallback] getAiringSchedule via getSeasonNow:', err.message);
            const seasonList = await this.getSeasonNow(1, 14);
            return (seasonList || []).map((a, idx) => ({
                id: a.id,
                airingAt: start + (idx * 10800),
                episode: 1,
                media: {
                    id: a.id,
                    title: { romaji: a.title },
                    coverImage: { medium: a.image },
                    averageScore: 85
                }
            }));
        }
    },

    /**
     * Get Random Anime
     * Simulates random by picking a random page from top 5000 popular anime
     */
    async getRandomAnime() {
        const randomPage = Math.floor(Math.random() * 500) + 1;
        const query = `
        query ($page: Int) {
            Page (page: $page, perPage: 1) {
                media (type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                    id
                    title { romaji english native }
                    coverImage { extraLarge large }
                    averageScore
                    episodes
                    format
                    status
                    description(asHtml: true)
                    genres
                    seasonYear
                }
            }
        }`;

        try {
            const data = await this.query(query, { page: randomPage });
            if (data.Page.media.length > 0) {
                return this.formatAnime(data.Page.media[0]);
            }
            return this.getTrending(1, 1).then(res => res[0]);
        } catch (e) {
            console.warn('⚠️ [API Fallback] getRandomAnime via getTrending:', e.message);
            const fallback = await this.getTrending(1, 10);
            return fallback[Math.floor(Math.random() * fallback.length)] || fallback[0];
        }
    }
};

window.API = API;
