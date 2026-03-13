<?php
/**
 * AnimeEngine v8 - Move Between Lists API (Seguro)
 * PUT: Mover anime entre listas
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

// Se for para 'completed', atualizar progresso para o total — PREPARED STATEMENT
if ($tipo_lista === 'completed') {
    // Buscar total de episódios do cache
    $result = secure_query(
        $conn,
        "SELECT ac.episodios FROM animes_cache ac 
         JOIN listas_anime la ON la.anime_id = ac.anime_id 
         WHERE la.usuario_id = ? AND la.anime_id = ?",
        "ii",
        $usuario_id, $anime_id
    );
    
    $eps = 0;
    if ($result && $row = mysqli_fetch_assoc($result)) {
        $eps = intval($row['episodios']);
    }
    
    $stmt = secure_query(
        $conn,
        "UPDATE listas_anime SET tipo_lista = ?, progresso = ? WHERE usuario_id = ? AND anime_id = ?",
        "siii",
        $tipo_lista, $eps, $usuario_id, $anime_id
    );
} else {
    $stmt = secure_query(
        $conn,
        "UPDATE listas_anime SET tipo_lista = ? WHERE usuario_id = ? AND anime_id = ?",
        "sii",
        $tipo_lista, $usuario_id, $anime_id
    );
}

if ($stmt) {
    $affected = ($stmt instanceof mysqli_stmt) ? mysqli_stmt_affected_rows($stmt) : mysqli_affected_rows($conn);
    if ($affected > 0) {
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
