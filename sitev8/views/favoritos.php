<?php
/**
 * AnimeEngine v8 - View: Favoritos
 */
?>

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
        <a href="?page=explorar" class="btn btn-primary" style="margin-top: 20px;">
            <i class="fas fa-search"></i> Explorar Animes
        </a>
    </div>
