<?php
/**
 * AnimeEngine v7 - Get Achievements API
 * GET: Obter conquistas do usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

requerLoginAPI();

$conn = conectar();
$usuario_id = getUsuarioId();

// Buscar badges desbloqueados
$sql = "SELECT badge_id, desbloqueado_em FROM conquistas WHERE usuario_id = $usuario_id";
$result = mysqli_query($conn, $sql);

$unlocked = [];
while ($row = mysqli_fetch_assoc($result)) {
    $unlocked[$row['badge_id']] = $row['desbloqueado_em'];
}

mysqli_close($conn);

jsonResponse([
    'unlocked' => $unlocked,
    'count' => count($unlocked)
]);
