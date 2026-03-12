<?php
/**
 * AnimeEngine v7 - Follow/Unfollow API
 * POST: Seguir/Deixar de seguir usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

requerLoginAPI();

$data = json_decode(file_get_contents('php://input'), true);
$target_id = intval($data['user_id'] ?? 0);
$action = $data['action'] ?? 'follow'; // 'follow' ou 'unfollow'

if ($target_id <= 0) {
    jsonError('ID de usuário inválido');
}

$conn = conectar();
$usuario_id = getUsuarioId();

// Não pode seguir a si mesmo
if ($target_id === $usuario_id) {
    mysqli_close($conn);
    jsonError('Você não pode seguir a si mesmo');
}

// Verificar se usuário existe
$sql = "SELECT id, perfil_publico FROM usuarios WHERE id = $target_id";
$result = mysqli_query($conn, $sql);
if (mysqli_num_rows($result) === 0) {
    mysqli_close($conn);
    jsonError('Usuário não encontrado', 404);
}

if ($action === 'follow') {
    $sql = "INSERT IGNORE INTO seguidores (seguidor_id, seguindo_id) VALUES ($usuario_id, $target_id)";
    mysqli_query($conn, $sql);
    $message = 'Você está seguindo este usuário!';
} else {
    $sql = "DELETE FROM seguidores WHERE seguidor_id = $usuario_id AND seguindo_id = $target_id";
    mysqli_query($conn, $sql);
    $message = 'Você deixou de seguir este usuário';
}

// Contar seguidores
$sql = "SELECT COUNT(*) as count FROM seguidores WHERE seguindo_id = $target_id";
$result = mysqli_query($conn, $sql);
$seguidores = mysqli_fetch_assoc($result)['count'];

mysqli_close($conn);

jsonSuccess($message, [
    'seguidores' => intval($seguidores),
    'seguindo' => $action === 'follow'
]);
