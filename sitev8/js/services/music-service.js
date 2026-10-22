/**
 * AnimeEngine v8 — MusicService
 * Camada unificada de dados musicais (AnimeThemes API + AniList GraphQL).
 * 
 * Responsabilidades:
 *  - Buscar Openings (OP) e Endings (ED) reais na AnimeThemes API (https://api.animethemes.moe)
 *  - Enriquecer metadados visuais (capa, banner, título, ano) via AniList GraphQL em lote
 *  - Separar estritamente OP/ED reais (.webm de v.animethemes.moe) de trailers promocionais (YouTube)
 *  - Providenciar estações temáticas (Aleatória, Populares, Temporada, Minha Lista)
 *  - Cache em memória e sessionStorage para evitar requisições redundantes e rate-limits
 */

const MusicService = (function () {
    'use strict';

    const ANIMETHEMES_BASE = 'https://api.animethemes.moe';
    const ANILIST_BASE = 'https://graphql.anilist.co';
    const DEFAULT_COVER = 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png';

    // Caches em memória
    const animeThemesCache = new Map(); // anilistId -> { themes: Track[], trailerFallback: Track|null }
    const anilistMetaCache = new Map(); // anilistId -> { id, title, cover, banner, year }
    const searchCache = new Map();      // queryKey -> Track[]

    // =========================================================
    // CACHE HELPERS (sessionStorage)
    // =========================================================
    function loadSessionCache() {
        try {
            const raw = sessionStorage.getItem('ae_music_anilist_meta_v8');
            if (raw) {
                const parsed = JSON.parse(raw);
                Object.entries(parsed).forEach(([k, v]) => anilistMetaCache.set(Number(k), v));
            }
        } catch (e) { }
    }

    function saveSessionCache() {
        try {
            const obj = {};
            anilistMetaCache.forEach((v, k) => { obj[k] = v; });
            sessionStorage.setItem('ae_music_anilist_meta_v8', JSON.stringify(obj));
        } catch (e) { }
    }

    loadSessionCache();

    // =========================================================
    // NORMALIZAÇÃO DE FAIXAS (TRACK CONTRACT)
    // =========================================================
    /**
     * Escolhe o melhor vídeo dentro das entries de um animetheme
     * Prioriza: link válido -> Creditless (nc) -> maior resolução
     */
    function selectBestVideo(themeObj) {
        const entries = themeObj?.animethemeentries || [];
        const candidates = [];

        for (const entry of entries) {
            const videos = entry?.videos || [];
            for (const video of videos) {
                if (video && video.link && typeof video.link === 'string') {
                    candidates.push({
                        video,
                        version: entry.version || 1,
                        episodes: entry.episodes || '',
                        spoiler: Boolean(entry.spoiler),
                        nsfw: Boolean(entry.nsfw)
                    });
                }
            }
        }

        if (candidates.length === 0) return null;

        candidates.sort((a, b) => {
            if (a.nsfw !== b.nsfw) return a.nsfw ? 1 : -1;
            if (Boolean(b.video.nc) !== Boolean(a.video.nc)) return b.video.nc ? 1 : -1;
            return (b.video.resolution || 720) - (a.video.resolution || 720);
        });

        return candidates[0];
    }

    /**
     * Normaliza um objeto animetheme da AnimeThemes API no contrato Track do AnimeEngine v8
     */
    function normalizeAnimeTheme(themeObj, animeObj = null, anilistMeta = null) {
        const best = selectBestVideo(themeObj);
        if (!best) return null;

        const parentAnime = animeObj || themeObj.anime || {};
        const resources = parentAnime.resources || [];
        const anilistRes = resources.find(r =>
            (r.site && r.site.toLowerCase() === 'anilist') ||
            (r.link && r.link.includes('anilist.co/anime/'))
        );

        const anilistId = anilistMeta?.id ||
            anilistRes?.external_id ||
            (anilistRes?.link ? Number((anilistRes.link.match(/anime\/(\d+)/) || [])[1]) : null) ||
            null;

        const cachedMeta = anilistId ? anilistMetaCache.get(Number(anilistId)) : null;
        const meta = anilistMeta || cachedMeta || null;

        const rawType = (themeObj.type || (themeObj.slug ? themeObj.slug.slice(0, 2) : 'OP')).toUpperCase();
        const themeType = rawType === 'ED' ? 'ED' : 'OP';
        const sequence = themeObj.sequence || 1;
        const themeSlug = themeObj.slug || `${themeType}${sequence}`;

        const songTitle = themeObj.song?.title || `${themeSlug}`;
        const artists = themeObj.song?.artists || [];
        const artistName = artists.length > 0
            ? artists.map(a => a.name).join(', ')
            : (parentAnime.name || meta?.title || 'Anime Theme');

        const animeTitle = meta?.title || parentAnime.name || 'Anime Desconhecido';
        const animeImages = Array.isArray(parentAnime.images) ? parentAnime.images : [];
        const atLargeCover = animeImages.find(img => img.facet === 'Large Cover')?.link || animeImages[0]?.link || null;
        const cover = meta?.cover || meta?.image || atLargeCover || DEFAULT_COVER;
        const banner = meta?.banner || cover;
        const animeYear = meta?.year || parentAnime.year || null;

        return {
            id: `at_${themeObj.id || best.video.id || Math.random().toString(36).slice(2, 9)}`,
            sourceType: 'animethemes',
            isFallbackTrailer: false,
            themeType,
            themeSlug,
            themeLabel: themeSlug,
            sequence,
            songTitle,
            artist: artistName,
            artistName,
            animeId: anilistId ? Number(anilistId) : null,
            animeTitle,
            animeYear,
            cover,
            banner,
            mediaUrl: best.video.link,
            youtubeId: null,
            resolution: best.video.resolution || 720,
            nc: Boolean(best.video.nc),
            audioUrl: best.video.audio?.link || best.video.link.replace('https://v.animethemes.moe/', 'https://a.animethemes.moe/').replace(/\.webm$/i, '.ogg')
        };
    }

    /**
     * Cria um Track explícito de fallback para YouTube (ex: quando AnimeThemes não possui a faixa ou em modo de contingência)
     */
    function createYouTubeTrack({ youtubeId, songTitle, artist, animeId, animeTitle, cover, themeType = 'OP', themeSlug = 'OP1', isFallbackTrailer = false }) {
        if (!youtubeId) return null;
        return {
            id: `yt_${youtubeId}`,
            sourceType: 'youtube',
            isFallbackTrailer: Boolean(isFallbackTrailer),
            themeType: isFallbackTrailer ? 'TRAILER' : themeType,
            themeSlug: isFallbackTrailer ? 'PV' : themeSlug,
            sequence: 1,
            songTitle: songTitle || (isFallbackTrailer ? `${animeTitle} (Trailer Oficial)` : `${animeTitle} Theme`),
            artist: artist || animeTitle || 'YouTube',
            animeId: animeId ? Number(animeId) : null,
            animeTitle: animeTitle || 'Anime',
            animeYear: null,
            cover: cover || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
            banner: cover || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
            mediaUrl: null,
            youtubeId,
            resolution: 720,
            nc: false
        };
    }

    /**
     * Extrai o ID do vídeo de qualquer URL do YouTube
     */
    function extractYouTubeId(urlOrId) {
        if (!urlOrId || typeof urlOrId !== 'string') return null;
        const trimmed = urlOrId.trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
        if (trimmed.includes('watch?v=')) return trimmed.split('watch?v=')[1].split('&')[0];
        if (trimmed.includes('embed/')) return trimmed.split('embed/')[1].split('?')[0];
        if (trimmed.includes('youtu.be/')) return trimmed.split('youtu.be/')[1].split('?')[0];
        return null;
    }

    // =========================================================
    // ENRIQUECIMENTO DE METADADOS VIA ANILIST (BATCH)
    // =========================================================
    let anilistSkipUntil = 0;

    async function enrichTracksWithAniList(tracks) {
        if (!Array.isArray(tracks) || tracks.length === 0) return tracks;

        const missingIds = [...new Set(
            tracks
                .map(t => t.animeId)
                .filter(id => id && !anilistMetaCache.has(Number(id)))
        )];

        if (missingIds.length > 0 && Date.now() >= anilistSkipUntil) {
            const query = `
                query ($ids: [Int]) {
                    Page(page: 1, perPage: 50) {
                        media(id_in: $ids, type: ANIME) {
                            id
                            title { romaji english }
                            coverImage { extraLarge large medium }
                            bannerImage
                            seasonYear
                        }
                    }
                }
            `;

            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 3500);
                const res = await fetch(ANILIST_BASE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, variables: { ids: missingIds.slice(0, 50) } }),
                    signal: controller.signal
                });
                clearTimeout(timer);

                if (res.ok) {
                    const json = await res.json();
                    const mediaList = json.data?.Page?.media || [];
                    mediaList.forEach(m => {
                        anilistMetaCache.set(Number(m.id), {
                            id: Number(m.id),
                            title: m.title?.romaji || m.title?.english || 'Anime',
                            cover: m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || DEFAULT_COVER,
                            banner: m.bannerImage || m.coverImage?.extraLarge || DEFAULT_COVER,
                            year: m.seasonYear || null
                        });
                    });
                    saveSessionCache();
                } else {
                    anilistSkipUntil = Date.now() + 120000;
                }
            } catch (e) {
                anilistSkipUntil = Date.now() + 120000;
                console.warn('[MusicService] AniList indisponível (usando capas nativas da AnimeThemes).');
            }
        }

        return tracks.map(t => {
            if (t.animeId && anilistMetaCache.has(Number(t.animeId))) {
                const meta = anilistMetaCache.get(Number(t.animeId));
                return {
                    ...t,
                    animeTitle: meta.title || t.animeTitle,
                    cover: meta.cover || t.cover,
                    banner: meta.banner || meta.cover || t.banner,
                    animeYear: meta.year || t.animeYear
                };
            }
            return t;
        });
    }

    // =========================================================
    // 1. BUSCAR OP/ED POR ANILIST ID (PÁGINA DE DETALHES / CARDS)
    // =========================================================
    async function getThemesByAnimeId(anilistId, animeMeta = null) {
        const numericId = Number(anilistId);
        if (numericId && animeThemesCache.has(numericId)) {
            return animeThemesCache.get(numericId);
        }

        if (numericId && animeMeta) {
            anilistMetaCache.set(numericId, {
                id: numericId,
                title: animeMeta.title || 'Anime',
                cover: animeMeta.image || animeMeta.cover || DEFAULT_COVER,
                banner: animeMeta.banner || animeMeta.image || DEFAULT_COVER,
                year: animeMeta.year || null
            });
            saveSessionCache();
        }

        let themes = [];

        // 1ª Tentativa: filtro exato por external_id do AniList na AnimeThemes API
        if (numericId) {
            try {
                const url = `${ANIMETHEMES_BASE}/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${numericId}&include=animethemes.animethemeentries.videos,animethemes.song.artists,resources`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const animeList = data.anime || [];
                    for (const animeObj of animeList) {
                        const rawThemes = animeObj.animethemes || [];
                        for (const th of rawThemes) {
                            const track = normalizeAnimeTheme(th, animeObj, animeMeta ? {
                                id: numericId,
                                title: animeMeta.title,
                                cover: animeMeta.image || animeMeta.cover,
                                banner: animeMeta.banner,
                                year: animeMeta.year
                            } : null);
                            if (track) themes.push(track);
                        }
                    }
                }
            } catch (e) {
                console.warn('[MusicService] Erro ao buscar por AniList ID na AnimeThemes:', e);
            }
        }

        // 1.5ª Tentativa: se o ID veio do Jikan v4 (MyAnimeList ID), buscar por site=MyAnimeList
        if (themes.length === 0 && numericId) {
            try {
                const malUrl = `${ANIMETHEMES_BASE}/anime?filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${numericId}&include=animethemes.animethemeentries.videos,animethemes.song.artists,resources,images`;
                const malRes = await fetch(malUrl);
                if (malRes.ok) {
                    const malData = await malRes.json();
                    for (const animeObj of (malData.anime || [])) {
                        for (const th of (animeObj.animethemes || [])) {
                            const track = normalizeAnimeTheme(th, animeObj, animeMeta ? {
                                id: numericId,
                                title: animeMeta.title,
                                cover: animeMeta.image || animeMeta.cover,
                                banner: animeMeta.banner,
                                year: animeMeta.year
                            } : null);
                            if (track) themes.push(track);
                        }
                    }
                }
            } catch (_) {}
        }

        // 2ª Tentativa: se não encontrou por external_id e temos o título do anime, busca pelo nome
        if (themes.length === 0 && animeMeta?.title) {
            try {
                const q = encodeURIComponent(animeMeta.title);
                const url = `${ANIMETHEMES_BASE}/anime?q=${q}&include=animethemes.animethemeentries.videos,animethemes.song.artists,resources,images&page[size]=3`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const firstAnime = (data.anime || [])[0];
                    if (firstAnime && Array.isArray(firstAnime.animethemes)) {
                        for (const th of firstAnime.animethemes) {
                            const track = normalizeAnimeTheme(th, firstAnime, {
                                id: numericId || null,
                                title: animeMeta.title,
                                cover: animeMeta.image || animeMeta.cover || null,
                                banner: animeMeta.banner || animeMeta.image || null,
                                year: animeMeta.year || firstAnime.year
                            });
                            if (track) themes.push(track);
                        }
                    }
                }
            } catch (e) {
                console.warn('[MusicService] Erro no fallback por nome na AnimeThemes:', e);
            }
        }

        // Ordenar: OPs primeiro (OP1, OP2...), depois EDs (ED1, ED2...)
        themes.sort((a, b) => {
            if (a.themeType !== b.themeType) return a.themeType === 'OP' ? -1 : 1;
            return (a.sequence || 1) - (b.sequence || 1);
        });

        // Preparar fallback explícito de trailer (NUNCA rotulado como OP/ED real)
        let trailerFallback = null;
        if (animeMeta?.trailer) {
            const ytId = extractYouTubeId(animeMeta.trailer);
            if (ytId) {
                trailerFallback = createYouTubeTrack({
                    youtubeId: ytId,
                    songTitle: `${animeMeta.title} — Trailer Promocional (PV)`,
                    artist: 'Trailer Oficial (Sem OP/ED na AnimeThemes)',
                    animeId: numericId,
                    animeTitle: animeMeta.title,
                    cover: animeMeta.image || animeMeta.cover,
                    isFallbackTrailer: true
                });
            }
        }

        const result = { themes, trailerFallback };
        if (numericId) {
            animeThemesCache.set(numericId, result);
        }
        return result;
    }

    // =========================================================
    // 2. BUSCA TEXTUAL DE MÚSICAS / ANIMES (RÁDIO)
    // =========================================================
    async function searchTracks(query, typeFilter = 'ALL') {
        const cleanQuery = (query || '').trim();
        if (!cleanQuery) return [];

        const cacheKey = `${cleanQuery.toLowerCase()}__${typeFilter}`;
        if (searchCache.has(cacheKey)) {
            return searchCache.get(cacheKey);
        }

        const tracks = [];
        const seenIds = new Set();

        try {
            const qParam = encodeURIComponent(cleanQuery);
            const [themeRes, animeRes] = await Promise.all([
                fetch(`${ANIMETHEMES_BASE}/animetheme?q=${qParam}&include=anime.images,animethemeentries.videos,song.artists&page[size]=12`),
                fetch(`${ANIMETHEMES_BASE}/anime?q=${qParam}&include=animethemes.animethemeentries.videos,animethemes.song.artists,resources,images&page[size]=5`)
            ]);

            if (themeRes.ok) {
                const themeData = await themeRes.json();
                const directThemes = themeData.animethemes || [];
                for (const th of directThemes) {
                    const track = normalizeAnimeTheme(th, th.anime);
                    if (track && !seenIds.has(track.mediaUrl)) {
                        seenIds.add(track.mediaUrl);
                        tracks.push(track);
                    }
                }
            }

            if (animeRes.ok) {
                const animeData = await animeRes.json();
                const matchedAnimes = animeData.anime || [];
                for (const animeObj of matchedAnimes) {
                    const animeThemes = animeObj.animethemes || [];
                    for (const th of animeThemes) {
                        const track = normalizeAnimeTheme(th, animeObj);
                        if (track && !seenIds.has(track.mediaUrl)) {
                            seenIds.add(track.mediaUrl);
                            tracks.push(track);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[MusicService] Erro ao buscar faixas:', e);
        }

        const enriched = await enrichTracksWithAniList(tracks);
        const filtered = typeFilter === 'ALL'
            ? enriched
            : enriched.filter(t => t.themeType === typeFilter);

        searchCache.set(cacheKey, filtered);
        return filtered;
    }

    // =========================================================
    // 3. DESCOBERTA / SINTONIA ALEATÓRIA E ESTAÇÕES DA RÁDIO
    // =========================================================
    async function getDiscoveryTracks({ type = 'ALL', count = 18 } = {}) {
        const tracks = [];
        const seenUrls = new Set();

        try {
            let url = `${ANIMETHEMES_BASE}/animetheme?sort=random&include=anime.images,animethemeentries.videos,song.artists&page[size]=${Math.min(count, 20)}`;
            if (type === 'OP' || type === 'ED') {
                url += `&filter[type]=${type}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const rawThemes = data.animethemes || [];
                for (const th of rawThemes) {
                    const track = normalizeAnimeTheme(th, th.anime);
                    if (track && !seenUrls.has(track.mediaUrl)) {
                        seenUrls.add(track.mediaUrl);
                        tracks.push(track);
                    }
                }
            }
        } catch (e) {
            console.warn('[MusicService] Erro ao buscar sintonia aleatória na AnimeThemes:', e);
        }

        if (tracks.length === 0) {
            return getEmergencyFallbackPool(type);
        }

        const enriched = await enrichTracksWithAniList(tracks);
        return enriched.slice(0, count);
    }

    // =========================================================
    // CATÁLOGO DE ESTAÇÕES TEMÁTICAS (RÁDIOS DIVERSAS)
    // =========================================================
    const STATIONS_CATALOG = {
        random: {
            id: 'random',
            category: 'geral',
            name: 'Sintonia Aleatória',
            badge: 'FM 88.1 • MIX GLOBAL',
            tagline: 'Descoberta contínua de Openings e Endings de todas as épocas e estilos',
            icon: 'fas fa-random',
            visualTheme: 'classic',
            globalTheme: 'default',
            accentColor: '#ff3366',
            queries: []
        },
        popular: {
            id: 'popular',
            category: 'geral',
            name: 'Top Hits Anime',
            badge: 'FM 90.5 • HALL DA FAMA',
            tagline: 'As aberturas e encerramentos mais lendários e aclamados da história',
            icon: 'fas fa-crown',
            visualTheme: 'gold',
            globalTheme: 'goldMode',
            accentColor: '#ffd700',
            queries: [
                'Fullmetal Alchemist', 'Shingeki no Kyojin', 'Death Note', 'Steins;Gate',
                'Code Geass', 'One Punch Man', 'Sword Art Online', 'Kimetsu no Yaiba',
                'Hunter x Hunter', 'Mob Psycho', 'Jujutsu Kaisen', 'Cowboy Bebop'
            ]
        },
        seasonal: {
            id: 'seasonal',
            category: 'geral',
            name: 'New Wave & Temporada',
            badge: 'FM 92.3 • NOVA GERAÇÃO',
            tagline: 'Os grandes sucessos musicais das temporadas recentes',
            icon: 'fas fa-satellite-dish',
            visualTheme: 'seasonal',
            globalTheme: 'ruanMode',
            accentColor: '#00d9ff',
            queries: [
                'Frieren', 'Dandadan', 'Solo Leveling', 'Kusuriya no Hitorigoto',
                'Kaijuu 8', 'Dungeon Meshi', 'Oshi no Ko', 'Mashle',
                'Blue Lock', 'Chainsaw Man', 'Spy x Family', 'Bocchi the Rock'
            ]
        },
        mylist: {
            id: 'mylist',
            category: 'geral',
            name: 'Minha Lista FM',
            badge: 'FM 94.7 • SUA COLEÇÃO',
            tagline: 'Trilha sonora personalizada baseada nos animes da sua biblioteca e favoritos',
            icon: 'fas fa-bookmark',
            visualTheme: 'mylist',
            globalTheme: 'developerMode',
            accentColor: '#7cfc00',
            queries: []
        },
        shonen: {
            id: 'shonen',
            category: 'tematica',
            name: 'Shonen Overdrive',
            badge: 'FM 97.1 • ROCK & BATALHA',
            tagline: 'J-Rock explosivo, guitarras distorcidas e energia máxima de combate',
            icon: 'fas fa-fire-alt',
            visualTheme: 'shonen',
            globalTheme: 'vestaMode',
            accentColor: '#ff4b2b',
            queries: [
                'Bleach', 'Naruto Shippuuden', 'Jujutsu Kaisen', 'Chainsaw Man',
                'Shingeki no Kyojin', 'One Piece', 'Boku no Hero Academia', 'Black Clover',
                'Kimetsu no Yaiba', 'Dragon Ball Z', 'Tengen Toppa Gurren Lagann', 'Haikyuu',
                'Soul Eater', 'Fire Force', 'Yu Yu Hakusho', 'Fairy Tail'
            ]
        },
        cyberpunk: {
            id: 'cyberpunk',
            category: 'tematica',
            name: 'Cyber-Synth 2099',
            badge: 'FM 99.9 • NIGHT CITY SYNTH',
            tagline: 'Synthwave, eletrônica futurista, distopias tecnológicas e estética neon',
            icon: 'fas fa-microchip',
            visualTheme: 'cyberpunk',
            globalTheme: 'cyberpunk',
            accentColor: '#05d9e8',
            queries: [
                'Cyberpunk', 'Ghost in the Shell', 'Psycho-Pass', 'Serial Experiments Lain',
                'Ergo Proxy', 'Akira', 'Vivy', 'Steins;Gate',
                'Trigun', 'Aldnoah.Zero', 'Guilty Crown', 'Parasyte', 'Code Geass'
            ]
        },
        nostalgia: {
            id: 'nostalgia',
            category: 'tematica',
            name: 'Nostalgia 90s / 2000s',
            badge: 'FM 89.3 • K7 REWIND',
            tagline: 'Clássicos eternos da Era de Ouro dos animes em fita cassete e TV aberta',
            icon: 'fas fa-compact-disc',
            visualTheme: 'nostalgia',
            globalTheme: 'vaporwaveMode',
            accentColor: '#ff71ce',
            queries: [
                'Neon Genesis Evangelion', 'Cowboy Bebop', 'Yu Yu Hakusho', 'Dragon Ball',
                'Sailor Moon', 'Rurouni Kenshin', 'Inuyasha', 'Cardcaptor Sakura',
                'Saint Seiya', 'Digimon', 'Samurai Champloo', 'Great Teacher Onizuka',
                'Nana', 'Trigun', 'Slam Dunk'
            ]
        },
        chill: {
            id: 'chill',
            category: 'tematica',
            name: 'Lo-Fi & Slice of Life',
            badge: 'FM 101.5 • COMFY & RELAX',
            tagline: 'Melodias acústicas, suaves e acolhedoras para relaxar, estudar ou programar',
            icon: 'fas fa-mug-hot',
            visualTheme: 'chill',
            globalTheme: 'zenMode',
            accentColor: '#52b788',
            queries: [
                'Yuru Camp', 'Mushishi', 'Violet Evergarden', 'Sousou no Frieren',
                'Barakamon', 'Natsume Yuujinchou', 'Shigatsu wa Kimi no Uso', 'K-On',
                'Aria the Animation', 'Fruits Basket', 'Horimiya', 'Kobayashi-san',
                'Hyouka', 'Sangatsu no Lion', 'Non Non Biyori'
            ]
        },
        dark: {
            id: 'dark',
            category: 'tematica',
            name: 'Eclipse Seinen',
            badge: 'FM 66.6 • DARK & METAL',
            tagline: 'Metal sinfônico, pós-hardcore, terror psicológico e fantasia sombria',
            icon: 'fas fa-skull-crossbones',
            visualTheme: 'dark',
            globalTheme: 'bloodMoon',
            accentColor: '#dc2626',
            queries: [
                'Tokyo Ghoul', 'Berserk', 'Death Note', 'Monster',
                'Hellsing', 'Vinland Saga', 'Kiseijuu', 'Elfen Lied',
                'Overlord', 'Re:Zero', 'Mahou Shoujo Madoka Magica', 'Made in Abyss',
                'Claymore', 'Another', 'Dororo', 'Dorohedoro'
            ]
        },
        idol: {
            id: 'idol',
            category: 'tematica',
            name: 'Idol & Pop Stage',
            badge: 'FM 104.9 • J-POP & SAKURA',
            tagline: 'J-Pop vibrante, bandas colegiais, palcos iluminados e comédias românticas',
            icon: 'fas fa-star',
            visualTheme: 'idol',
            globalTheme: 'sakuraMode',
            accentColor: '#ff4da6',
            queries: [
                'Oshi no Ko', 'Bocchi the Rock', 'Kaguya-sama', 'Love Live',
                'Zombieland Saga', 'Spy x Family', 'Toradora', 'Bakemonogatari',
                'Kono Subarashii', 'Nichijou', 'Lucky Star', 'Haruhi Suzumiya',
                'Sono Bisque Doll', 'Idolmaster'
            ]
        },
        matrix: {
            id: 'matrix',
            category: 'tematica',
            name: 'Matrix Terminal FM',
            badge: 'FM 107.7 • HACKER NET',
            tagline: 'Universos virtuais, mistério cyber, redes neurais e batidas digitais',
            icon: 'fas fa-terminal',
            visualTheme: 'matrix',
            globalTheme: 'matrix',
            accentColor: '#00ff41',
            queries: [
                '.hack', 'Serial Experiments Lain', 'Sword Art Online', 'Log Horizon',
                'Accel World', 'Digimon Tamers', 'Ghost in the Shell', 'Steins;Gate',
                'Paprika', 'Dennou Coil', 'No Game No Life', 'Summer Wars'
            ]
        }
    };

    function getStationsCatalog() {
        return Object.values(STATIONS_CATALOG);
    }

    function getStationConfig(stationId) {
        return STATIONS_CATALOG[stationId] || STATIONS_CATALOG.random;
    }

    /**
     * Busca faixas baseadas em uma estação temática ou geral
     */
    async function getStationTracks(stationId = 'random', typeFilter = 'ALL') {
        const station = getStationConfig(stationId);

        if (stationId === 'random') {
            return getDiscoveryTracks({ type: typeFilter, count: 18 });
        }

        // Se a estação possui pool curado de queries (Temáticas + Popular + Seasonal),
        // buscamos diretamente na AnimeThemes API para garantir 100% de disponibilidade mesmo sem AniList!
        if (Array.isArray(station.queries) && station.queries.length > 0) {
            const shuffledQueries = [...station.queries].sort(() => Math.random() - 0.5).slice(0, 4);
            const collected = [];
            const seenIds = new Set();

            await Promise.all(shuffledQueries.map(async (q) => {
                try {
                    const url = `${ANIMETHEMES_BASE}/animetheme?q=${encodeURIComponent(q)}&page[size]=10&include=anime.images,animethemeentries.videos,song.artists`;
                    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                    if (!res.ok) return;
                    const data = await res.json();
                    const themes = data.animethemes || [];
                    let perQueryCount = 0;
                    for (const th of themes) {
                        const track = normalizeAnimeTheme(th, th.anime);
                        if (!track || seenIds.has(track.id)) continue;
                        if (typeFilter !== 'ALL' && track.themeType !== typeFilter) continue;
                        seenIds.add(track.id);
                        collected.push(track);
                        perQueryCount++;
                        if (perQueryCount >= 5) break;
                    }
                } catch (e) {
                    console.warn(`[MusicService] Falha ao buscar query "${q}" da estação ${stationId}:`, e);
                }
            }));

            if (collected.length > 0) {
                const randomized = collected.sort(() => Math.random() - 0.5).slice(0, 18);
                return enrichTracksWithAniList(randomized);
            }
        }

        let candidateAnimes = [];

        if (stationId === 'mylist' && typeof Storage !== 'undefined') {
            const lists = ['watching', 'completed', 'planToWatch'];
            const seen = new Set();
            lists.forEach(listName => {
                const items = Storage.getList ? Storage.getList(listName) : [];
                items.forEach(a => {
                    if (a && a.id && !seen.has(Number(a.id))) {
                        seen.add(Number(a.id));
                        candidateAnimes.push({
                            id: Number(a.id),
                            title: a.title,
                            image: a.image,
                            banner: a.banner || a.image,
                            year: a.year
                        });
                    }
                });
            });
            const favs = Storage.getFavorites ? Storage.getFavorites() : [];
            favs.forEach(a => {
                if (a && a.id && !seen.has(Number(a.id))) {
                    seen.add(Number(a.id));
                    candidateAnimes.push({
                        id: Number(a.id),
                        title: a.title,
                        image: a.image,
                        banner: a.banner || a.image,
                        year: a.year
                    });
                }
            });
        }

        if (candidateAnimes.length === 0) {
            return getDiscoveryTracks({ type: typeFilter, count: 16 });
        }

        // Embaralhar candidatos da Minha Lista e buscar seus temas na AnimeThemes API
        const shuffled = [...candidateAnimes].sort(() => Math.random() - 0.5).slice(0, 10);
        const idsParam = shuffled.map(a => a.id).join(',');

        const tracks = [];
        try {
            const url = `${ANIMETHEMES_BASE}/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${idsParam}&include=animethemes.animethemeentries.videos,animethemes.song.artists,resources,images&page[size]=25`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
                const data = await res.json();
                const animeList = data.anime || [];
                for (const animeObj of animeList) {
                    const rawThemes = animeObj.animethemes || [];
                    let countForAnime = 0;
                    for (const th of rawThemes) {
                        const track = normalizeAnimeTheme(th, animeObj);
                        if (!track) continue;
                        if (typeFilter !== 'ALL' && track.themeType !== typeFilter) continue;
                        tracks.push(track);
                        countForAnime++;
                        if (countForAnime >= 2) break;
                    }
                }
            }
        } catch (e) {
            console.warn('[MusicService] Falha no lote da Minha Lista, buscando por título:', e);
        }

        // Fallback por título dos animes da Minha Lista caso o external_id não retorne
        if (tracks.length === 0 && shuffled.length > 0) {
            for (const item of shuffled.slice(0, 4)) {
                if (!item.title) continue;
                const found = await searchTracks(item.title, typeFilter);
                tracks.push(...found.slice(0, 3));
            }
        }

        if (tracks.length === 0) {
            return getDiscoveryTracks({ type: typeFilter, count: 16 });
        }

        return enrichTracksWithAniList(tracks);
    }

    /**
     * Pool de emergência caso a API externa esteja temporariamente indisponível
     */
    function getEmergencyFallbackPool(typeFilter = 'ALL') {
        const pool = [
            {
                id: 'at_fallback_unravel',
                sourceType: 'animethemes',
                isFallbackTrailer: false,
                themeType: 'OP',
                themeSlug: 'OP1',
                sequence: 1,
                songTitle: 'unravel',
                artist: 'TK from Ling tosite sigure',
                animeId: 20605,
                animeTitle: 'Tokyo Ghoul',
                animeYear: 2014,
                cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-fmnHdfurM7m6.jpg',
                banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-fmnHdfurM7m6.jpg',
                mediaUrl: 'https://v.animethemes.moe/TokyoGhoul-OP1.webm',
                youtubeId: 'owS7fA2mIu0',
                resolution: 1080,
                nc: true
            },
            {
                id: 'at_fallback_kaikaikitan',
                sourceType: 'animethemes',
                isFallbackTrailer: false,
                themeType: 'OP',
                themeSlug: 'OP1',
                sequence: 1,
                songTitle: 'Kaikai Kitan',
                artist: 'Eve',
                animeId: 113415,
                animeTitle: 'Jujutsu Kaisen',
                animeYear: 2020,
                cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg',
                banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg',
                mediaUrl: 'https://v.animethemes.moe/JujutsuKaisen-OP1-NCBD1080.webm',
                youtubeId: 'GwaRztMaoY0',
                resolution: 1080,
                nc: true
            },
            {
                id: 'at_fallback_departure',
                sourceType: 'animethemes',
                isFallbackTrailer: false,
                themeType: 'OP',
                themeSlug: 'OP1',
                sequence: 1,
                songTitle: 'departure!',
                artist: 'Masatoshi Ono',
                animeId: 11061,
                animeTitle: 'Hunter x Hunter (2011)',
                animeYear: 2011,
                cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png',
                banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png',
                mediaUrl: 'https://v.animethemes.moe/HunterXHunter2011-OP1.webm',
                youtubeId: 'h0S8H0MNoM4',
                resolution: 1080,
                nc: true
            },
            {
                id: 'at_fallback_again',
                sourceType: 'animethemes',
                isFallbackTrailer: false,
                themeType: 'OP',
                themeSlug: 'OP1',
                sequence: 1,
                songTitle: 'again',
                artist: 'YUI',
                animeId: 5114,
                animeTitle: 'Fullmetal Alchemist: Brotherhood',
                animeYear: 2009,
                cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-KJTQz9AIm6Wk.jpg',
                banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-KJTQz9AIm6Wk.jpg',
                mediaUrl: 'https://v.animethemes.moe/FullmetalAlchemistBrotherhood-OP1.webm',
                youtubeId: '9fUPY6c2nS0',
                resolution: 1080,
                nc: true
            },
            {
                id: 'at_fallback_cruelangel',
                sourceType: 'animethemes',
                isFallbackTrailer: false,
                themeType: 'OP',
                themeSlug: 'OP1',
                sequence: 1,
                songTitle: 'Zankoku na Tenshi no Thesis',
                artist: 'Yoko Takahashi',
                animeId: 30,
                animeTitle: 'Neon Genesis Evangelion',
                animeYear: 1995,
                cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx30-wmNoX3m2qTzz.jpg',
                banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx30-wmNoX3m2qTzz.jpg',
                mediaUrl: 'https://v.animethemes.moe/NeonGenesisEvangelion-OP1.webm',
                youtubeId: 'Nafii87gdzs',
                resolution: 1080,
                nc: true
            }
        ];

        return typeFilter === 'ALL' ? pool : pool.filter(t => t.themeType === typeFilter);
    }

    async function getThemesForAnime(id, meta = null) {
        const res = await getThemesByAnimeId(id, meta);
        return res?.themes || [];
    }

    return {
        getThemesByAnimeId,
        getThemesForAnime,
        searchTracks,
        getDiscoveryTracks,
        getStationTracks,
        getStationsCatalog,
        getStationConfig,
        getStationById: getStationConfig,
        normalizeAnimeTheme,
        createYouTubeTrack,
        extractYouTubeId,
        enrichTracksWithAniList,
        getEmergencyFallbackPool
    };
})();

window.MusicService = MusicService;
