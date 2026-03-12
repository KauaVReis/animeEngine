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
    
    $conn = conectar();
    $id = intval($_SESSION['usuario_id']);
    
    $sql = "SELECT id, username, email, avatar, xp, nivel, tema, idioma, sfw, particulas 
            FROM usuarios WHERE id = $id";
    $result = mysqli_query($conn, $sql);
    
    if ($result && mysqli_num_rows($result) > 0) {
        $usuario = mysqli_fetch_assoc($result);
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
    $_SESSION['usuario_id'] = $usuario_id;
    
    // Atualizar último acesso
    $conn = conectar();
    $sql = "UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = " . intval($usuario_id);
    mysqli_query($conn, $sql);
    mysqli_close($conn);
}

/**
 * Fazer logout
 */
function fazerLogout() {
    $_SESSION = [];
    session_destroy();
}
