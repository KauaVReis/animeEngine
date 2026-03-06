/**
 * MangaEngine v1.0
 * Motor de busca e leitura de mangás híbrido.
 * AniList (GraphQL) para metadados + MangaDex (REST) para conteúdo.
 *
 * @author MangaEngine
 */

const MangaEngine = (() => {
    'use strict';

    // =========================================================
    // CONSTANTS & STATE
    // =========================================================

    const ANILIST_URL = 'https://graphql.anilist.co';
    const MANGADEX_URL = 'https://api.mangadex.org';
    const FAVORITES_URL = 'save_fav.php';

    const ANILIST_QUERY = `
        query ($search: String, $page: Int, $perPage: Int, $genre: String) {
            Page(page: $page, perPage: $perPage) {
                pageInfo { total currentPage lastPage hasNextPage }
                media(search: $search, type: MANGA, sort: POPULARITY_DESC, genre: $genre) {
                    id
                    title { romaji english native }
                    coverImage { large medium }
                    bannerImage
                    averageScore
                    genres
                    description(asHtml: false)
                    status
                    chapters
                    volumes
                    startDate { year month }
                    format
                }
            }
        }
    `;

    // State
    let state = {
        currentSection: 'search',
        currentManga: null,       // AniList data do mangá selecionado
        mangadexId: null,         // MangaDex ID correspondente
        chapters: [],             // Lista de capítulos do MangaDex
        currentChapterIndex: -1,  // Índice do capítulo atual na lista
        favorites: new Set(),     // Set de anilist_ids favoritados
        searchTimeout: null,      // Debounce timer
        lastSearch: '',           // Última busca

        // Paginação e Filtros
        currentPage: 1,
        hasNextPage: false,
        currentGenre: '',
        isLoadingMore: false,

        // Histórico (localStorage)
        readChapters: new Set(),   // Set de chapter_ids lidos
        lastReadManga: null,       // Objeto com info do último mangá lido {id, title, cover, chapterNum, chapterId, timestamp}

        // Leitor
        readingMode: 'scroll',     // 'scroll' ou 'page'
        currentPageInChapter: 0    // Índice da página atual no modo 'page'
    };

    // =========================================================
    // DOM REFERENCES
    // =========================================================

    const $ = (id) => document.getElementById(id);

    // =========================================================
    // UTILITY FUNCTIONS
    // =========================================================

    /** Debounce */
    function debounce(fn, delay) {
        return (...args) => {
            clearTimeout(state.searchTimeout);
            state.searchTimeout = setTimeout(() => fn(...args), delay);
        };
    }

    /** Toast notification */
    function showToast(message, type = 'info') {
        const container = $('toastContainer');
        const colors = {
            success: 'border-green-500 bg-green-500/10',
            error: 'border-red-500 bg-red-500/10',
            info: 'border-engine-orange bg-engine-orange/10',
        };

        const toast = document.createElement('div');
        toast.className = `glass rounded-lg px-4 py-3 border-l-4 ${colors[type] || colors.info} font-mono text-sm text-engine-text animate-slide-up max-w-sm`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /** Limpa HTML para texto puro */
    function stripHTML(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    /** localStorage: Capítulos Lidos */
    function saveReadChapter(chapterId) {
        state.readChapters.add(chapterId);
        localStorage.setItem('mangaengine_read', JSON.stringify([...state.readChapters]));
    }

    function loadReadChapters() {
        const saved = localStorage.getItem('mangaengine_read');
        if (saved) {
            state.readChapters = new Set(JSON.parse(saved));
        }
    }

    /** localStorage: Último Mangá Lido */
    function saveLastRead(manga, chapter) {
        const lastRead = {
            id: manga.id,
            title: manga.title,
            cover: manga.coverImage?.medium || manga.coverImage?.large,
            chapterNum: chapter.attributes?.chapter || '?',
            chapterId: chapter.id,
            timestamp: Date.now()
        };
        state.lastReadManga = lastRead;
        localStorage.setItem('mangaengine_last_read', JSON.stringify(lastRead));
        renderContinueReading();
    }

    function loadLastRead() {
        const saved = localStorage.getItem('mangaengine_last_read');
        if (saved) {
            state.lastReadManga = JSON.parse(saved);
            renderContinueReading();
        }
    }

    /** Renderizar seção Continuar Lendo */
    function renderContinueReading() {
        const container = $('continueReading');
        const content = $('continueReadingContent');

        if (!state.lastReadManga) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        const lr = state.lastReadManga;
        const title = getTitle(lr.title);

        content.innerHTML = `
            <div class="glass p-4 rounded-xl border border-engine-orange/30 flex items-center gap-4 group cursor-pointer hover:border-engine-orange transition-all max-w-2xl"
                 onclick="MangaEngine.openMangaById(${lr.id})">
                <img src="${lr.cover}" alt="${title}" class="w-16 h-24 object-cover rounded-lg shadow-lg border border-engine-border">
                <div class="flex-1 min-w-0">
                    <p class="text-engine-orange font-mono text-[10px] mb-1">PRÓXIMO PASSO //</p>
                    <h3 class="text-engine-text font-display font-bold text-lg truncate">${title}</h3>
                    <p class="text-engine-muted font-mono text-xs">Parou no Capítulo ${lr.chapterNum}</p>
                    <div class="mt-3 flex items-center gap-2">
                        <span class="px-3 py-1 rounded bg-engine-orange text-black font-mono text-[10px] font-bold group-hover:bg-white transition-colors">RETOMAR LEITURA</span>
                    </div>
                </div>
                <div class="text-engine-muted/20 group-hover:text-engine-orange transition-colors pr-2">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                    </svg>
                </div>
            </div>
        `;
    }

    /** Trunca texto */
    function truncate(str, len = 150) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }

    /** Formata score */
    function formatScore(score) {
        if (!score) return 'N/A';
        return score + '%';
    }

    /** Retorna o melhor título disponível */
    function getTitle(titleObj) {
        if (!titleObj) return 'Sem título';
        return titleObj.english || titleObj.romaji || titleObj.native || 'Sem título';
    }

    // =========================================================
    // SECTION NAVIGATION (SPA Router)
    // =========================================================

    function showSection(name) {
        const sections = ['search', 'details', 'reader', 'favorites'];
        sections.forEach(s => {
            const el = $('section' + s.charAt(0).toUpperCase() + s.slice(1));
            if (el) {
                if (s === name) {
                    el.classList.remove('section-hidden');
                } else {
                    el.classList.add('section-hidden');
                }
            }
        });
        state.currentSection = name;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Load favorites when entering favorites section
        if (name === 'favorites') {
            loadFavorites();
        }
    }

    // =========================================================
    // ANILIST API — Busca de Mangás
    // =========================================================

    async function searchAniList(query = '', isLoadMore = false) {
        const isDiscovery = !query || query.trim().length < 2;

        if (!isLoadMore) {
            state.currentPage = 1;
            state.lastSearch = query;
            if (isDiscovery) {
                $('homeSectionTitle').classList.remove('hidden');
                $('welcomeHero').classList.remove('hidden');
            } else {
                $('homeSectionTitle').classList.add('hidden');
                $('welcomeHero').classList.add('hidden');
            }
            $('searchResults').innerHTML = '';
        }

        $('searchSpinner').classList.remove('hidden');
        $('searchEmpty').classList.add('hidden');
        $('paginationContainer').classList.add('hidden');

        try {
            const variables = {
                page: state.currentPage,
                perPage: 15,
                genre: state.currentGenre || undefined
            };

            if (!isDiscovery) {
                variables.search = query.trim();
            }

            const response = await fetch(ANILIST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: ANILIST_QUERY,
                    variables: variables
                })
            });

            if (!response.ok) throw new Error(`AniList API Error: ${response.status}`);

            const json = await response.json();
            const pageInfo = json?.data?.Page?.pageInfo;
            const media = json?.data?.Page?.media || [];

            state.hasNextPage = pageInfo?.hasNextPage || false;

            renderSearchResults(media, isLoadMore);

            if (media.length === 0 && !isLoadMore) {
                $('searchEmpty').classList.remove('hidden');
            }

            if (state.hasNextPage) {
                $('paginationContainer').classList.remove('hidden');
            }

        } catch (error) {
            console.error('AniList Error:', error);
            showToast('Erro ao buscar no AniList: ' + error.message, 'error');
            if (!isLoadMore) {
                $('searchResults').innerHTML = '';
                $('searchEmpty').classList.remove('hidden');
            }
        } finally {
            $('searchSpinner').classList.add('hidden');
        }
    }

    /** Renderizar cards de resultado */
    function renderSearchResults(mediaList, append = false) {
        const container = $('searchResults');
        if (!append) container.innerHTML = '';

        mediaList.forEach(manga => {
            const title = getTitle(manga.title);
            const score = manga.averageScore || '??';
            const year = manga.startDate?.year || '????';
            const description = truncate(stripHTML(manga.description), 180);
            const genres = (manga.genres || []).slice(0, 3);

            const card = document.createElement('div');
            card.className = 'manga-card group cursor-pointer animate-fade-in';
            card.onclick = () => selectManga(manga);

            card.innerHTML = `
                <div class="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-engine-border group-hover:border-engine-orange transition-all duration-300 shadow-lg">
                    <img src="${manga.coverImage.large}" alt="${title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    
                    <!-- Score Badge -->
                    <div class="absolute top-2 right-2 px-2 py-1 rounded bg-black/80 border border-engine-orange/50 backdrop-blur-md">
                        <span class="text-engine-orange font-mono text-[10px] font-bold">★ ${score}</span>
                    </div>

                    <div class="absolute bottom-0 left-0 right-0 p-3">
                        <p class="text-engine-text font-display font-medium text-sm leading-tight line-clamp-2">${title}</p>
                    </div>
                </div>

                <!-- Tooltip Tech (Sinopse no Hover) -->
                <div class="manga-tooltip">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-engine-orange font-mono text-[10px]">INFO // ${year}</span>
                        <span class="text-engine-muted font-mono text-[9px] uppercase">${manga.format || 'MANGA'}</span>
                    </div>
                    <p class="text-engine-text/90 font-mono text-[10px] leading-relaxed mb-3 italic">"${description || 'Sem descrição disponível.'}"</p>
                    <div class="flex flex-wrap gap-1">
                        ${genres.map(g => `<span class="px-1.5 py-0.5 rounded bg-engine-surface border border-engine-border text-engine-muted text-[8px] font-mono">${g}</span>`).join('')}
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }

    // =========================================================
    // MANGA DETAILS — AniList + MangaDex
    // =========================================================

    async function selectManga(manga) {
        state.currentManga = manga;
        state.mangadexId = null;
        state.chapters = [];
        state.currentChapterIndex = -1;

        showSection('details');
        renderMangaInfo(manga);

        // Buscar ID no MangaDex pelo título
        await findMangaDexId(manga);

        // Se encontrou, buscar capítulos
        if (state.mangadexId) {
            await loadChapters(state.mangadexId);
        }
    }

    /** Renderizar informações do mangá */
    function renderMangaInfo(manga) {
        const container = $('mangaInfo');
        const isFav = state.favorites.has(manga.id);
        const description = stripHTML(manga.description);

        container.innerHTML = `
            <div class="shrink-0">
                <img src="${manga.coverImage?.large || ''}"
                     alt="${getTitle(manga.title)}"
                     class="w-48 h-72 object-cover rounded-lg glow-orange-sm border border-engine-border">
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4 mb-3">
                    <h1 class="text-3xl font-bold font-display text-engine-text leading-tight">
                        ${getTitle(manga.title)}
                    </h1>
                    <button onclick="MangaEngine.toggleFavorite()"
                            class="fav-btn shrink-0 p-2 rounded-lg border ${isFav ? 'border-engine-orange text-engine-orange' : 'border-engine-border text-engine-muted'} hover:border-engine-orange hover:text-engine-orange transition-all"
                            title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                            id="favButton">
                        <svg class="w-6 h-6" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                    </button>
                </div>

                ${manga.title?.romaji && manga.title.romaji !== getTitle(manga.title) ?
                `<p class="text-engine-muted font-mono text-sm mb-3">${manga.title.romaji}</p>` : ''}

                <div class="flex flex-wrap items-center gap-3 mb-4">
                    ${manga.averageScore ? `
                        <div class="flex items-center gap-2">
                            <span class="text-engine-orange font-mono font-bold text-lg">${formatScore(manga.averageScore)}</span>
                            <div class="w-24 h-1.5 bg-engine-border rounded-full overflow-hidden">
                                <div class="score-bar h-full rounded-full" style="width: ${manga.averageScore}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    ${manga.format ? `<span class="font-mono text-xs text-engine-muted bg-engine-surface px-2 py-1 rounded">${manga.format}</span>` : ''}
                    ${manga.status ? `<span class="font-mono text-xs text-engine-muted bg-engine-surface px-2 py-1 rounded">${manga.status}</span>` : ''}
                    ${manga.chapters ? `<span class="font-mono text-xs text-engine-muted bg-engine-surface px-2 py-1 rounded">${manga.chapters} caps</span>` : ''}
                    ${manga.volumes ? `<span class="font-mono text-xs text-engine-muted bg-engine-surface px-2 py-1 rounded">${manga.volumes} vols</span>` : ''}
                </div>

                <div class="flex flex-wrap gap-1.5 mb-4">
                    ${(manga.genres || []).map(g => `<span class="genre-pill text-xs font-mono px-2 py-1 rounded-md border border-engine-border text-engine-muted hover:text-engine-orange">${g}</span>`).join('')}
                </div>

                ${description ? `
                    <p class="text-engine-text/80 text-sm leading-relaxed font-light max-h-32 overflow-y-auto pr-2">
                        ${truncate(description, 500)}
                    </p>
                ` : ''}
            </div>
        `;
    }

    // =========================================================
    // MANGADEX API — Buscar ID e Capítulos
    // =========================================================

    async function findMangaDexId(manga) {
        $('chaptersLoading').classList.remove('hidden');
        $('chaptersList').innerHTML = '';
        $('chaptersEmpty').classList.add('hidden');

        const title = getTitle(manga.title);

        try {
            const res = await fetch(`${MANGADEX_URL}/manga?title=${encodeURIComponent(title)}&limit=5&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includes[]=cover_art`);
            if (!res.ok) throw new Error(`MangaDex Search Error: ${res.status}`);

            const json = await res.json();
            const results = json?.data || [];

            if (results.length > 0) {
                // Tentar encontrar a melhor correspondência
                const match = results.find(m => {
                    const attrs = m.attributes;
                    const titles = [
                        attrs.title?.en,
                        attrs.title?.ja,
                        attrs.title?.['ja-ro'],
                        ...(attrs.altTitles || []).map(t => Object.values(t)[0])
                    ].filter(Boolean).map(t => t.toLowerCase());
                    return titles.some(t => t === title.toLowerCase());
                }) || results[0]; // Fallback para o primeiro resultado

                state.mangadexId = match.id;
            } else {
                $('chaptersLoading').classList.add('hidden');
                $('chaptersEmpty').classList.remove('hidden');
                showToast('Mangá não encontrado no MangaDex.', 'info');
            }

        } catch (error) {
            console.error('MangaDex Search Error:', error);
            $('chaptersLoading').classList.add('hidden');
            showToast('Erro ao buscar no MangaDex: ' + error.message, 'error');
        }
    }

    async function loadChapters(mangadexId) {
        $('chaptersLoading').classList.remove('hidden');
        $('chaptersList').innerHTML = '';
        $('chaptersEmpty').classList.add('hidden');

        try {
            // Buscar capítulos em múltiplos idiomas (en + pt-br)
            const languages = ['en', 'pt-br'];
            let allChapters = [];

            for (const lang of languages) {
                let offset = 0;
                const limit = 100;
                let hasMore = true;

                while (hasMore && offset < 1000) {
                    const res = await fetch(
                        `${MANGADEX_URL}/manga/${mangadexId}/feed?translatedLanguage[]=${lang}&order[chapter]=asc&limit=${limit}&offset=${offset}&includes[]=scanlation_group`
                    );

                    if (!res.ok) throw new Error(`MangaDex Feed Error: ${res.status}`);

                    const json = await res.json();
                    const data = json?.data || [];
                    allChapters = allChapters.concat(data);

                    hasMore = data.length === limit;
                    offset += limit;

                    // Rate limit: small delay entre requests
                    if (hasMore) await new Promise(r => setTimeout(r, 300));
                }

                // Pequeno delay entre idiomas
                await new Promise(r => setTimeout(r, 200));
            }

            // Separar capítulos legíveis (com páginas no MangaDex) de externos (links)
            // Prioridade: capítulos com páginas > capítulos externos
            const chapterMap = new Map(); // chapterNumber -> melhor capítulo

            allChapters.forEach(ch => {
                const num = ch.attributes?.chapter;
                if (!num) return;

                const isExternal = !!ch.attributes?.externalUrl;
                const hasPages = (ch.attributes?.pages || 0) > 0;
                const existing = chapterMap.get(num);

                if (!existing) {
                    chapterMap.set(num, ch);
                } else {
                    const existingIsExternal = !!existing.attributes?.externalUrl;
                    const existingHasPages = (existing.attributes?.pages || 0) > 0;

                    // Preferir capítulo com páginas reais sobre externo
                    if (!existingHasPages && hasPages) {
                        chapterMap.set(num, ch);
                    }
                    // Se ambos têm páginas, preferir pt-br se existente é en
                    // (apenas para dar variedade, mas em geral o primeiro é ok)
                }
            });

            // Ordenar por número do capítulo
            state.chapters = Array.from(chapterMap.values()).sort((a, b) => {
                const numA = parseFloat(a.attributes?.chapter || '0');
                const numB = parseFloat(b.attributes?.chapter || '0');
                return numA - numB;
            });

            renderChapters(state.chapters);

            if (state.chapters.length === 0) {
                $('chaptersEmpty').classList.remove('hidden');
            }

        } catch (error) {
            console.error('MangaDex Chapters Error:', error);
            showToast('Erro ao carregar capítulos: ' + error.message, 'error');
        } finally {
            $('chaptersLoading').classList.add('hidden');
        }
    }

    async function openMangaById(anilistId) {
        showSection('details');
        $('detailsLoading').classList.remove('hidden');

        try {
            const response = await fetch(ANILIST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query ($id: Int) { Media(id: $id, type: MANGA) { id title { romaji english native } coverImage { large medium } bannerImage averageScore genres description status chapters volumes startDate { year month } format } }`,
                    variables: { id: anilistId }
                })
            });
            const json = await response.json();
            const manga = json?.data?.Media;
            if (manga) selectManga(manga);
        } catch (e) {
            showToast('Erro ao abrir mangá: ' + e.message, 'error');
        }
    }

    /** Renderizar lista de capítulos */
    function renderChapters(chapters) {
        const container = $('chaptersList');
        container.innerHTML = '';

        const readableCount = chapters.filter(ch => !ch.attributes?.externalUrl).length;
        const externalCount = chapters.length - readableCount;

        let countText = `${chapters.length} capítulo(s) encontrado(s)`;
        if (externalCount > 0 && readableCount > 0) {
            countText += ` — ${readableCount} legível(is), ${externalCount} externo(s)`;
        } else if (externalCount > 0 && readableCount === 0) {
            countText += ` — todos externos (links oficiais)`;
        }
        $('chapterCount').textContent = countText;

        chapters.forEach((ch, index) => {
            const attrs = ch.attributes || {};
            const chNum = attrs.chapter || '?';
            const chTitle = attrs.title || '';
            const group = ch.relationships?.find(r => r.type === 'scanlation_group');
            const groupName = group?.attributes?.name || 'Grupo desconhecido';
            const pages = attrs.pages || 0;
            const isExternal = !!attrs.externalUrl;
            const lang = attrs.translatedLanguage || 'en';
            const langLabel = lang === 'pt-br' ? 'PT-BR' : lang.toUpperCase();
            const isRead = state.readChapters.has(ch.id);

            const item = document.createElement('div');
            item.className = `chapter-item flex items-center justify-between p-3 rounded-lg border border-engine-border border-l-4 ${isExternal ? 'border-l-blue-500/50' : 'border-l-transparent'} cursor-pointer hover:border-l-engine-orange transition-all ${isRead ? 'chapter-read' : ''}`;

            item.onclick = () => openReader(index);

            item.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <span class="text-engine-orange font-mono font-bold text-sm shrink-0 w-16">Cap. ${chNum}</span>
                    <div class="min-w-0">
                        <p class="text-engine-text text-sm font-display truncate">
                            ${chTitle || `Capítulo ${chNum}`}
                        </p>
                        <p class="text-engine-muted font-mono text-xs truncate">${groupName}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="font-mono text-[10px] px-1.5 py-0.5 rounded border ${lang === 'pt-br' ? 'border-green-500/40 text-green-400' : 'border-engine-border text-engine-muted'}">${langLabel}</span>
                    ${isExternal ? `
                        <span class="font-mono text-[10px] px-1.5 py-0.5 rounded border border-blue-500/40 text-blue-400 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            Externo
                        </span>
                    ` : `<span class="text-engine-muted font-mono text-xs">${pages}p</span>`}
                    <svg class="w-4 h-4 text-engine-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isExternal ? 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' : 'M9 5l7 7-7 7'}"/>
                    </svg>
                </div>
            `;

            container.appendChild(item);
        });
    }

    // =========================================================
    // READER — Leitor Vertical
    // =========================================================

    async function openReader(chapterIndex) {
        if (chapterIndex < 0 || chapterIndex >= state.chapters.length) return;

        state.currentChapterIndex = chapterIndex;
        const chapter = state.chapters[chapterIndex];
        const chapterId = chapter.id;
        const chNum = chapter.attributes?.chapter || '?';
        const chTitle = chapter.attributes?.title || `Capítulo ${chNum}`;

        saveLastRead(state.currentManga, chapter);

        state.currentPageInChapter = 0; // Reset ao abrir novo capítulo

        showSection('reader');
        updateReaderUI();

        // Update reader title
        const readerTitle = $('readerTitle');
        const titleElements = readerTitle.querySelectorAll('p');
        if (titleElements.length >= 2) {
            titleElements[0].textContent = getTitle(state.currentManga.title);
            titleElements[1].textContent = `Capítulo ${chNum} — ${chTitle}`;
        }

        // Update nav buttons
        $('btnPrevChapter').disabled = chapterIndex <= 0;
        $('btnNextChapter').disabled = chapterIndex >= state.chapters.length - 1;

        // Se o capítulo é externo (MangaPlus/Viz), embutir via iframe
        if (chapter.attributes?.externalUrl) {
            const externalUrl = chapter.attributes.externalUrl;
            const group = chapter.relationships?.find(r => r.type === 'scanlation_group');
            const groupName = group?.attributes?.name || 'Site Oficial';

            $('readerLoading').classList.add('hidden');
            $('readerBottomNav').classList.remove('hidden');
            $('readerPages').innerHTML = `
                <div class="relative w-full rounded-lg overflow-hidden border border-engine-border" style="height: calc(100vh - 180px); min-height: 500px;">
                    <iframe
                        id="externalReaderFrame"
                        src="${externalUrl}"
                        class="w-full h-full border-0 bg-white rounded-lg"
                        allow="fullscreen"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
                        loading="eager"
                        title="Leitura externa — Capítulo ${chNum}"
                    ></iframe>
                    <div id="iframeOverlay" class="absolute inset-0 flex flex-col items-center justify-center glass rounded-lg hidden">
                        <svg class="w-16 h-16 text-engine-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        <p class="text-engine-text font-display font-bold text-lg mb-2">Leitura externa bloqueada</p>
                        <p class="text-engine-muted font-mono text-sm mb-1 text-center max-w-md">
                            O ${groupName} não permite leitura embutida.
                        </p>
                        <p class="text-engine-muted/60 font-mono text-xs mb-6 text-center max-w-md">
                            Clique abaixo para abrir diretamente no site oficial.
                        </p>
                        <a href="${externalUrl}" target="_blank" rel="noopener noreferrer"
                           class="px-6 py-3 rounded-lg bg-engine-orange/20 border border-engine-orange text-engine-orange font-mono text-sm hover:bg-engine-orange/30 transition-all flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            Abrir no ${groupName}
                        </a>
                    </div>
                </div>
                <div class="flex items-center justify-center gap-3 mt-3">
                    <span class="font-mono text-[10px] px-2 py-1 rounded border border-blue-500/30 text-blue-400 flex items-center gap-1.5">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        Leitura via ${groupName}
                    </span>
                    <a href="${externalUrl}" target="_blank" rel="noopener noreferrer"
                       class="font-mono text-[10px] px-2 py-1 rounded border border-engine-border text-engine-muted hover:text-engine-orange hover:border-engine-orange transition-all">
                        Abrir em nova aba ↗
                    </a>
                </div>
            `;

            // Detectar se o iframe foi bloqueado (X-Frame-Options / CSP)
            const iframe = $('externalReaderFrame');
            const overlay = $('iframeOverlay');

            // Timeout: se não carregou em 5s, provavelmente bloqueado
            const iframeTimeout = setTimeout(() => {
                overlay.classList.remove('hidden');
            }, 5000);

            iframe.addEventListener('load', () => {
                clearTimeout(iframeTimeout);
                try {
                    // Tentar acessar o conteúdo — se bloqueado por CORS, vai lançar erro
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (!doc || doc.body?.innerHTML === '') {
                        overlay.classList.remove('hidden');
                    }
                } catch (e) {
                    // Cross-origin — o iframe carregou, está tudo ok
                    // (se deu erro de acesso é porque carregou mas é cross-origin)
                }
            });

            iframe.addEventListener('error', () => {
                clearTimeout(iframeTimeout);
                overlay.classList.remove('hidden');
            });

            showToast(`Leitura via ${groupName} — Cap. ${chNum}`, 'info');
            return;
        }

        // Load pages
        $('readerLoading').classList.remove('hidden');
        $('readerPages').innerHTML = '';
        $('readerBottomNav').classList.add('hidden');

        try {
            // Retry com até 3 tentativas e delay progressivo
            let json = null;
            let lastError = null;
            const maxRetries = 3;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const res = await fetch(`${MANGADEX_URL}/at-home/server/${chapterId}`);

                    if (res.status === 404) {
                        throw new Error('Capítulo não disponível no servidor MangaDex (404).');
                    }

                    if (res.status === 429) {
                        // Rate limited — esperar mais antes de tentar novamente
                        const waitTime = attempt * 2000;
                        console.warn(`Rate limited (429). Aguardando ${waitTime}ms antes de tentar novamente...`);
                        showToast(`Rate limit atingido. Tentando novamente em ${waitTime / 1000}s...`, 'info');
                        await new Promise(r => setTimeout(r, waitTime));
                        continue;
                    }

                    if (!res.ok) {
                        throw new Error(`At-Home Error: ${res.status}`);
                    }

                    json = await res.json();
                    break; // Sucesso, sair do loop

                } catch (err) {
                    lastError = err;
                    // Se for 404 (capítulo não existe), não adianta tentar novamente
                    if (err.message.includes('404')) {
                        break;
                    }
                    // Para outros erros, tentar novamente com delay
                    if (attempt < maxRetries) {
                        const waitTime = attempt * 1000;
                        console.warn(`Tentativa ${attempt} falhou. Retentando em ${waitTime}ms...`, err.message);
                        await new Promise(r => setTimeout(r, waitTime));
                    }
                }
            }

            if (!json) {
                throw lastError || new Error('Falha ao conectar com o servidor At-Home.');
            }

            const baseUrl = json.baseUrl;
            const hash = json.chapter?.hash;
            // Tentar usar 'data' (qualidade total), senão usar 'dataSaver' (comprimido)
            let pages = json.chapter?.data || [];
            let usingSaver = false;

            if (pages.length === 0) {
                pages = json.chapter?.dataSaver || [];
                usingSaver = true;
            }

            if (pages.length === 0) {
                throw new Error('Nenhuma página encontrada neste capítulo.');
            }

            if (usingSaver) {
                showToast('Usando imagens comprimidas (dataSaver).', 'info');
            }

            renderPages(baseUrl, hash, pages, usingSaver);

        } catch (error) {
            console.error('Reader Error:', error);
            showToast('Erro ao carregar páginas: ' + error.message, 'error');

            const is404 = error.message.includes('404');

            $('readerPages').innerHTML = `
                <div class="text-center py-16">
                    <svg class="w-16 h-16 text-engine-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${is404
                    ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                    : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z'}"/>
                    </svg>
                    <p class="text-engine-muted font-mono text-sm mb-2">${is404
                    ? 'Este capítulo não está disponível no MangaDex.'
                    : 'Erro ao carregar o capítulo.'}</p>
                    <p class="text-engine-muted/60 font-mono text-xs mb-4">${error.message}</p>
                    ${is404 ? `
                        <p class="text-engine-muted/40 font-mono text-xs mb-6">
                            O capítulo pode ter sido removido, transferido ou está temporariamente indisponível.
                        </p>
                    ` : ''}
                    <button onclick="MangaEngine.showSection('details')"
                            class="px-4 py-2 rounded-lg bg-engine-surface border border-engine-border hover:border-engine-orange text-engine-muted hover:text-engine-orange font-mono text-sm transition-all">
                        ← Voltar aos capítulos
                    </button>
                </div>
            `;
        } finally {
            $('readerLoading').classList.add('hidden');
        }
    }

    /** Renderizar páginas do leitor */
    function renderPages(baseUrl, hash, pages, usingSaver = false) {
        const container = $('readerPages');
        container.innerHTML = '';

        // Aplicar classe de modo
        container.className = state.readingMode === 'page' ? 'reader-page-mode relative' : 'space-y-4';

        pages.forEach((page, index) => {
            const img = document.createElement('img');
            const url = `${baseUrl}/${usingSaver ? 'data-saver' : 'data'}/${hash}/${page}`;
            img.src = url;
            img.alt = `Página ${index + 1}`;
            img.className = `w-full max-w-4xl mx-auto rounded-lg shadow-xl transition-opacity duration-300 ${state.readingMode === 'page' && index === 0 ? 'active-page' : ''}`;
            img.loading = index < 3 ? 'eager' : 'lazy'; // Carregar as primeiras imediatamente

            // No modo página, o clique na imagem avança
            if (state.readingMode === 'page') {
                img.onclick = (e) => {
                    const rect = img.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    if (x > rect.width / 2) nextPage();
                    else prevPage();
                };
            }

            container.appendChild(img);
        });

        if (state.readingMode === 'page') {
            updatePageCounter();
        }

        // Show bottom navigation
        $('readerBottomNav').classList.remove('hidden');
    }

    /** Navegar capítulo anterior */
    function prevChapter() {
        if (state.currentChapterIndex > 0) {
            openReader(state.currentChapterIndex - 1);
        }
    }

    /** Navegar próximo capítulo */
    function nextChapter() {
        if (state.currentChapterIndex < state.chapters.length - 1) {
            openReader(state.currentChapterIndex + 1);
        }
    }

    /** Mudar modo de leitura */
    function setReadingMode(mode) {
        if (state.readingMode === mode) return;
        state.readingMode = mode;

        // Atualizar botões
        $('btnModeScroll').classList.toggle('active', mode === 'scroll');
        $('btnModePage').classList.toggle('active', mode === 'page');

        // Se estiver no leitor, re-renderizar ou ajustar
        if (state.currentSection === 'reader') {
            const container = $('readerPages');
            const images = container.querySelectorAll('img');

            if (images.length > 0) {
                container.className = mode === 'page' ? 'reader-page-mode relative' : 'space-y-4';
                images.forEach((img, i) => {
                    img.className = `w-full max-w-4xl mx-auto rounded-lg shadow-xl transition-opacity duration-300 ${mode === 'page' && i === state.currentPageInChapter ? 'active-page' : ''}`;
                    // Remover/Adicionar evento de clique
                    img.onclick = mode === 'page' ? (e) => {
                        const rect = img.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        if (x > rect.width / 2) nextPage();
                        else prevPage();
                    } : null;
                });

                if (mode === 'page') {
                    updatePageCounter();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        }

        showToast(`Modo de leitura: ${mode === 'page' ? 'Página a Página' : 'Rolagem Vertical'}`, 'info');
    }

    function updatePageVisibility() {
        const images = $('readerPages').querySelectorAll('img');
        images.forEach((img, i) => {
            img.classList.toggle('active-page', i === state.currentPageInChapter);
        });
        updatePageCounter();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function nextPage() {
        const images = $('readerPages').querySelectorAll('img');
        if (state.currentPageInChapter < images.length - 1) {
            state.currentPageInChapter++;
            updatePageVisibility();
        } else {
            showToast('Fim do capítulo. Use a navegação abaixo para o próximo.', 'info');
        }
    }

    function prevPage() {
        if (state.currentPageInChapter > 0) {
            state.currentPageInChapter--;
            updatePageVisibility();
        }
    }

    function updatePageCounter() {
        const images = $('readerPages').querySelectorAll('img');
        const counter = $('readerPageCounter');
        if (counter) {
            if (state.readingMode === 'page' && images.length > 0) {
                counter.classList.remove('hidden');
                counter.textContent = `${state.currentPageInChapter + 1} / ${images.length}`;
            } else {
                counter.classList.add('hidden');
            }
        }
    }

    function updateReaderUI() {
        // Garantir que os botões de modo reflitam o estado
        $('btnModeScroll').classList.toggle('active', state.readingMode === 'scroll');
        $('btnModePage').classList.toggle('active', state.readingMode === 'page');
    }

    // =========================================================
    // FAVORITES — Sistema de Favoritos (PHP/MySQLi)
    // =========================================================

    /** Toggle favorito */
    async function toggleFavorite() {
        const manga = state.currentManga;
        if (!manga) return;

        const isFav = state.favorites.has(manga.id);

        try {
            if (isFav) {
                // Remover
                const res = await fetch(FAVORITES_URL, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ anilist_id: manga.id })
                });
                const json = await res.json();
                if (json.success) {
                    state.favorites.delete(manga.id);
                    showToast('Removido dos favoritos!', 'info');
                } else {
                    throw new Error(json.error || 'Erro ao remover');
                }
            } else {
                // Adicionar
                const res = await fetch(FAVORITES_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        anilist_id: manga.id,
                        mangadex_id: state.mangadexId || null,
                        title: getTitle(manga.title),
                        cover_url: manga.coverImage?.large || manga.coverImage?.medium || ''
                    })
                });
                const json = await res.json();
                if (json.success) {
                    state.favorites.add(manga.id);
                    showToast('Adicionado aos favoritos!', 'success');
                } else {
                    throw new Error(json.error || 'Erro ao salvar');
                }
            }

            // Atualizar botão
            renderMangaInfo(manga);

        } catch (error) {
            console.error('Favorite Error:', error);
            showToast('Erro nos favoritos: ' + error.message, 'error');
        }
    }

    /** Carregar lista de favoritos */
    async function loadFavorites() {
        $('favoritesLoading').classList.remove('hidden');
        $('favoritesGrid').innerHTML = '';
        $('favoritesEmpty').classList.add('hidden');

        try {
            const res = await fetch(FAVORITES_URL);
            const json = await res.json();

            if (!json.success) throw new Error(json.error || 'Erro ao carregar');

            const data = json.data || [];

            // Atualizar set de favoritos
            state.favorites = new Set(data.map(f => parseInt(f.anilist_id)));

            renderFavorites(data);

            if (data.length === 0) {
                $('favoritesEmpty').classList.remove('hidden');
            }

        } catch (error) {
            console.error('Load Favorites Error:', error);
            $('favoritesEmpty').classList.remove('hidden');
            $('favoritesEmpty').innerHTML = `
                <svg class="w-16 h-16 text-engine-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p class="text-engine-muted font-mono text-sm mb-2">Servidor PHP não disponível.</p>
                <p class="text-engine-muted/60 font-mono text-xs">Inicie o XAMPP/PHP para ativar o sistema de favoritos.</p>
            `;
        } finally {
            $('favoritesLoading').classList.add('hidden');
        }
    }

    /** Renderizar grid de favoritos */
    function renderFavorites(favorites) {
        const container = $('favoritesGrid');
        container.innerHTML = '';

        favorites.forEach((fav, index) => {
            const card = document.createElement('div');
            card.className = 'manga-card bg-engine-card rounded-lg overflow-hidden border border-engine-border border-l-4 border-l-engine-orange relative group animate-slide-up';
            card.style.animationDelay = `${index * 0.05}s`;

            card.innerHTML = `
                <div class="relative aspect-[3/4] overflow-hidden bg-engine-surface cursor-pointer" onclick="MangaEngine.openFavorite(${fav.anilist_id}, '${(fav.mangadex_id || '').replace(/'/g, "\\'")}')">
                    <img src="${fav.cover_url || ''}" alt="${fav.title}" class="w-full h-full object-cover" loading="lazy">
                    <div class="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-engine-card to-transparent"></div>
                </div>
                <div class="p-3 flex items-start justify-between gap-2">
                    <h3 class="text-sm font-display font-bold text-engine-text leading-tight line-clamp-2 cursor-pointer" onclick="MangaEngine.openFavorite(${fav.anilist_id}, '${(fav.mangadex_id || '').replace(/'/g, "\\'")}')" title="${fav.title}">
                        ${fav.title}
                    </h3>
                    <button onclick="MangaEngine.removeFavorite(${fav.anilist_id})"
                            class="shrink-0 p-1 rounded text-engine-muted hover:text-red-400 transition-colors"
                            title="Remover">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            `;

            container.appendChild(card);
        });
    }

    /** Remover favorito */
    async function removeFavorite(anilistId) {
        try {
            const res = await fetch(FAVORITES_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anilist_id: anilistId })
            });
            const json = await res.json();

            if (json.success) {
                state.favorites.delete(anilistId);
                showToast('Favorito removido!', 'info');
                loadFavorites(); // Refresh
            } else {
                throw new Error(json.error);
            }
        } catch (error) {
            showToast('Erro ao remover: ' + error.message, 'error');
        }
    }

    /** Abrir favorito — busca no AniList e redireciona para detalhes */
    async function openFavorite(anilistId, mangadexId) {
        showToast('Carregando mangá...', 'info');

        try {
            const query = `
query($id: Int) {
    Media(id: $id, type: MANGA) {
                        id title { romaji english native }
                        coverImage { large medium } bannerImage
                        averageScore genres description(asHtml: false)
                        status chapters volumes startDate { year month } format
    }
}
`;
            const res = await fetch(ANILIST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: { id: anilistId } })
            });

            const json = await res.json();
            const manga = json?.data?.Media;

            if (manga) {
                state.currentManga = manga;
                state.mangadexId = mangadexId || null;
                showSection('details');
                renderMangaInfo(manga);

                if (mangadexId) {
                    await loadChapters(mangadexId);
                } else {
                    await findMangaDexId(manga);
                    if (state.mangadexId) {
                        await loadChapters(state.mangadexId);
                    }
                }
            }
        } catch (error) {
            showToast('Erro ao abrir favorito: ' + error.message, 'error');
        }
    }

    // =========================================================
    // INITIALIZATION
    // =========================================================

    function init() {
        // Search input with debounce
        const searchInput = $('searchInput');
        const debouncedSearch = debounce(searchAniList, 400);

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query !== state.lastSearch) {
                state.lastSearch = query;
                debouncedSearch(query);
            }
        });

        // Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(state.searchTimeout);
                searchAniList(searchInput.value);
            }
        });

        // Reader Mode Buttons
        $('btnModeScroll').addEventListener('click', () => setReadingMode('scroll'));
        $('btnModePage').addEventListener('click', () => setReadingMode('page'));

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if (document.activeElement === searchInput) return;

            if (state.currentSection === 'reader' && state.readingMode === 'page') {
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    nextPage();
                } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    prevPage();
                }
            }

            if (e.key === '/' && document.activeElement !== searchInput) {
                e.preventDefault();
                searchInput.focus();
            }
            // Escape to go back
            if (e.key === 'Escape') {
                if (state.currentSection === 'reader') showSection('details');
                else if (state.currentSection === 'details') showSection('search');
                else if (state.currentSection === 'favorites') showSection('search');
            }
        });

        // Genre Filters
        document.querySelectorAll('.genre-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // UI update
                document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active-genre'));
                btn.classList.add('active-genre');

                state.currentGenre = btn.dataset.genre;
                searchAniList(searchInput.value); // Re-search with genre
            });
        });

        // Load More Button
        const loadMoreBtn = $('loadMoreBtn');
        loadMoreBtn.addEventListener('click', () => {
            if (state.hasNextPage) {
                state.currentPage++;
                searchAniList(state.lastSearch, true);
            }
        });

        // Load Persisted Data
        loadReadChapters();
        loadLastRead();

        // Load favorites set (sem renderizar, só para saber quais estão favoritados)
        loadFavoritesSet();

        // Load trending manga on home
        searchAniList('');

        console.log(
            '%c⚙ MangaEngine v1.0 %cInitialized',
            'color: #ff6600; font-weight: bold; font-size: 14px;',
            'color: #6b6b80; font-size: 12px;'
        );
    }

    /** Carregar apenas o Set de favorites IDs */
    async function loadFavoritesSet() {
        try {
            const res = await fetch(FAVORITES_URL);
            const json = await res.json();
            if (json.success) {
                state.favorites = new Set(json.data.map(f => parseInt(f.anilist_id)));
            }
        } catch (e) {
            // PHP provavelmente não está rodando. Sem problemas.
        }
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // =========================================================
    // PUBLIC API
    // =========================================================

    return {
        showSection,
        toggleFavorite,
        removeFavorite,
        openFavorite,
        prevChapter,
        nextChapter,
        setReadingMode,
        nextPage,
        prevPage,
        openMangaById,
    };

})();
