<?php
/**
 * AnimeEngine v8 - View: Home
 * Conteudo principal da pagina inicial.
 * NAO inclui <html>, <head>, <body>, header ou footer.
 */
?>

<!-- HERO BANNER -->
<section class="hero-banner" id="hero-banner">
    <div class="hero-overlay"></div>
    <div class="hero-content">
        <span class="hero-badge" id="hero-badge">🔥 EM DESTAQUE</span>
        <h1 class="hero-title" id="hero-title">Carregando...</h1>
        <p class="hero-synopsis" id="hero-synopsis"></p>
        <div class="hero-meta">
            <span class="hero-score"><i class="fas fa-star"></i> <span id="hero-score">-</span></span>
            <span class="hero-eps"><i class="fas fa-tv"></i> <span id="hero-eps">-</span> eps</span>
        </div>
        <div class="hero-actions">
            <a href="#" class="btn btn-primary" id="hero-details-btn">
                <i class="fas fa-info-circle"></i> Ver Detalhes
            </a>
            <button class="btn btn-secondary" id="hero-ost-btn" title="Tocar Opening/Ending oficial no Player Global">
                <i class="fas fa-music"></i> Ouvir OP/ED
            </button>
            <?php if ($usuario): ?>
                <button class="btn btn-secondary" id="hero-list-btn">
                    <i class="fas fa-plus"></i> Minha Lista
                </button>
            <?php else: ?>
                <a href="?page=login" class="btn btn-secondary">
                    <i class="fas fa-sign-in-alt"></i> Entrar para Salvar
                </a>
            <?php endif; ?>
        </div>
    </div>
</section>

<!-- PAINEL DE CONTROLE DO DIA (COMMAND STRIP NEO-BRUTALISTA) -->
<section class="command-strip-section" id="home-command-strip">
    <div class="command-strip-grid">
        <!-- BLOCO 1: ANIMDLE DIÁRIO -->
        <div class="command-card command-card-animdle" id="cmd-card-animdle">
            <div class="command-card-top">
                <span class="command-tag"><i class="fas fa-gamepad"></i> DESAFIO DIÁRIO</span>
                <span class="command-status-pill" id="cmd-animdle-badge">HOJE</span>
            </div>
            <div class="command-card-title" id="cmd-animdle-title">Animdle — Qual é o Anime?</div>
            <div class="command-card-sub" id="cmd-animdle-sub">Adivinhe pela Opening em até 5 tentativas (+50 XP)</div>
            <div class="command-card-actions">
                <a href="?page=animdle" class="btn btn-primary btn-sm">
                    <i class="fas fa-play"></i> Jogar Desafio
                </a>
            </div>
        </div>

        <!-- BLOCO 2: SINTONIA RÁDIO FM -->
        <div class="command-card command-card-radio">
            <div class="command-card-top">
                <span class="command-tag"><i class="fas fa-broadcast-tower"></i> RÁDIO FM 11 ESTAÇÕES</span>
                <span class="command-status-pill live-pill" id="cmd-radio-station">SHONEN POWER</span>
            </div>
            <div class="command-card-title" id="cmd-radio-track">Sintonizador OP/ED Oficial</div>
            <div class="command-card-sub">Openings e Endings reais sem sair da navegação</div>
            <div class="command-card-actions">
                <button type="button" class="btn btn-primary btn-sm" id="cmd-radio-play-btn" onclick="HomePage.quickTuneRadio()">
                    <i class="fas fa-bolt"></i> Sintonizar Agora
                </button>
                <a href="?page=radio" class="btn btn-secondary btn-sm">
                    <i class="fas fa-sliders-h"></i> Estações
                </a>
            </div>
        </div>

        <!-- BLOCO 3: ROLETA SONORA (SURPRESA) -->
        <div class="command-card command-card-roulette">
            <div class="command-card-top">
                <span class="command-tag"><i class="fas fa-record-vinyl"></i> DESCOBERTA CEGA</span>
                <span class="command-status-pill">SURPRESA</span>
            </div>
            <div class="command-card-title" id="cmd-roulette-title">Roleta de Openings</div>
            <div class="command-card-sub" id="cmd-roulette-sub">Sorteie uma OP aleatória e descubra um novo anime</div>
            <div class="command-card-actions">
                <button type="button" class="btn btn-secondary btn-sm" id="cmd-roulette-btn" onclick="HomePage.spinBlindOST()">
                    <i class="fas fa-dice"></i> Girar Roleta OP
                </button>
                <a href="?page=calculadora" class="btn btn-secondary btn-sm" title="Oráculo de Recomendações">
                    <i class="fas fa-magic"></i> Oráculo
                </a>
            </div>
        </div>

        <!-- BLOCO 4: TELEMETRIA DO MOTOR TRI-API -->
        <div class="command-card command-card-engine">
            <div class="command-card-top">
                <span class="command-tag"><i class="fas fa-microchip"></i> MOTOR DE DADOS v8</span>
                <span class="command-status-pill engine-pill" id="cmd-engine-pill">TRI-API</span>
            </div>
            <div class="command-card-title" id="cmd-engine-source">Verificando provedor...</div>
            <div class="command-card-sub" id="cmd-engine-desc">Failover automático AniList ⇄ Jikan v4 ⇄ AnimeThemes</div>
            <div class="command-card-actions">
                <a href="?page=calendario" class="btn btn-secondary btn-sm">
                    <i class="fas fa-calendar-alt"></i> Grade Semanal
                </a>
                <a href="?page=changelog" class="btn btn-secondary btn-sm">
                    <i class="fas fa-code-branch"></i> v8.0
                </a>
            </div>
        </div>
    </div>
</section>

<!-- QUOTE & WEEKLY GOALS ROW -->
<div class="home-widgets-row">
    <div id="quote-container"></div>
    <div id="goals-container"></div>
</div>

<!-- SECTION: PRÓXIMOS EPISÓDIOS -->
<section class="anime-section" id="section-airing" style="display: none;"></section>

<!-- SECTION: CONTINUAR ASSISTINDO -->
<?php if ($usuario): ?>
<section class="anime-section" id="section-watching">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-play-circle"></i> Continuar Assistindo</h2>
        <a href="?page=assistindo" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-watching"></div>
</section>
<?php endif; ?>

<!-- ANIME OF THE DAY -->
<div id="anime-of-day-container"></div>

<!-- SECTION: EM ALTA -->
<section class="anime-section" id="section-trending">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-fire"></i> Em Alta Esta Semana</h2>
        <a href="?page=explorar&filter=trending" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-trending">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>

<!-- SECTION: TEMPORADA ATUAL -->
<section class="anime-section" id="section-seasonal">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-snowflake"></i> Temporada Atual</h2>
        <a href="?page=explorar&filter=seasonal" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-seasonal">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>

<!-- SECTION: TOP -->
<section class="anime-section" id="section-top">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-trophy"></i> Mais Bem Avaliados</h2>
        <a href="?page=explorar&filter=top" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-top">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>
