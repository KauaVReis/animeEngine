/**
 * AnimeEngine v4 - Storage Module
 * Sistema de persistência de dados usando localStorage
 */

const Storage = {
    STORAGE_KEY: 'animeEngine_v4',

    // Estrutura padrão dos dados
    defaultData: {
        playlist: [],
        globalEp: 0,
        settings: {
            pace: 3,
            skipFillers: false,
            skipOP: false
        },
        history: [],      // Animes completos
        favorites: [],    // Animes favoritos
        achievements: {
            unlocked: [],
            xp: 0,
            totalEpisodes: 0,
            totalMinutes: 0
        },
        theme: 'default',
        lastSaved: null
    },

    /**
     * Salva todos os dados no localStorage
     * @param {Object} data - Dados a serem salvos
     */
    save(data) {
        try {
            const saveData = {
                ...data,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
            console.log('💾 AnimeEngine: Dados salvos!');
            return true;
        } catch (error) {
            console.error('❌ AnimeEngine: Erro ao salvar:', error);
            return false;
        }
    },

    /**
     * Carrega dados do localStorage
     * @returns {Object} Dados carregados ou dados padrão
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                console.log('📂 AnimeEngine: Dados carregados!', data);
                // Merge para garantir que novas propriedades existam
                return this.mergeWithDefaults(data);
            }
        } catch (error) {
            console.error('❌ AnimeEngine: Erro ao carregar:', error);
        }
        console.log('🆕 AnimeEngine: Usando dados padrão');
        return { ...this.defaultData };
    },

    /**
     * Combina dados salvos com defaults (para compatibilidade com atualizações)
     */
    mergeWithDefaults(savedData) {
        return {
            ...this.defaultData,
            ...savedData,
            settings: {
                ...this.defaultData.settings,
                ...(savedData.settings || {})
            },
            achievements: {
                ...this.defaultData.achievements,
                ...(savedData.achievements || {})
            }
        };
    },

    /**
     * Limpa todos os dados salvos
     */
    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('🗑️ AnimeEngine: Dados limpos!');
            return true;
        } catch (error) {
            console.error('❌ AnimeEngine: Erro ao limpar:', error);
            return false;
        }
    },

    /**
     * Exporta dados para arquivo JSON
     */
    export() {
        const data = this.load();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `animeengine_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Importa dados de arquivo JSON
     * @param {File} file - Arquivo JSON
     */
    async import(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.save(data);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
};

// Exporta para uso global ou como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
