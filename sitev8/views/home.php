<?php
/**
 * AnimeEngine v8 - View: Home
 * Conteúdo principal da página inicial.
 * NÃO inclui <html>, <head>, <body>, header ou footer.
 */
?>

<!-- HERO BANNER -->
<section class="hero-banner" id="hero-banner">
    <div class="hero-overlay"></div>
    <div class="hero-content">
        <span class="hero-badge">🔥 EM DESTAQUE</span>
        <h1 class="hero-title" id="hero-title">Carregando...</h1>
        <p class="hero-synopsis" id="hero-synopsis"></p>
        <div class="hero-meta">
            <span class="hero-score"><i class="fas fa-star"></i> <span id="hero-score">-</span></span>
            <span class="hero-eps"><i class="fas fa-tv"></i> <span id="hero-eps">-</span> eps</span>
        </div>
        <div class="hero-actions">
            <a href="#" class="btn btn-primary" id="hero-details-btn">
                <i class="fas fa-info-circle"></i> Ver Detalhes
            </a>
            <?php if ($usuario): ?>
                <button class="btn btn-secondary" id="hero-list-btn">
                    <i class="fas fa-plus"></i> Minha Lista
                </button>
            <?php else: ?>
                <a href="?page=login" class="btn btn-secondary">
                    <i class="fas fa-sign-in-alt"></i> Entrar para Salvar
                </a>
            <?php endif; ?>
        </div>
    </div>
</section>

<!-- QUOTE OF THE DAY -->
<div id="quote-container"></div>

<!-- SECTION: RADIO OST -->
<section class="anime-section" id="section-radio">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-headphones-alt"></i> Rádio & Trilhas Sonoras</h2>
        <a href="?page=explorar" class="section-link">Sintonizar →</a>
    </div>
    <div class="carousel ost-carousel" style="display: flex; gap: var(--space-md); overflow-x: auto; padding-bottom: 20px;">
        <!-- Cards de OST Premium -->
        <div class="ost-card-premium" onclick="OSTPlayer.play('owS7fA2mIu0', 'Tokyo Ghoul', 'Unravel (Opening 1)', 'https://i.ytimg.com/vi/owS7fA2mIu0/hqdefault.jpg')">
            <div class="card-image-wrapper">
                <img src="https://i.ytimg.com/vi/owS7fA2mIu0/hqdefault.jpg" alt="Unravel" onerror="this.src='img/placeholder.jpg'">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Unravel</h3>
                <p class="card-studio">Tokyo Ghoul</p>
            </div>
        </div>

        <div class="ost-card-premium" onclick="OSTPlayer.play('u3z89_P4Y_U', 'Naruto Shippuden', 'Blue Bird (Opening 3)', 'https://i.ytimg.com/vi/u3z89_P4Y_U/hqdefault.jpg')">
            <div class="card-image-wrapper">
                <img src="https://i.ytimg.com/vi/u3z89_P4Y_U/hqdefault.jpg" alt="Blue Bird" onerror="this.src='img/placeholder.jpg'">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Blue Bird</h3>
                <p class="card-studio">Naruto Shippuden</p>
            </div>
        </div>

        <div class="ost-card-premium" onclick="OSTPlayer.play('GwaRztMaoY0', 'Jujutsu Kaisen', 'Kaikai Kitan', 'https://i.ytimg.com/vi/GwaRztMaoY0/hqdefault.jpg')">
            <div class="card-image-wrapper">
                <img src="https://i.ytimg.com/vi/GwaRztMaoY0/hqdefault.jpg" alt="Kaikai Kitan" onerror="this.src='img/placeholder.jpg'">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Kaikai Kitan</h3>
                <p class="card-studio">Jujutsu Kaisen</p>
            </div>
        </div>

        <div class="ost-card-premium" onclick="OSTPlayer.play('X9LwI6G2X74', 'Saint Seiya', 'Pegasus Fantasy', 'https://i.ytimg.com/vi/X9LwI6G2X74/hqdefault.jpg')">
            <div class="card-image-wrapper">
                <img src="https://i.ytimg.com/vi/X9LwI6G2X74/hqdefault.jpg" alt="Pegasus Fantasy" onerror="this.src='img/placeholder.jpg'">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Pegasus Fantasy</h3>
                <p class="card-studio">Saint Seiya</p>
            </div>
        </div>

        <div class="ost-card-premium" onclick="OSTPlayer.play('h0S8H0MNoM4', 'Hunter x Hunter', 'Departure!', 'https://i.ytimg.com/vi/h0S8H0MNoM4/hqdefault.jpg')">
            <div class="card-image-wrapper">
                <img src="https://i.ytimg.com/vi/h0S8H0MNoM4/hqdefault.jpg" alt="Departure!" onerror="this.src='img/placeholder.jpg'">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Departure!</h3>
                <p class="card-studio">Hunter x Hunter</p>
            </div>
        </div>
    </div>
</section>

<!-- SECTION: PRÓXIMOS EPISÓDIOS -->
<section class="anime-section" id="section-airing" style="display: none;"></section>

<!-- SECTION: CONTINUAR ASSISTINDO -->
<?php if ($usuario): ?>
<section class="anime-section" id="section-watching">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-play-circle"></i> Continuar Assistindo</h2>
        <a href="?page=assistindo" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-watching"></div>
</section>
<?php endif; ?>

<!-- ANIME OF THE DAY -->
<div id="anime-of-day-container"></div>

<!-- SECTION: EM ALTA -->
<section class="anime-section" id="section-trending">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-fire"></i> Em Alta Esta Semana</h2>
        <a href="?page=explorar&filter=trending" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-trending">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>

<!-- SECTION: TEMPORADA ATUAL -->
<section class="anime-section" id="section-seasonal">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-snowflake"></i> Temporada Atual</h2>
        <a href="?page=explorar&filter=seasonal" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-seasonal">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>

<!-- SECTION: TOP -->
<section class="anime-section" id="section-top">
    <div class="section-header">
        <h2 class="section-title"><i class="fas fa-trophy"></i> Mais Bem Avaliados</h2>
        <a href="?page=explorar&filter=top" class="section-link">Ver Tudo →</a>
    </div>
    <div class="carousel" id="carousel-top">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</section>
