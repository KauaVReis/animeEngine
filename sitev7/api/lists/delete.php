<?php
/**
 * AnimeEngine v7 - Delete from List API
 * DELETE: Remover anime da lista do usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

// Verificar login
requerLoginAPI();

// Receber dados
$data = json_decode(file_get_contents('php://input'), true);
$anime_id = intval($data['anime_id'] ?? ($_POST['anime_id'] ?? 0));

if ($anime_id <= 0) {
    jsonError('ID do anime inválido');
}

$conn = conectar();
$usuario_id = getUsuarioId();

$sql = "DELETE FROM listas_anime WHERE usuario_id = $usuario_id AND anime_id = $anime_id";

if (mysqli_query($conn, $sql)) {
    mysqli_close($conn);
    jsonSuccess('Anime removido da lista!', ['anime_id' => $anime_id]);
} else {
    mysqli_close($conn);
    jsonError('Erro ao remover anime da lista');
}
