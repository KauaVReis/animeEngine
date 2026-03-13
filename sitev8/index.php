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
    $page = !empty($path) ? $path : 'home';
} else {
    // Mesmo com ?page=, precisamos do script_dir para o <base>
    $script_dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
}

// Garante que a base path termine com /
$base_path = rtrim($script_dir, '/') . '/';

// Sanitização básica do nome da página
$page = preg_replace('/[^a-z0-9_]/', '', strtolower($page));

// 3. MAPEAR ROTAS E METADADOS
// ===================================
$rotas = [
    'home'          => 'views/home.php',
    'explorar'      => 'views/explorar.php',
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
];

$titulos = [
    'home' => 'Home', 'explorar' => 'Explorar', 'calculadora' => 'Calculadora',
    'perfil' => 'Perfil', 'calendario' => 'Calendário', 'detalhes' => 'Detalhes',
    'ranking' => 'Ranking', 'login' => 'Login', 'register' => 'Cadastro',
    'assistindo' => 'Assistindo', 'favoritos' => 'Favoritos', 'lista' => 'Minha Lista',
    'tierlist' => 'Tier List', 'titulos' => 'Títulos', 'editar_perfil' => 'Editar Perfil',
    'estatisticas' => 'Estatísticas'
];

$scripts_por_pagina = [
    'home'       => ['js/airing.js', 'js/pages/home.js'],
    'explorar'   => ['js/pages/explorar.js'],
    'calendario' => ['js/calendar.js', 'js/pages/calendario.js'],
    'lista'      => ['js/pages/lista.js'],
    'assistindo' => ['js/pages/lista.js'],
    'favoritos'  => ['js/pages/lista.js'],
];

$css_por_pagina = [
    'home'       => ['css/pages/home.css'],
    'explorar'   => ['css/pages/explorar.css'],
    'login'      => ['css/pages/auth.css'],
    'register'   => ['css/pages/auth.css'],
    'lista'      => ['css/pages/lista.css'],
    'assistindo' => ['css/pages/lista.css'],
    'favoritos'  => ['css/pages/lista.css'],
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

// Metadados para o SPA Router
if ($is_ajax) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Page-Title: ' . ($titulos[$page] ?? 'Home') . ' - ANIME.ENGINE v8');
    header('X-Page-Scripts: ' . json_encode($scripts_por_pagina[$page] ?? []));
    header('X-Page-Css: ' . json_encode($css_por_pagina[$page] ?? []));
    header('X-Page-Fullscreen: ' . ($is_fullscreen ? 'true' : 'false'));
    
    include __DIR__ . '/' . $view_file;
    exit;
}

// Renderização Completa (Não-AJAX)
$titulo_completo = ($titulos[$page] ?? 'Home') . ' - ANIME.ENGINE v8';
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
}

echo '</body></html>';
