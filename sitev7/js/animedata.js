/**
 * AnimeEngine v6 - AnimeData Module
 * Dados de episódios e fillers para animes populares
 * Usado para mostrar informações precisas na calculadora
 */

const AnimeData = {
    // Dados de animes com episódios e fillers
    animes: {
        // One Piece
        'one piece': {
            episodes: 1122,
            status: 'Airing',
            fillerRanges: [[54,61], [98,99], [102,102], [131,143], [196,206], [213,216], [220,226], [279,283], [291,292], [303,303], [317,319], [326,336], [382,384], [406,407], [426,429], [457,458], [492,496], [506,506], [542,542], [575,578], [590,590], [626,628], [747,750], [775,778], [780,782], [807,807], [881,891], [895,896], [907,907]],
            avgDuration: 24
        },
        
        // Naruto
        'naruto': {
            episodes: 220,
            status: 'Completed',
            fillerRanges: [[26,26], [97,106], [136,220]],
            avgDuration: 23
        },
        
        // Naruto Shippuden
        'naruto shippuden': {
            episodes: 500,
            status: 'Completed',
            fillerRanges: [[57,71], [91,112], [144,151], [170,171], [176,196], [223,242], [257,260], [271,271], [279,281], [284,295], [303,320], [347,361], [376,377], [388,390], [394,413], [416,417], [422,423], [427,457], [460,462], [464,469], [480,483]],
            avgDuration: 23
        },
        
        // Bleach
        'bleach': {
            episodes: 366,
            status: 'Completed',
            fillerRanges: [[33,33], [50,50], [64,109], [128,137], [168,189], [204,205], [213,214], [227,266], [287,287], [298,299], [303,305], [311,342], [355,355]],
            avgDuration: 24
        },
        
        // Bleach TYBW
        'bleach: thousand-year blood war': {
            episodes: 52,
            status: 'Airing',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Dragon Ball Z
        'dragon ball z': {
            episodes: 291,
            status: 'Completed',
            fillerRanges: [[10,17], [20,20], [39,44], [100,100], [102,102], [108,117], [125,125], [170,171], [174,194], [202,202], [204,204], [206,209], [211,219], [221,229], [231,238], [240,250], [252,253], [255,286], [288,288]],
            avgDuration: 24
        },
        
        // Dragon Ball Super
        'dragon ball super': {
            episodes: 131,
            status: 'Completed',
            fillerRanges: [[68,76]],
            avgDuration: 24
        },
        
        // Fairy Tail
        'fairy tail': {
            episodes: 328,
            status: 'Completed',
            fillerRanges: [[9,9], [19,20], [49,50], [69,75], [125,150], [202,226], [246,265], [268,270], [273,275], [277,283], [285,286], [288,290]],
            avgDuration: 24
        },
        
        // Hunter x Hunter (2011)
        'hunter x hunter': {
            episodes: 148,
            status: 'Completed',
            fillerRanges: [[13,13], [26,26], [37,37], [100,100]],
            avgDuration: 23
        },
        
        // Gintama
        'gintama': {
            episodes: 367,
            status: 'Completed',
            fillerRanges: [[4,4], [6,11], [13,16], [18,18], [30,30], [42,42], [50,51], [57,57], [66,66], [69,69], [75,75], [82,82], [87,87], [106,106], [112,112], [114,114], [116,117], [119,119], [127,127], [130,130], [134,134], [136,136], [150,151], [164,164], [167,167], [170,170], [173,173], [179,179], [186,186], [188,188], [190,190], [193,193], [196,198], [206,206], [210,210], [218,218], [221,221], [224,224], [239,239], [242,243], [246,246]],
            avgDuration: 24
        },
        
        // Boruto
        'boruto': {
            episodes: 293,
            status: 'Completed',
            fillerRanges: [[16,18], [40,42], [48,52], [67,69], [96,97], [104,105], [112,119], [138,147], [156,156], [168,169], [176,178], [220,227], [232,250], [268,273], [280,283], [285,288], [290,293]],
            avgDuration: 23
        },
        
        // Black Clover
        'black clover': {
            episodes: 170,
            status: 'Completed',
            fillerRanges: [[29,29], [66,66], [68,68], [82,82], [123,125], [131,131], [134,134], [142,148], [150,153], [156,157], [164,164]],
            avgDuration: 24
        },
        
        // My Hero Academia
        'boku no hero academia': {
            episodes: 138,
            status: 'Airing',
            fillerRanges: [[39,39], [58,58], [64,64]],
            avgDuration: 24
        },
        
        // Demon Slayer
        'kimetsu no yaiba': {
            episodes: 55,
            status: 'Airing',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Attack on Titan
        'shingeki no kyojin': {
            episodes: 88,
            status: 'Completed',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Jujutsu Kaisen
        'jujutsu kaisen': {
            episodes: 47,
            status: 'Airing',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Chainsaw Man
        'chainsaw man': {
            episodes: 12,
            status: 'Airing',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Spy x Family
        'spy x family': {
            episodes: 37,
            status: 'Airing',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Fullmetal Alchemist Brotherhood
        'fullmetal alchemist: brotherhood': {
            episodes: 64,
            status: 'Completed',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Death Note
        'death note': {
            episodes: 37,
            status: 'Completed',
            fillerRanges: [],
            avgDuration: 22
        },
        
        // Code Geass
        'code geass': {
            episodes: 50,
            status: 'Completed',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Steins;Gate
        'steins;gate': {
            episodes: 24,
            status: 'Completed',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Cowboy Bebop
        'cowboy bebop': {
            episodes: 26,
            status: 'Completed',
            fillerRanges: [],
            avgDuration: 24
        },
        
        // Neon Genesis Evangelion
        'neon genesis evangelion': {
            episodes: 26,
            status: 'Completed',
            fillerRanges: [],
            avgDuration: 24
        }
    },

    /**
     * Busca dados de um anime pelo título
     */
    getAnimeData(title) {
        const normalizedTitle = title.toLowerCase().trim();
        
        // Busca exata
        if (this.animes[normalizedTitle]) {
            return this.animes[normalizedTitle];
        }
        
        // Busca parcial
        for (const key of Object.keys(this.animes)) {
            if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
                return this.animes[key];
            }
        }
        
        return null;
    },

    /**
     * Conta o total de episódios filler
     */
    getFillerCount(title) {
        const data = this.getAnimeData(title);
        if (!data || !data.fillerRanges) return 0;
        
        let count = 0;
        data.fillerRanges.forEach(range => {
            count += (range[1] - range[0]) + 1;
        });
        return count;
    },

    /**
     * Retorna porcentagem de filler
     */
    getFillerPercentage(title) {
        const data = this.getAnimeData(title);
        if (!data) return 0;
        
        const fillerCount = this.getFillerCount(title);
        return Math.round((fillerCount / data.episodes) * 100);
    },

    /**
     * Formata informações para exibição
     */
    formatAnimeInfo(title) {
        const data = this.getAnimeData(title);
        if (!data) {
            return { found: false };
        }
        
        const fillerCount = this.getFillerCount(title);
        const canonCount = data.episodes - fillerCount;
        const fillerPercent = this.getFillerPercentage(title);
        const totalHours = Math.round((data.episodes * data.avgDuration) / 60);
        const canonHours = Math.round((canonCount * data.avgDuration) / 60);
        
        return {
            found: true,
            episodes: data.episodes,
            status: data.status,
            fillerCount,
            canonCount,
            fillerPercent,
            totalHours,
            canonHours,
            avgDuration: data.avgDuration
        };
    }
};

// Expor globalmente
window.AnimeData = AnimeData;

