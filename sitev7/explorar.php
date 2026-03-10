<?php
/**
 * AnimeEngine v7 - Explorar Page
 */

$titulo_pagina = 'Explorar - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-search"></i> Explorar</h1>
    </div>

    <!-- QUICK FILTERS -->
    <div class="quick-filters" id="quick-filters">
        <button class="quick-filter active" data-filter="trending">🔥 Em Alta</button>
        <button class="quick-filter" data-filter="seasonal">❄️ Temporada</button>
        <button class="quick-filter" data-filter="top">🏆 Top Avaliados</button>
        <button class="quick-filter" data-filter="upcoming">📅 Em Breve</button>
        <button class="quick-filter" style="border-color: var(--primary-color); color: var(--primary-color);" onclick="toggleOstView(true)">🎶 OSTs</button>
    </div>

    <!-- GENRE FILTERS -->
    <div class="genre-tags" id="genre-tags">
        <button class="genre-tag" data-genre="1">Action</button>
        <button class="genre-tag" data-genre="2">Adventure</button>
        <button class="genre-tag" data-genre="4">Comedy</button>
        <button class="genre-tag" data-genre="8">Drama</button>
        <button class="genre-tag" data-genre="10">Fantasy</button>
        <button class="genre-tag" data-genre="14">Horror</button>
        <button class="genre-tag" data-genre="22">Romance</button>
        <button class="genre-tag" data-genre="24">Sci-Fi</button>
        <button class="genre-tag" data-genre="36">Slice of Life</button>
        <button class="genre-tag" data-genre="30">Sports</button>
    </div>

    <!-- OST SPECIAL GRID -->
    <div class="anime-grid" id="ost-grid" style="display: none;">
        <div class="ost-card-premium" onclick="OSTPlayer.play('h0S8H0MNoM4', 'Hunter x Hunter', 'Departure!', 'https://img.youtube.com/vi/h0S8H0MNoM4/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/h0S8H0MNoM4/0.jpg" onerror="window.OSTPlayer.onCoverError(this, 'Hunter x Hunter')"><div class="card-overlay"><i class="fas fa-play"></i></div></div>
            <div class="card-info"><h3 class="card-title">Departure!</h3><p class="card-studio">Hunter x Hunter</p></div>
        </div>
        <div class="ost-card-premium" onclick="OSTPlayer.play('GwaRztMaoY0', 'Jujutsu Kaisen', 'Kaikai Kitan', 'https://img.youtube.com/vi/GwaRztMaoY0/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/GwaRztMaoY0/0.jpg" onerror="window.OSTPlayer.onCoverError(this, 'Jujutsu Kaisen')"><div class="card-overlay"><i class="fas fa-play"></i></div></div>
            <div class="card-info"><h3 class="card-title">Kaikai Kitan</h3><p class="card-studio">Jujutsu Kaisen</p></div>
        </div>
        <div class="ost-card-premium" onclick="OSTPlayer.play('owS7fA2mIu0', 'Tokyo Ghoul', 'Unravel (Opening 1)', 'https://img.youtube.com/vi/owS7fA2mIu0/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/owS7fA2mIu0/0.jpg" onerror="window.OSTPlayer.onCoverError(this, 'Tokyo Ghoul')"><div class="card-overlay"><i class="fas fa-play"></i></div></div>
            <div class="card-info"><h3 class="card-title">Unravel</h3><p class="card-studio">Tokyo Ghoul</p></div>
        </div>
        <div class="ost-card-premium" onclick="OSTPlayer.play('u3z89_P4Y_U', 'Naruto Shippuden', 'Blue Bird (Opening 3)', 'https://img.youtube.com/vi/u3z89_P4Y_U/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/u3z89_P4Y_U/0.jpg" onerror="window.OSTPlayer.onCoverError(this, 'Naruto Shippuden')"><div class="card-overlay"><i class="fas fa-play"></i></div></div>
            <div class="card-info"><h3 class="card-title">Blue Bird</h3><p class="card-studio">Naruto Shippuden</p></div>
        </div>
        <div class="ost-card-premium" onclick="OSTPlayer.play('7NoPeTfR-i8', 'Attack on Titan', 'The Rumbling', 'https://img.youtube.com/vi/7NoPeTfR-i8/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/7NoPeTfR-i8/0.jpg" onerror="window.OSTPlayer.onCoverError(this, 'Attack on Titan')"><div class="card-overlay"><i class="fas fa-play"></i></div></div>
            <div class="card-info"><h3 class="card-title">The Rumbling</h3><p class="card-studio">Shingeki no Kyojin</p></div>
        </div>
        <div class="ost-card-premium" onclick="OSTPlayer.play('X9LwI6G2X74', 'Saint Seiya', 'Pegasus Fantasy', 'https://img.youtube.com/vi/X9LwI6G2X74/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/X9LwI6G2X74/0.jpg" onerror="window.OSTPlayer.onCoverError(this, 'Saint Seiya')"><div class="card-overlay"><i class="fas fa-play"></i></div></div>
            <div class="card-info"><h3 class="card-title">Pegasus Fantasy</h3><p class="card-studio">Saint Seiya</p></div>
        </div>
        <div class="ost-card-premium" onclick="OSTPlayer.play('9fUPY6c2nS0', 'Fullmetal Alchemist', 'Again', 'https://img.youtube.com/vi/9fUPY6c2nS0/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/9fUPY6c2nS0/0.jpg" onerror="window.OSTPlayer.onCoverError(this, 'Fullmetal Alchemist')"><div class="card-overlay"><i class="fas fa-play"></i></div></div>
            <div class="card-info"><h3 class="card-title">Again</h3><p class="card-studio">FMA Brotherhood</p></div>
        </div>
        <div class="ost-card-premium" onclick="OSTPlayer.play('Nafii87gdzs', 'Evangelion', 'Cruel Angel', 'https://img.youtube.com/vi/Nafii87gdzs/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/Nafii87gdzs/0.jpg" onerror="window.OSTPlayer.onCoverError(this, 'Neon Genesis Evangelion')"><div class="card-overlay"><i class="fas fa-play"></i></div></div>
            <div class="card-info"><h3 class="card-title">Cruel Angel's Thesis</h3><p class="card-studio">Neon Genesis Evang.</p></div>
        </div>
    </div>

    <!-- RESULTS GRID -->
    <div class="anime-grid" id="anime-grid">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>

    <!-- LOAD MORE -->
    <div class="load-more-container" id="load-more-container" style="display: none;">
        <button class="btn btn-secondary" id="load-more-btn">
            <i class="fas fa-plus"></i> Carregar Mais
        </button>
    </div>

    <script>
        function toggleOstView(showOst) {
            document.getElementById('ost-grid').style.display = showOst ? 'grid' : 'none';
            document.getElementById('anime-grid').style.display = showOst ? 'none' : 'grid';
            document.getElementById('genre-tags').style.display = showOst ? 'none' : 'flex';
            document.getElementById('load-more-container').style.display = showOst ? 'none' : 'block';
            
            // Remove active das outras e bota na de OST se clicou nela
            const btns = document.querySelectorAll('.quick-filter');
            btns.forEach(b => b.classList.remove('active'));
            if(showOst) {
                btns[btns.length-1].classList.add('active');
            }
        }
        
        // Listen to native quick filters to hide OST View when clicked
        document.addEventListener('DOMContentLoaded', () => {
             document.querySelectorAll('.quick-filter[data-filter]').forEach(b => {
                 b.addEventListener('click', () => toggleOstView(false));
             });
        });
    </script>
</main>

<?php
$scripts_pagina = ['js/pages/explorar.js'];
require_once 'includes/footer.php';
?>
