<?php
/**
 * AnimeEngine v7 - Login API
 * POST: Fazer login
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/streak.php';

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

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
$email_escaped = escape($conn, $email);
$sql = "SELECT id, username, email, senha_hash, avatar, xp, nivel, tema, streak_atual, streak_max
        FROM usuarios WHERE email = '$email_escaped'";
$result = mysqli_query($conn, $sql);

if (!$result) {
    $error = mysqli_error($conn);
    mysqli_close($conn);
    jsonError('Erro no banco de dados: ' . $error, 500);
}

if (mysqli_num_rows($result) === 0) {
    mysqli_close($conn);
    jsonError('Email ou senha incorretos');
}

$usuario = mysqli_fetch_assoc($result);

// Verificar senha
if (!password_verify($senha, $usuario['senha_hash'])) {
    mysqli_close($conn);
    jsonError('Email ou senha incorretos');
}

// Fazer login (Sessão + Update Ultimo Acesso)
fazerLogin($usuario['id']);

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

