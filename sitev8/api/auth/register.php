<?php
/**
 * AnimeEngine v7 - Register API
 * POST: Registrar novo usuário
 */

require_once '../../includes/database.php';

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

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

// Verificar se username já existe
$username_escaped = escape($conn, $username);
$sql = "SELECT id FROM usuarios WHERE username = '$username_escaped'";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
    mysqli_close($conn);
    jsonError('Este nome de usuário já está em uso');
}

// Verificar se email já existe
$email_escaped = escape($conn, $email);
$sql = "SELECT id FROM usuarios WHERE email = '$email_escaped'";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
    mysqli_close($conn);
    jsonError('Este email já está cadastrado');
}

// Hash da senha
$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

// Inserir usuário
$sql = "INSERT INTO usuarios (username, email, senha_hash) VALUES ('$username_escaped', '$email_escaped', '$senha_hash')";

if (mysqli_query($conn, $sql)) {
    $usuario_id = mysqli_insert_id($conn);
    mysqli_close($conn);
    
    jsonSuccess('Conta criada com sucesso!', [
        'usuario_id' => $usuario_id,
        'username' => $username
    ]);
} else {
    mysqli_close($conn);
    jsonError('Erro ao criar conta. Tente novamente.');
}
