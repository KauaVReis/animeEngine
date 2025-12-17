<?php
/**
 * AnimeEngine v7 - Move Between Lists API
 * PUT: Mover anime entre listas
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
$tipo_lista = $data['tipo_lista'] ?? '';

if ($anime_id <= 0) {
    jsonError('ID do anime inválido');
}

$tipos_validos = ['watching', 'planToWatch', 'completed', 'paused', 'dropped'];
if (!in_array($tipo_lista, $tipos_validos)) {
    jsonError('Tipo de lista inválido');
}

$conn = conectar();
$usuario_id = getUsuarioId();

$sql = "UPDATE listas_anime SET tipo_lista = '$tipo_lista' 
        WHERE usuario_id = $usuario_id AND anime_id = $anime_id";

if (mysqli_query($conn, $sql)) {
    if (mysqli_affected_rows($conn) > 0) {
        mysqli_close($conn);
        jsonSuccess('Movido com sucesso!', ['tipo_lista' => $tipo_lista]);
    } else {
        mysqli_close($conn);
        jsonError('Anime não encontrado na sua lista');
    }
} else {
    mysqli_close($conn);
    jsonError('Erro ao mover anime');
}
