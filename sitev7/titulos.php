<?php
/**
 * AnimeEngine v7 - Página de Títulos
 * Ver e selecionar títulos
 */

require_once 'includes/auth.php';
require_once 'includes/titulos.php';

if (!estaLogado()) {
    header('Location: login.php?redirect=titulos.php');
    exit;
}

// Verificar novos títulos automaticamente
verificarTitulos(getUsuarioId());

$titulo_pagina = 'Títulos - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-crown"></i> Meus Títulos</h1>
        <p class="page-subtitle">Desbloqueie conquistas para equipar títulos únicos no seu perfil!</p>
    </div>

    <!-- Título Ativo (Destaque Neobrutalista) -->
    <div class="active-title-board">
        <div class="active-title-header">
            <h3><i class="fas fa-user-tag"></i> Título Equipado Atualmente</h3>
            <button class="btn btn-danger btn-sm" onclick="TitulosPage.removeTitulo()">
                <i class="fas fa-ban"></i> Desequipar
            </button>
        </div>
        <div class="active-title-display-box" id="active-title">
            <div class="carousel-loading">
                <div class="loader"></div>
            </div>
        </div>
    </div>

    <!-- Galerias por Categoria -->
    <div class="titles-gallery">

        <div class="title-category-box">
            <div class="category-header bg-yellow">
                <h3>🏆 Conquistas de Nível</h3>
                <p>Evolua seu XP assistindo animes ativamente para liberar.</p>
            </div>
            <div class="titles-grid" id="titulos-nivel"></div>
        </div>

        <div class="title-category-box">
            <div class="category-header bg-pink">
                <h3>🎭 Maestria de Gênero</h3>
                <p>Torne-se o mestre completando vários animes do mesmo gênero.</p>
            </div>
            <div class="titles-grid" id="titulos-genero"></div>
        </div>

        <div class="title-category-box">
            <div class="category-header bg-blue">
                <h3>🌸 Veterano Sazonal</h3>
                <p>Assista lançamentos durante a respectiva temporada.</p>
            </div>
            <div class="titles-grid" id="titulos-sazonal"></div>
        </div>

        <div class="title-category-box">
            <div class="category-header bg-dark">
                <h3>🔮 Títulos Secretos</h3>
                <p>Ações extraordinárias gerarão recompensas secretas.</p>
            </div>
            <div class="titles-grid" id="titulos-secreto"></div>
        </div>

    </div>
</main>

<?php
$scripts_pagina = ['js/pages/titulos.js'];
require_once 'includes/footer.php';
?>