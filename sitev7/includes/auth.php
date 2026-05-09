<?php
/**
 * AnimeEngine v7 - Authentication Helper
 * Funções de autenticação
 */

session_start();

require_once __DIR__ . '/database.php';

/**
 * Verificar se usuário está logado
 */
function estaLogado() {
    return isset($_SESSION['usuario_id']) && $_SESSION['usuario_id'] > 0;
}

/**
 * Expirar sessão por inatividade.
 */
function verificarSessionTimeout($timeout = 3600) {
    if (!estaLogado()) {
        return;
    }

    $lastActivity = $_SESSION['last_activity'] ?? time();
    if (time() - $lastActivity > $timeout) {
        fazerLogout();
        return;
    }

    $_SESSION['last_activity'] = time();
}

verificarSessionTimeout();

/**
 * Obter ID do usuário logado
 */
function getUsuarioId() {
    return $_SESSION['usuario_id'] ?? null;
}

/**
 * Obter dados do usuário logado
 */
function getUsuarioLogado() {
    if (!estaLogado()) {
        return null;
    }

    static $usuarioCache = [];
    
    $conn = conectar();
    $id = intval($_SESSION['usuario_id']);

    if (isset($usuarioCache[$id])) {
        mysqli_close($conn);
        return $usuarioCache[$id];
    }
    
    $sql = "SELECT id, username, email, avatar, xp, nivel, tema, idioma, sfw, particulas 
            FROM usuarios WHERE id = ?";
    $result = dbSelect($conn, $sql, 'i', [$id]);
    
    if ($result && mysqli_num_rows($result) > 0) {
        $usuario = mysqli_fetch_assoc($result);
        $usuarioCache[$id] = $usuario;
        mysqli_close($conn);
        return $usuario;
    }
    
    mysqli_close($conn);
    return null;
}

/**
 * Requer login - redireciona se não logado
 */
function requerLogin() {
    if (!estaLogado()) {
        header('Location: /sitev7/login.php');
        exit;
    }
}

/**
 * Requer login para API - retorna erro JSON
 */
function requerLoginAPI() {
    if (!estaLogado()) {
        jsonError('Não autorizado. Faça login.', 401);
    }
}

/**
 * Gerar token aleatório
 */
function gerarToken($length = 64) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Fazer login do usuário
 */
function fazerLogin($usuario_id) {
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = $usuario_id;
    $_SESSION['login_time'] = time();
    $_SESSION['last_activity'] = time();
    
    // Atualizar último acesso
    $conn = conectar();
    $sql = "UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?";
    dbStatement($conn, $sql, 'i', [intval($usuario_id)]);
    mysqli_close($conn);
}

/**
 * Fazer logout
 */
function fazerLogout() {
    $_SESSION = [];
    session_destroy();
}
