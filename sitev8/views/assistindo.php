<?php
/**
 * AnimeEngine v8 - View: Assistindo
 */
?>

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
        <a href="?page=explorar" class="btn btn-primary">
            <i class="fas fa-search"></i> Explorar Animes
        </a>
    </div>
