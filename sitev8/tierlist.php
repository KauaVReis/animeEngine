<?php
/**
 * AnimeEngine v7 - Tier List Page
 * Requer login
 */

require_once 'includes/auth.php';

if (!estaLogado()) {
    header('Location: login.php?redirect=tierlist.php');
    exit;
}

$titulo_pagina = 'Anime Tier List - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<style>
    .tier-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 40px;
    }

    .tier-row {
        display: flex;
        min-height: 100px;
        background: var(--color-surface);
        border: var(--border-width) solid var(--border-color);
        box-shadow: var(--shadow-neo);
        position: relative;
    }

    .tier-label {
        width: 100px;
        min-width: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-size: 2rem;
        color: var(--color-white);
        border-right: var(--border-width) solid var(--border-color);
        text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
    }

    .tier-s {
        background: #ff7f7f;
    }

    .tier-a {
        background: #ffbf7f;
    }

    .tier-b {
        background: #ffff7f;
        color: #333 !important;
    }

    .tier-c {
        background: #7fff7f;
        color: #333 !important;
    }

    .tier-d {
        background: #7fbfff;
    }

    .tier-f {
        background: #7f7fff;
    }

    .tier-items {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 10px;
        flex-grow: 1;
        min-height: 80px;
    }

    /* Anime Cards in Tier List */
    .tier-card {
        width: 80px;
        aspect-ratio: 2/3;
        background: var(--color-surface);
        border: 1px solid var(--border-color);
        cursor: grab;
        position: relative;
        transition: transform 0.2s;
        flex-shrink: 0;
    }

    .tier-card:active {
        cursor: grabbing;
    }

    .tier-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .tier-card-title {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-size: 0.6rem;
        padding: 2px;
        text-align: center;
        display: none;
    }

    .tier-card:hover .tier-card-title {
        display: block;
    }

    /* Pool Section */
    .pool-section {
        background: var(--color-surface);
        border: var(--border-width) solid var(--border-color);
        box-shadow: var(--shadow-neo);
        padding: 20px;
    }

    .pool-header {
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 10px;
    }

    .pool-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        min-height: 150px;
    }

    /* Sortable Ghost */
    .sortable-ghost {
        opacity: 0.4;
        filter: grayscale(1);
    }

    .sortable-chosen {
        transform: scale(1.1);
        z-index: 10;
    }
</style>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-trophy"></i> Anime Tier List</h1>
        <p class="text-muted">Rankeie seus animes favoritos. Arraste e solte para organizar.</p>
    </div>

    <div class="tier-container" id="tier-board">
        <!-- Tier S -->
        <div class="tier-row" data-tier="S">
            <div class="tier-label tier-s">S</div>
            <div class="tier-items sortable-list" id="tier-list-S"></div>
        </div>

        <!-- Tier A -->
        <div class="tier-row" data-tier="A">
            <div class="tier-label tier-a">A</div>
            <div class="tier-items sortable-list" id="tier-list-A"></div>
        </div>

        <!-- Tier B -->
        <div class="tier-row" data-tier="B">
            <div class="tier-label tier-b">B</div>
            <div class="tier-items sortable-list" id="tier-list-B"></div>
        </div>

        <!-- Tier C -->
        <div class="tier-row" data-tier="C">
            <div class="tier-label tier-c">C</div>
            <div class="tier-items sortable-list" id="tier-list-C"></div>
        </div>

        <!-- Tier D -->
        <div class="tier-row" data-tier="D">
            <div class="tier-label tier-d">D</div>
            <div class="tier-items sortable-list" id="tier-list-D"></div>
        </div>

        <!-- Tier F -->
        <div class="tier-row" data-tier="F">
            <div class="tier-label tier-f">F</div>
            <div class="tier-items sortable-list" id="tier-list-F"></div>
        </div>
    </div>

    <div class="pool-section">
        <div class="pool-header">
            <h2>📦 Meus Animes Completos</h2>
            <button class="quick-filter" onclick="TierListPage.resetConfirm()">
                <i class="fas fa-trash-alt"></i> Resetar Tier List
            </button>
        </div>
        <div class="pool-grid sortable-list" id="anime-pool">
            <div class="carousel-loading">
                <div class="loader"></div>
            </div>
        </div>
    </div>
</main>

<!-- Bibliotecas e Scripts -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<?php
$scripts_pagina = ['js/pages/tierlist.js'];
require_once 'includes/footer.php';
?>