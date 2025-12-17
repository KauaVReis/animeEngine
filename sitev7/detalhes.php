<?php
/**
 * AnimeEngine v7 - Detalhes do Anime
 */

$anime_id = intval($_GET['id'] ?? 0);

$titulo_pagina = 'Detalhes - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div id="anime-details">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</main>

<?php
$scripts_pagina = ['js/pages/detalhes.js'];
require_once 'includes/footer.php';
?>
