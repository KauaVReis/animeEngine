<?php
/**
 * AnimeEngine v7 - Assistindo Page
 * Requer login
 */

require_once 'includes/auth.php';

if (!estaLogado()) {
    header('Location: login.php?redirect=assistindo.php');
    exit;
}

$titulo_pagina = 'Assistindo - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-play-circle"></i> Assistindo Agora</h1>
    </div>

    <div class="anime-grid" id="watching-grid">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>

    <div class="empty-state" id="empty-state" style="display: none;">
        <div class="empty-icon">📺</div>
        <h3>Nada Assistindo</h3>
        <p>Comece a assistir um anime!</p>
        <a href="explorar.php" class="btn btn-primary">
            <i class="fas fa-search"></i> Explorar Animes
        </a>
    </div>
</main>

<?php
$scripts_pagina = ['js/pages/assistindo.js'];
require_once 'includes/footer.php';
?>
