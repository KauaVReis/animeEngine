<?php
/**
 * AnimeEngine v8 - View: Titulos
 * Galeria de títulos com pré-visualização, categorias e equipar/desequipar instantâneo
 */
?>

<div class="titles-page-container">
    <!-- PAGE HEADER -->
    <div class="page-header-neo">
        <div class="header-titles">
            <div class="header-badge"><i class="fas fa-crown"></i> RECOMPENSAS EXCLUSIVAS</div>
            <h1 class="page-title"><i class="fas fa-award"></i> Galeria de Títulos</h1>
            <p class="page-subtitle">Desbloqueie conquistas, suba de nível e ouça rádios para exibir títulos únicos no seu perfil</p>
        </div>
        <div class="header-actions">
            <a href="perfil" class="btn btn-primary btn-sm">
                <i class="fas fa-user-circle"></i> Ver Meu Perfil
            </a>
        </div>
    </div>

    <!-- TÍTULO ATIVO (DESTAQUE HERO NEO-BRUTALISTA) -->
    <div class="active-title-board-v8">
        <div class="active-title-header-v8">
            <div class="active-title-label">
                <i class="fas fa-id-badge text-warning"></i>
                <span>TÍTULO EQUIPADO ATUALMENTE NO PERFIL</span>
            </div>
            <button class="btn btn-danger btn-sm" id="btn-unequip-title" onclick="TitulosPage.removeTitulo()" style="display: none;">
                <i class="fas fa-ban"></i> Desequipar
            </button>
        </div>
        <div class="active-title-display-box-v8" id="active-title">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </div>

    <!-- GALERIAS POR CATEGORIA -->
    <div class="titles-categories-grid">
        <!-- Categoria 1: Nível -->
        <div class="title-category-card">
            <div class="category-banner bg-yellow">
                <div class="cat-header-title">
                    <span class="cat-icon">🏆</span>
                    <h3>Evolução de Nível</h3>
                </div>
                <p>Evolua seu XP e suba de nível para desbloquear insígnias de prestígio.</p>
            </div>
            <div class="titles-track-grid" id="titulos-nivel">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <!-- Categoria 2: Gênero -->
        <div class="title-category-card">
            <div class="category-banner bg-pink">
                <div class="cat-header-title">
                    <span class="cat-icon">🎭</span>
                    <h3>Maestria de Gênero</h3>
                </div>
                <p>Torne-se especialista assistindo animes de temas específicos.</p>
            </div>
            <div class="titles-track-grid" id="titulos-genero">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <!-- Categoria 3: Rádio & Melodia -->
        <div class="title-category-card">
            <div class="category-banner bg-purple">
                <div class="cat-header-title">
                    <span class="cat-icon">🎧</span>
                    <h3>Rádio & Comunidade</h3>
                </div>
                <p>Ouça aberturas e participe das transmissões musicais da comunidade.</p>
            </div>
            <div class="titles-track-grid" id="titulos-radio">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <!-- Categoria 4: Sazonal -->
        <div class="title-category-card">
            <div class="category-banner bg-blue">
                <div class="cat-header-title">
                    <span class="cat-icon">🌸</span>
                    <h3>Veterano Sazonal</h3>
                </div>
                <p>Acompanhe transmissões e estreias durante suas temporadas ativas.</p>
            </div>
            <div class="titles-track-grid" id="titulos-sazonal">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <!-- Categoria 5: Secretos -->
        <div class="title-category-card">
            <div class="category-banner bg-dark">
                <div class="cat-header-title">
                    <span class="cat-icon">🔮</span>
                    <h3>Títulos Secretos</h3>
                </div>
                <p>Ações raras, combinações ocultas e eventos especiais revelam estes títulos.</p>
            </div>
            <div class="titles-track-grid" id="titulos-secreto">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>
    </div>
</div>

<script src="js/pages/titulos.js?v=10.2"></script>
