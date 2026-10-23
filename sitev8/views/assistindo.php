<?php
/**
 * AnimeEngine v8 - View: Assistindo Agora
 * Dashboard de episódios em andamento com controles rápidos e integração de áudio
 */
$usuario_logado = getUsuarioLogado();
?>

<div class="watching-page-container">
    <!-- PAGE HEADER -->
    <div class="page-header-neo">
        <div class="header-titles">
            <div class="header-badge"><i class="fas fa-play-circle"></i> EM PROGRESSO</div>
            <h1 class="page-title"><i class="fas fa-tv"></i> Assistindo Agora</h1>
            <p class="page-subtitle">Acompanhe seus episódios em andamento, atualize seu progresso com um clique e ouça as trilhas sonoras</p>
        </div>

        <div class="header-actions">
            <a href="lista" class="btn btn-secondary btn-sm">
                <i class="fas fa-list-check"></i> Abrir Kanban Completo
            </a>
            <a href="explorar" class="btn btn-primary btn-sm">
                <i class="fas fa-compass"></i> Explorar Novos Animes
            </a>
        </div>
    </div>

    <!-- CARDS DE ASSISTINDO -->
    <div class="watching-cards-grid" id="watching-grid">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>

    <!-- ESTADO VAZIO -->
    <div class="watching-empty-state" id="empty-state" style="display: none;">
        <div class="empty-icon-box">📺</div>
        <h3 class="empty-title">Nenhum anime em andamento no momento</h3>
        <p class="empty-desc">Adicione animes à sua lista "Assistindo" para acompanhar seu progresso diário de episódios.</p>
        <div class="empty-actions">
            <a href="explorar" class="btn btn-primary">
                <i class="fas fa-search"></i> Explorar Catálogo de Animes
            </a>
            <a href="lista" class="btn btn-secondary">
                <i class="fas fa-layer-group"></i> Ver Minha Biblioteca
            </a>
        </div>
    </div>
</div>

<script src="js/pages/assistindo.js?v=10.2"></script>
