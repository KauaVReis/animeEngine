<?php
/**
 * AnimeEngine v8 - Front Controller (Router PHP)
 * Único ponto de entrada da aplicação.
 * 
 * - Requisição normal: retorna header + view + footer (página completa)
 * - Requisição AJAX (?ajax=true): retorna apenas o "miolo" da view
 */

// 1. CARREGAR DEPENDÊNCIAS CORE
// ============================================================
require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';

// 2. DETECTAR PÁGINA (Pela URL ou parâmetro ?page=)
// ============================================================
$page = $_GET['page'] ?? null;

if (!$page) {
    // Tenta detectar via REQUEST_URI (URLs amigáveis)
    $script_dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
    $request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Remove a pasta do script da URI para sobrar apenas a rota
    if (strpos($request_uri, $script_dir) === 0) {
        $path = substr($request_uri, strlen($script_dir));
    } else {
        $path = $request_uri;
    }
    
    $path = trim($path, '/');
    // Se a URL for 'index.php', trata como home
    if ($path === 'index.php') {
        $path = '';
    }
    $page = !empty($path) ? $path : 'home';
} else {
    // Mesmo com ?page=, precisamos do script_dir para o <base>
    $script_dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
}

// Garante que a base path termine com /
$base_path = rtrim($script_dir, '/') . '/';

// Sanitização básica do nome da página
$page = preg_replace('/[^a-z0-9_]/', '', strtolower($page));

// Alias 'arcade' ou 'music_quiz' -> 'animdle'
if ($page === 'arcade' || $page === 'music_quiz') {
    $page = 'animdle';
}

// 3. MAPEAR ROTAS E METADADOS
// ===================================
$rotas = [
    'home'          => 'views/home.php',
    'explorar'      => 'views/explorar.php',
    'radio'         => 'views/radio.php',
    'animdle'       => 'views/animdle.php',
    'calculadora'   => 'views/calculadora.php',
    'perfil'        => 'views/perfil.php',
    'calendario'    => 'views/calendario.php',
    'detalhes'      => 'views/detalhes.php',
    'ranking'       => 'views/ranking.php',
    'login'         => 'views/login.php',
    'register'      => 'views/register.php',
    'assistindo'    => 'views/assistindo.php',
    'favoritos'     => 'views/favoritos.php',
    'lista'         => 'views/lista.php',
    'tierlist'      => 'views/tierlist.php',
    'titulos'       => 'views/titulos.php',
    'editar_perfil' => 'views/editar_perfil.php',
    'estatisticas'  => 'views/estatisticas.php',
    'changelog'     => 'views/changelog.php',
];

$titulos = [
    'home'          => 'Home',
    'explorar'      => 'Explorar',
    'radio'         => 'Rádio AnimeThemes',
    'animdle'       => 'Animdle — Music Quiz',
    'calculadora'   => 'Calculadora',
    'perfil'        => 'Perfil',
    'calendario'    => 'Calendário',
    'detalhes'      => 'Detalhes',
    'ranking'       => 'Ranking',
    'login'         => 'Login',
    'register'      => 'Cadastro',
    'assistindo'    => 'Assistindo',
    'favoritos'     => 'Favoritos',
    'lista'         => 'Minha Lista',
    'tierlist'      => 'Tier List',
    'titulos'       => 'Títulos',
    'editar_perfil' => 'Editar Perfil',
    'estatisticas'  => 'Estatísticas',
    'changelog'     => 'Changelog',
];

$scripts_por_pagina = [
    'home'          => ['js/airing.js', 'js/pages/home.js'],
    'explorar'      => ['js/pages/explorar.js'],
    'radio'         => ['js/pages/radio.js'],
    'animdle'       => ['js/pages/animdle.js'],
    'calendario'    => ['js/calendar.js', 'js/pages/calendario.js'],
    'detalhes'      => ['js/timeline.js', 'js/pages/detalhes.js'],
    'calculadora'   => ['js/animedata.js', 'js/pages/calculadora.js'],
    'lista'         => ['https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js', 'js/pages/lista.js'],
    'assistindo'    => ['js/pages/assistindo.js'],
    'favoritos'     => ['js/pages/favoritos.js'],
    'estatisticas'  => ['js/pages/stats.js'],
    'tierlist'      => ['https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js', 'js/pages/tierlist.js'],
    'titulos'       => ['js/pages/titulos.js'],
    'perfil'        => ['https://cdn.jsdelivr.net/npm/chart.js', 'js/pages/perfil.js'],
];

$css_por_pagina = [
    'home'          => ['css/pages/home.css'],
    'explorar'      => ['css/pages/explorar.css'],
    'radio'         => ['css/pages/radio.css'],
    'animdle'       => ['css/pages/animdle.css'],
    'calendario'    => ['css/pages/calendario.css'],
    'detalhes'      => ['css/pages/detalhes.css'],
    'calculadora'   => ['css/pages/calculadora.css'],
    'login'         => ['css/pages/auth.css'],
    'register'      => ['css/pages/auth.css'],
    'lista'         => ['css/pages/lista.css'],
    'assistindo'    => ['css/pages/lista.css', 'css/pages/explorar.css'],
    'favoritos'     => ['css/pages/lista.css', 'css/pages/explorar.css'],
    'estatisticas'  => ['css/pages/stats.css'],
    'tierlist'      => ['css/pages/tierlist.css'],
    'titulos'       => ['css/pages/titulos.css'],
    'perfil'        => ['css/pages/perfil.css'],
    'editar_perfil' => ['css/pages/perfil.css'],
    'ranking'       => ['css/pages/ranking.css'],
    'changelog'     => ['css/pages/changelog.css'],
];

// Fallback para home se a rota não existir
if (!isset($rotas[$page])) {
    $page = 'home';
}

$view_file = $rotas[$page];
$is_ajax = (isset($_GET['ajax']) && $_GET['ajax'] === 'true');
$is_fullscreen = in_array($page, ['login', 'register']);

// 4. SEGURANÇA E ACESSO
// ============================================================
$usuario = getUsuarioLogado();
$paginas_restritas = ['perfil', 'lista', 'assistindo', 'favoritos', 'editar_perfil', 'estatisticas', 'titulos'];

if (in_array($page, $paginas_restritas) && !$usuario) {
    if ($is_ajax) {
        header('X-Page-Redirect: login');
        exit;
    }
    header('Location: login'); // Redireciona via URL amigável
    exit;
}

// Se já logado, redireciona de Login/Register para Home
if (in_array($page, ['login', 'register']) && $usuario) {
    header('Location: home');
    exit;
}

// 5. RENDERIZAÇÃO
// ============================================================
$titulo_pagina = ($titulos[$page] ?? 'Home') . ' - ANIME.ENGINE v8';
$scripts_pagina = $scripts_por_pagina[$page] ?? [];
$css_pagina = $css_por_pagina[$page] ?? [];

// Metadados para o SPA Router
if ($is_ajax) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Page-Title: ' . rawurlencode($titulo_pagina));
    header('X-Page-Scripts: ' . json_encode($scripts_pagina));
    header('X-Page-Css: ' . json_encode($css_pagina));
    header('X-Page-Fullscreen: ' . ($is_fullscreen ? 'true' : 'false'));
    
    include __DIR__ . '/' . $view_file;
    exit;
}

// Renderização Completa (Não-AJAX)
$pagina_atual = $page;

include __DIR__ . '/includes/header.php';

if (!$is_fullscreen) {
    include __DIR__ . '/includes/nav.php';
}

echo '<main id="spa-content" class="main-content ' . ($is_fullscreen ? 'fullscreen-main' : '') . '">';
include __DIR__ . '/' . $view_file;
echo '</main>';

if (!$is_fullscreen) {
    include __DIR__ . '/includes/footer.php';
} else {
    echo '</body></html>';
}
