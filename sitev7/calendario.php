<?php
/**
 * AnimeEngine v7 - Calendário Page
 * Igual ao v6 - não requer login
 */

$titulo_pagina = 'Calendário - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-calendar-alt"></i> Calendário da Temporada</h1>
        <p class="page-subtitle">Animes que estão no ar esta temporada</p>
    </div>

    <!-- Season Selector -->
    <div class="calendar-controls">
        <div class="season-selector">
            <button class="btn btn-secondary" onclick="CalendarioPage.prevSeason()">
                <i class="fas fa-chevron-left"></i>
            </button>
            <div class="season-display" id="season-display">
                <span class="season-icon">🌸</span>
                <span class="season-name">Carregando...</span>
            </div>
            <button class="btn btn-secondary" onclick="CalendarioPage.nextSeason()">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="calendar-filters">
            <button class="filter-btn active" data-filter="all"
                onclick="CalendarioPage.filterDay('all')">Todos</button>
            <button class="filter-btn" data-filter="today" onclick="CalendarioPage.filterDay('today')">Hoje</button>
            <button class="filter-btn" data-filter="following"
                onclick="CalendarioPage.filterDay('following')">Seguindo</button>
        </div>
    </div>

    <!-- Weekly Grid -->
    <div class="calendar-week" id="calendar-week">
        <div class="calendar-day" data-day="sunday">
            <div class="day-header">
                <span class="day-name">Domingo</span>
                <span class="day-count" id="count-sunday">0</span>
            </div>
            <div class="day-animes" id="animes-sunday"></div>
        </div>
        <div class="calendar-day" data-day="monday">
            <div class="day-header">
                <span class="day-name">Segunda</span>
                <span class="day-count" id="count-monday">0</span>
            </div>
            <div class="day-animes" id="animes-monday"></div>
        </div>
        <div class="calendar-day" data-day="tuesday">
            <div class="day-header">
                <span class="day-name">Terça</span>
                <span class="day-count" id="count-tuesday">0</span>
            </div>
            <div class="day-animes" id="animes-tuesday"></div>
        </div>
        <div class="calendar-day" data-day="wednesday">
            <div class="day-header">
                <span class="day-name">Quarta</span>
                <span class="day-count" id="count-wednesday">0</span>
            </div>
            <div class="day-animes" id="animes-wednesday"></div>
        </div>
        <div class="calendar-day" data-day="thursday">
            <div class="day-header">
                <span class="day-name">Quinta</span>
                <span class="day-count" id="count-thursday">0</span>
            </div>
            <div class="day-animes" id="animes-thursday"></div>
        </div>
        <div class="calendar-day" data-day="friday">
            <div class="day-header">
                <span class="day-name">Sexta</span>
                <span class="day-count" id="count-friday">0</span>
            </div>
            <div class="day-animes" id="animes-friday"></div>
        </div>
        <div class="calendar-day" data-day="saturday">
            <div class="day-header">
                <span class="day-name">Sábado</span>
                <span class="day-count" id="count-saturday">0</span>
            </div>
            <div class="day-animes" id="animes-saturday"></div>
        </div>
    </div>

    <!-- CALENDAR -->
    <div class="calendar-container" id="calendar-container">
        <div class="loader"></div>
    </div>

</main>

<?php
$scripts_pagina = ['js/pages/calendario.js'];
require_once 'includes/footer.php';
?>
