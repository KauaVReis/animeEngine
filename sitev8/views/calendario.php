<?php
/**
 * AnimeEngine v8 - View: Calendario
 */
?>

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
                <div class="season-info">
                    <span class="season-name">Carregando...</span>
                    <span class="season-months"></span>
                </div>
            </div>
            <button class="btn btn-secondary" onclick="CalendarioPage.nextSeason()">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="calendar-filters">
            <button class="filter-btn active" data-filter="all" onclick="CalendarioPage.filterDay('all')">Todos</button>
            <button class="filter-btn" data-filter="today" onclick="CalendarioPage.filterDay('today')">Hoje</button>
            <button class="filter-btn" data-filter="following" onclick="CalendarioPage.filterDay('following')">
                <i class="fas fa-bell"></i> Seguindo
            </button>
        </div>
    </div>

    <!-- Weekly Grid -->
    <div class="calendar-week" id="calendar-week">
        <div class="calendar-day" data-day="sunday">
            <div class="day-header"><span class="day-name">Dom</span><span class="day-count" id="count-sunday">0</span></div>
            <div class="day-animes" id="animes-sunday"></div>
        </div>
        <div class="calendar-day" data-day="monday">
            <div class="day-header"><span class="day-name">Seg</span><span class="day-count" id="count-monday">0</span></div>
            <div class="day-animes" id="animes-monday"></div>
        </div>
        <div class="calendar-day" data-day="tuesday">
            <div class="day-header"><span class="day-name">Ter</span><span class="day-count" id="count-tuesday">0</span></div>
            <div class="day-animes" id="animes-tuesday"></div>
        </div>
        <div class="calendar-day" data-day="wednesday">
            <div class="day-header"><span class="day-name">Qua</span><span class="day-count" id="count-wednesday">0</span></div>
            <div class="day-animes" id="animes-wednesday"></div>
        </div>
        <div class="calendar-day" data-day="thursday">
            <div class="day-header"><span class="day-name">Qui</span><span class="day-count" id="count-thursday">0</span></div>
            <div class="day-animes" id="animes-thursday"></div>
        </div>
        <div class="calendar-day" data-day="friday">
            <div class="day-header"><span class="day-name">Sex</span><span class="day-count" id="count-friday">0</span></div>
            <div class="day-animes" id="animes-friday"></div>
        </div>
        <div class="calendar-day" data-day="saturday">
            <div class="day-header"><span class="day-name">Sáb</span><span class="day-count" id="count-saturday">0</span></div>
            <div class="day-animes" id="animes-saturday"></div>
        </div>
    </div>
