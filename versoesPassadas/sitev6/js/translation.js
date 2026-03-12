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
    async translate(text, id, from = 'en', to = null) {
        if (!text) return '';
        
        // Get target language from settings if not provided
        if (!to) {
            const settings = Storage.getSettings ? Storage.getSettings() : { language: 'pt-br' };
            to = settings.language;
        }

        // If target is same as source (e.g. user set to English), return original
        if (from === to) return text;
        
        // 1. Check Cache
        const cacheKey = `${this.CACHE_PREFIX}${id}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            // Check if cached value is actually an error message
            if (cached.includes('QUERY LENGTH LIMIT EXCEEDED') || cached.includes('MYMEMORY')) {
                // Invalid cache, proceed to fetch (or return original if too long)
                // console.log(`🗑️ Clearing invalid cache for ${id}`);
                localStorage.removeItem(cacheKey);
            } else {
                 // console.log(`📖 Cache hit for translation: ${id}`);
                return cached;
            }
        }

        // 2. Fetch from API
        try {
            // MyMemory Free Limit is ~500 chars. 
            // If text is longer, user prefers Original Full text over Truncated Translation.
            if (text.length > 500) {
                // console.warn('Text too long for free translation (skipped):', text.length);
                return text; 
            }
            
            // console.log(`🌍 Translating for ${id}...`);
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    q: text,
                    langpair: `${from}|${to}`
                })
            });
            
            const data = await response.json();
            
            if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                const translated = data.responseData.translatedText;
                
                // CRITICAL: Check if API returned an error message as text
                if (translated.includes('QUERY LENGTH LIMIT EXCEEDED') || translated.includes('MYMEMORY')) {
                    console.warn('Translation API Limit Hit, reverting to original.');
                    return text;
                }

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
            } else {
                 console.warn(`Translation API Error/Limit: ${data.responseDetails}`);
                 return text; // Return original on error
            }
        } catch (error) {
            console.error('Translation API Network Error:', error);
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
