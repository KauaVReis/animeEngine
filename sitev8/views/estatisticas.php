<?php
/**
 * AnimeEngine v8 - View: Estatísticas (Aprimorada)
 * Dashboard analítico de métricas, gráficos e preferências do usuário
 */
?>

<div class="stats-page-container">
    <!-- PAGE HEADER -->
    <div class="page-header-neo">
        <div class="header-titles">
            <div class="header-badge"><i class="fas fa-chart-pie"></i> ANALYTICS v8</div>
            <h1 class="page-title"><i class="fas fa-chart-line"></i> Estatísticas Aprimoradas</h1>
            <p class="page-subtitle">Acompanhe seu histórico de reprodução, tempo assistido e preferências visuais</p>
        </div>
        <div class="header-actions">
            <a href="perfil" class="btn btn-secondary btn-sm">
                <i class="fas fa-user"></i> Meu Perfil
            </a>
            <a href="lista" class="btn btn-primary btn-sm">
                <i class="fas fa-list"></i> Minha Biblioteca
            </a>
        </div>
    </div>

    <!-- KPI CARDS (RESUMO MÉTRICO) -->
    <div class="stats-kpi-grid" id="kpi-grid">
        <div class="kpi-card" id="kpi-time">
            <div class="kpi-icon"><i class="fas fa-clock"></i></div>
            <div class="kpi-body">
                <span class="kpi-value" id="val-time">0h</span>
                <span class="kpi-label">Tempo Total Assistido</span>
                <span class="kpi-sub" id="val-days">0 dias equivalentes</span>
            </div>
        </div>

        <div class="kpi-card" id="kpi-animes">
            <div class="kpi-icon"><i class="fas fa-tv"></i></div>
            <div class="kpi-body">
                <span class="kpi-value" id="val-total-animes">0</span>
                <span class="kpi-label">Animes na Biblioteca</span>
                <span class="kpi-sub" id="val-completed-animes">0 completados</span>
            </div>
        </div>

        <div class="kpi-card" id="kpi-episodes">
            <div class="kpi-icon"><i class="fas fa-play-circle"></i></div>
            <div class="kpi-body">
                <span class="kpi-value" id="val-episodes">0</span>
                <span class="kpi-label">Episódios Totais</span>
                <span class="kpi-sub" id="val-watching-eps">assistidos até agora</span>
            </div>
        </div>

        <div class="kpi-card" id="kpi-mean-score">
            <div class="kpi-icon"><i class="fas fa-star text-warning"></i></div>
            <div class="kpi-body">
                <span class="kpi-value" id="val-mean-score">0.0</span>
                <span class="kpi-label">Nota Média</span>
                <span class="kpi-sub" id="val-rated-count">0 avaliados</span>
            </div>
        </div>

        <div class="kpi-card" id="kpi-level">
            <div class="kpi-icon"><i class="fas fa-bolt text-primary"></i></div>
            <div class="kpi-body">
                <span class="kpi-value" id="val-level">Lv.1</span>
                <span class="kpi-label">Nível de Conta</span>
                <span class="kpi-sub" id="val-xp">0 XP total</span>
            </div>
        </div>

        <div class="kpi-card" id="kpi-achievements">
            <div class="kpi-icon"><i class="fas fa-trophy"></i></div>
            <div class="kpi-body">
                <span class="kpi-value" id="val-achievements">0</span>
                <span class="kpi-label">Conquistas</span>
                <span class="kpi-sub">desbloqueadas</span>
            </div>
        </div>
    </div>

    <!-- DISTRIBUIÇÃO POR STATUS (SEGMENTED BAR) -->
    <div class="stats-card-section">
        <div class="stats-card-header">
            <h3><i class="fas fa-layer-group"></i> Distribuição por Status na Coleção</h3>
            <span class="stats-header-info" id="status-total-label">Total: 0 animes</span>
        </div>
        <div class="segmented-track" id="status-track">
            <div class="segment-fill seg-watching" id="seg-watching" style="width: 0%;" title="Assistindo"></div>
            <div class="segment-fill seg-completed" id="seg-completed" style="width: 0%;" title="Completos"></div>
            <div class="segment-fill seg-plan" id="seg-plan" style="width: 0%;" title="Planejo"></div>
            <div class="segment-fill seg-paused" id="seg-paused" style="width: 0%;" title="Pausados"></div>
            <div class="segment-fill seg-dropped" id="seg-dropped" style="width: 0%;" title="Abandonados"></div>
        </div>
        <div class="status-legend-grid">
            <div class="legend-item"><span class="legend-dot seg-watching"></span> Assistindo: <strong id="leg-watching">0</strong></div>
            <div class="legend-item"><span class="legend-dot seg-completed"></span> Completados: <strong id="leg-completed">0</strong></div>
            <div class="legend-item"><span class="legend-dot seg-plan"></span> Planejo Assistir: <strong id="leg-plan">0</strong></div>
            <div class="legend-item"><span class="legend-dot seg-paused"></span> Pausados: <strong id="leg-paused">0</strong></div>
            <div class="legend-item"><span class="legend-dot seg-dropped"></span> Abandonados: <strong id="leg-dropped">0</strong></div>
        </div>
    </div>

    <!-- GRÁFICOS ANALÍTICOS (DUAS COLUNAS) -->
    <div class="stats-charts-row">
        <!-- RADAR DE GÊNEROS -->
        <div class="stats-card-section half-card">
            <div class="stats-card-header">
                <h3><i class="fas fa-tags text-primary"></i> Gêneros Mais Assistidos</h3>
            </div>
            <div class="chart-canvas-wrapper">
                <canvas id="chart-genres"></canvas>
            </div>
            <div class="top-genres-pills" id="top-genres-list"></div>
        </div>

        <!-- HISTOGRAMA DE NOTAS -->
        <div class="stats-card-section half-card">
            <div class="stats-card-header">
                <h3><i class="fas fa-signal text-warning"></i> Distribuição de Avaliações (1 a 10)</h3>
            </div>
            <div class="chart-canvas-wrapper">
                <canvas id="chart-scores"></canvas>
            </div>
            <p class="chart-footnote">Frequência com que você atribui cada nota aos animes da sua lista.</p>
        </div>
    </div>

    <!-- FORMATOS & TOP AVALIADOS -->
    <div class="stats-charts-row">
        <!-- FORMATOS (TV, MOVIE, OVA) -->
        <div class="stats-card-section format-card">
            <div class="stats-card-header">
                <h3><i class="fas fa-compact-disc"></i> Formatos de Mídia</h3>
            </div>
            <div class="chart-canvas-wrapper doughnut-wrap">
                <canvas id="chart-formats"></canvas>
            </div>
        </div>

        <!-- TOP ANIME PICKS DO USUÁRIO -->
        <div class="stats-card-section top-rated-card">
            <div class="stats-card-header">
                <h3><i class="fas fa-crown text-warning"></i> Seus Melhores Avaliados</h3>
            </div>
            <div class="top-rated-grid" id="top-rated-grid">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>
    </div>
</div>
