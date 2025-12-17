<?php
/**
 * AnimeEngine v7 - Explorar Page
 */

$titulo_pagina = 'Explorar - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-search"></i> Explorar</h1>
    </div>

    <!-- QUICK FILTERS -->
    <div class="quick-filters" id="quick-filters">
        <button class="quick-filter active" data-filter="trending">🔥 Em Alta</button>
        <button class="quick-filter" data-filter="seasonal">❄️ Temporada</button>
        <button class="quick-filter" data-filter="top">🏆 Top Avaliados</button>
        <button class="quick-filter" data-filter="upcoming">📅 Em Breve</button>
    </div>

    <!-- GENRE FILTERS -->
    <div class="genre-tags" id="genre-tags">
        <button class="genre-tag" data-genre="1">Action</button>
        <button class="genre-tag" data-genre="2">Adventure</button>
        <button class="genre-tag" data-genre="4">Comedy</button>
        <button class="genre-tag" data-genre="8">Drama</button>
        <button class="genre-tag" data-genre="10">Fantasy</button>
        <button class="genre-tag" data-genre="14">Horror</button>
        <button class="genre-tag" data-genre="22">Romance</button>
        <button class="genre-tag" data-genre="24">Sci-Fi</button>
        <button class="genre-tag" data-genre="36">Slice of Life</button>
        <button class="genre-tag" data-genre="30">Sports</button>
    </div>

    <!-- RESULTS GRID -->
    <div class="anime-grid" id="anime-grid">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>

    <!-- LOAD MORE -->
    <div class="load-more-container" id="load-more-container" style="display: none;">
        <button class="btn btn-secondary" id="load-more-btn">
            <i class="fas fa-plus"></i> Carregar Mais
        </button>
    </div>
</main>

<?php
$scripts_pagina = ['js/pages/explorar.js'];
require_once 'includes/footer.php';
?>
