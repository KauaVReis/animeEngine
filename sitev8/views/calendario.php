<?php
/**
 * AnimeEngine v8 - View: Calendário da Temporada
 * Grade de Lançamentos Semanal & Guia de Transmissão
 */
?>

<div class="calendar-page-container">
    <!-- PAGE HEADER -->
    <div class="calendar-header-banner">
        <div class="calendar-title-wrap">
            <h1 class="calendar-main-title"><i class="fas fa-calendar-alt"></i> CALENDÁRIO DA TEMPORADA</h1>
            <p class="calendar-subtitle">Acompanhe as estreias, horários de transmissão e contagens regressivas dos animes no ar</p>
        </div>
        
        <!-- Live Airing Counter Badge -->
        <div class="calendar-live-stat" id="calendar-live-stat">
            <span class="live-dot-pulse"></span>
            <span id="calendar-live-count">0 animes no ar hoje</span>
        </div>
    </div>

    <!-- CALENDAR CONTROLS & CONTROLS BAR -->
    <div class="calendar-toolbar">
        <!-- Season Navigator -->
        <div class="calendar-season-nav">
            <button type="button" class="btn-season-nav" onclick="CalendarioPage.prevSeason()" title="Temporada Anterior">
                <i class="fas fa-chevron-left"></i>
            </button>
            <div class="season-pill-display" id="season-display" onclick="CalendarioPage.showSeasonPickerModal()" title="Clique para escolher temporada">
                <span class="season-icon" id="season-icon">🌸</span>
                <div class="season-info-text">
                    <span class="season-name" id="season-name">Carregando...</span>
                    <span class="season-months" id="season-months">...</span>
                </div>
                <i class="fas fa-caret-down season-caret"></i>
            </div>
            <button type="button" class="btn-season-nav" onclick="CalendarioPage.nextSeason()" title="Próxima Temporada">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>

        <!-- Search Bar -->
        <div class="calendar-search-wrap">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="calendar-search-input" class="calendar-search-input" 
                   placeholder="Buscar anime na temporada..." 
                   oninput="CalendarioPage.onSearchInput(this.value)">
            <button type="button" id="calendar-search-clear" class="btn-search-clear" onclick="CalendarioPage.clearSearch()" style="display:none;">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <!-- Filter Chips & View Mode Toggle -->
        <div class="calendar-filter-group">
            <div class="calendar-filter-chips">
                <button type="button" class="filter-chip-btn active" data-filter="all" onclick="CalendarioPage.filterDay('all')">
                    Todos
                </button>
                <button type="button" class="filter-chip-btn" data-filter="today" onclick="CalendarioPage.filterDay('today')">
                    <span class="chip-pulse"></span> Hoje
                </button>
                <button type="button" class="filter-chip-btn" data-filter="following" onclick="CalendarioPage.filterDay('following')">
                    <i class="fas fa-bell"></i> Seguindo
                </button>
            </div>

            <!-- View Switch: Weekly Grid vs Focused Day View -->
            <div class="calendar-view-toggle">
                <button type="button" class="btn-view-toggle active" id="btn-view-week" onclick="CalendarioPage.setViewMode('week')" title="Visualização em Grade Semanal">
                    <i class="fas fa-th"></i> Grade
                </button>
                <button type="button" class="btn-view-toggle" id="btn-view-day" onclick="CalendarioPage.setViewMode('day')" title="Visualização Detalhada por Dia">
                    <i class="fas fa-calendar-day"></i> Por Dia
                </button>
            </div>
        </div>
    </div>

    <!-- RESPONSIVE DAY TABS BAR (Especialmente útil em Mobile e no modo Por Dia) -->
    <div class="calendar-day-tabs" id="calendar-day-tabs">
        <button type="button" class="day-tab-btn" data-day="sunday" onclick="CalendarioPage.selectDayTab('sunday')">
            <span class="day-tab-label">Dom</span>
            <span class="day-tab-badge" id="tab-count-sunday">0</span>
        </button>
        <button type="button" class="day-tab-btn" data-day="monday" onclick="CalendarioPage.selectDayTab('monday')">
            <span class="day-tab-label">Seg</span>
            <span class="day-tab-badge" id="tab-count-monday">0</span>
        </button>
        <button type="button" class="day-tab-btn" data-day="tuesday" onclick="CalendarioPage.selectDayTab('tuesday')">
            <span class="day-tab-label">Ter</span>
            <span class="day-tab-badge" id="tab-count-tuesday">0</span>
        </button>
        <button type="button" class="day-tab-btn" data-day="wednesday" onclick="CalendarioPage.selectDayTab('wednesday')">
            <span class="day-tab-label">Qua</span>
            <span class="day-tab-badge" id="tab-count-wednesday">0</span>
        </button>
        <button type="button" class="day-tab-btn" data-day="thursday" onclick="CalendarioPage.selectDayTab('thursday')">
            <span class="day-tab-label">Qui</span>
            <span class="day-tab-badge" id="tab-count-thursday">0</span>
        </button>
        <button type="button" class="day-tab-btn" data-day="friday" onclick="CalendarioPage.selectDayTab('friday')">
            <span class="day-tab-label">Sex</span>
            <span class="day-tab-badge" id="tab-count-friday">0</span>
        </button>
        <button type="button" class="day-tab-btn" data-day="saturday" onclick="CalendarioPage.selectDayTab('saturday')">
            <span class="day-tab-label">Sáb</span>
            <span class="day-tab-badge" id="tab-count-saturday">0</span>
        </button>
    </div>

    <!-- SKELETON / LOADING CONTAINER -->
    <div class="calendar-loading-state" id="calendar-loading" style="display: none;">
        <div class="calendar-loader-spinner"></div>
        <p class="calendar-loader-text">SINCRONIZANDO GRADE DE TRANSMISSÃO COM ANILIST...</p>
    </div>

    <!-- WEEKLY 7-COLUMN GRID VIEW -->
    <div class="calendar-week-grid" id="calendar-week">
        <div class="calendar-day-col" data-day="sunday">
            <div class="day-col-header">
                <span class="day-col-title">DOMINGO</span>
                <span class="day-col-badge" id="count-sunday">0</span>
            </div>
            <div class="day-col-cards" id="animes-sunday"></div>
        </div>

        <div class="calendar-day-col" data-day="monday">
            <div class="day-col-header">
                <span class="day-col-title">SEGUNDA</span>
                <span class="day-col-badge" id="count-monday">0</span>
            </div>
            <div class="day-col-cards" id="animes-monday"></div>
        </div>

        <div class="calendar-day-col" data-day="tuesday">
            <div class="day-col-header">
                <span class="day-col-title">TERÇA</span>
                <span class="day-col-badge" id="count-tuesday">0</span>
            </div>
            <div class="day-col-cards" id="animes-tuesday"></div>
        </div>

        <div class="calendar-day-col" data-day="wednesday">
            <div class="day-col-header">
                <span class="day-col-title">QUARTA</span>
                <span class="day-col-badge" id="count-wednesday">0</span>
            </div>
            <div class="day-col-cards" id="animes-wednesday"></div>
        </div>

        <div class="calendar-day-col" data-day="thursday">
            <div class="day-col-header">
                <span class="day-col-title">QUINTA</span>
                <span class="day-col-badge" id="count-thursday">0</span>
            </div>
            <div class="day-col-cards" id="animes-thursday"></div>
        </div>

        <div class="calendar-day-col" data-day="friday">
            <div class="day-col-header">
                <span class="day-col-title">SEXTA</span>
                <span class="day-col-badge" id="count-friday">0</span>
            </div>
            <div class="day-col-cards" id="animes-friday"></div>
        </div>

        <div class="calendar-day-col" data-day="saturday">
            <div class="day-col-header">
                <span class="day-col-title">SÁBADO</span>
                <span class="day-col-badge" id="count-saturday">0</span>
            </div>
            <div class="day-col-cards" id="animes-saturday"></div>
        </div>
    </div>

    <!-- FOCUSED SINGLE-DAY VIEW (MODO DIA / MOBILE EXPANDIDO) -->
    <div class="calendar-day-view-container" id="calendar-day-view" style="display: none;">
        <div class="day-view-header">
            <h2 class="day-view-title" id="day-view-title">Lançamentos de Sexta-feira</h2>
            <span class="day-view-count" id="day-view-count">0 animes</span>
        </div>
        <div class="day-view-cards-grid" id="day-view-cards"></div>
    </div>
</div>
