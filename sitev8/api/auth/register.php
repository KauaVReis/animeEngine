<?php
/**
 * AnimeEngine v8 - Register API
 * POST: Registrar novo usuário (Seguro)
 */

require_once '../../includes/database.php';
require_once '../../includes/rate_limiter.php';

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

// Rate limiting restrito para auth (10 req/min)
verificar_rate_limit_auth();

// Receber dados
$data = json_decode(file_get_contents('php://input'), true);

$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$senha = $data['senha'] ?? '';

// Validações
if (empty($username)) {
    jsonError('Nome de usuário é obrigatório');
}

if (strlen($username) < 3 || strlen($username) > 50) {
    jsonError('Nome de usuário deve ter entre 3 e 50 caracteres');
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    jsonError('Nome de usuário só pode conter letras, números e underscore');
}

if (empty($email)) {
    jsonError('Email é obrigatório');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Email inválido');
}

if (empty($senha)) {
    jsonError('Senha é obrigatória');
}

if (strlen($senha) < 6) {
    jsonError('Senha deve ter no mínimo 6 caracteres');
}

// Conectar
$conn = conectar();

// Verificar se username já existe — PREPARED STATEMENT
$result = secure_query($conn, "SELECT id FROM usuarios WHERE username = ?", "s", $username);

if (mysqli_num_rows($result) > 0) {
    mysqli_close($conn);
    jsonError('Este nome de usuário já está em uso');
}

// Verificar se email já existe — PREPARED STATEMENT
$result = secure_query($conn, "SELECT id FROM usuarios WHERE email = ?", "s", $email);

if (mysqli_num_rows($result) > 0) {
    mysqli_close($conn);
    jsonError('Este email já está cadastrado');
}

// Hash da senha
$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

// Inserir usuário — PREPARED STATEMENT
$stmt = secure_query(
    $conn,
    "INSERT INTO usuarios (username, email, senha_hash) VALUES (?, ?, ?)",
    "sss",
    $username,
    $email,
    $senha_hash
);

if ($stmt) {
    $usuario_id = last_insert_id($conn);
    mysqli_close($conn);
    
    jsonSuccess('Conta criada com sucesso!', [
        'usuario_id' => $usuario_id,
        'username' => $username
    ]);
} else {
    mysqli_close($conn);
    jsonError('Erro ao criar conta. Tente novamente.');
}
