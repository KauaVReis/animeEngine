<?php
/**
 * AnimeEngine v7 - Estatísticas Page
 * Requer login
 */

require_once 'includes/auth.php';

if (!estaLogado()) {
    header('Location: login.php?redirect=estatisticas.php');
    exit;
}

$titulo_pagina = 'Estatísticas - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-chart-bar"></i> Estatísticas</h1>
        <p class="page-subtitle">Acompanhe seu progresso de anime</p>
    </div>
    
    <div id="stats-container">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</main>

<?php
$scripts_pagina = ['js/pages/stats.js'];
require_once 'includes/footer.php';
?>
