<?php
/**
 * AnimeEngine v8 - Get Títulos API (Seguro)
 * 100% Prepared Statements (mysqli + bind_param, ZERO PDO)
 * GET: Obter títulos do usuário por categorias
 */

require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

requerLoginAPI();

$conn = conectar();
$usuario_id = getUsuarioId();

// Buscar todos os títulos com status de desbloqueio para este usuário
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
    'genero' => [],
    'nivel' => [],
    'sazonal' => [],
    'secreto' => [],
    'conquista' => [],
    'radio' => []
];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $row['requisito'] = json_decode($row['requisito'] ?? '[]', true) ?: [];
        $row['desbloqueado'] = (bool) $row['desbloqueado'];
        $tipo = $row['tipo'];
        if (!isset($titulos[$tipo])) {
            $titulos[$tipo] = [];
        }
        $titulos[$tipo][] = $row;
    }
}

// Título ativo
$resultUser = secure_query($conn, "SELECT titulo_ativo FROM usuarios WHERE id = ?", "i", $usuario_id);
$user = $resultUser ? mysqli_fetch_assoc($resultUser) : null;

mysqli_close($conn);

jsonResponse([
    'titulos' => $titulos,
    'titulo_ativo' => $user['titulo_ativo'] ?? null
]);
