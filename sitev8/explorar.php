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

    <!-- ADVANCED FILTERS ROW -->
    <div class="filter-controls-row">
        <!-- QUICK FILTERS -->
        <div class="quick-filters" id="quick-filters">
            <button class="quick-filter active" data-filter="trending">🔥 Em Alta</button>
            <button class="quick-filter" data-filter="seasonal">❄️ Temporada</button>
            <button class="quick-filter" data-filter="top">🏆 Top Avaliados</button>
            <button class="quick-filter" data-filter="upcoming">📅 Em Breve</button>
            <button class="quick-filter" onclick="toggleOstView(true)">🎶 OSTs</button>
        </div>

        <!-- SORT CONTROLS -->
        <div class="sort-controls">
            <label for="sort-select"><i class="fas fa-sort-amount-down"></i> Ordenar:</label>
            <select id="sort-select" class="neo-select">
                <option value="POPULARITY_DESC">Popularidade 🔥</option>
                <option value="SCORE_DESC">Melhor Nota ⭐</option>
                <option value="TRENDING_DESC">Tendência 📈</option>
                <option value="START_DATE_DESC">Lançamento 📅</option>
                <option value="TITLE_ROMAJI_ASC">Nome (A-Z) 🔠</option>
            </select>
        </div>
    </div>

    <!-- FORMAT FILTERS -->
    <div class="format-filters" id="format-filters">
        <span class="filter-label">Formato:</span>
        <button class="format-tag" data-format="TV">📺 TV</button>
        <button class="format-tag" data-format="MOVIE">🎬 Filme</button>
        <button class="format-tag" data-format="OVA">📀 OVA</button>
        <button class="format-tag" data-format="ONA">🌐 ONA</button>
        <button class="format-tag" data-format="SPECIAL">⭐ Especial</button>
    </div>

    <!-- GENRE FILTERS -->
    <div class="genre-tags" id="genre-tags">
        <span class="filter-label">Gêneros:</span>
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

    <!-- ADVANCED FILTERS SECTION (NEW) -->
    <div class="advanced-filters-grid">
        <!-- SEASON & YEAR -->
        <div class="filter-group">
            <span class="filter-label">Temporada:</span>
            <div class="filter-inputs">
                <select id="season-select" class="neo-select">
                    <option value="">Todas 📅</option>
                    <option value="WINTER">Inverno ❄️</option>
                    <option value="SPRING">Primavera 🌸</option>
                    <option value="SUMMER">Verão ☀️</option>
                    <option value="FALL">Outono 🍂</option>
                </select>
                <input type="number" id="year-input" class="neo-input" placeholder="Ano (ex: 2024)" min="1940" max="2030">
            </div>
        </div>

        <!-- STATUS -->
        <div class="filter-group">
            <span class="filter-label">Status:</span>
            <select id="status-select" class="neo-select">
                <option value="">Qualquer 📡</option>
                <option value="FINISHED">Finalizado ✅</option>
                <option value="RELEASING">Em Lançamento 📺</option>
                <option value="NOT_YET_RELEASED">Não Lançado 🕒</option>
                <option value="CANCELLED">Cancelado ❌</option>
            </select>
        </div>

        <!-- SOURCE MATERIAL -->
        <div class="filter-group">
            <span class="filter-label">Fonte:</span>
            <select id="source-select" class="neo-select">
                <option value="">Qualquer 📖</option>
                <option value="MANGA">Mangá 📚</option>
                <option value="LIGHT_NOVEL">Light Novel 📘</option>
                <option value="ORIGINAL">Original ✨</option>
                <option value="VIDEO_GAME">Video Game 🎮</option>
                <option value="WEB_NOVEL">Web Novel 🌐</option>
            </select>
        </div>

        <!-- MIN SCORE (SLIDER) -->
        <div class="filter-group">
            <span class="filter-label">Nota Mínima: <span id="score-value">0</span></span>
            <input type="range" id="score-slider" min="0" max="100" step="10" value="0" class="neo-range">
        </div>

        <!-- ADULT/SFW TOGGLE (Conditional) -->
        <div class="filter-group" id="adult-filter-container" style="display: none;">
            <span class="filter-label">Adulto:</span>
            <button class="neon-toggle" id="adult-toggle" data-adult="false">🔞 OFF</button>
        </div>
    </div>

    <!-- ACTIVE FILTERS & RESULTS COUNTER -->
    <div class="filter-status-area">
        <div class="active-chips" id="active-chips">
            <!-- Chips will be rendered here -->
        </div>
        <div class="results-info">
            <span id="results-count">Buscando animes...</span>
        </div>
    </div>

    <!-- OST SPECIAL GRID -->
    <div class="anime-grid" id="ost-grid" style="display: none;">
        <div class="ost-card-premium"
            onclick="OSTPlayer.play('h0S8H0MNoM4', 'Hunter x Hunter', 'Departure!', 'https://img.youtube.com/vi/h0S8H0MNoM4/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/h0S8H0MNoM4/0.jpg"
                    onerror="window.OSTPlayer.onCoverError(this, 'Hunter x Hunter')">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Departure!</h3>
                <p class="card-studio">Hunter x Hunter</p>
            </div>
        </div>
        <div class="ost-card-premium"
            onclick="OSTPlayer.play('GwaRztMaoY0', 'Jujutsu Kaisen', 'Kaikai Kitan', 'https://img.youtube.com/vi/GwaRztMaoY0/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/GwaRztMaoY0/0.jpg"
                    onerror="window.OSTPlayer.onCoverError(this, 'Jujutsu Kaisen')">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Kaikai Kitan</h3>
                <p class="card-studio">Jujutsu Kaisen</p>
            </div>
        </div>
        <div class="ost-card-premium"
            onclick="OSTPlayer.play('owS7fA2mIu0', 'Tokyo Ghoul', 'Unravel (Opening 1)', 'https://img.youtube.com/vi/owS7fA2mIu0/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/owS7fA2mIu0/0.jpg"
                    onerror="window.OSTPlayer.onCoverError(this, 'Tokyo Ghoul')">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Unravel</h3>
                <p class="card-studio">Tokyo Ghoul</p>
            </div>
        </div>
        <div class="ost-card-premium"
            onclick="OSTPlayer.play('u3z89_P4Y_U', 'Naruto Shippuden', 'Blue Bird (Opening 3)', 'https://img.youtube.com/vi/u3z89_P4Y_U/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/u3z89_P4Y_U/0.jpg"
                    onerror="window.OSTPlayer.onCoverError(this, 'Naruto Shippuden')">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Blue Bird</h3>
                <p class="card-studio">Naruto Shippuden</p>
            </div>
        </div>
        <div class="ost-card-premium"
            onclick="OSTPlayer.play('7NoPeTfR-i8', 'Attack on Titan', 'The Rumbling', 'https://img.youtube.com/vi/7NoPeTfR-i8/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/7NoPeTfR-i8/0.jpg"
                    onerror="window.OSTPlayer.onCoverError(this, 'Attack on Titan')">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">The Rumbling</h3>
                <p class="card-studio">Shingeki no Kyojin</p>
            </div>
        </div>
        <div class="ost-card-premium"
            onclick="OSTPlayer.play('X9LwI6G2X74', 'Saint Seiya', 'Pegasus Fantasy', 'https://img.youtube.com/vi/X9LwI6G2X74/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/X9LwI6G2X74/0.jpg"
                    onerror="window.OSTPlayer.onCoverError(this, 'Saint Seiya')">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Pegasus Fantasy</h3>
                <p class="card-studio">Saint Seiya</p>
            </div>
        </div>
        <div class="ost-card-premium"
            onclick="OSTPlayer.play('9fUPY6c2nS0', 'Fullmetal Alchemist', 'Again', 'https://img.youtube.com/vi/9fUPY6c2nS0/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/9fUPY6c2nS0/0.jpg"
                    onerror="window.OSTPlayer.onCoverError(this, 'Fullmetal Alchemist')">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Again</h3>
                <p class="card-studio">FMA Brotherhood</p>
            </div>
        </div>
        <div class="ost-card-premium"
            onclick="OSTPlayer.play('Nafii87gdzs', 'Evangelion', 'Cruel Angel', 'https://img.youtube.com/vi/Nafii87gdzs/0.jpg')">
            <div class="card-image-wrapper"><img src="https://img.youtube.com/vi/Nafii87gdzs/0.jpg"
                    onerror="window.OSTPlayer.onCoverError(this, 'Neon Genesis Evangelion')">
                <div class="card-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">Cruel Angel's Thesis</h3>
                <p class="card-studio">Neon Genesis Evang.</p>
            </div>
        </div>
    </div>

    <!-- RESULTS GRID -->
    <div class="anime-grid" id="anime-grid">
        <div class="carousel-loading">
            <div class="loader"></div>
        </div>
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
            if (showOst) {
                btns[btns.length - 1].classList.add('active');
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