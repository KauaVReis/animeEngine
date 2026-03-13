<?php
/**
 * AnimeEngine v8 - Get Títulos API (Seguro)
 * GET: Obter títulos do usuário
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

// Buscar todos os títulos — PREPARED
$result = secure_query(
    $conn,
    "SELECT t.*, 
    CASE WHEN ut.usuario_id IS NOT NULL THEN 1 ELSE 0 END as desbloqueado,
    ut.desbloqueado_em
    FROM titulos t
    LEFT JOIN usuarios_titulos ut ON t.id = ut.titulo_id AND ut.usuario_id = ?
    ORDER BY t.tipo, t.id",
    "i",
    $usuario_id
);

$titulos = [
    'genero' => [], 'nivel' => [], 'sazonal' => [],
    'secreto' => [], 'conquista' => []
];

while ($row = mysqli_fetch_assoc($result)) {
    $row['requisito'] = json_decode($row['requisito'], true);
    $row['desbloqueado'] = (bool) $row['desbloqueado'];
    $titulos[$row['tipo']][] = $row;
}

// Título ativo — PREPARED
$result = secure_query($conn, "SELECT titulo_ativo FROM usuarios WHERE id = ?", "i", $usuario_id);
$user = mysqli_fetch_assoc($result);

mysqli_close($conn);

jsonResponse([
    'titulos' => $titulos,
    'titulo_ativo' => $user['titulo_ativo']
]);
