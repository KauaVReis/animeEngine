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
        <?php if (estaLogado()):
            $u = getUsuarioLogado();
            ?>
            <span
                style="background: var(--color-primary); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 15px;">
                ID: <?php echo $u['id']; ?> (<?php echo $u['username']; ?>)
            </span>
        <?php endif; ?>
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
    .page-header {
        margin-bottom: 2.5rem;
        padding-bottom: 1rem;
        border-bottom: var(--border-width) solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .page-title {
        font-family: var(--font-display);
        font-size: 2.5rem;
        text-transform: uppercase;
        margin: 0;
        text-shadow: 2px 2px 0 var(--color-primary);
    }

    .watching-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 25px;
    }

    .watching-card {
        background: var(--color-surface);
        border: var(--border-width) solid var(--border-color);
        box-shadow: var(--shadow-neo);
        padding: 15px;
        display: flex;
        gap: 20px;
        transition: all var(--transition-fast);
        cursor: pointer;
        position: relative;
    }

    .watching-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: var(--shadow-neo-hover);
        border-color: var(--color-primary);
    }

    .watching-image {
        width: 100px;
        height: 140px;
        flex-shrink: 0;
        border: var(--border-width) solid var(--border-color);
        overflow: hidden;
    }

    .watching-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .watching-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .watching-title {
        font-family: var(--font-body);
        font-size: 1.1rem;
        font-weight: 800;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.2;
    }

    .watching-progress-info {
        margin: 10px 0;
    }

    .watching-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 5px;
        font-family: var(--font-body);
    }

    .progress-track {
        height: 12px;
        background: var(--color-bg);
        border: 2px solid var(--border-color);
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--color-primary);
        border-right: 2px solid var(--border-color);
        transition: width 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .episode-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 5px;
    }

    .btn-control {
        width: 36px;
        height: 36px;
        border: 2px solid var(--border-color);
        background: var(--color-secondary);
        color: var(--color-black);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-weight: 900;
        box-shadow: 2px 2px 0 var(--border-color);
        transition: all var(--transition-fast);
    }

    .btn-control:hover {
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 var(--border-color);
        background: var(--color-primary);
        color: var(--color-white);
    }

    .episode-number {
        flex: 1;
        text-align: center;
        font-family: var(--font-display);
        font-size: 1rem;
        background: var(--color-bg);
        border: 2px solid var(--border-color);
        padding: 4px;
    }

    .empty-state {
        background: var(--color-surface);
        border: var(--border-width) solid var(--border-color);
        box-shadow: var(--shadow-neo);
        padding: 50px;
        text-align: center;
        margin-top: 50px;
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: 20px;
    }

    @media (max-width: 600px) {
        .watching-card {
            padding: 10px;
            gap: 15px;
        }

        .watching-image {
            width: 80px;
            height: 110px;
        }

        .page-title {
            font-size: 1.8rem;
        }
    }
</style>

<?php
$scripts_pagina = ['js/pages/assistindo.js'];
require_once 'includes/footer.php';
?>