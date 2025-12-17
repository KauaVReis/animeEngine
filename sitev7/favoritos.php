<?php
/**
 * AnimeEngine v7 - Favoritos Page
 * Requer login
 */

require_once 'includes/auth.php';

if (!estaLogado()) {
    header('Location: login.php?redirect=favoritos.php');
    exit;
}

$titulo_pagina = 'Favoritos - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-star"></i> Meus Favoritos</h1>
    </div>

    <div class="anime-grid" id="favorites-grid">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>

    <div class="empty-state" id="empty-state" style="display: none;">
        <div class="empty-icon">⭐</div>
        <h3>Nenhum Favorito</h3>
        <p>Favorite animes para vê-los aqui!</p>
        <a href="explorar.php" class="btn btn-primary">
            <i class="fas fa-search"></i> Explorar Animes
        </a>
    </div>
</main>

<?php
$scripts_pagina = ['js/pages/favoritos.js'];
require_once 'includes/footer.php';
?>
