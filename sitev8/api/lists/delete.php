<?php
/**
 * AnimeEngine v8 - Delete from List API (Seguro)
 * DELETE: Remover anime da lista do usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/rate_limiter.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

verificar_rate_limit();
requerLoginAPI();

// Receber dados
$data = json_decode(file_get_contents('php://input'), true);
$anime_id = intval($data['anime_id'] ?? ($_POST['anime_id'] ?? 0));

if ($anime_id <= 0) {
    jsonError('ID do anime inválido');
}

$conn = conectar();
$usuario_id = getUsuarioId();

// DELETE — PREPARED STATEMENT
$stmt = secure_query(
    $conn,
    "DELETE FROM listas_anime WHERE usuario_id = ? AND anime_id = ?",
    "ii",
    $usuario_id, $anime_id
);

if ($stmt) {
    mysqli_close($conn);
    jsonSuccess('Anime removido da lista!', ['anime_id' => $anime_id]);
} else {
    mysqli_close($conn);
    jsonError('Erro ao remover anime da lista');
}
