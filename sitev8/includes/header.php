<?php
/**
 * AnimeEngine v8 - Header Include
 * Inclui no topo de todas as páginas
 */

require_once __DIR__ . '/auth.php';

$usuario = $usuario ?? getUsuarioLogado();
$pagina_atual = $pagina_atual ?? 'home';
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="<?= $base_path ?>">
    <title><?= $titulo_pagina ?? 'ANIME.ENGINE v8' ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;700&display=swap"
        rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/v6_styles.css">
    <link rel="stylesheet" href="css/spa.css">
    <?php if (isset($css_pagina) && !empty($css_pagina)): ?>
        <?php foreach ($css_pagina as $css): ?>
            <link rel="stylesheet" href="<?= $css ?>" data-page-css>
        <?php endforeach; ?>
    <?php endif; ?>
</head>

<body>
    <header class="header">
        <div class="header-content">
            <a href="home" class="logo">
                <span class="logo-text">ANIME.ENGINE</span>
                <span class="logo-version">v8</span>
            </a>

            <div class="search-container">
                <input type="text" id="search-input" class="search-input" placeholder="Buscar anime..."
                    autocomplete="off">
                <button class="search-btn"><i class="fas fa-search"></i></button>
            </div>

            <div class="user-area">
                <?php if ($usuario): ?>
                    <a href="perfil" class="level-badge" id="level-badge" title="Ver Perfil">
                        <span
                            class="level-icon"><?= ['🌱', '🌿', '🍃', '🔥', '⚡', '💎', '🏆', '👑', '🌟', '🐉'][min($usuario['nivel'] - 1, 9)] ?></span>
                        <span class="level-text">Lv.<?= $usuario['nivel'] ?></span>
                    </a>
                    <!-- Notification Button (Injected via JS common.js to avoid duplication) -->
                    <!-- Logout (Hidden on mobile via CSS) -->
                    <a href="api/auth/logout.php" class="header-btn desktop-only" title="Sair">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                <?php else: ?>
                    <a href="login" class="icon-btn btn-login" title="Entrar">
                        <i class="fas fa-user"></i>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </header>