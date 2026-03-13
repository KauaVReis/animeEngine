<?php
/**
 * AnimeEngine v8 - Follow/Unfollow API (Seguro)
 * POST: Seguir/Deixar de seguir usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/rate_limiter.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

verificar_rate_limit();
requerLoginAPI();

$data = json_decode(file_get_contents('php://input'), true);
$target_id = intval($data['user_id'] ?? 0);
$action = $data['action'] ?? 'follow';

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

// Verificar se usuário existe — PREPARED STATEMENT
$result = secure_query($conn, "SELECT id, perfil_publico FROM usuarios WHERE id = ?", "i", $target_id);
if (!$result || mysqli_num_rows($result) === 0) {
    mysqli_close($conn);
    jsonError('Usuário não encontrado', 404);
}

if ($action === 'follow') {
    // INSERT IGNORE — PREPARED STATEMENT
    secure_query(
        $conn,
        "INSERT IGNORE INTO seguidores (seguidor_id, seguindo_id) VALUES (?, ?)",
        "ii",
        $usuario_id, $target_id
    );
    $message = 'Você está seguindo este usuário!';
} else {
    // DELETE — PREPARED STATEMENT
    secure_query(
        $conn,
        "DELETE FROM seguidores WHERE seguidor_id = ? AND seguindo_id = ?",
        "ii",
        $usuario_id, $target_id
    );
    $message = 'Você deixou de seguir este usuário';
}

// Contar seguidores — PREPARED STATEMENT
$result = secure_query($conn, "SELECT COUNT(*) as count FROM seguidores WHERE seguindo_id = ?", "i", $target_id);
$seguidores = mysqli_fetch_assoc($result)['count'];

mysqli_close($conn);

jsonSuccess($message, [
    'seguidores' => intval($seguidores),
    'seguindo' => $action === 'follow'
]);
