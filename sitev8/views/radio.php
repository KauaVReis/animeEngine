<?php
/**
 * AnimeEngine v8 - View: Rádio AnimeThemes & Estações Temáticas
 * Estação de Rádio integrada ao motor global OSTPlayer e MusicService
 */
?>

<div class="radio-page-wrapper" id="radio-page" data-station-theme="classic">
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

    <!-- GRID PRINCIPAL DA RÁDIO (ACIMA DA DOBRA) -->
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
