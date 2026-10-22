<?php
/**
 * AnimeEngine v8 - View: Animdle / Music Quiz
 * Rota independente de jogo musical (separada dos controles da Rádio)
 */
?>

<div class="animdle-page-wrapper" id="animdle-page">
    <!-- HEADER DO JOGO -->
    <div class="animdle-header-card">
        <div class="animdle-title-block">
            <span class="animdle-tag" id="animdle-date-badge">DESAFIO DIÁRIO</span>
            <h1 class="page-title animdle-main-title">
                <i class="fas fa-music"></i> ANIMDLE <span class="animdle-subtitle-inline">MUSIC QUIZ</span>
            </h1>
            <p class="animdle-desc">Ouça o trecho da Opening/Ending e adivinhe o anime em até 5 tentativas.</p>
        </div>

        <div class="animdle-header-actions">
            <!-- Seletor OP / ED -->
            <div class="animdle-mode-switch" role="group" aria-label="Modo de Jogo">
                <button class="animdle-mode-btn active" id="animdle-mode-op" onclick="AnimdlePage.switchMode('OP')">
                    OPENING (OP)
                </button>
                <button class="animdle-mode-btn" id="animdle-mode-ed" onclick="AnimdlePage.switchMode('ED')">
                    ENDING (ED)
                </button>
            </div>

            <button class="btn btn-secondary btn-sm" onclick="AnimdlePage.startPracticeRound()" title="Sortear um desafio livre aleatório">
                <i class="fas fa-dice"></i> Modo Treino
            </button>

            <button class="btn btn-secondary btn-sm" id="open-calendar-btn" onclick="AnimdlePage.openArchiveCalendar()" title="Jogar desafios de dias anteriores">
                <i class="fas fa-calendar-alt"></i> Arquivo
            </button>
        </div>
    </div>

    <!-- ARENA PRINCIPAL DO JOGO -->
    <div class="animdle-arena-card">
        <!-- Vidas e Duração Desbloqueada -->
        <div class="animdle-status-bar">
            <div class="animdle-lives-box">
                <span class="status-label">TENTATIVAS:</span>
                <span class="animdle-hearts" id="animdle-lives-display">❤️❤️❤️❤️❤️</span>
            </div>
            <div class="animdle-unlock-box">
                <span class="status-label">TRECHO LIBERADO:</span>
                <span class="unlock-badge" id="animdle-duration-badge">5s / 25s</span>
            </div>
        </div>

        <!-- Moldura de Capa com Blur Progressivo -->
        <div class="animdle-stage-row">
            <div class="animdle-cover-frame">
                <img id="animdle-cover-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png" alt="Anime Misterioso" style="filter: blur(40px); transform: scale(1.12);">
                <div class="animdle-cover-overlay" id="animdle-cover-overlay">
                    <i class="fas fa-question"></i>
                </div>
            </div>

            <!-- Reprodutor de Snippet Isolado -->
            <div class="animdle-player-box">
                <div class="animdle-visualizer-bars" id="animdle-visualizer">
                    <div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div>
                    <div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div>
                    <div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div>
                </div>

                <!-- Barra de Progresso com Marcadores de 5s / 10s / 15s / 20s / 25s -->
                <div class="animdle-progress-wrap">
                    <div class="animdle-progress-track">
                        <div class="animdle-progress-unlocked" id="animdle-progress-unlocked" style="width: 20%;"></div>
                        <div class="animdle-progress-fill" id="animdle-progress-fill" style="width: 0%;"></div>
                        <span class="step-marker" style="left: 20%;" title="5s"></span>
                        <span class="step-marker" style="left: 40%;" title="10s"></span>
                        <span class="step-marker" style="left: 60%;" title="15s"></span>
                        <span class="step-marker" style="left: 80%;" title="20s"></span>
                    </div>
                    <div class="animdle-time-labels">
                        <span id="animdle-time-cur">0.0s</span>
                        <span id="animdle-time-max">Máx: 5s (de 25s)</span>
                    </div>
                </div>

                <div class="animdle-play-row">
                    <button class="animdle-play-btn" id="animdle-play-btn" onclick="AnimdlePage.toggleSnippetPlay()" disabled>
                        <i class="fas fa-spinner fa-spin"></i>
                    </button>
                    <div class="animdle-status-msg" id="animdle-status-msg">
                        Preparando desafio musical...
                    </div>
                </div>
            </div>
        </div>

        <!-- ÁREA DE PALPITE (AUTOCOMPLETE + BOTÃO PULAR) -->
        <div class="animdle-controls-area" id="animdle-controls-area">
            <div class="animdle-input-row">
                <div class="animdle-autocomplete-wrap">
                    <input type="text" id="animdle-guess-input" class="animdle-guess-input" placeholder="Digite o nome do anime..." autocomplete="off" disabled>
                    <div class="animdle-suggestions" id="animdle-suggestions"></div>
                </div>
                <button class="btn btn-secondary animdle-skip-btn" id="animdle-skip-btn" onclick="AnimdlePage.skipAttempt()" disabled>
                    Pular (+5s) <i class="fas fa-forward"></i>
                </button>
            </div>
        </div>

        <!-- HISTÓRICO DE TENTATIVAS DA RODADA -->
        <div class="animdle-attempts-list" id="animdle-attempts-list"></div>

        <!-- RESULTADO FINAL (VITÓRIA OU FIM DE JOGO) -->
        <div class="animdle-result-card" id="animdle-result-card" style="display: none;"></div>
    </div>

    <!-- MODAL DE CALENDÁRIO / ARQUIVO DIÁRIO -->
    <div class="animdle-calendar-modal" id="animdle-calendar-modal" style="display: none;" onclick="AnimdlePage.closeArchiveCalendar()">
        <div class="animdle-calendar-box" onclick="event.stopPropagation()">
            <div class="calendar-box-header">
                <h3><i class="fas fa-calendar-alt"></i> Arquivo do Animdle</h3>
                <button class="calendar-close-btn" onclick="AnimdlePage.closeArchiveCalendar()">&times;</button>
            </div>
            <div class="calendar-month-nav">
                <button class="btn btn-secondary btn-sm" onclick="AnimdlePage.changeArchiveMonth(-1)">&lt;</button>
                <span id="animdle-cal-label">Outubro 2026</span>
                <button class="btn btn-secondary btn-sm" onclick="AnimdlePage.changeArchiveMonth(1)">&gt;</button>
            </div>
            <div class="animdle-calendar-grid" id="animdle-calendar-grid"></div>
        </div>
    </div>
</div>
