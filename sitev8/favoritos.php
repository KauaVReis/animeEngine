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

    .favorites-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 25px;
    }

    .fav-card {
        background: var(--color-surface);
        border: var(--border-width) solid var(--border-color);
        box-shadow: var(--shadow-neo);
        padding: 10px;
        transition: all var(--transition-fast);
        cursor: pointer;
        position: relative;
    }

    .fav-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: var(--shadow-neo-hover);
        border-color: var(--color-primary);
    }

    .fav-image {
        width: 100%;
        aspect-ratio: 2/3;
        position: relative;
        overflow: hidden;
        border: 2px solid var(--border-color);
    }

    .fav-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .fav-overlay {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        background: var(--color-surface);
        border: 2px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary);
        font-size: 1.2rem;
        z-index: 2;
        box-shadow: 2px 2px 0 var(--border-color);
    }

    .fav-card:hover .fav-overlay {
        background: var(--color-primary);
        color: var(--color-white);
        transform: scale(1.1);
    }

    .fav-info {
        padding: 15px 5px 5px;
    }

    .fav-title {
        font-family: var(--font-body);
        font-size: 1.1rem;
        font-weight: 800;
        margin: 0;
        text-align: center;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .fav-meta {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--color-text-muted);
        text-align: center;
        margin-top: 5px;
        display: block;
        font-family: var(--font-body);
    }

    .empty-state {
        background: var(--color-surface);
        border: var(--border-width) solid var(--border-color);
        box-shadow: var(--shadow-neo);
        padding: 60px;
        text-align: center;
        margin-top: 50px;
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        color: var(--color-primary);
    }
</style>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-heart"></i> Meus Favoritos</h1>
        <?php if (estaLogado()):
            $u = getUsuarioLogado();
            ?>
            <span
                style="background: var(--color-primary); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 15px;">
                ID: <?php echo $u['id']; ?> (<?php echo $u['username']; ?>)
            </span>
        <?php endif; ?>
    </div>

    <div class="favorites-grid" id="favorites-grid">
        <div class="carousel-loading">
            <div class="loader"></div>
        </div>
    </div>

    <div class="empty-state" id="empty-state" style="display: none;">
        <div class="empty-icon"><i class="fas fa-heart-broken"></i></div>
        <h3>Nenhum Favorito ainda...</h3>
        <p>Demonstre seu amor favoritando os animes que você mais gosta!</p>
        <a href="explorar.php" class="btn btn-primary" style="margin-top: 20px;">
            <i class="fas fa-search"></i> Explorar Animes
        </a>
    </div>
</main>

<?php
$scripts_pagina = ['js/pages/favoritos.js'];
require_once 'includes/footer.php';
?>