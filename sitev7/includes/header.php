<?php
/**
 * AnimeEngine v7 - Header Include
 * Inclui no topo de todas as páginas
 */

require_once __DIR__ . '/auth.php';

$usuario = getUsuarioLogado();
$pagina_atual = basename($_SERVER['PHP_SELF'], '.php');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $titulo_pagina ?? 'ANIME.ENGINE v7' ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/v6_styles.css">
</head>
<body>
    <header class="header">
        <div class="header-content">
            <a href="index.php" class="logo">
                <span class="logo-text">ANIME.ENGINE</span>
                <span class="logo-version">v7</span>
            </a>
            
            <div class="search-container">
                <input type="text" id="search-input" class="search-input" placeholder="Buscar anime...">
                <button class="search-btn"><i class="fas fa-search"></i></button>
            </div>
            
            <div class="user-area">
                <?php if ($usuario): ?>
                    <a href="perfil.php" class="level-badge" id="level-badge" title="Ver Perfil">
                        <span class="level-icon"><?= ['🌱','🌿','🍃','🔥','⚡','💎','🏆','👑','🌟','🐉'][min($usuario['nivel']-1, 9)] ?></span>
                        <span class="level-text">Lv.<?= $usuario['nivel'] ?></span>
                    </a>
                    <a href="api/auth/logout.php" class="header-btn" title="Sair">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                <?php else: ?>
                    <a href="login.php" class="btn btn-primary btn-sm">
                        <i class="fas fa-sign-in-alt"></i> Entrar
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </header>
