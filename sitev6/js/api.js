/**
 * AnimeEngine v6 - AniList API Integration (GraphQL)
 * Docs: https://anilist.gitbook.io/anilist-apiv2-docs/
 */

const API = {
    baseURL: 'https://graphql.anilist.co',
    
    // Helper para delay (rate limit)
    delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Helper genérico para requisições GraphQL
     */
    async query(query, variables = {}) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

        const response = await fetch(this.baseURL, options);
        const json = await response.json();
        
        if (!response.ok) {
            // Handle rate limits specially
             if (response.status === 429) {
                console.warn('⚠️ Rate Limited. Waiting...');
                await new Promise(r => setTimeout(r, 2000)); // Simple retry wait
                return this.query(query, variables); // Retry once
             }
            throw new Error(json.errors ? json.errors[0].message : 'Network response was not ok');
        }
        
        return json.data;
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

        return {
            id: media.id, // AniList ID
            mal_id: media.idMal, // Backup for cross-ref
            title: media.title?.romaji || media.title?.english || media.title?.native || 'Sem Título',
            title_english: media.title?.english,
            title_native: media.title?.native,
            image: media.coverImage?.extraLarge || media.coverImage?.large || 'img/placeholder.jpg',
            banner: media.bannerImage || 'img/banner-placeholder.jpg',
            synopsis: media.description || 'Sinopse não disponível.', // HTML format
            score: media.averageScore ? (media.averageScore / 10).toFixed(1) : '?',
            episodes: media.episodes,
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
                    averageScore
                    episodes
                    format
                }
            }
        }`;
        const data = await this.query(query, { page, perPage });
        return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
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
                    averageScore
                    episodes
                    format
                }
            }
        }`;
        const data = await this.query(query, { page, perPage });
        return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
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
                    averageScore
                    episodes
                    format
                }
            }
        }`;
        const data = await this.query(query, { page, perPage });
        return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
    },

    /**
     * Get Anime Details (Full)
     */
    async getAnimeById(id) {
        const query = `
        query ($id: Int) {
            Media (id: $id, type: ANIME) {
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
                
                characters(sort: ROLE, page: 1, perPage: 10) {
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
        
        const data = await this.query(query, { id: parseInt(id) });
        const formatted = await this.formatAnime(data.Media);
        
        // Trigger translation for details page specific workflow
        if (window.Translation) {
             // We start the translation but don't wait for it to return in the initial object
             // The UI should handle the update or we wait here.
             // Let's wait here for better UX on first load (slower but translated)
             // or standard approach: return text, UI updates using Translation.translate()
             formatted.synopsis_pt = await window.Translation.translate(formatted.synopsis.replace(/<[^>]*>/g, ''), formatted.id);
        }
        
        return formatted;
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
                }
            }
        }`;
        
        const data = await this.query(query, { search, page, perPage });
        return Promise.all(data.Page.media.map(m => this.formatAnime(m)));
    },
    
    /**
     * Get Airing Schedule (for Calendar)
     * Get episodes airing in the current week range
     */
    async getAiringSchedule(start, end) {
        const query = `
        query ($start: Int, $end: Int) {
            Page(page: 1, perPage: 50) {
                airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
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
        const data = await this.query(query, { start, end });
        return data.Page.airingSchedules;
    },

    /**
     * Get Random Anime from User List (or generic random if not logged in/migrated)
     * Since we don't have user list linked to AniList account (we use local storage),
     * we will implement a "Random Popular" or "Random Recommendation" if needed by API.
     * But the feature request is "Random from Plan to Watch". That logic belongs in the App/Storage layer, not API.
     * 
     * However, we can add a generic random finder here too.
     */
    async getRandomAnime() {
        // AniList doesn't have a direct /random endpoint like Jikan easily accessible without querying a random ID range or using a trick.
        // A common trick is to query a random page of popular anime or a random ID.
        // Let's stick to "Random Popular" for now if needed.
        const randomPage = Math.floor(Math.random() * 50) + 1;
        const data = await this.getTrending(randomPage, 1);
        return data[0];
    }
};

window.API = API;
