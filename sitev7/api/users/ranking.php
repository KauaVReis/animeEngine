<?php
/**
 * AnimeEngine v7 - Ranking Global API
 * GET: Top usuários por XP
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

$conn = conectar();
$limite = min(intval($_GET['limit'] ?? 100), 100);

// Top usuários por XP
$sql = "SELECT id, username, xp, nivel, 
        (SELECT COUNT(*) FROM listas_anime WHERE usuario_id = u.id AND tipo_lista = 'completed') as completos
        FROM usuarios u
        WHERE perfil_publico = 1
        ORDER BY xp DESC
        LIMIT $limite";

$result = mysqli_query($conn, $sql);
$ranking = [];
$posicao = 1;

while ($row = mysqli_fetch_assoc($result)) {
    $row['posicao'] = $posicao++;
    $ranking[] = $row;
}

// Posição do usuário logado
$minha_posicao = null;
if (estaLogado()) {
    $usuario_id = getUsuarioId();
    $sql = "SELECT COUNT(*) + 1 as posicao FROM usuarios WHERE xp > (SELECT xp FROM usuarios WHERE id = $usuario_id)";
    $result = mysqli_query($conn, $sql);
    $minha_posicao = mysqli_fetch_assoc($result)['posicao'];
}

mysqli_close($conn);

jsonResponse([
    'ranking' => $ranking,
    'minha_posicao' => $minha_posicao
]);
