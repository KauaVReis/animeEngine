<?php
/**
 * AnimeEngine v7 - Login API
 * POST: Fazer login
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/streak.php';
require_once '../../includes/rate-limit.php';
require_once '../../includes/security-log.php';
require_once '../../includes/csrf.php';

// Headers
header('Content-Type: application/json');
setCorsHeaders('POST, OPTIONS');

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

checkRateLimit('auth_login', 5, 300);
validateCsrfToken();

// Receber dados
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    jsonError('JSON inválido: ' . json_last_error_msg());
}

$email = trim($data['email'] ?? '');
$senha = $data['senha'] ?? '';

// Validações
if (empty($email)) {
    jsonError('Email é obrigatório');
}

if (empty($senha)) {
    jsonError('Senha é obrigatória');
}

// Conectar
$conn = conectar();

// Buscar usuário por email
$sql = "SELECT id, username, email, senha_hash, avatar, xp, nivel, tema, streak_atual, streak_max
        FROM usuarios WHERE email = ?";
$result = dbSelect($conn, $sql, 's', [$email]);

if (!$result) {
    mysqli_close($conn);
    jsonError('Erro ao processar solicitação', 500);
}

if (mysqli_num_rows($result) === 0) {
    mysqli_close($conn);
    logSecurityEvent('login_failed_unknown_email', null, ['email' => $email]);
    jsonError('Email ou senha incorretos');
}

$usuario = mysqli_fetch_assoc($result);

// Verificar senha
if (!password_verify($senha, $usuario['senha_hash'])) {
    mysqli_close($conn);
    logSecurityEvent('login_failed_invalid_password', $usuario['id'], ['email' => $email]);
    jsonError('Email ou senha incorretos');
}

// Fazer login (Sessão + Update Ultimo Acesso)
fazerLogin($usuario['id']);
logSecurityEvent('login_success', $usuario['id']);

mysqli_close($conn);

// Verificar e atualizar streak (usa nova conexão internamente)
$streak_result = [];
try {
    $streak_result = verificarStreak($usuario['id']);
} catch (Exception $e) {
    // Se falhar o streak, não impede o login, mas registra erro se possível
    // Por enquanto, retorna vazio ou erro controlado
    $streak_result = ['error' => 'Falha ao verificar streak'];
}

// Remover hash da resposta
unset($usuario['senha_hash']);

// Adicionar streak à resposta
if (isset($streak_result['streak'])) {
    $usuario['streak_atual'] = $streak_result['streak'];
    $usuario['streak_max'] = $streak_result['max'];
}

jsonSuccess('Login realizado com sucesso!', [
    'usuario' => $usuario,
    'streak' => $streak_result
]);

