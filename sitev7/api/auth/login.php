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
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

// Receber dados
$data = json_decode(file_get_contents('php://input'), true);

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

// Fazer login
fazerLogin($usuario['id']);

// Atualizar último acesso
$sql = "UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = " . $usuario['id'];
mysqli_query($conn, $sql);

mysqli_close($conn);

// Verificar e atualizar streak
$streak_result = verificarStreak($usuario['id']);

// Remover hash da resposta
unset($usuario['senha_hash']);

// Adicionar streak à resposta
$usuario['streak_atual'] = $streak_result['streak'];
$usuario['streak_max'] = $streak_result['max'];

jsonSuccess('Login realizado com sucesso!', [
    'usuario' => $usuario,
    'streak' => $streak_result
]);

