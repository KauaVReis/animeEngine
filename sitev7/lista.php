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
        <h1 class="page-title"><i class="fas fa-list"></i> Biblioteca (Kanban)</h1>

        <div class="list-filters">
            <input type="text" class="list-search" id="list-search" placeholder="Buscar na lista...">
        </div>
    </div>

    <!-- KANBAN BOARD -->
    <div class="kanban-board">

        <!-- Coluna: Planejo Assistir -->
        <div class="kanban-column" id="col-planToWatch" data-status="planToWatch">
            <div class="kanban-header">
                <h2>📋 Planejo Assistir</h2>
                <span class="kanban-count" id="count-planToWatch">0</span>
            </div>
            <div class="kanban-cards-container" id="list-planToWatch">
                <div class="carousel-loading">
                    <div class="loader"></div>
                </div>
            </div>
        </div>

        <!-- Coluna: Assistindo -->
        <div class="kanban-column" id="col-watching" data-status="watching">
            <div class="kanban-header">
                <h2>📺 Assistindo</h2>
                <span class="kanban-count" id="count-watching">0</span>
            </div>
            <div class="kanban-cards-container" id="list-watching">
            </div>
        </div>

        <!-- Coluna: Completos -->
        <div class="kanban-column" id="col-completed" data-status="completed">
            <div class="kanban-header">
                <h2>✅ Completos</h2>
                <span class="kanban-count" id="count-completed">0</span>
            </div>
            <div class="kanban-cards-container" id="list-completed">
            </div>
        </div>

        <!-- Coluna: Abandonados -->
        <div class="kanban-column" id="col-dropped" data-status="dropped">
            <div class="kanban-header">
                <h2>❌ Abandonados</h2>
                <span class="kanban-count" id="count-dropped">0</span>
            </div>
            <div class="kanban-cards-container" id="list-dropped">
            </div>
        </div>

    </div>
</main>

<!-- Bibliotecas e Scripts -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<?php
$scripts_pagina = ['js/pages/lista.js'];
require_once 'includes/footer.php';
?>