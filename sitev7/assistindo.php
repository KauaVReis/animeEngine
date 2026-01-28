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

    <div class="watching-grid" id="watching-grid">
        <div class="carousel-loading">
            <div class="loader"></div>
        </div>
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

<style>
    .watching-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .watching-card {
        display: flex;
        gap: 15px;
        background: var(--color-surface);
        border-radius: 12px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }

    .watching-card:hover {
        border-color: var(--color-primary);
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .watching-image {
        width: 80px;
        flex-shrink: 0;
    }

    .watching-image img {
        width: 100%;
        border-radius: 8px;
    }

    .watching-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .watching-title {
        font-size: 1rem;
        font-weight: 700;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .watching-progress {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: var(--color-text-muted);
    }

    .progress-bar {
        height: 6px;
        background: var(--color-bg);
        border-radius: 3px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), #00d4ff);
        border-radius: 3px;
        transition: width 0.3s ease;
    }

    .episode-controls {
        display: flex;
        align-items: center;
        gap: 5px;
        /* Reduced gap */
        margin-top: auto;
        background: var(--color-bg);
        padding: 5px;
        border-radius: 25px;
        overflow: hidden;
        /* Contain */
    }

    .btn-mini {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: var(--color-surface);
        color: var(--color-text);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
        /* Important: Don't shrink */
    }

    .btn-mini:hover {
        background: var(--color-primary);
        color: white;
        transform: scale(1.1);
    }

    .episode-display {
        flex: 1;
        text-align: center;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 12px;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }

    .episode-display:hover {
        background: rgba(var(--color-primary-rgb), 0.1);
        color: var(--color-primary);
    }

    .edit-icon {
        font-size: 0.7rem;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .episode-display:hover .edit-icon {
        opacity: 1;
    }

    /* Modal Styles */
    .edit-ep-modal {
        text-align: center;
    }

    .input-group {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        justify-content: center;
    }

    #ep-input {
        width: 80px;
        padding: 8px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        text-align: center;
        font-size: 1.2rem;
        font-weight: bold;
        background: var(--color-bg);
        color: var(--color-text);
    }

    @media (max-width: 600px) {
        .watching-grid {
            grid-template-columns: 1fr;
        }
    }
</style>

<?php
$scripts_pagina = ['js/pages/assistindo.js'];
require_once 'includes/footer.php';
?>