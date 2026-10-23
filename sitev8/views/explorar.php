<?php
/**
 * AnimeEngine v8 - View: Explorar
 * Catálogo inteligente com filtros avançados, alternância Grade/Lista,
 * Descoberta Sonora (Roleta OP) e integração com a Tri-API
 */
?>

<!-- HEADER DA PÁGINA COM AÇÕES & VIEW SWITCHER -->
<div class="explore-header-row">
    <div class="explore-title-group">
        <h1 class="page-title" style="margin: 0;"><i class="fas fa-compass"></i> Explorar Catálogo</h1>
        <span id="explore-api-source" class="badge" style="font-size: 0.72rem; padding: 4px 10px; border: 1.5px solid var(--border-color); background: var(--color-surface); font-weight: 800;">
            TRI-API
        </span>
    </div>

    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <!-- VIEW SWITCHER (GRADE VS LISTA COMPACTA) -->
        <div class="explore-view-switcher" role="group" aria-label="Modo de visualização">
            <button type="button" class="view-switch-btn active" id="btn-view-grid" onclick="ExplorePage.setViewMode('grid')" title="Modo Grade (Pôsteres e Cards)">
                <i class="fas fa-th-large"></i> Grade
            </button>
            <button type="button" class="view-switch-btn" id="btn-view-list" onclick="ExplorePage.setViewMode('list')" title="Modo Tabela (Lista Compacta com Dados)">
                <i class="fas fa-list-ul"></i> Lista
            </button>
        </div>

        <button type="button" class="btn btn-secondary btn-sm" id="explore-roulette-btn" onclick="ExplorePage.spinSoundtrackRoulette()" title="Sorteie uma Opening oficial aleatória">
            <i class="fas fa-record-vinyl"></i> Descoberta Sonora
        </button>

        <a href="?page=radio" class="btn btn-primary btn-sm">
            <i class="fas fa-broadcast-tower"></i> Rádio FM
        </a>
    </div>
</div>

<!-- ADVANCED FILTERS ROW -->
<div class="filter-controls-row">
    <!-- QUICK FILTERS -->
    <div class="quick-filters" id="quick-filters">
        <button class="quick-filter active" data-filter="trending">🔥 Em Alta</button>
        <button class="quick-filter" data-filter="seasonal">❄️ Temporada</button>
        <button class="quick-filter" data-filter="top">🏆 Top Avaliados</button>
        <button class="quick-filter" data-filter="upcoming">📅 Em Breve</button>
    </div>

    <!-- SORT CONTROLS -->
    <div class="sort-controls">
        <label for="sort-select" class="filter-label"><i class="fas fa-sort-amount-down"></i> Ordenar:</label>
        <select id="sort-select" class="neo-select" style="min-width: 170px;">
            <option value="POPULARITY_DESC">Popularidade 🔥</option>
            <option value="SCORE_DESC">Melhor Nota ⭐</option>
            <option value="TRENDING_DESC">Tendência 📈</option>
            <option value="START_DATE_DESC">Lançamento 📅</option>
            <option value="TITLE_ROMAJI">Nome (A-Z) 🔠</option>
        </select>
    </div>
</div>

<!-- FORMAT FILTERS -->
<div class="format-filters" id="format-filters">
    <span class="filter-label"><i class="fas fa-tv"></i> Formato:</span>
    <button class="format-tag" data-format="TV">📺 TV</button>
    <button class="format-tag" data-format="MOVIE">🎬 Filme</button>
    <button class="format-tag" data-format="OVA">📀 OVA</button>
    <button class="format-tag" data-format="ONA">🌐 ONA</button>
    <button class="format-tag" data-format="SPECIAL">⭐ Especial</button>
</div>

<!-- GENRE FILTERS -->
<div class="genre-tags" id="genre-tags">
    <span class="filter-label"><i class="fas fa-tags"></i> Gêneros:</span>
    <button class="genre-tag" data-genre="1">Ação</button>
    <button class="genre-tag" data-genre="2">Aventura</button>
    <button class="genre-tag" data-genre="4">Comédia</button>
    <button class="genre-tag" data-genre="8">Drama</button>
    <button class="genre-tag" data-genre="10">Fantasia</button>
    <button class="genre-tag" data-genre="14">Horror</button>
    <button class="genre-tag" data-genre="22">Romance</button>
    <button class="genre-tag" data-genre="24">Sci-Fi</button>
    <button class="genre-tag" data-genre="36">Slice of Life</button>
    <button class="genre-tag" data-genre="30">Esportes</button>
    <button class="genre-tag" data-genre="40">Suspense</button>
    <button class="genre-tag" data-genre="7">Mistério</button>
</div>

<!-- ADVANCED FILTERS SECTION -->
<div class="advanced-filters-grid">
    <!-- SEASON & YEAR -->
    <div class="filter-group">
        <span class="filter-label">Temporada &amp; Ano:</span>
        <div class="filter-inputs">
            <select id="season-select" class="neo-select">
                <option value="">Todas 📅</option>
                <option value="WINTER">Inverno ❄️</option>
                <option value="SPRING">Primavera 🌸</option>
                <option value="SUMMER">Verão ☀️</option>
                <option value="FALL">Outono 🍂</option>
            </select>
            <input type="number" id="year-input" class="neo-input" placeholder="Ano (ex: 2025)" min="1960" max="2030">
        </div>
    </div>

    <!-- STATUS -->
    <div class="filter-group">
        <span class="filter-label">Status da Obra:</span>
        <select id="status-select" class="neo-select">
            <option value="">Qualquer 📡</option>
            <option value="FINISHED">Finalizado ✅</option>
            <option value="RELEASING">Em Lançamento 📺</option>
            <option value="NOT_YET_RELEASED">Não Lançado 🕒</option>
        </select>
    </div>

    <!-- SOURCE MATERIAL -->
    <div class="filter-group">
        <span class="filter-label">Origem do Material:</span>
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
        <span class="filter-label">Nota Mínima: <span id="score-value" style="color: var(--color-primary); font-weight: 900;">0.0</span></span>
        <input type="range" id="score-slider" min="0" max="90" step="5" value="0" class="neo-range">
    </div>

    <!-- ADULT/SFW TOGGLE (Conditional) -->
    <div class="filter-group" id="adult-filter-container" style="display: none;">
        <span class="filter-label">Conteúdo Adulto:</span>
        <button class="neon-toggle" id="adult-toggle" data-adult="false">🔞 OFF</button>
    </div>
</div>

<!-- ACTIVE FILTERS & RESULTS COUNTER -->
<div class="filter-status-area">
    <div class="active-chips" id="active-chips"></div>
    <div class="results-info" style="display: flex; align-items: center; gap: 10px;">
        <span id="results-count" style="font-weight: 800; font-size: 0.82rem; font-family: var(--font-display);">Buscando animes...</span>
    </div>
</div>

<!-- SOUNDTRACK ROULETTE REVEAL BANNER (Hidden until triggered) -->
<div id="soundtrack-roulette-banner" style="display: none; margin-bottom: var(--space-lg); padding: 16px; background: var(--color-surface); border: var(--border-width) solid var(--color-primary); box-shadow: var(--shadow-neo);"></div>

<!-- MODO GRADE (DEFAULT) -->
<div class="anime-grid" id="anime-grid">
    <div class="carousel-loading">
        <div class="loader"></div>
    </div>
</div>

<!-- MODO TABELA / LISTA COMPACTA (HIDDEN BY DEFAULT) -->
<div class="explore-table-wrapper" id="anime-table-container" style="display: none;">
    <table class="explore-table">
        <thead>
            <tr>
                <th style="width: 50px;">Capa</th>
                <th>Título da Obra</th>
                <th>Formato</th>
                <th>Temporada</th>
                <th>Episódios</th>
                <th>Nota</th>
                <th>Status</th>
                <th style="text-align: right; width: 140px;">Ações</th>
            </tr>
        </thead>
        <tbody id="anime-table-body"></tbody>
    </table>
</div>

<!-- LOAD MORE -->
<div class="load-more-container" id="load-more-container" style="display: none; justify-content: center; margin-top: var(--space-lg);">
    <button class="btn btn-secondary" id="load-more-btn" style="min-width: 220px; font-weight: 800;">
        <i class="fas fa-plus"></i> Carregar Mais Animes
    </button>
</div>
