<?php
/**
 * AnimeEngine v8 - Navigation Include
 * Sidebar e Bottom Nav — links atualizados para Front Controller + Rádio & Animdle
 */

$pagina_atual = $pagina_atual ?? 'home';

function navActive($pagina, $atual)
{
    return $pagina === $atual ? 'active' : '';
}
?>

<!-- SIDEBAR -->
<nav class="sidebar">
    <a href="home" class="nav-item <?= navActive('home', $pagina_atual) ?>">
        <i class="fas fa-home"></i><span>Home</span>
    </a>
    <a href="explorar" class="nav-item <?= navActive('explorar', $pagina_atual) ?>">
        <i class="fas fa-search"></i><span>Explorar</span>
    </a>
    <a href="radio" class="nav-item <?= navActive('radio', $pagina_atual) ?>">
        <i class="fas fa-broadcast-tower"></i><span>Rádio</span>
    </a>
    <a href="animdle" class="nav-item <?= navActive('animdle', $pagina_atual) ?>">
        <i class="fas fa-music"></i><span>Animdle</span>
    </a>
    <a href="lista" class="nav-item <?= navActive('lista', $pagina_atual) ?>">
        <i class="fas fa-list"></i><span>Minha Lista</span>
    </a>
    <a href="assistindo" class="nav-item <?= navActive('assistindo', $pagina_atual) ?>">
        <i class="fas fa-play-circle"></i><span>Assistindo</span>
    </a>
    <a href="favoritos" class="nav-item <?= navActive('favoritos', $pagina_atual) ?>">
        <i class="fas fa-star"></i><span>Favoritos</span>
    </a>
    <a href="calendario" class="nav-item <?= navActive('calendario', $pagina_atual) ?>">
        <i class="fas fa-calendar-alt"></i><span>Calendário</span>
    </a>
    <a href="calculadora" class="nav-item <?= navActive('calculadora', $pagina_atual) ?>">
        <i class="fas fa-calculator"></i><span>Calculadora</span>
    </a>
    <a href="estatisticas" class="nav-item <?= navActive('estatisticas', $pagina_atual) ?>">
        <i class="fas fa-chart-bar"></i><span>Estatísticas</span>
    </a>
    <a href="titulos" class="nav-item <?= navActive('titulos', $pagina_atual) ?>">
        <i class="fas fa-crown"></i><span>Títulos</span>
    </a>
    <a href="changelog" class="nav-item <?= navActive('changelog', $pagina_atual) ?>">
        <i class="fas fa-clipboard-list"></i><span>Changelog</span>
    </a>
    <a href="#" class="nav-item" onclick="if(window.Common) Common.openSettings(); return false;" title="Abrir Configurações (Modal)">
        <i class="fas fa-cog"></i><span>Configurações</span>
    </a>
    <a href="#" class="nav-item" onclick="goToRandomAnime(); return false;">
        <i class="fas fa-dice"></i><span>Aleatório</span>
    </a>

    <div class="nav-divider"></div>

    <div class="theme-selector" id="theme-selector"></div>
</nav>

<!-- BOTTOM NAV MOBILE -->
<nav class="bottom-nav">
    <a href="home" class="bottom-nav-item <?= navActive('home', $pagina_atual) ?>">
        <i class="fas fa-home"></i>
    </a>
    <a href="explorar" class="bottom-nav-item <?= navActive('explorar', $pagina_atual) ?>">
        <i class="fas fa-search"></i>
    </a>
    <a href="radio" class="bottom-nav-item <?= navActive('radio', $pagina_atual) ?>" title="Rádio">
        <i class="fas fa-broadcast-tower"></i>
    </a>
    <a href="animdle" class="bottom-nav-item <?= navActive('animdle', $pagina_atual) ?>" title="Animdle">
        <i class="fas fa-music"></i>
    </a>
    <div class="bottom-nav-item bottom-nav-more" onclick="Common.toggleBottomNavMore()">
        <i class="fas fa-ellipsis-h"></i>
        <div class="bottom-nav-popup" id="bottom-nav-popup">
            <a href="lista"><i class="fas fa-list"></i> Minha Lista</a>
            <a href="calendario"><i class="fas fa-calendar-alt"></i> Calendário</a>
            <a href="favoritos"><i class="fas fa-star"></i> Favoritos</a>
            <a href="assistindo"><i class="fas fa-play-circle"></i> Assistindo</a>
            <a href="calculadora"><i class="fas fa-calculator"></i> Calculadora</a>
            <a href="estatisticas"><i class="fas fa-chart-bar"></i> Estatísticas</a>
            <a href="titulos"><i class="fas fa-crown"></i> Títulos</a>
            <a href="changelog"><i class="fas fa-clipboard-list"></i> Changelog</a>
            <a href="javascript:void(0)" onclick="Common.openSettings(); Common.toggleBottomNavMore(); return false;"><i class="fas fa-cog"></i> Configurações</a>
            <a href="#" onclick="goToRandomAnime(); return false;"><i class="fas fa-dice"></i> Aleatório</a>
            <hr style="margin: 5px 0; border: 0; border-top: 1px solid var(--border-color);">
            <?php if (isset($usuario) && $usuario): ?>
                <a href="api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Sair</a>
            <?php endif; ?>
        </div>
    </div>
</nav>
