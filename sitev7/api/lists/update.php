<?php
/**
 * AnimeEngine v7 - Update Progress API
 * PUT: Atualizar progresso e nota do anime
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

// Verificar login
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

// Construir UPDATE dinâmico
$updates = [];
if ($progresso !== null) {
    $updates[] = "progresso = $progresso";
}
if ($nota !== null) {
    $updates[] = "nota = $nota";
}
if ($favorito !== null) {
    $updates[] = "favorito = $favorito";
}

if (empty($updates)) {
    mysqli_close($conn);
    jsonError('Nenhum campo para atualizar');
}

$sql = "UPDATE listas_anime SET " . implode(', ', $updates) . " 
        WHERE usuario_id = $usuario_id AND anime_id = $anime_id";

if (mysqli_query($conn, $sql)) {
    if (mysqli_affected_rows($conn) > 0) {
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
