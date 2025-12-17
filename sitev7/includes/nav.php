<?php
/**
 * AnimeEngine v7 - Navigation Include
 * Sidebar e Bottom Nav
 */

$pagina_atual = $pagina_atual ?? basename($_SERVER['PHP_SELF'], '.php');

function navActive($pagina, $atual) {
    return $pagina === $atual ? 'active' : '';
}
?>

<!-- SIDEBAR -->
<nav class="sidebar">
    <a href="index.php" class="nav-item <?= navActive('index', $pagina_atual) ?>">
        <i class="fas fa-home"></i><span>Home</span>
    </a>
    <a href="explorar.php" class="nav-item <?= navActive('explorar', $pagina_atual) ?>">
        <i class="fas fa-search"></i><span>Explorar</span>
    </a>
    <a href="lista.php" class="nav-item <?= navActive('lista', $pagina_atual) ?>">
        <i class="fas fa-list"></i><span>Minha Lista</span>
    </a>
    <a href="assistindo.php" class="nav-item <?= navActive('assistindo', $pagina_atual) ?>">
        <i class="fas fa-play-circle"></i><span>Assistindo</span>
    </a>
    <a href="favoritos.php" class="nav-item <?= navActive('favoritos', $pagina_atual) ?>">
        <i class="fas fa-star"></i><span>Favoritos</span>
    </a>
    <a href="calendario.php" class="nav-item <?= navActive('calendario', $pagina_atual) ?>">
        <i class="fas fa-calendar-alt"></i><span>Calendário</span>
    </a>
    <a href="calculadora.php" class="nav-item <?= navActive('calculadora', $pagina_atual) ?>">
        <i class="fas fa-calculator"></i><span>Calculadora</span>
    </a>
    <a href="estatisticas.php" class="nav-item <?= navActive('estatisticas', $pagina_atual) ?>">
        <i class="fas fa-chart-bar"></i><span>Estatísticas</span>
    </a>
    <a href="#" class="nav-item" onclick="goToRandomAnime(); return false;">
        <i class="fas fa-dice"></i><span>Aleatório</span>
    </a>
    
    <div class="nav-divider"></div>
    
    <div class="theme-selector" id="theme-selector"></div>
</nav>

<!-- BOTTOM NAV MOBILE -->
<nav class="bottom-nav">
    <a href="index.php" class="bottom-nav-item <?= navActive('index', $pagina_atual) ?>">
        <i class="fas fa-home"></i>
    </a>
    <a href="explorar.php" class="bottom-nav-item <?= navActive('explorar', $pagina_atual) ?>">
        <i class="fas fa-search"></i>
    </a>
    <a href="lista.php" class="bottom-nav-item <?= navActive('lista', $pagina_atual) ?>">
        <i class="fas fa-list"></i>
    </a>
    <a href="calendario.php" class="bottom-nav-item <?= navActive('calendario', $pagina_atual) ?>">
        <i class="fas fa-calendar-alt"></i>
    </a>
    <div class="bottom-nav-item bottom-nav-more" onclick="Common.toggleBottomNavMore()">
        <i class="fas fa-ellipsis-h"></i>
        <div class="bottom-nav-popup" id="bottom-nav-popup">
            <a href="favoritos.php"><i class="fas fa-star"></i> Favoritos</a>
            <a href="assistindo.php"><i class="fas fa-play-circle"></i> Assistindo</a>
            <a href="calculadora.php"><i class="fas fa-calculator"></i> Calculadora</a>
            <a href="estatisticas.php"><i class="fas fa-chart-bar"></i> Estatísticas</a>
        </div>
    </div>
</nav>
