<?php
/**
 * AnimeEngine v7 - Home Page
 */

$titulo_pagina = 'Home - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <!-- HERO BANNER -->
    <section class="hero-banner" id="hero-banner">
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <span class="hero-badge">🔥 EM DESTAQUE</span>
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
                <?php if ($usuario): ?>
                    <button class="btn btn-secondary" id="hero-list-btn">
                        <i class="fas fa-plus"></i> Minha Lista
                    </button>
                <?php else: ?>
                    <a href="login.php" class="btn btn-secondary">
                        <i class="fas fa-sign-in-alt"></i> Entrar para Salvar
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- QUOTE OF THE DAY -->
    <div id="quote-container"></div>

    <!-- SECTION: CONTINUAR ASSISTINDO -->
    <?php if ($usuario): ?>
    <section class="anime-section" id="section-watching">
        <div class="section-header">
            <h2 class="section-title"><i class="fas fa-play-circle"></i> Continuar Assistindo</h2>
            <a href="assistindo.php" class="section-link">Ver Tudo →</a>
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
            <a href="explorar.php?filter=trending" class="section-link">Ver Tudo →</a>
        </div>
        <div class="carousel" id="carousel-trending">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </section>

    <!-- SECTION: TEMPORADA ATUAL -->
    <section class="anime-section" id="section-seasonal">
        <div class="section-header">
            <h2 class="section-title"><i class="fas fa-snowflake"></i> Temporada Atual</h2>
            <a href="explorar.php?filter=seasonal" class="section-link">Ver Tudo →</a>
        </div>
        <div class="carousel" id="carousel-seasonal">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </section>

    <!-- SECTION: TOP -->
    <section class="anime-section" id="section-top">
        <div class="section-header">
            <h2 class="section-title"><i class="fas fa-trophy"></i> Mais Bem Avaliados</h2>
            <a href="explorar.php?filter=top" class="section-link">Ver Tudo →</a>
        </div>
        <div class="carousel" id="carousel-top">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </section>
</main>

<?php
$scripts_pagina = ['js/pages/home.js'];
require_once 'includes/footer.php';
?>
