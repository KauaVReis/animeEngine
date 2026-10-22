<?php
/**
 * AnimeEngine v8 - View: Home (Reimaginada Neo-Brutalista)
 * Hero Spotlight Dinâmico + Rail de Destaques + Arcade Command Hub +
 * Discovery Matrix por Vibe + Pódio Semanal Top 10 + Carrosséis
 */
?>

<!-- 1. HERO SPOTLIGHT DINÂMICO (ANIME HEADLINE) -->
<section class="hero-spotlight-wrapper" id="hero-spotlight">
    <div class="hero-spotlight-card">
        <div class="hero-backdrop" id="hero-backdrop"></div>
        <div class="hero-overlay-neo"></div>

        <div class="hero-spotlight-body">
            <div class="hero-headline-meta">
                <span class="hero-headline-badge" id="hero-badge">🔥 DESTAQUE #1 DA TEMPORADA</span>
                <span class="hero-format-pill" id="hero-format">TV</span>
                <span class="hero-year-pill" id="hero-year">2026</span>
            </div>

            <h1 class="hero-headline-title" id="hero-title">Carregando Destaque...</h1>
            <div class="hero-headline-sub" id="hero-romaji">Sincronizando com o motor de dados</div>

            <p class="hero-headline-synopsis" id="hero-synopsis">
                Aguarde um momento enquanto carregamos a obra em evidência nesta semana...
            </p>

            <div class="hero-headline-metrics">
                <div class="metric-chip score-chip">
                    <i class="fas fa-star"></i>
                    <strong id="hero-score">9.4</strong>
                    <span>/ 10</span>
                </div>
                <div class="metric-chip eps-chip">
                    <i class="fas fa-play-circle"></i>
                    <span id="hero-eps">24 eps</span>
                </div>
                <div class="metric-chip studio-chip">
                    <i class="fas fa-film"></i>
                    <span id="hero-studio">Studio</span>
                </div>
            </div>

            <div class="hero-headline-actions">
                <a href="#" class="btn btn-primary btn-lg" id="hero-details-btn">
                    <i class="fas fa-arrow-right"></i> Ver Ficha Completa
                </a>
                <button type="button" class="btn btn-secondary btn-lg" id="hero-ost-btn" title="Tocar Opening oficial no Player persistente">
                    <i class="fas fa-music"></i> Ouvir Abertura Oficial
                </button>
                <?php if ($usuario): ?>
                    <button type="button" class="btn btn-secondary btn-lg" id="hero-list-btn">
                        <i class="fas fa-plus"></i> Salvar na Lista
                    </button>
                <?php else: ?>
                    <a href="?page=login" class="btn btn-secondary btn-lg">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </a>
                <?php endif; ?>
            </div>
        </div>

        <!-- RAIL DE MINI-DESTAQUES LATERAIS / SWITCHER -->
        <div class="hero-spotlight-rail">
            <div class="rail-header">
                <span><i class="fas fa-layer-group"></i> EM FOCO</span>
                <span class="rail-counter" id="hero-rail-counter">1 / 4</span>
            </div>
            <div class="rail-items-container" id="hero-rail-items">
                <!-- Preenchido via JavaScript -->
                <div class="rail-item active skeleton-rail"></div>
                <div class="rail-item skeleton-rail"></div>
                <div class="rail-item skeleton-rail"></div>
                <div class="rail-item skeleton-rail"></div>
            </div>
        </div>
    </div>
</section>

<!-- 2. ARCADE & UTILITIES HUB (COMMAND STRIP NEO-BRUTALISTA) -->
<section class="command-strip-section" id="home-command-strip">
    <div class="command-strip-grid">
        <!-- BLOCO 1: SINTONIA RÁDIO FM (11 ESTAÇÕES) -->
        <div class="command-card command-card-radio">
            <div class="command-card-top">
                <span class="command-tag"><i class="fas fa-broadcast-tower"></i> RÁDIO ANIME.FM</span>
                <span class="command-status-pill live-pill" id="cmd-radio-station">SHONEN POWER</span>
            </div>
            <div class="command-card-title text-truncate" id="cmd-radio-track">Sintonizador Oficial OP/ED</div>
            <div class="command-card-sub truncate-2">Músicas em HD sincronizadas sem pausar na navegação SPA</div>
            <div class="command-card-actions">
                <button type="button" class="btn btn-primary btn-sm" id="cmd-radio-play-btn" onclick="HomePage.quickTuneRadio()">
                    <i class="fas fa-bolt"></i> Sintonizar
                </button>
                <a href="?page=radio" class="btn btn-secondary btn-sm">
                    <i class="fas fa-sliders-h"></i> Estações
                </a>
            </div>
        </div>

        <!-- BLOCO 2: ANIMDLE DIÁRIO -->
        <div class="command-card command-card-animdle" id="cmd-card-animdle">
            <div class="command-card-top">
                <span class="command-tag"><i class="fas fa-gamepad"></i> DESAFIO DIÁRIO</span>
                <span class="command-status-pill" id="cmd-animdle-badge">HOJE</span>
            </div>
            <div class="command-card-title text-truncate" id="cmd-animdle-title">Animdle — Qual é o Anime?</div>
            <div class="command-card-sub truncate-2">Ouça 1s de áudio e adivinhe o anime do dia (+50 XP)</div>
            <div class="command-card-actions">
                <a href="?page=animdle" class="btn btn-primary btn-sm">
                    <i class="fas fa-play"></i> Jogar Agora
                </a>
            </div>
        </div>

        <!-- BLOCO 3: ROLETA DE DESCOBERTA CEGA -->
        <div class="command-card command-card-roulette">
            <div class="command-card-top">
                <span class="command-tag"><i class="fas fa-record-vinyl"></i> DESCOBERTA CEGA</span>
                <span class="command-status-pill">SURPRESA</span>
            </div>
            <div class="command-card-title text-truncate" id="cmd-roulette-title">Roleta de Openings</div>
            <div class="command-card-sub truncate-2" id="cmd-roulette-sub">Sorteie uma faixa às cegas e conheça obras novas</div>
            <div class="command-card-actions">
                <button type="button" class="btn btn-secondary btn-sm" id="cmd-roulette-btn" onclick="HomePage.spinBlindOST()">
                    <i class="fas fa-dice"></i> Girar Roleta
                </button>
                <a href="?page=calculadora" class="btn btn-secondary btn-sm" title="Oráculo de Recomendações">
                    <i class="fas fa-magic"></i> Oráculo
                </a>
            </div>
        </div>

        <!-- BLOCO 4: MOTOR TRI-API & DIAGNÓSTICO -->
        <div class="command-card command-card-engine">
            <div class="command-card-top">
                <span class="command-tag"><i class="fas fa-microchip"></i> MOTOR DE DADOS v8</span>
                <span class="command-status-pill engine-pill" id="cmd-engine-pill">TRI-API</span>
            </div>
            <div class="command-card-title text-truncate" id="cmd-engine-source">AniList ⇄ Themes ⇄ Jikan</div>
            <div class="command-card-sub truncate-2" id="cmd-engine-desc">Resiliência ativa com failover automático e cache</div>
            <div class="command-card-actions">
                <a href="?page=calendario" class="btn btn-secondary btn-sm">
                    <i class="fas fa-calendar-alt"></i> Grade
                </a>
                <a href="?page=configuracoes" class="btn btn-secondary btn-sm" title="Abrir Configurações do Sistema">
                    <i class="fas fa-cog"></i> Ajustes
                </a>
            </div>
        </div>
    </div>
</section>

<!-- 3. DISCOVERY MATRIX (DESCOBERTA POR VIBE / MOOD) -->
<section class="vibe-discovery-section">
    <div class="section-header">
        <div class="section-title-wrap">
            <h2 class="section-title"><i class="fas fa-compass"></i> O que você quer sentir hoje?</h2>
            <span class="section-badge">DESCOBERTA POR VIBE</span>
        </div>
        <a href="?page=explorar" class="section-link">Ver Catálogo Completo →</a>
    </div>

    <!-- SENSATION PILLS TÁTEIS -->
    <div class="vibe-pills-bar" id="vibe-pills-bar">
        <button type="button" class="vibe-pill active" data-vibe="shonen" onclick="HomePage.selectVibe('shonen', this)">
            <i class="fas fa-fire"></i> Shounen &amp; Hype
        </button>
        <button type="button" class="vibe-pill" data-vibe="cyberpunk" onclick="HomePage.selectVibe('cyberpunk', this)">
            <i class="fas fa-vr-cardboard"></i> Cyberpunk &amp; Sci-Fi
        </button>
        <button type="button" class="vibe-pill" data-vibe="cozy" onclick="HomePage.selectVibe('cozy', this)">
            <i class="fas fa-mug-hot"></i> Cozy &amp; Slice of Life
        </button>
        <button type="button" class="vibe-pill" data-vibe="drama" onclick="HomePage.selectVibe('drama', this)">
            <i class="fas fa-heart-broken"></i> Drama &amp; Lágrimas
        </button>
        <button type="button" class="vibe-pill" data-vibe="mindfuck" onclick="HomePage.selectVibe('mindfuck', this)">
            <i class="fas fa-brain"></i> Mistério &amp; Mindfuck
        </button>
        <button type="button" class="vibe-pill" data-vibe="fantasy" onclick="HomePage.selectVibe('fantasy', this)">
            <i class="fas fa-dragon"></i> Fantasia &amp; Isekai
        </button>
    </div>

    <!-- CARROSSEL REATIVO DE VIBE -->
    <div class="carousel vibe-carousel" id="carousel-vibe">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>

<!-- 4. TOP 10 SEMANAL COM PÓDIO VISUAL (#1, #2, #3) -->
<section class="home-ranking-section">
    <div class="section-header">
        <div class="section-title-wrap">
            <h2 class="section-title"><i class="fas fa-trophy"></i> Pódio da Semana — Top Avaliados</h2>
            <span class="section-badge badge-gold">POPULARIDADE &amp; NOTA</span>
        </div>
        <a href="?page=ranking" class="section-link">Ver Ranking Geral →</a>
    </div>

    <div class="ranking-podium-container" id="home-ranking-podium">
        <!-- Renderizado dinamicamente via HomePage.loadTop10Ranking() -->
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>

<!-- QUOTE & METAS SEMANAIS -->
<div class="home-widgets-row">
    <div id="quote-container"></div>
    <div id="goals-container"></div>
</div>

<!-- SECTION: CONTINUAR ASSISTINDO (SE LOGADO) -->
<?php if ($usuario): ?>
<section class="anime-section" id="section-watching">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-play-circle"></i> Continuar Assistindo</h2>
        <a href="?page=assistindo" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-watching"></div>
</section>
<?php endif; ?>

<!-- ANIME DO DIA -->
<div id="anime-of-day-container"></div>

<!-- SECTION: EM ALTA ESTA SEMANA -->
<section class="anime-section" id="section-trending">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-bolt"></i> Em Alta Esta Semana</h2>
        <a href="?page=explorar&filter=trending" class="section-link">Ver Todos →</a>
    </div>
    <div class="carousel" id="carousel-trending">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>

<!-- SECTION: TEMPORADA ATUAL -->
<section class="anime-section" id="section-seasonal">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-snowflake"></i> Destaques da Temporada</h2>
        <a href="?page=explorar&filter=seasonal" class="section-link">Ver Grade Completa →</a>
    </div>
    <div class="carousel" id="carousel-seasonal">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>

<!-- SECTION: CLÁSSICOS & TOP NOTAS -->
<section class="anime-section" id="section-top">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-crown"></i> Obras-Primas Aclamadas</h2>
        <a href="?page=explorar&filter=top" class="section-link">Ver Todos →</a>
    </div>
    <div class="carousel" id="carousel-top">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>
