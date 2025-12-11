/**
 * Translation Service for AnimeEngine v6
 * Handles text translation with local caching to minimize API usage.
 */

const Translation = {
    CACHE_PREFIX: 'ae_trans_',
    API_URL: 'https://api.mymemory.translated.net/get', // Using MyMemory free tier

    /**
     * Translate text from source lang to target lang
     * @param {string} text Text to translate
     * @param {number} id Anime ID (for caching)
     * @param {string} from Source language (default: en)
     * @param {string} to Target language (default: pt-br)
     */
    async translate(text, id, from = 'en', to = 'pt-br') {
        if (!text) return '';
        
        // 1. Check Cache
        const cacheKey = `${this.CACHE_PREFIX}${id}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            // console.log(`📖 Cache hit for translation: ${id}`);
            return cached;
        }

        // 2. Fetch from API
        try {
            // console.log(`🌍 Translating for ${id}...`);
            const response = await fetch(`${this.API_URL}?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
            const data = await response.json();
            
            if (data && data.responseData && data.responseData.translatedText) {
                const translated = data.responseData.translatedText;
                
                // 3. Save to Cache
                try {
                    localStorage.setItem(cacheKey, translated);
                } catch (e) {
                    // Handle quota exceeded
                    console.warn('LocalStorage full, clearing old translations...');
                    this.clearOldCache();
                    try {
                        localStorage.setItem(cacheKey, translated);
                    } catch (e2) {}
                }
                
                return translated;
            }
        } catch (error) {
            console.error('Translation API Error:', error);
        }

        // Fallback: return original text
        return text;
    },

    /**
     * Clear old translations if space is needed
     * (Simple strategy: clear all)
     */
    clearOldCache() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};

window.Translation = Translation;
