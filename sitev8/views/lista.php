<?php
/**
 * AnimeEngine v8 - View: Minha Lista (Kanban & Biblioteca)
 * Kanban interativo com drag-and-drop, filtros e controle rápido de episódios
 */
$usuario_logado = getUsuarioLogado();
?>

<div class="kanban-page-container">
    <!-- HEADER DA BIBLIOTECA -->
    <div class="page-header-neo">
        <div class="header-titles">
            <div class="header-badge"><i class="fas fa-list-check"></i> MINHA COLEÇÃO</div>
            <h1 class="page-title"><i class="fas fa-layer-group"></i> Biblioteca de Animes</h1>
            <p class="page-subtitle">Organize seus animes em colunas interativas, arraste para mudar de status e registre seu progresso</p>
        </div>

        <div class="header-actions">
            <a href="assistindo" class="btn btn-primary btn-sm">
                <i class="fas fa-play-circle"></i> Modo Assistindo
            </a>
            <a href="tierlist" class="btn btn-secondary btn-sm">
                <i class="fas fa-trophy"></i> Minha Tier List
            </a>
        </div>
    </div>

    <!-- BARRA DE FERRAMENTAS E FILTROS -->
    <div class="kanban-toolbar">
        <div class="toolbar-search">
            <i class="fas fa-search"></i>
            <input type="text" id="list-search" placeholder="Buscar por título na biblioteca..." autocomplete="off">
        </div>

        <div class="toolbar-filters">
            <div class="filter-group">
                <label for="sort-select"><i class="fas fa-sort"></i> Ordenar:</label>
                <select id="sort-select" onchange="ListaPage.renderList()">
                    <option value="recentes">Mais recentes</option>
                    <option value="nota_desc">Maior nota ⭐</option>
                    <option value="titulo_asc">Título (A-Z)</option>
                    <option value="progresso_desc">Mais assistidos</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="status-filter"><i class="fas fa-filter"></i> Coluna:</label>
                <select id="status-filter" onchange="ListaPage.renderList()">
                    <option value="all">Todas as Colunas</option>
                    <option value="watching">📺 Assistindo</option>
                    <option value="planToWatch">📋 Planejo Assistir</option>
                    <option value="completed">✅ Completos</option>
                    <option value="paused">⏸️ Pausados</option>
                    <option value="dropped">❌ Abandonados</option>
                </select>
            </div>
        </div>
    </div>

    <!-- KANBAN BOARD COM AS 5 COLUNAS -->
    <div class="kanban-board-v8" id="kanban-board">
        <!-- Coluna 1: Planejo Assistir -->
        <div class="kanban-col" id="col-planToWatch" data-status="planToWatch">
            <div class="kanban-col-header bg-plan">
                <div class="col-title-wrap">
                    <span class="col-icon">📋</span>
                    <h3>Planejo Assistir</h3>
                </div>
                <span class="kanban-badge-count" id="count-planToWatch">0</span>
            </div>
            <div class="kanban-cards-track" id="list-planToWatch">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <!-- Coluna 2: Assistindo -->
        <div class="kanban-col" id="col-watching" data-status="watching">
            <div class="kanban-col-header bg-watching">
                <div class="col-title-wrap">
                    <span class="col-icon">📺</span>
                    <h3>Assistindo Agora</h3>
                </div>
                <span class="kanban-badge-count" id="count-watching">0</span>
            </div>
            <div class="kanban-cards-track" id="list-watching">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <!-- Coluna 3: Pausados -->
        <div class="kanban-col" id="col-paused" data-status="paused">
            <div class="kanban-col-header bg-paused">
                <div class="col-title-wrap">
                    <span class="col-icon">⏸️</span>
                    <h3>Pausados</h3>
                </div>
                <span class="kanban-badge-count" id="count-paused">0</span>
            </div>
            <div class="kanban-cards-track" id="list-paused">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <!-- Coluna 4: Completados -->
        <div class="kanban-col" id="col-completed" data-status="completed">
            <div class="kanban-col-header bg-completed">
                <div class="col-title-wrap">
                    <span class="col-icon">✅</span>
                    <h3>Completados</h3>
                </div>
                <span class="kanban-badge-count" id="count-completed">0</span>
            </div>
            <div class="kanban-cards-track" id="list-completed">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <!-- Coluna 5: Abandonados -->
        <div class="kanban-col" id="col-dropped" data-status="dropped">
            <div class="kanban-col-header bg-dropped">
                <div class="col-title-wrap">
                    <span class="col-icon">❌</span>
                    <h3>Abandonados</h3>
                </div>
                <span class="kanban-badge-count" id="count-dropped">0</span>
            </div>
            <div class="kanban-cards-track" id="list-dropped">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<script src="js/pages/lista.js?v=10.2"></script>
