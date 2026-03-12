<?php
/**
 * AnimeEngine v7 - Calendário Page
 */

$titulo_pagina = 'Calendário - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<style>
/* ========================================
   CALENDÁRIO - Estilos
======================================== */

.calendar-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.season-selector {
    display: flex;
    align-items: center;
    gap: 10px;
}

.season-display {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    background: var(--color-surface);
    border: var(--border-width) solid var(--border-color);
    box-shadow: var(--shadow-neo);
    min-width: 200px;
    justify-content: center;
}

.season-icon { font-size: 1.8rem; }
.season-info { display: flex; flex-direction: column; line-height: 1.2; }
.season-name { font-family: var(--font-display); font-size: 1rem; font-weight: 700; }
.season-months { font-size: 0.78rem; color: var(--color-text-muted); }

.calendar-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

/* ========================================
   GRADE SEMANAL
======================================== */
.calendar-week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 10px;
}

.calendar-day {
    background: var(--color-surface);
    border: var(--border-width) solid var(--border-color);
    box-shadow: var(--shadow-neo);
    min-width: 170px;
    transition: all 0.2s;
}

.calendar-day.today {
    border-color: var(--color-primary);
    box-shadow: 4px 4px 0 var(--color-primary);
}

.calendar-day.today .day-header {
    background: var(--color-primary);
    color: #fff;
}

.calendar-day.today .day-name { color: #fff; }
.calendar-day.today .day-count {
    background: rgba(255,255,255,0.25);
    color: #fff;
    border-color: rgba(255,255,255,0.4);
}

.day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: var(--border-width) solid var(--border-color);
    background: var(--color-bg);
}

.day-name {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.day-count {
    background: var(--color-secondary);
    color: var(--color-black);
    border: 2px solid var(--border-color);
    font-size: 0.75rem;
    font-weight: 800;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.day-animes {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.day-empty {
    padding: 20px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.85rem;
}

/* ========================================
   CARD DE ANIME
======================================== */
.calendar-anime {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(0,0,0,0.08);
    cursor: pointer;
    transition: background 0.15s;
    position: relative;
}

.calendar-anime:last-child { border-bottom: none; }

.calendar-anime:hover { background: var(--color-bg); }

.calendar-anime.following {
    background: rgba(255, 51, 102, 0.05);
    border-left: 3px solid var(--color-primary);
}

.calendar-anime.is-live {
    background: rgba(255, 68, 68, 0.07);
    border-left: 3px solid #ff4444;
}

.calendar-anime img {
    width: 42px;
    height: 58px;
    object-fit: cover;
    border: 2px solid var(--border-color);
    flex-shrink: 0;
}

.calendar-anime-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.calendar-anime-title {
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.2;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.calendar-anime-meta {
    display: flex;
    gap: 8px;
    font-size: 0.72rem;
    color: var(--color-text-muted);
    font-weight: 600;
    flex-wrap: wrap;
}

.calendar-time i { margin-right: 3px; }

/* ========================================
   BADGE "NO AR" + COUNTDOWN
======================================== */
.badge-live {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    font-weight: 800;
    color: #ff4444;
    background: rgba(255, 68, 68, 0.12);
    border: 1px solid #ff4444;
    padding: 1px 6px;
    letter-spacing: 0.05em;
    animation: pulse-live 1.5s ease-in-out infinite;
    width: fit-content;
}

@keyframes pulse-live {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.calendar-countdown {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--color-primary);
    display: flex;
    align-items: center;
    gap: 4px;
}

.countdown {
    font-family: var(--font-display);
    letter-spacing: 0.03em;
}

/* ========================================
   BOTÃO SEGUIR
======================================== */
.calendar-follow-btn {
    width: 28px;
    height: 28px;
    border: 2px solid var(--border-color);
    background: var(--color-surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    flex-shrink: 0;
    transition: all 0.15s;
    margin-top: 2px;
}

.calendar-follow-btn:hover {
    background: var(--color-secondary);
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--border-color);
}

.calendar-follow-btn.active {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
    box-shadow: 2px 2px 0 var(--border-color);
}

/* ========================================
   RESPONSIVIDADE MOBILE
======================================== */
@media (max-width: 900px) {
    .calendar-week {
        grid-template-columns: repeat(4, minmax(160px, 1fr));
    }
}

@media (max-width: 600px) {
    .calendar-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .season-selector { justify-content: center; }

    .calendar-filters { justify-content: center; }

    .calendar-week {
        grid-template-columns: repeat(2, minmax(155px, 1fr));
    }
}
</style>

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

</main>

<?php
$scripts_pagina = ['js/pages/calendario.js'];
require_once 'includes/footer.php';
?>