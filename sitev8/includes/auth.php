<?php
/**
 * AnimeEngine v8 - Authentication Helper
 * Sessões seguras + Funções de autenticação
 */

// ============================================================
// CONFIGURAÇÃO DE SESSÃO SEGURA
// ============================================================

// Configurar cookies de sessão ANTES de session_start()
if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    
    session_set_cookie_params([
        'lifetime' => 0,           // Sessão expira ao fechar browser
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps,    // Só HTTPS em produção
        'httponly'  => true,        // JS não pode acessar o cookie
        'samesite' => 'Strict'     // Proteção CSRF nativa
    ]);
    
    session_start();
}

// Timeout de sessão: 2 horas de inatividade
define('SESSION_TIMEOUT', 7200);

if (isset($_SESSION['last_activity'])) {
    if (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT) {
        // Sessão expirou por inatividade
        $_SESSION = [];
        session_destroy();
        
        // Reiniciar sessão limpa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
}
$_SESSION['last_activity'] = time();

require_once __DIR__ . '/database.php';

// ============================================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================================

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
 * Obter dados do usuário logado (usando prepared statement)
 */
function getUsuarioLogado() {
    if (!estaLogado()) {
        return null;
    }
    
    $conn = conectar();
    $id = intval($_SESSION['usuario_id']);
    
    $result = secure_query(
        $conn,
        "SELECT id, username, email, avatar, xp, nivel, tema, idioma, sfw, particulas 
         FROM usuarios WHERE id = ?",
        "i",
        $id
    );
    
    if ($result && mysqli_num_rows($result) > 0) {
        $usuario = mysqli_fetch_assoc($result);
        mysqli_close($conn);
        return $usuario;
    }
    
    mysqli_close($conn);
    return null;
}

// ============================================================
// AÇÕES DE LOGIN / LOGOUT
// ============================================================

/**
 * Requer login - redireciona se não logado
 */
function requerLogin() {
    if (!estaLogado()) {
        header('Location: ?page=login');
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
 * Fazer login do usuário (com regeneração de sessão)
 */
function fazerLogin($usuario_id) {
    // Regenerar Session ID para prevenir Session Fixation
    session_regenerate_id(true);
    
    $_SESSION['usuario_id'] = $usuario_id;
    $_SESSION['last_activity'] = time();
    $_SESSION['ip'] = $_SERVER['REMOTE_ADDR'];
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // Atualizar último acesso (com prepared statement)
    $conn = conectar();
    secure_query($conn, "UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?", "i", $usuario_id);
    mysqli_close($conn);
}

/**
 * Fazer logout
 */
function fazerLogout() {
    $_SESSION = [];
    
    // Destruir cookie de sessão
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    
    session_destroy();
}
