<?php
/**
 * AnimeEngine v7 - Minha Lista Page
 * Requer login
 */

require_once 'includes/auth.php';

// Verificar login
if (!estaLogado()) {
    header('Location: login.php?redirect=lista.php');
    exit;
}

$titulo_pagina = 'Minha Lista - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-list"></i> Minha Lista</h1>
    </div>

    <!-- TABS -->
    <div class="list-tabs">
        <button class="list-tab active" data-list="watching">
            📺 Assistindo <span class="tab-count" id="count-watching">0</span>
        </button>
        <button class="list-tab" data-list="planToWatch">
            📋 Quero Ver <span class="tab-count" id="count-planToWatch">0</span>
        </button>
        <button class="list-tab" data-list="completed">
            ✅ Completos <span class="tab-count" id="count-completed">0</span>
        </button>
        <button class="list-tab" data-list="paused">
            ⏸️ Pausados <span class="tab-count" id="count-paused">0</span>
        </button>
        <button class="list-tab" data-list="dropped">
            ❌ Abandonados <span class="tab-count" id="count-dropped">0</span>
        </button>
    </div>

    <!-- SEARCH/FILTER -->
    <div class="list-filters">
        <input type="text" class="list-search" id="list-search" placeholder="Buscar na lista...">
        <select class="list-sort" id="list-sort">
            <option value="recent">Mais Recentes</option>
            <option value="title">Título A-Z</option>
            <option value="score">Maior Nota</option>
            <option value="progress">Progresso</option>
        </select>
    </div>

    <!-- ANIME GRID -->
    <div class="anime-grid" id="list-grid">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>

    <!-- EMPTY STATE -->
    <div class="empty-state" id="empty-state" style="display: none;">
        <div class="empty-icon">📭</div>
        <h3>Lista Vazia</h3>
        <p>Adicione animes para vê-los aqui!</p>
        <a href="explorar.php" class="btn btn-primary">
            <i class="fas fa-search"></i> Explorar Animes
        </a>
    </div>
</main>

<?php
$scripts_pagina = ['js/pages/lista.js'];
require_once 'includes/footer.php';
?>
