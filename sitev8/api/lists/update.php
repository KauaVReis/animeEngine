<?php
/**
 * AnimeEngine v8 - Update Progress API (Seguro)
 * PUT: Atualizar progresso e nota do anime
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/rate_limiter.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

verificar_rate_limit();
requerLoginAPI();

// Receber dados
$data = json_decode(file_get_contents('php://input'), true);

$anime_id = intval($data['anime_id'] ?? 0);
$progresso = isset($data['progresso']) ? intval($data['progresso']) : null;
$nota = isset($data['nota']) ? intval($data['nota']) : null;
$favorito = isset($data['favorito']) ? intval($data['favorito']) : null;

if ($anime_id <= 0) {
    jsonError('ID do anime inválido');
}

$conn = conectar();
$usuario_id = getUsuarioId();

// Construir UPDATE dinâmico com prepared statements
$sets = [];
$types = '';
$params = [];

if ($progresso !== null) {
    $sets[] = "progresso = ?";
    $types .= "i";
    $params[] = $progresso;
}
if ($nota !== null) {
    $sets[] = "nota = ?";
    $types .= "i";
    $params[] = $nota;
}
if ($favorito !== null) {
    $sets[] = "favorito = ?";
    $types .= "i";
    $params[] = $favorito;
}

if (empty($sets)) {
    mysqli_close($conn);
    jsonError('Nenhum campo para atualizar');
}

// Adicionar WHERE params
$types .= "ii";
$params[] = $usuario_id;
$params[] = $anime_id;

$sql = "UPDATE listas_anime SET " . implode(', ', $sets) . " WHERE usuario_id = ? AND anime_id = ?";
$stmt = secure_query($conn, $sql, $types, ...$params);

if ($stmt) {
    $affected = ($stmt instanceof mysqli_stmt) ? mysqli_stmt_affected_rows($stmt) : mysqli_affected_rows($conn);
    if ($affected > 0) {
        mysqli_close($conn);
        jsonSuccess('Atualizado com sucesso!');
    } else {
        mysqli_close($conn);
        jsonError('Anime não encontrado na sua lista');
    }
} else {
    mysqli_close($conn);
    jsonError('Erro ao atualizar');
}
