<?php
/**
 * AnimeEngine v8 - View: Rádio AnimeThemes & Salas Coletivas
 * Suporta o modo Solo (11 Estações Temáticas FM) e o modo Salas Coletivas (Multiplayer Rooms)
 * com sincronização em tempo real (ETag 304 / Soft-Sync) e chat integrado.
 */
?>

<div class="radio-page-wrapper" id="radio-page" data-station-theme="classic">
    <!-- SWITCHER GLOBAL DE MODOS: ESTAÇÕES SOLOS VS SALAS COLETIVAS -->
    <div class="radio-mode-switcher-bar">
        <div class="radio-mode-switch" role="tablist" aria-label="Modo de Transmissão da Rádio">
            <button type="button" class="radio-mode-pill active" id="btn-mode-solo" onclick="RadioPage.switchRadioMode('solo')" role="tab" aria-selected="true">
                <i class="fas fa-broadcast-tower"></i> Estações Solos (11 FMs)
            </button>
            <button type="button" class="radio-mode-pill" id="btn-mode-rooms" onclick="RadioPage.switchRadioMode('rooms')" role="tab" aria-selected="false">
                <i class="fas fa-users"></i> Salas Coletivas (Live Rooms) <span class="badge-pulse-live">NOVO</span>
            </button>
        </div>
    </div>

    <!-- =========================================================================
         SEÇÃO 1: MODO ESTAÇÕES SOLOS (EXPERIÊNCIA CLÁSSICA v8)
         ========================================================================= -->
    <div id="radio-mode-solo-section" class="radio-mode-section active">
        <!-- TUNER HEADER UNIFICADO: IDENTIDADE DA ESTAÇÃO + CONTROLES COMPACTOS + SELETOR DE ESTAÇÕES EM LINHA -->
        <header class="radio-tuner-header" aria-label="Sintonizador da Rádio AnimeEngine">
            <!-- LINHA 1: STATUS AO VIVO + ESTAÇÃO ATIVA + FILTRO OP/ED + AÇÕES RÁPIDAS -->
            <div class="tuner-top-row">
                <div class="tuner-identity">
                    <div class="radio-live-badge" id="radio-live-badge" title="Status da transmissão">
                        <span class="live-dot"></span>
                        <span id="radio-status-text">NO AR</span>
                    </div>
                    <span class="station-fm-pill" id="radio-station-fm">FM 88.1 • MIX GLOBAL</span>
                    <h1 class="page-title radio-main-title">
                        <i class="fas fa-broadcast-tower"></i>
                        <span id="radio-station-heading">RÁDIO • ALEATÓRIA</span>
                    </h1>
                    <span class="tuner-divider" aria-hidden="true">•</span>
                    <p class="radio-subtitle" id="radio-station-tagline">
                        Openings &amp; Endings originais em alta definição • Sintonia contínua
                    </p>
                </div>

                <div class="tuner-actions">
                    <span class="station-theme-pill" id="radio-station-theme-pill" title="Tema visual sincronizado com a estação atual">
                        <i class="fas fa-sparkles"></i> Default
                    </span>

                    <!-- Filtro Compacto ALL / OP / ED -->
                    <div class="radio-type-filter" role="group" aria-label="Filtro de tipo de música">
                        <button type="button" class="type-filter-btn active" data-type="ALL" onclick="RadioPage.setTypeFilter('ALL')" title="Tocar Openings e Endings">TODOS</button>
                        <button type="button" class="type-filter-btn" data-type="OP" onclick="RadioPage.setTypeFilter('OP')" title="Apenas Openings (Aberturas)">OP</button>
                        <button type="button" class="type-filter-btn" data-type="ED" onclick="RadioPage.setTypeFilter('ED')" title="Apenas Endings (Encerramentos)">ED</button>
                    </div>

                    <!-- Ações Secundárias Compactas (Icon-Only Neo-Brutalist 36x36) -->
                    <button type="button" class="btn-icon-neo radio-ambient-btn active" id="radio-ambient-sync-btn" onclick="RadioPage.toggleAmbientSync()" aria-pressed="true" aria-label="Sincronizar tema visual com a estação" title="Ambiente da Estação: ON (Sincroniza tema e partículas com a rádio)">
                        <i class="fas fa-palette"></i>
                        <span class="ambient-status-dot" id="radio-ambient-state-dot"></span>
                        <span class="sr-only" id="radio-ambient-state">ON</span>
                    </button>

                    <button type="button" class="btn-icon-neo" onclick="RadioPage.refreshStation()" aria-label="Sortear nova leva de músicas desta estação" title="Nova Sintonia (Sortear novas faixas da estação)">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <!-- LINHA 2: FILTRO DE CATEGORIA + FITA HORIZONTAL COMPACTA DE ESTAÇÕES (11 ESTAÇÕES) -->
            <div class="tuner-dial-row">
                <div class="tuner-cat-switch" role="tablist" aria-label="Filtrar categoria de estações">
                    <button type="button" class="tuner-cat-btn active" data-cat="all" onclick="RadioPage.filterStationCategory('all')">Todas</button>
                    <button type="button" class="tuner-cat-btn" data-cat="geral" onclick="RadioPage.filterStationCategory('geral')">Sintonias</button>
                    <button type="button" class="tuner-cat-btn" data-cat="tematica" onclick="RadioPage.filterStationCategory('tematica')">Temáticas</button>
                </div>

                <div class="radio-stations-strip" role="radiogroup" aria-label="Estações de Rádio Temáticas">
                    <!-- Sintonias Gerais -->
                    <button type="button" class="station-btn active" role="radio" aria-checked="true" data-station="random" data-category="geral" data-visual="classic" onclick="RadioPage.selectStation('random')" title="Aleatória (FM 88.1 • Mix Global) — Curadoria livre de todas as épocas">
                        <span class="st-icon"><i class="fas fa-dice"></i></span>
                        <span class="st-name">Aleatória</span>
                        <span class="st-freq">88.1</span>
                    </button>
                    <button type="button" class="station-btn" role="radio" aria-checked="false" data-station="popular" data-category="geral" data-visual="gold" onclick="RadioPage.selectStation('popular')" title="Top Hits (FM 90.5 • Hall da Fama) — As aberturas e encerramentos mais aclamados">
                        <span class="st-icon"><i class="fas fa-crown"></i></span>
                        <span class="st-name">Top Hits</span>
                        <span class="st-freq">90.5</span>
                    </button>
                    <button type="button" class="station-btn" role="radio" aria-checked="false" data-station="seasonal" data-category="geral" data-visual="seasonal" onclick="RadioPage.selectStation('seasonal')" title="New Wave (FM 92.3 • Temporadas Recentes) — Hits da temporada atual e lançamentos">
                        <span class="st-icon"><i class="fas fa-satellite-dish"></i></span>
                        <span class="st-name">New Wave</span>
                        <span class="st-freq">92.3</span>
                    </button>
                    <button type="button" class="station-btn" role="radio" aria-checked="false" data-station="mylist" data-category="geral" data-visual="mylist" onclick="RadioPage.selectStation('mylist')" title="Minha Lista (FM 94.7 • Sua Coleção) — Temas dos animes salvos na sua lista">
                        <span class="st-icon"><i class="fas fa-bookmark"></i></span>
                        <span class="st-name">Minha Lista</span>
                        <span class="st-freq">94.7</span>
                    </button>

                    <!-- Estações Temáticas (Gênero Musical + Tema Visual) -->
                    <button type="button" class="station-btn station-thematic" role="radio" aria-checked="false" data-station="shonen" data-category="tematica" data-visual="shonen" onclick="RadioPage.selectStation('shonen')" title="Shonen Overdrive (FM 96.9) — Rock explosivo &amp; batalhas épicas • Tema Magma">
                        <span class="st-icon"><i class="fas fa-fire-alt"></i></span>
                        <span class="st-name">Shonen Overdrive</span>
                        <span class="st-freq">96.9</span>
                    </button>
                    <button type="button" class="station-btn station-thematic" role="radio" aria-checked="false" data-station="cyberpunk" data-category="tematica" data-visual="cyberpunk" onclick="RadioPage.selectStation('cyberpunk')" title="Cyber-Synth 2099 (FM 99.1) — Sci-Fi, Mecha &amp; Eletrônica • Tema Cyberpunk">
                        <span class="st-icon"><i class="fas fa-microchip"></i></span>
                        <span class="st-name">Cyber-Synth</span>
                        <span class="st-freq">99.1</span>
                    </button>
                    <button type="button" class="station-btn station-thematic" role="radio" aria-checked="false" data-station="nostalgia" data-category="tematica" data-visual="nostalgia" onclick="RadioPage.selectStation('nostalgia')" title="Nostalgia 90s/00s (FM 101.3) — Clássicos da Era de Ouro • Tema Vaporwave">
                        <span class="st-icon"><i class="fas fa-compact-disc"></i></span>
                        <span class="st-name">Nostalgia 90s/00s</span>
                        <span class="st-freq">101.3</span>
                    </button>
                    <button type="button" class="station-btn station-thematic" role="radio" aria-checked="false" data-station="chill" data-category="tematica" data-visual="chill" onclick="RadioPage.selectStation('chill')" title="Lo-Fi &amp; Slice of Life (FM 103.5) — Acústico, Iyashikei &amp; Relax • Tema Zen">
                        <span class="st-icon"><i class="fas fa-mug-hot"></i></span>
                        <span class="st-name">Lo-Fi &amp; Chill</span>
                        <span class="st-freq">103.5</span>
                    </button>
                    <button type="button" class="station-btn station-thematic" role="radio" aria-checked="false" data-station="dark" data-category="tematica" data-visual="dark" onclick="RadioPage.selectStation('dark')" title="Eclipse Seinen (FM 105.7) — Dark Fantasy, Metal &amp; Suspense • Tema Blood Moon">
                        <span class="st-icon"><i class="fas fa-skull-crossbones"></i></span>
                        <span class="st-name">Eclipse Seinen</span>
                        <span class="st-freq">105.7</span>
                    </button>
                    <button type="button" class="station-btn station-thematic" role="radio" aria-checked="false" data-station="idol" data-category="tematica" data-visual="idol" onclick="RadioPage.selectStation('idol')" title="Idol &amp; Pop Stage (FM 107.1) — J-Pop brilhante, Romance &amp; Shows • Tema Sakura">
                        <span class="st-icon"><i class="fas fa-star"></i></span>
                        <span class="st-name">Idol &amp; Pop</span>
                        <span class="st-freq">107.1</span>
                    </button>
                    <button type="button" class="station-btn station-thematic" role="radio" aria-checked="false" data-station="matrix" data-category="tematica" data-visual="matrix" onclick="RadioPage.selectStation('matrix')" title="Matrix Terminal (FM 108.9) — Mundos Virtuais &amp; Hackers • Tema Matrix">
                        <span class="st-icon"><i class="fas fa-terminal"></i></span>
                        <span class="st-name">Matrix Terminal</span>
                        <span class="st-freq">108.9</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- GRID PRINCIPAL DA RÁDIO SOLO (ACIMA DA DOBRA) -->
        <div class="radio-workspace-grid">
            <!-- COLUNA ESQUERDA: MONITOR DE VÍDEO / VITROLA + DECK DE CONTROLE -->
            <div class="radio-stage-column">
                <div class="radio-monitor-card">
                    <div class="radio-monitor-topbar">
                        <div class="monitor-signal-info">
                            <span class="signal-tag" id="radio-source-badge">WEB-STREAM</span>
                            <span class="signal-quality" id="radio-quality-badge">HD</span>
                            <span class="signal-station-chip" id="radio-stage-station-chip">FM 88.1</span>
                        </div>
                        <div class="monitor-mode-actions">
                            <button type="button" class="monitor-mode-btn active" id="btn-mode-video" onclick="RadioPage.setDisplayMode('video')" title="Exibir Clipe Original (OP/ED)">
                                <i class="fas fa-film"></i> Clipe
                            </button>
                            <button type="button" class="monitor-mode-btn" id="btn-mode-vinyl" onclick="RadioPage.setDisplayMode('visualizer')" title="Modo Vitrola &amp; Equalizador">
                                <i class="fas fa-compact-disc"></i> Vitrola
                            </button>
                            <button type="button" class="monitor-mode-btn monitor-icon-only" onclick="RadioPage.toggleFullscreenStage()" aria-label="Alternar Tela Cheia" title="Tela Cheia">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    </div>

                    <!-- PALCO VISUAL -->
                    <div class="radio-stage-screen" id="radio-stage-screen">
                        <!-- Efeito atmosférico de sobreposição temática (Scanlines CRT / Aura / Vignette) -->
                        <div class="radio-stage-atmosphere"></div>

                        <!-- Mount onde o #ost-media-stage do OSTPlayer é acoplado sem reiniciar o stream -->
                        <div class="radio-video-mount" id="radio-video-mount"></div>

                        <!-- Modo Vitrola / Sensorial (Exibido quando viewMode === 'visualizer') -->
                        <div class="radio-vinyl-stage" id="radio-vinyl-stage" style="display: none;">
                            <div class="vinyl-backdrop" id="radio-vinyl-backdrop"></div>
                            <div class="vinyl-disc-wrapper" id="radio-vinyl-disc">
                                <div class="vinyl-grooves"></div>
                                <img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png" alt="Capa" id="radio-vinyl-cover">
                                <div class="vinyl-center-hole"></div>
                            </div>
                            <div class="radio-eq-bars" id="radio-eq-bars">
                                <span></span><span></span><span></span><span></span><span></span><span></span>
                                <span></span><span></span><span></span><span></span><span></span><span></span>
                                <span></span><span></span><span></span><span></span><span></span><span></span>
                            </div>
                        </div>

                        <!-- Overlay de Carregamento -->
                        <div class="radio-loading-overlay" id="radio-loading-overlay" style="display: none;">
                            <div class="loader"></div>
                            <span id="radio-loading-msg">Sintonizando frequência AnimeThemes...</span>
                        </div>
                    </div>

                    <!-- DECK DE INFORMAÇÕES E CONTROLES DE TRANSPORTE -->
                    <div class="radio-deck-body">
                        <div class="radio-now-playing">
                            <img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png" alt="Capa" class="radio-np-cover" id="radio-np-cover">
                            <div class="radio-np-meta">
                                <div class="radio-np-badges">
                                    <span class="np-theme-pill" id="radio-np-type">OP1</span>
                                    <span class="np-year-pill" id="radio-np-year">ANIME.ENGINE</span>
                                </div>
                                <h2 class="radio-np-song" id="radio-np-song">Pronto para Sintonizar</h2>
                                <div class="radio-np-artist" id="radio-np-artist">Clique em Play ou escolha uma estação acima</div>
                                <div class="radio-np-anime-row">
                                    <span class="radio-np-anime" id="radio-np-anime">Catálogo AnimeThemes API</span>
                                </div>
                            </div>
                            <button type="button" class="btn-icon-neo radio-anime-link-icon" id="radio-anime-link-btn" style="display: none;" onclick="RadioPage.openCurrentAnimeDetails()" aria-label="Abrir Ficha do Anime" title="Abrir Ficha do Anime">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                        </div>

                        <!-- Barra de Progresso -->
                        <div class="radio-seek-row">
                            <span class="radio-time-label" id="radio-time-current">0:00</span>
                            <div class="radio-seek-bar" id="radio-seek-bar" title="Clique para avançar ou retroceder na faixa">
                                <div class="radio-seek-fill" id="radio-seek-fill"></div>
                            </div>
                            <span class="radio-time-label" id="radio-time-total">0:00</span>
                        </div>

                        <!-- Botões Principais de Transporte -->
                        <div class="radio-transport-row">
                            <div class="transport-left">
                                <button type="button" class="radio-ctrl-btn" id="radio-btn-shuffle" onclick="OSTPlayer.toggleShuffle()" aria-label="Ordem Aleatória" title="Ordem Aleatória (Shuffle)">
                                    <i class="fas fa-random"></i>
                                </button>
                                <button type="button" class="radio-ctrl-btn" id="radio-btn-repeat" onclick="OSTPlayer.cycleRepeat()" aria-label="Modo de Repetição" title="Modo de Repetição">
                                    <i class="fas fa-redo"></i>
                                </button>
                            </div>

                            <div class="transport-center">
                                <button type="button" class="radio-ctrl-btn" onclick="OSTPlayer.prev()" aria-label="Faixa Anterior" title="Faixa Anterior">
                                    <i class="fas fa-step-backward"></i>
                                </button>
                                <button type="button" class="radio-ctrl-btn radio-play-master" id="radio-btn-play" onclick="OSTPlayer.togglePlay()" aria-label="Reproduzir ou Pausar" title="Play / Pause">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button type="button" class="radio-ctrl-btn" onclick="OSTPlayer.next()" aria-label="Próxima Faixa" title="Próxima Faixa">
                                    <i class="fas fa-step-forward"></i>
                                </button>
                            </div>

                            <div class="transport-right">
                                <button type="button" class="radio-ctrl-btn" onclick="OSTPlayer.toggleMute()" id="radio-btn-mute" aria-label="Silenciar áudio" title="Mudo / Som">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                                <input type="range" class="radio-volume-slider" id="radio-volume-slider" min="0" max="100" value="80" aria-label="Volume" oninput="OSTPlayer.setVolume(this.value)">
                                <button type="button" class="radio-ctrl-btn" onclick="RadioPage.refreshStation()" aria-label="Sortear nova leva de músicas desta estação" title="Nova Sintonia (Recarregar Estação)">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COLUNA DIREITA: FILA, BUSCA NO CATÁLOGO E HISTÓRICO -->
            <div class="radio-sidebar-column">
                <div class="radio-panel-card">
                    <div class="radio-tabs-header" role="tablist">
                        <button type="button" class="radio-tab-btn active" data-tab="queue" onclick="RadioPage.switchTab('queue')">
                            <i class="fas fa-list-ol"></i> Fila <span class="tab-counter" id="radio-queue-count">0</span>
                        </button>
                        <button type="button" class="radio-tab-btn" data-tab="search" onclick="RadioPage.switchTab('search')">
                            <i class="fas fa-search"></i> Catálogo
                        </button>
                        <button type="button" class="radio-tab-btn" data-tab="history" onclick="RadioPage.switchTab('history')">
                            <i class="fas fa-history"></i> Histórico
                        </button>
                    </div>

                    <!-- ABA 1: FILA DE REPRODUÇÃO -->
                    <div class="radio-tab-content active" id="radio-tab-queue">
                        <div class="radio-panel-toolbar">
                            <span id="radio-queue-station-label">Programação da estação atual</span>
                            <button type="button" class="btn-link-neo" onclick="RadioPage.loadMoreToQueue()" title="Carregar mais músicas desta estação para a fila">
                                <i class="fas fa-plus"></i> + Faixas
                            </button>
                        </div>
                        <div class="radio-track-list" id="radio-queue-list">
                            <div class="carousel-loading"><div class="loader"></div></div>
                        </div>
                    </div>

                    <!-- ABA 2: BUSCA NO CATÁLOGO ANIMETHEMES -->
                    <div class="radio-tab-content" id="radio-tab-search" style="display: none;">
                        <form class="radio-search-form" onsubmit="event.preventDefault(); RadioPage.performSearch();">
                            <input type="text" id="radio-search-input" class="radio-search-input" placeholder="Música, artista ou anime (ex: Unravel, YOASOBI, Bleach)...">
                            <button type="submit" class="btn-icon-neo radio-search-submit" aria-label="Pesquisar no catálogo" title="Pesquisar no catálogo">
                                <i class="fas fa-search"></i>
                            </button>
                        </form>
                        <div class="radio-track-list" id="radio-search-results">
                            <div class="radio-empty-state">
                                <i class="fas fa-compact-disc"></i>
                                <p>Pesquise qualquer Opening, Ending, banda ou anime no catálogo da AnimeThemes.</p>
                            </div>
                        </div>
                    </div>

                    <!-- ABA 3: HISTÓRICO -->
                    <div class="radio-tab-content" id="radio-tab-history" style="display: none;">
                        <div class="radio-panel-toolbar">
                            <span>Tocadas recentemente nesta sessão</span>
                        </div>
                        <div class="radio-track-list" id="radio-history-list">
                            <div class="radio-empty-state">
                                <p>Nenhuma faixa no histórico ainda.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- =========================================================================
         SEÇÃO 2: MODO SALAS COLETIVAS (RADIO ROOMS)
         ========================================================================= -->
    <div id="radio-mode-rooms-section" class="radio-mode-section" style="display: none;">
        
        <!-- SUB-TELA A: LOBBY DE SALAS PÚBLICAS E PRIVADAS -->
        <div id="radio-rooms-lobby-view">
            <!-- HERO BANNER DO LOBBY -->
            <div class="rooms-hero-card">
                <div class="rooms-hero-content">
                    <div class="rooms-hero-pill"><i class="fas fa-users"></i> SALAS DE AUDIÇÃO COLETIVA</div>
                    <h2 class="rooms-hero-title">Ouça Anime Songs ao vivo com a galera</h2>
                    <p class="rooms-hero-desc">
                        Crie sua estação temática, assuma o posto de DJ, converse no chat em tempo real e sinta cada abertura e encerramento com áudio sincronizado.
                    </p>
                </div>
                <div class="rooms-hero-actions">
                    <button type="button" class="btn-neo-brand rooms-action-btn" onclick="RadioRooms.openCreateModal()">
                        <i class="fas fa-plus-circle"></i> Criar Nova Sala
                    </button>
                    <button type="button" class="btn-neo-secondary rooms-action-btn" onclick="RadioRooms.promptEnterByCode()">
                        <i class="fas fa-key"></i> Entrar por Código
                    </button>
                </div>
            </div>

            <!-- BARRA DE FILTROS E BUSCA DO LOBBY -->
            <div class="rooms-filter-bar">
                <div class="rooms-search-box">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" id="rooms-search-input" placeholder="Buscar por sala, anime ou DJ..." oninput="RadioRooms.filterRooms(this.value)">
                </div>

                <div class="rooms-category-chips" role="tablist">
                    <button type="button" class="rooms-chip active" data-cat="all" onclick="RadioRooms.setCategoryFilter('all')">Todas</button>
                    <button type="button" class="rooms-chip" data-cat="shonen" onclick="RadioRooms.setCategoryFilter('shonen')">🔥 Shounen</button>
                    <button type="button" class="rooms-chip" data-cat="chill" onclick="RadioRooms.setCategoryFilter('chill')">☕ Lo-Fi / Relax</button>
                    <button type="button" class="rooms-chip" data-cat="cyberpunk" onclick="RadioRooms.setCategoryFilter('cyberpunk')">⚡ Cyberpunk</button>
                    <button type="button" class="rooms-chip" data-cat="nostalgia" onclick="RadioRooms.setCategoryFilter('nostalgia')">📼 Anos 90/00</button>
                    <button type="button" class="rooms-chip" data-cat="idol" onclick="RadioRooms.setCategoryFilter('idol')">🌸 Idol / Pop</button>
                </div>

                <div class="rooms-refresh-wrap">
                    <button type="button" class="btn-icon-neo" onclick="RadioRooms.loadRooms(true)" title="Atualizar Lista de Salas">
                        <i class="fas fa-sync-alt" id="rooms-refresh-icon"></i>
                    </button>
                </div>
            </div>

            <!-- GRID DE CARDS DAS SALAS -->
            <div class="rooms-cards-grid" id="radio-rooms-cards-grid">
                <div class="carousel-loading"><div class="loader"></div><p>Sintonizando salas ativas...</p></div>
            </div>
        </div>

        <!-- SUB-TELA B: SALA ATIVA (PALCO AO VIVO + CHAT + FILA) -->
        <div id="radio-room-active-stage" style="display: none;">
            <!-- CABEÇALHO DA SALA AO VIVO -->
            <header class="room-active-header">
                <div class="room-header-left">
                    <button type="button" class="btn-neo-secondary room-back-btn" onclick="RadioRooms.leaveCurrentRoom()" title="Voltar ao Lobby de Salas">
                        <i class="fas fa-arrow-left"></i> Sair da Sala
                    </button>
                    <div class="room-header-meta">
                        <div class="room-header-badges">
                            <span class="room-live-pill"><span class="live-dot"></span> AO VIVO</span>
                            <span class="room-theme-pill" id="room-active-theme-pill">SHONEN</span>
                            <span class="room-sync-pill" id="room-active-sync-pill" title="Status de sincronização ETag / Soft-Sync">
                                <i class="fas fa-check-circle"></i> SYNC 304
                            </span>
                        </div>
                        <h1 class="room-active-title" id="room-active-title">Carregando sala...</h1>
                        <p class="room-active-desc" id="room-active-desc"></p>
                    </div>
                </div>

                <div class="room-header-right">
                    <div class="room-host-card" id="room-host-card">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=DJ" alt="Host" class="room-host-avatar" id="room-host-avatar">
                        <div class="room-host-info">
                            <span class="room-host-badge"><i class="fas fa-crown"></i> HOST / DJ</span>
                            <span class="room-host-name" id="room-host-name">Carregando...</span>
                        </div>
                    </div>
                    <div class="room-header-actions">
                        <button type="button" class="btn-icon-neo" onclick="RadioRooms.copyRoomLink()" title="Copiar Link / Código da Sala">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button type="button" class="btn-icon-neo btn-danger-neo" id="room-btn-close" style="display: none;" onclick="RadioRooms.closeRoom()" title="Encerrar Sala Definitivamente (Apenas Host)">
                            <i class="fas fa-power-off"></i>
                        </button>
                    </div>
                </div>
            </header>

            <!-- GRID WORKSPACE DA SALA (PALCO ESQUERDA + COMUNIDADE DIREITA) -->
            <div class="room-workspace-grid">
                <!-- COLUNA ESQUERDA: PALCO DA SALA COM VIDEO MOUNT E TRANSPORTE -->
                <div class="room-stage-column">
                    <div class="radio-monitor-card room-stage-card">
                        <div class="radio-monitor-topbar">
                            <div class="monitor-signal-info">
                                <span class="signal-tag">ROOM-SYNC</span>
                                <span class="signal-quality" id="room-listener-counter"><i class="fas fa-headphones"></i> 1 Ouvinte</span>
                            </div>
                            <div class="monitor-mode-actions">
                                <button type="button" class="monitor-mode-btn active" id="btn-room-mode-video" onclick="RadioRooms.setDisplayMode('video')">
                                    <i class="fas fa-film"></i> Clipe
                                </button>
                                <button type="button" class="monitor-mode-btn" id="btn-room-mode-vinyl" onclick="RadioRooms.setDisplayMode('visualizer')">
                                    <i class="fas fa-compact-disc"></i> Vitrola
                                </button>
                                <button type="button" class="monitor-mode-btn monitor-icon-only" onclick="RadioPage.toggleFullscreenStage()" title="Tela Cheia">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>

                        <!-- PALCO VISUAL (Acolhe o mesmo #ost-media-stage sem resetar áudio) -->
                        <div class="radio-stage-screen room-screen-wrapper" id="room-stage-screen">
                            <div class="radio-stage-atmosphere"></div>
                            
                            <!-- Container flutuante de reações de emojis ao vivo (TikTok/Bilibili style) -->
                            <div class="room-reaction-sparks-layer" id="room-sparks-layer"></div>

                            <div class="radio-video-mount" id="room-video-mount"></div>

                            <!-- Vitrola fallback na Sala -->
                            <div class="radio-vinyl-stage" id="room-vinyl-stage" style="display: none;">
                                <div class="vinyl-backdrop" id="room-vinyl-backdrop"></div>
                                <div class="vinyl-disc-wrapper" id="room-vinyl-disc">
                                    <div class="vinyl-grooves"></div>
                                    <img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png" alt="Capa" id="room-vinyl-cover">
                                    <div class="vinyl-center-hole"></div>
                                </div>
                                <div class="radio-eq-bars" id="room-eq-bars">
                                    <span></span><span></span><span></span><span></span><span></span><span></span>
                                    <span></span><span></span><span></span><span></span><span></span><span></span>
                                </div>
                            </div>

                            <div class="radio-loading-overlay" id="room-loading-overlay" style="display: none;">
                                <div class="loader"></div>
                                <span id="room-loading-msg">Sincronizando com o Host da Sala...</span>
                            </div>
                        </div>

                        <!-- DECK DE TRANSPORTE DA SALA -->
                        <div class="radio-deck-body room-deck">
                            <div class="radio-now-playing">
                                <img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png" alt="Capa" class="radio-np-cover" id="room-np-cover">
                                <div class="radio-np-meta">
                                    <div class="radio-np-badges">
                                        <span class="np-theme-pill" id="room-np-type">OP</span>
                                        <span class="np-year-pill" id="room-np-status">AO VIVO</span>
                                    </div>
                                    <h2 class="radio-np-song" id="room-np-song">Aguardando faixa...</h2>
                                    <div class="radio-np-artist" id="room-np-artist">Aguardando o DJ iniciar a transmissão</div>
                                    <div class="radio-np-anime-row">
                                        <span class="radio-np-anime" id="room-np-anime">---</span>
                                    </div>
                                </div>
                                
                                <!-- BOTÕES DE INTERAÇÃO DO OUVINTE COM O DJ -->
                                <div class="room-song-actions">
                                    <button type="button" class="btn-like-hype" id="room-btn-like" onclick="RadioRooms.sendLike()" title="Dar Like (+2 XP para o DJ)">
                                        <i class="fas fa-heart"></i> <span id="room-like-count">0</span>
                                    </button>
                                </div>
                            </div>

                            <!-- BARRA DE PROGRESSO SINCRONIZADA PELO SERVIDOR -->
                            <div class="radio-seek-row">
                                <span class="radio-time-label" id="room-time-current">0:00</span>
                                <div class="radio-seek-bar room-seek-bar" id="room-seek-bar">
                                    <div class="radio-seek-fill" id="room-seek-fill"></div>
                                </div>
                                <span class="radio-time-label" id="room-time-total">0:00</span>
                            </div>

                            <!-- CONTROLES ADAPTATIVOS: HOST VS OUVINTE -->
                            <div class="radio-transport-row room-transport">
                                <div class="transport-left">
                                    <!-- Botão de Votar para Pular (Ouvintes) -->
                                    <button type="button" class="btn-neo-secondary room-skip-vote-btn" id="room-btn-vote-skip" onclick="RadioRooms.voteSkip()" title="Votar para pular a música atual (50% de consenso necessário)">
                                        <i class="fas fa-forward"></i> <span id="room-vote-skip-label">Votar Pular (0)</span>
                                    </button>
                                </div>

                                <div class="transport-center">
                                    <!-- Painel do Host (DJ) -->
                                    <div class="host-controls-cluster" id="room-host-controls" style="display: none;">
                                        <button type="button" class="radio-ctrl-btn radio-play-master" id="room-host-playpause" onclick="RadioRooms.hostTogglePlay()" title="Pausar / Retomar a Sala Inteira">
                                            <i class="fas fa-pause"></i>
                                        </button>
                                        <button type="button" class="radio-ctrl-btn" onclick="RadioRooms.hostSkipTrack()" title="Pular Faixa Imediatamente (Host DJ)">
                                            <i class="fas fa-step-forward"></i>
                                        </button>
                                    </div>

                                    <!-- Painel do Ouvinte Comum -->
                                    <div class="listener-controls-cluster" id="room-listener-controls">
                                        <button type="button" class="radio-ctrl-btn" onclick="OSTPlayer.toggleMute()" id="room-btn-mute" title="Mutar / Desmutar Som Local">
                                            <i class="fas fa-volume-up"></i>
                                        </button>
                                        <button type="button" class="btn-neo-secondary btn-sm" onclick="RadioRooms.forceResync()" title="Forçar Re-sincronia de áudio com o servidor">
                                            <i class="fas fa-sync-alt"></i> Sincronizar
                                        </button>
                                    </div>
                                </div>

                                <div class="transport-right">
                                    <input type="range" class="radio-volume-slider" id="room-volume-slider" min="0" max="100" value="80" oninput="OSTPlayer.setVolume(this.value)" aria-label="Volume">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- COLUNA DIREITA: PAINEL DA COMUNIDADE (CHAT, FILA, OUVINTES) -->
                <div class="room-sidebar-column">
                    <div class="radio-panel-card room-community-card">
                        <div class="radio-tabs-header" role="tablist">
                            <button type="button" class="radio-tab-btn active" data-room-tab="chat" onclick="RadioRooms.switchTab('chat')">
                                <i class="fas fa-comments"></i> Chat <span class="tab-counter" id="room-unread-count">0</span>
                            </button>
                            <button type="button" class="radio-tab-btn" data-room-tab="queue" onclick="RadioRooms.switchTab('queue')">
                                <i class="fas fa-list-ol"></i> Fila <span class="tab-counter" id="room-queue-count">0</span>
                            </button>
                            <button type="button" class="radio-tab-btn" data-room-tab="listeners" onclick="RadioRooms.switchTab('listeners')">
                                <i class="fas fa-users"></i> Ouvintes <span class="tab-counter" id="room-listeners-count">1</span>
                            </button>
                        </div>

                        <!-- ABA 1: CHAT DA SALA COM REAÇÕES RÁPIDAS -->
                        <div class="room-tab-content active" id="room-tab-chat">
                            <!-- FLUXO DE MENSAGENS -->
                            <div class="room-chat-messages" id="room-chat-messages">
                                <div class="chat-system-msg">
                                    <i class="fas fa-info-circle"></i> Bem-vindo à sala! Interaja com respeito e curta as músicas.
                                </div>
                            </div>

                            <!-- BARRA DE REAÇÕES RÁPIDAS RÍTMICAS -->
                            <div class="room-quick-reactions-bar">
                                <span class="reactions-label">Reações:</span>
                                <button type="button" class="btn-reaction" onclick="RadioRooms.sendReaction('🔥')" title="Fogo / Hype">🔥 HYPE</button>
                                <button type="button" class="btn-reaction" onclick="RadioRooms.sendReaction('🌸')" title="Sakura / Chills">🌸 CHILLS</button>
                                <button type="button" class="btn-reaction" onclick="RadioRooms.sendReaction('⚡')" title="Raio / Drop">⚡ DROP</button>
                                <button type="button" class="btn-reaction" onclick="RadioRooms.sendReaction('🎸')" title="Guitarra / Banger">🎸 BANGER</button>
                                <button type="button" class="btn-reaction" onclick="RadioRooms.sendReaction('😭')" title="Choro / Emoção">😭 EMOÇÃO</button>
                            </div>

                            <!-- FORMULÁRIO DE ENVIO DE MENSAGEM -->
                            <form class="room-chat-form" onsubmit="event.preventDefault(); RadioRooms.sendChatMessage();">
                                <input type="text" id="room-chat-input" class="room-chat-input" placeholder="Comente sobre a música..." maxlength="300" autocomplete="off">
                                <button type="submit" class="btn-icon-neo room-chat-send-btn" aria-label="Enviar mensagem" title="Enviar mensagem">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>

                        <!-- ABA 2: FILA COLABORATIVA -->
                        <div class="room-tab-content" id="room-tab-queue" style="display: none;">
                            <div class="radio-panel-toolbar">
                                <span>Próximas faixas da sala</span>
                                <button type="button" class="btn-neo-brand btn-sm" onclick="RadioRooms.openAddSongModal()" title="Sugerir ou adicionar música à fila">
                                    <i class="fas fa-plus"></i> + Adicionar Música
                                </button>
                            </div>
                            <div class="radio-track-list" id="room-queue-list">
                                <div class="radio-empty-state">
                                    <i class="fas fa-list"></i>
                                    <p>Nenhuma música na fila a seguir. Seja o primeiro a adicionar!</p>
                                </div>
                            </div>
                        </div>

                        <!-- ABA 3: LISTA DE OUVINTES CONECTADOS -->
                        <div class="room-tab-content" id="room-tab-listeners" style="display: none;">
                            <div class="radio-panel-toolbar">
                                <span>Membros presentes na sala</span>
                            </div>
                            <div class="room-listeners-grid" id="room-listeners-grid">
                                <div class="carousel-loading"><div class="loader"></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- =========================================================================
         MODAIS NEO-BRUTALISTAS DE SALAS
         ========================================================================= -->

    <!-- MODAL 1: CRIAR SALA -->
    <div class="neo-modal-backdrop" id="modal-create-room" style="display: none;" onclick="if(event.target === this) RadioRooms.closeCreateModal();">
        <div class="neo-modal-box">
            <div class="neo-modal-header">
                <h3 class="neo-modal-title"><i class="fas fa-plus-circle"></i> Criar Sala Coletiva</h3>
                <button type="button" class="btn-close-neo" onclick="RadioRooms.closeCreateModal()" aria-label="Fechar">&times;</button>
            </div>
            <form id="form-create-room" onsubmit="event.preventDefault(); RadioRooms.submitCreateRoom();">
                <div class="neo-modal-body">
                    <div class="form-group-neo">
                        <label for="create-room-nome" class="form-label-neo">Nome da Sala *</label>
                        <input type="text" id="create-room-nome" class="form-input-neo" placeholder="Ex: Shounen Hype Tavern, Noites de Lo-Fi..." required maxlength="80">
                    </div>

                    <div class="form-group-neo">
                        <label for="create-room-desc" class="form-label-neo">Descrição / Regras</label>
                        <textarea id="create-room-desc" class="form-textarea-neo" rows="2" placeholder="O que vai tocar por aqui?"></textarea>
                    </div>

                    <div class="form-row-neo">
                        <div class="form-group-neo col">
                            <label for="create-room-theme" class="form-label-neo">Gênero / Tema Base</label>
                            <select id="create-room-theme" class="form-select-neo">
                                <option value="shonen">🔥 Shounen Magma</option>
                                <option value="chill">☕ Lo-Fi &amp; Chill</option>
                                <option value="cyberpunk">⚡ Cyber-Synth 2099</option>
                                <option value="nostalgia">📼 Nostalgia 90s/00s</option>
                                <option value="gold">👑 Top Hits</option>
                                <option value="dark">🌑 Eclipse Seinen</option>
                                <option value="idol">🌸 Idol &amp; Pop Stage</option>
                                <option value="matrix">💻 Matrix Terminal</option>
                            </select>
                        </div>
                        <div class="form-group-neo col">
                            <label for="create-room-tipo" class="form-label-neo">Visibilidade</label>
                            <select id="create-room-tipo" class="form-select-neo" onchange="RadioRooms.togglePasswordInput(this.value)">
                                <option value="publica">🌐 Pública (Aberta no Lobby)</option>
                                <option value="privada">🔒 Privada (Apenas com Senha)</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group-neo" id="group-room-password" style="display: none;">
                        <label for="create-room-pass" class="form-label-neo">Senha de Acesso (para convidados)</label>
                        <input type="password" id="create-room-pass" class="form-input-neo" placeholder="Senha da sala">
                    </div>
                </div>
                <div class="neo-modal-footer">
                    <button type="button" class="btn-neo-secondary" onclick="RadioRooms.closeCreateModal()">Cancelar</button>
                    <button type="submit" class="btn-neo-brand" id="btn-submit-create-room">
                        <i class="fas fa-broadcast-tower"></i> Lançar Sala (+25 XP)
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL 2: ADICIONAR MÚSICA À FILA DA SALA -->
    <div class="neo-modal-backdrop" id="modal-add-song" style="display: none;" onclick="if(event.target === this) RadioRooms.closeAddSongModal();">
        <div class="neo-modal-box">
            <div class="neo-modal-header">
                <h3 class="neo-modal-title"><i class="fas fa-music"></i> Adicionar Faixa à Fila da Sala</h3>
                <button type="button" class="btn-close-neo" onclick="RadioRooms.closeAddSongModal()" aria-label="Fechar">&times;</button>
            </div>
            <div class="neo-modal-body">
                <form class="radio-search-form" onsubmit="event.preventDefault(); RadioRooms.searchForQueue();">
                    <input type="text" id="room-search-song-input" class="radio-search-input" placeholder="Buscar por música, anime ou artista (ex: Silhouette, LiSA, JJK)...">
                    <button type="submit" class="btn-icon-neo" aria-label="Pesquisar">
                        <i class="fas fa-search"></i>
                    </button>
                </form>

                <div class="radio-track-list modal-track-list" id="room-add-song-results">
                    <div class="radio-empty-state">
                        <p>Pesquise uma faixa do catálogo oficial da AnimeThemes para adicionar à fila da sala.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
