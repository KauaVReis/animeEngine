<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="MangaEngine — Leitor de mangás híbrido com busca AniList e leitura MangaDex.">
    <title>MangaEngine — Leitor Híbrido</title>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        engine: {
                            bg: '#0a0a0f',
                            surface: '#111118',
                            card: '#16161f',
                            border: '#1e1e2a',
                            text: '#e0e0e8',
                            muted: '#6b6b80',
                            orange: '#ff6600',
                            'orange-glow': '#ff8533',
                            'orange-dim': '#cc5200',
                            accent: '#ff6600',
                        }
                    },
                    fontFamily: {
                        display: ['Rajdhani', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    animation: {
                        'spin-slow': 'spin 4s linear infinite',
                        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                        'slide-up': 'slideUp 0.4s ease-out',
                        'fade-in': 'fadeIn 0.3s ease-out',
                    },
                    keyframes: {
                        pulseGlow: {
                            '0%, 100%': { opacity: '1' },
                            '50%': { opacity: '0.6' },
                        },
                        slideUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' },
                        },
                        fadeIn: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' },
                        },
                    }
                }
            }
        }
    </script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">

    <style>
        /* === Reset & Base === */
        * { box-sizing: border-box; }

        body {
            background-color: #0a0a0f;
            color: #e0e0e8;
            font-family: 'Rajdhani', sans-serif;
        }

        /* === Grid Pattern Background === */
        .bg-grid {
            background-image:
                linear-gradient(rgba(255, 102, 0, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 102, 0, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
        }

        /* === Scrollbar === */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #ff6600; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #ff8533; }

        /* === Glow Effects === */
        .glow-orange {
            box-shadow: 0 0 15px rgba(255, 102, 0, 0.25),
                        0 0 30px rgba(255, 102, 0, 0.1);
        }

        .glow-orange-sm {
            box-shadow: 0 0 8px rgba(255, 102, 0, 0.2);
        }

        .text-glow {
            text-shadow: 0 0 20px rgba(255, 102, 0, 0.5),
                         0 0 40px rgba(255, 102, 0, 0.2);
        }

        /* === Card Hover === */
        .manga-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .manga-card:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 8px 30px rgba(255, 102, 0, 0.15),
                        0 0 0 1px rgba(255, 102, 0, 0.3);
        }

        /* === Glassmorphism === */
        .glass {
            background: rgba(22, 22, 31, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 102, 0, 0.1);
        }

        /* === Loading Spinner === */
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #1e1e2a;
            border-top: 3px solid #ff6600;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        /* === Chapter Item === */
        .chapter-item {
            transition: all 0.2s ease;
        }

        .chapter-item:hover {
            background: rgba(255, 102, 0, 0.08);
            padding-left: 1.5rem;
            border-left-color: #ff6600;
        }

        /* === Image Loader === */
        .page-img {
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        .page-img.loaded {
            opacity: 1;
        }

        /* === Neon Line === */
        .neon-line {
            height: 2px;
            background: linear-gradient(90deg, transparent, #ff6600, transparent);
        }

        /* === Favorite Button Animation === */
        .fav-btn {
            transition: all 0.3s ease;
        }

        .fav-btn:hover {
            transform: scale(1.1);
        }

        .fav-btn.active {
            color: #ff6600;
            text-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
        }

        /* === Section transitions === */
        .section-hidden {
            display: none !important;
        }

        /* === Search Input Focus === */
        .search-input:focus {
            box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.4),
                        0 0 20px rgba(255, 102, 0, 0.1);
        }

        /* === Score Bar === */
        .score-bar {
            background: linear-gradient(90deg, #ff6600, #ff8533);
            box-shadow: 0 0 8px rgba(255, 102, 0, 0.4);
        }

        /* === Tag/Genre Pill === */
        .genre-pill {
            transition: all 0.2s ease;
        }

        .genre-pill:hover {
            background: rgba(255, 102, 0, 0.2);
            border-color: #ff6600;
        }
        /* Capítulo Lido */
        .chapter-read {
            opacity: 0.5;
        }
        .chapter-read .text-engine-orange {
            color: var(--text-muted);
        }

        /* Tooltip Tech */
        .manga-card {
            position: relative;
        }
        .manga-tooltip {
            position: absolute;
            bottom: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            width: 250px;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid var(--engine-border);
            padding: 12px;
            border-radius: 8px;
            z-index: 50;
            pointer-events: none;
            opacity: 0;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 102, 0, 0.1);
        }
        .manga-card:hover .manga-tooltip {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        .manga-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: var(--engine-border) transparent transparent transparent;
        }
        .active-genre {
            border-color: var(--engine-orange) !important;
            color: var(--engine-orange) !important;
            background: rgba(255, 102, 0, 0.1) !important;
        }

        /* Reading Modes */
        .reader-page-mode img {
            display: none;
            max-height: 85vh;
            margin: 0 auto;
            object-fit: contain;
        }
        .reader-page-mode img.active-page {
            display: block;
        }
        .reader-mode-btn.active {
            background: var(--engine-orange);
            color: black;
            border-color: var(--engine-orange);
        }
    </style>
</head>
<body class="min-h-screen bg-grid">

    <!-- ============================================= -->
    <!-- HEADER / NAVBAR                               -->
    <!-- ============================================= -->
    <header class="fixed top-0 left-0 right-0 z-50 glass">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <!-- Logo -->
            <a href="#" onclick="MangaEngine.showSection('search'); return false;"
               class="flex items-center gap-2 group shrink-0">
                <div class="relative">
                    <svg class="w-8 h-8 text-engine-orange group-hover:animate-spin-slow transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                </div>
                <span class="text-xl font-bold font-display tracking-wider text-engine-orange text-glow">
                    MANGA<span class="text-engine-text">ENGINE</span>
                </span>
            </a>

            <!-- Search Bar -->
            <div class="flex-1 max-w-xl relative">
                <div class="relative">
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-engine-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input
                        type="text"
                        id="searchInput"
                        class="search-input w-full bg-engine-surface border border-engine-border rounded-lg pl-10 pr-4 py-2.5 text-engine-text placeholder-engine-muted font-mono text-sm focus:outline-none focus:border-engine-orange transition-all"
                        placeholder="Buscar mangá no AniList..."
                        autocomplete="off"
                    >
                    <div id="searchSpinner" class="absolute right-3 top-1/2 -translate-y-1/2 hidden">
                        <div class="w-5 h-5 border-2 border-engine-border border-t-engine-orange rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>

            <!-- Nav Buttons -->
            <div class="flex items-center gap-2 shrink-0">
                <button onclick="MangaEngine.showSection('favorites')"
                        class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-engine-surface border border-engine-border hover:border-engine-orange transition-all text-sm font-mono text-engine-muted hover:text-engine-orange"
                        title="Favoritos">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span class="hidden sm:inline">Favoritos</span>
                </button>
            </div>
        </div>
        <div class="neon-line"></div>
    </header>

    <!-- ============================================= -->
    <!-- MAIN CONTENT                                  -->
    <!-- ============================================= -->
    <main class="pt-20 pb-8 max-w-7xl mx-auto px-4">

        <!-- ========== SEÇÃO: RESULTADOS DE BUSCA ========== -->
        <section id="sectionSearch" class="animate-fade-in">
            
            <!-- Continue Reading Section (Dynamic) -->
            <div id="continueReading" class="mb-10 hidden">
                <h2 class="text-xs font-mono text-engine-muted mb-4 tracking-widest uppercase flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-engine-orange animate-pulse"></span>
                    Continuar Lendo
                </h2>
                <div id="continueReadingContent">
                    <!-- Preenchido pelo engine.js -->
                </div>
            </div>

            <!-- Hero Welcome -->
            <div id="welcomeHero" class="text-center py-20">
                <div class="inline-block mb-6">
                    <svg class="w-20 h-20 text-engine-orange animate-spin-slow mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                </div>
                <h1 class="text-5xl font-bold font-display text-engine-orange text-glow mb-3 tracking-wide">
                    MANGA<span class="text-engine-text">ENGINE</span>
                </h1>
                <p class="text-engine-muted font-mono text-sm mb-8 max-w-md mx-auto">
                    Motor de busca híbrido &mdash; Metadados AniList + Conteúdo MangaDex
                </p>
                <div class="flex items-center justify-center gap-6 text-xs font-mono text-engine-muted">
                    <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        AniList API
                    </span>
                    <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        MangaDex API
                    </span>
                    <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        PHP/MySQLi
                    </span>
                </div>
            </div>

            <!-- Search Results Grid -->
            <div id="homeSectionTitle" class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 class="text-xl font-bold font-display text-engine-text tracking-wide">
                    <span class="text-engine-orange">//</span> MANGÁS EM ALTA
                </h2>
                
                <!-- Genre Filters -->
                <div id="genreFilters" class="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    <button data-genre="" class="genre-btn px-3 py-1 rounded-full border border-engine-border text-[10px] font-mono text-engine-muted hover:border-engine-orange hover:text-engine-orange transition-all whitespace-nowrap bg-engine-surface active-genre">Tudo</button>
                    <button data-genre="Action" class="genre-btn px-3 py-1 rounded-full border border-engine-border text-[10px] font-mono text-engine-muted hover:border-engine-orange hover:text-engine-orange transition-all whitespace-nowrap bg-engine-surface">Ação</button>
                    <button data-genre="Adventure" class="genre-btn px-3 py-1 rounded-full border border-engine-border text-[10px] font-mono text-engine-muted hover:border-engine-orange hover:text-engine-orange transition-all whitespace-nowrap bg-engine-surface">Aventura</button>
                    <button data-genre="Comedy" class="genre-btn px-3 py-1 rounded-full border border-engine-border text-[10px] font-mono text-engine-muted hover:border-engine-orange hover:text-engine-orange transition-all whitespace-nowrap bg-engine-surface">Comédia</button>
                    <button data-genre="Drama" class="genre-btn px-3 py-1 rounded-full border border-engine-border text-[10px] font-mono text-engine-muted hover:border-engine-orange hover:text-engine-orange transition-all whitespace-nowrap bg-engine-surface">Drama</button>
                    <button data-genre="Fantasy" class="genre-btn px-3 py-1 rounded-full border border-engine-border text-[10px] font-mono text-engine-muted hover:border-engine-orange hover:text-engine-orange transition-all whitespace-nowrap bg-engine-surface">Fantasia</button>
                    <button data-genre="Horror" class="genre-btn px-3 py-1 rounded-full border border-engine-border text-[10px] font-mono text-engine-muted hover:border-engine-orange hover:text-engine-orange transition-all whitespace-nowrap bg-engine-surface">Terror</button>
                    <button data-genre="Romance" class="genre-btn px-3 py-1 rounded-full border border-engine-border text-[10px] font-mono text-engine-muted hover:border-engine-orange hover:text-engine-orange transition-all whitespace-nowrap bg-engine-surface">Romance</button>
                </div>
            </div>
            <div id="searchResults" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <!-- Cards dinamicamente inseridos por engine.js -->
            </div>

            <!-- Pagination -->
            <div id="paginationContainer" class="mt-12 text-center hidden">
                <button id="loadMoreBtn" class="px-8 py-3 rounded-lg border border-engine-border bg-engine-surface text-engine-muted font-mono text-sm hover:border-engine-orange hover:text-engine-orange transition-all group">
                    CARREGAR MAIS 
                    <span class="inline-block group-hover:translate-y-1 transition-transform">↓</span>
                </button>
            </div>

            <!-- Empty State -->
            <div id="searchEmpty" class="text-center py-16 hidden">
                <svg class="w-16 h-16 text-engine-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-engine-muted font-mono text-sm">Nenhum resultado encontrado.</p>
            </div>
        </section>

        <!-- ========== SEÇÃO: DETALHES DO MANGÁ ========== -->
        <section id="sectionDetails" class="section-hidden animate-fade-in">
            <button onclick="MangaEngine.showSection('search')"
                    class="flex items-center gap-2 text-engine-muted hover:text-engine-orange font-mono text-sm mb-6 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Voltar aos resultados
            </button>

            <!-- Manga Info Banner -->
            <div id="mangaInfo" class="flex flex-col md:flex-row gap-6 mb-8">
                <!-- Populated by engine.js -->
            </div>

            <div class="neon-line mb-6"></div>

            <!-- Chapters Header -->
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold font-display text-engine-text tracking-wide">
                    <span class="text-engine-orange">//</span> CAPÍTULOS
                </h2>
                <span id="chapterCount" class="text-engine-muted font-mono text-xs"></span>
            </div>

            <!-- Loading Chapters -->
            <div id="chaptersLoading" class="flex flex-col items-center py-12 hidden">
                <div class="spinner mb-4"></div>
                <p class="text-engine-muted font-mono text-sm animate-pulse-glow">Buscando capítulos no MangaDex...</p>
            </div>

            <!-- Chapters List -->
            <div id="chaptersList" class="space-y-1">
                <!-- Chapter items inseridos por engine.js -->
            </div>

            <!-- No Chapters -->
            <div id="chaptersEmpty" class="text-center py-12 hidden">
                <svg class="w-12 h-12 text-engine-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                <p class="text-engine-muted font-mono text-sm">Nenhum capítulo encontrado em inglês ou português.</p>
            </div>
        </section>

        <!-- ========== SEÇÃO: LEITOR ========== -->
        <section id="sectionReader" class="section-hidden animate-fade-in">
            <!-- Reader Header -->
            <div class="glass rounded-lg p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
                <!-- Reader Control -->
                <div class="flex items-center gap-2">
                    <div class="flex items-center bg-engine-surface rounded-lg border border-engine-border p-1">
                        <button id="btnModeScroll" title="Modo Rolagem" class="reader-mode-btn active px-3 py-1.5 rounded-md text-[10px] font-mono transition-all">
                            SCROLL
                        </button>
                        <button id="btnModePage" title="Modo Página" class="reader-mode-btn px-3 py-1.5 rounded-md text-[10px] font-mono transition-all">
                            PÁGINA
                        </button>
                    </div>
                    <button onclick="MangaEngine.showSection('details')" class="p-2 rounded-lg bg-engine-surface border border-engine-border hover:border-engine-orange text-engine-muted transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div id="readerTitle" class="text-center">
                    <p class="text-engine-orange font-display font-bold text-lg leading-tight"></p>
                    <p class="text-engine-muted font-mono text-xs mb-1"></p>
                    <span id="readerPageCounter" class="text-engine-orange font-mono text-[10px] bg-engine-orange/10 px-2 py-0.5 rounded border border-engine-orange/20 hidden"></span>
                </div>
                <div class="flex items-center gap-2">
                    <button id="btnPrevChapter" onclick="MangaEngine.prevChapter()"
                            class="px-3 py-1.5 rounded bg-engine-surface border border-engine-border hover:border-engine-orange text-engine-muted hover:text-engine-orange font-mono text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                        ◄ Anterior
                    </button>
                    <button id="btnNextChapter" onclick="MangaEngine.nextChapter()"
                            class="px-3 py-1.5 rounded bg-engine-surface border border-engine-border hover:border-engine-orange text-engine-muted hover:text-engine-orange font-mono text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                        Próximo ►
                    </button>
                </div>
            </div>

            <!-- Loading Reader -->
            <div id="readerLoading" class="flex flex-col items-center py-16 hidden">
                <div class="spinner mb-4"></div>
                <p class="text-engine-muted font-mono text-sm animate-pulse-glow">Carregando páginas...</p>
            </div>

            <!-- Reader Pages (Vertical Scroll) -->
            <div id="readerPages" class="max-w-3xl mx-auto space-y-2">
                <!-- Imagens inseridas por engine.js -->
            </div>

            <!-- Bottom Nav -->
            <div id="readerBottomNav" class="max-w-3xl mx-auto mt-8 flex items-center justify-between hidden">
                <button onclick="MangaEngine.prevChapter()"
                        class="px-4 py-2 rounded-lg bg-engine-surface border border-engine-border hover:border-engine-orange text-engine-muted hover:text-engine-orange font-mono text-sm transition-all">
                    ◄ Capítulo Anterior
                </button>
                <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})"
                        class="px-4 py-2 rounded-lg bg-engine-orange/10 border border-engine-orange/30 text-engine-orange font-mono text-sm hover:bg-engine-orange/20 transition-all">
                    ↑ Topo
                </button>
                <button onclick="MangaEngine.nextChapter()"
                        class="px-4 py-2 rounded-lg bg-engine-surface border border-engine-border hover:border-engine-orange text-engine-muted hover:text-engine-orange font-mono text-sm transition-all">
                    Próximo Capítulo ►
                </button>
            </div>
        </section>

        <!-- ========== SEÇÃO: FAVORITOS ========== -->
        <section id="sectionFavorites" class="section-hidden animate-fade-in">
            <button onclick="MangaEngine.showSection('search')"
                    class="flex items-center gap-2 text-engine-muted hover:text-engine-orange font-mono text-sm mb-6 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Voltar
            </button>

            <div class="flex items-center gap-3 mb-6">
                <svg class="w-6 h-6 text-engine-orange" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <h2 class="text-2xl font-bold font-display text-engine-text tracking-wide">
                    <span class="text-engine-orange">//</span> FAVORITOS
                </h2>
            </div>

            <!-- Loading Favorites -->
            <div id="favoritesLoading" class="flex flex-col items-center py-12 hidden">
                <div class="spinner mb-4"></div>
                <p class="text-engine-muted font-mono text-sm">Carregando favoritos...</p>
            </div>

            <!-- Favorites Grid -->
            <div id="favoritesGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <!-- Favoritos inseridos por engine.js -->
            </div>

            <!-- Empty Favorites -->
            <div id="favoritesEmpty" class="text-center py-16 hidden">
                <svg class="w-16 h-16 text-engine-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                <p class="text-engine-muted font-mono text-sm mb-2">Nenhum favorito adicionado.</p>
                <p class="text-engine-muted/60 font-mono text-xs">Busque um mangá e clique no ♥ para favoritar.</p>
            </div>
        </section>

    </main>

    <!-- ============================================= -->
    <!-- FOOTER                                        -->
    <!-- ============================================= -->
    <footer class="border-t border-engine-border py-6 mt-12">
        <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p class="text-engine-muted font-mono text-xs">
                <span class="text-engine-orange">MangaEngine</span> v1.0 — Teste de Tese Técnica
            </p>
            <div class="flex items-center gap-4 text-xs font-mono text-engine-muted">
                <span>AniList GraphQL</span>
                <span class="text-engine-border">|</span>
                <span>MangaDex API v5</span>
                <span class="text-engine-border">|</span>
                <span>PHP/MySQLi</span>
            </div>
        </div>
    </footer>

    <!-- Toast Notifications -->
    <div id="toastContainer" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2"></div>

    <!-- Engine JS -->
    <script src="engine.js"></script>
</body>
</html>
