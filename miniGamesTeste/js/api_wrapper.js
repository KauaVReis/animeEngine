/**
 * API Wrapper for MiniGames Sandbox
 * Includes mock/standalone implementations of AniList API interactions.
 */

const API = {
    baseURL: 'https://graphql.anilist.co',

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
            console.error('API Error', json);
            if (response.status === 429) {
                console.warn('⚠️ Rate Limited. Waiting...');
                await new Promise(r => setTimeout(r, 2000));
                return this.query(query, variables);
            }
            throw new Error(json.errors ? json.errors[0].message : 'Network response was not ok');
        }

        return json.data;
    },

    getDailySeed() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlDate = urlParams.get('date');

        let date = new Date();
        if (urlDate) {
            // Parse YYYY-MM-DD safely to local time to avoid timezone shifts
            const parts = urlDate.split('-');
            if (parts.length === 3) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
        }

        const str = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        console.log("Seed Date String:", str);

        // Update UI Badge if exists
        const badge = document.getElementById('date-badge');
        if (badge) badge.textContent = urlDate ? `📅 ${urlDate}` : '📅 Hoje';

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    /**
     * Get Popular Characters (for CharacterDle Target)
     */
    async getDailyCharacters(seed) {
        const page = (seed % 20) + 1;
        const query = `
        query ($page: Int) {
            Page (page: $page, perPage: 50) {
                characters(sort: FAVOURITES_DESC) {
                    id
                    name { full native }
                    image { large }
                    favourites
                    gender
                    age
                    dateOfBirth { year month day }
                    bloodType
                    media(sort: POPULARITY_DESC, type: ANIME, perPage: 1) {
                        nodes {
                            id
                            title { romaji }
                            seasonYear
                            genres
                            studios { nodes { name } }
                        }
                    }
                }
            }
        }`;

        const data = await this.query(query, { page });
        return data.Page.characters;
    },

    /**
     * Search Character (For User Guessing & Autocomplete)
     */
    async searchCharacter(search) {
        const query = `
        query ($search: String) {
            Page (page: 1, perPage: 5) {
                characters(search: $search, sort: FAVOURITES_DESC) {
                    id
                    name { full native }
                    image { large }
                    gender
                    age
                    dateOfBirth { year month day }
                    bloodType
                    media(sort: POPULARITY_DESC, type: ANIME, perPage: 1) {
                        nodes {
                            id
                            title { romaji }
                            seasonYear
                            genres
                            studios { nodes { name } }
                        }
                    }
                }
            }
        }`;

        const data = await this.query(query, { search });
        // Return first match for direct guess, or logic can handle list if updated
        return data.Page.characters[0];
    },

    /**
     * Search Anime (For Autocomplete/Pixel Cover)
     */
    async searchAnime(search, page = 1, perPage = 5) {
        const query = `
        query ($search: String, $page: Int, $perPage: Int) {
            Page (page: $page, perPage: $perPage) {
                media (search: $search, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
                    id
                    title { romaji }
                    coverImage { medium }
                }
            }
        }`;

        const data = await this.query(query, { search, page, perPage });
        return data.Page.media;
    },

    /**
     * Get Random Anime (for Pixel Cover / Music Quiz fallback)
     */
    async getRandomAnime(seed) {
        const page = (seed % 100) + 1;
        const query = `
        query ($page: Int) {
            Page (page: $page, perPage: 50) {
                media (type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                    id
                    title { romaji english native }
                    coverImage { extraLarge large }
                    bannerImage
                }
            }
        }`;
        const data = await this.query(query, { page });
        return data.Page.media;
    }
};

window.API = API;
