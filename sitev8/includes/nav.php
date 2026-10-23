<?php
/**
 * AnimeEngine v8 - Navigation Include
 * Sidebar Drawer Neo-Brutalista com Grupos Categóricos & Bottom Nav Mobile
 */

$pagina_atual = $pagina_atual ?? 'home';

function navActive($pagina, $atual)
{
    return $pagina === $atual ? 'active' : '';
}
?>

<!-- BACKDROP OVERLAY PARA O MENU DRAWER -->
<div class="sidebar-backdrop" id="sidebar-backdrop" onclick="if(window.Common) Common.toggleSidebar(false);"></div>

<!-- SIDEBAR DRAWER (NEO-BRUTALISTA COM GRUPOS) -->
<nav class="sidebar" id="main-sidebar" aria-label="Navegação Principal">
    <div class="sidebar-header">
        <div class="sidebar-header-title">
            <i class="fas fa-bars-staggered"></i>
            <span>MENU // v8</span>
        </div>
        <button class="sidebar-close-btn" onclick="if(window.Common) Common.toggleSidebar(false);" aria-label="Fechar Menu" title="Fechar">
            <i class="fas fa-times"></i>
        </button>
    </div>

    <div class="sidebar-scroll">
        <!-- GRUPO 1: PRINCIPAL -->
        <div class="nav-group">
            <div class="nav-group-title"><i class="fas fa-compass"></i> Principal</div>
            <a href="home" class="nav-item <?= navActive('home', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-home"></i><span>Home</span>
            </a>
            <a href="explorar" class="nav-item <?= navActive('explorar', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-search"></i><span>Explorar Catálogo</span>
            </a>
            <a href="calendario" class="nav-item <?= navActive('calendario', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-calendar-alt"></i><span>Calendário Sazonal</span>
            </a>
        </div>

        <!-- GRUPO 2: MINHA COLEÇÃO -->
        <div class="nav-group">
            <div class="nav-group-title"><i class="fas fa-bookmark"></i> Minha Coleção</div>
            <a href="lista" class="nav-item <?= navActive('lista', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-list-check"></i><span>Minha Lista (Kanban)</span>
            </a>
            <a href="assistindo" class="nav-item <?= navActive('assistindo', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-play-circle"></i><span>Assistindo Agora</span>
            </a>
            <a href="favoritos" class="nav-item <?= navActive('favoritos', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-star"></i><span>Favoritos</span>
            </a>
            <a href="tierlist" class="nav-item <?= navActive('tierlist', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-layer-group"></i><span>Minha Tier List</span>
            </a>
        </div>

        <!-- GRUPO 3: RÁDIO & COMUNIDADE -->
        <div class="nav-group">
            <div class="nav-group-title"><i class="fas fa-broadcast-tower"></i> Áudio & Comunidade</div>
            <a href="radio" class="nav-item <?= navActive('radio', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-radio"></i><span>Rádio AnimeThemes</span>
            </a>
        </div>

        <!-- GRUPO 4: ARCADE OTAKU -->
        <div class="nav-group">
            <div class="nav-group-title"><i class="fas fa-gamepad"></i> Arcade Otaku</div>
            <a href="animdle" class="nav-item <?= navActive('animdle', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-music"></i><span>Animdle (Music Quiz)</span>
            </a>
            <a href="calculadora" class="nav-item <?= navActive('calculadora', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-calculator"></i><span>Calculadora de Tempo</span>
            </a>
            <a href="#" class="nav-item" onclick="if(window.Common) Common.toggleSidebar(false); if(window.goToRandomAnime) goToRandomAnime(); return false;">
                <i class="fas fa-dice"></i><span>Anime Aleatório</span>
            </a>
        </div>

        <!-- GRUPO 5: PROGRESSO & ESTATÍSTICAS -->
        <div class="nav-group">
            <div class="nav-group-title"><i class="fas fa-chart-line"></i> Progresso & Perfil</div>
            <a href="estatisticas" class="nav-item <?= navActive('estatisticas', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-chart-pie"></i><span>Estatísticas Aprimoradas</span>
            </a>
            <a href="titulos" class="nav-item <?= navActive('titulos', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-crown"></i><span>Galeria de Títulos</span>
            </a>
            <a href="perfil" class="nav-item <?= navActive('perfil', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-user-circle"></i><span>Meu Perfil</span>
            </a>
        </div>

        <!-- GRUPO 6: SISTEMA & CONFIGURAÇÕES -->
        <div class="nav-group">
            <div class="nav-group-title"><i class="fas fa-sliders-h"></i> Sistema</div>
            <a href="#" class="nav-item" onclick="if(window.Common) { Common.toggleSidebar(false); Common.openSettings(); } return false;" title="Abrir Configurações">
                <i class="fas fa-cog"></i><span>Configurações</span>
            </a>
            <a href="changelog" class="nav-item <?= navActive('changelog', $pagina_atual) ?>" onclick="if(window.Common) Common.toggleSidebar(false);">
                <i class="fas fa-clipboard-list"></i><span>Changelog v8</span>
            </a>
            <?php if (isset($usuario) && $usuario): ?>
                <a href="api/auth/logout.php" class="nav-item text-danger">
                    <i class="fas fa-sign-out-alt"></i><span>Encerrar Sessão</span>
                </a>
            <?php else: ?>
                <a href="login" class="nav-item text-primary" onclick="if(window.Common) Common.toggleSidebar(false);">
                    <i class="fas fa-sign-in-alt"></i><span>Fazer Login</span>
                </a>
            <?php endif; ?>
        </div>

        <div class="nav-divider"></div>

        <!-- THEME SELECTOR NO RODAPÉ DO DRAWER -->
        <div class="sidebar-theme-wrapper">
            <div class="sidebar-theme-label"><i class="fas fa-palette"></i> Tema da Interface:</div>
            <div class="theme-selector" id="theme-selector"></div>
        </div>
    </div>
</nav>

<!-- BOTTOM NAV MOBILE -->
<nav class="bottom-nav">
    <a href="home" class="bottom-nav-item <?= navActive('home', $pagina_atual) ?>" title="Home">
        <i class="fas fa-home"></i>
    </a>
    <a href="explorar" class="bottom-nav-item <?= navActive('explorar', $pagina_atual) ?>" title="Explorar">
        <i class="fas fa-search"></i>
    </a>
    <a href="radio" class="bottom-nav-item <?= navActive('radio', $pagina_atual) ?>" title="Rádio">
        <i class="fas fa-broadcast-tower"></i>
    </a>
    <a href="animdle" class="bottom-nav-item <?= navActive('animdle', $pagina_atual) ?>" title="Animdle">
        <i class="fas fa-music"></i>
    </a>
    <div class="bottom-nav-item bottom-nav-more" onclick="if(window.Common) Common.toggleSidebar(true);">
        <i class="fas fa-bars"></i>
    </div>
</nav>
