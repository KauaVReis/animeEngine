<?php
/**
 * AnimeEngine v8 - User Stats API (Seguro)
 * GET: Estatísticas do usuário
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

// Contagem por tipo de lista
$stats = [
    'watching' => 0, 'planToWatch' => 0, 'completed' => 0,
    'paused' => 0, 'dropped' => 0, 'totalAnimes' => 0,
    'totalEpisodes' => 0, 'totalHours' => 0, 'favorites' => 0,
    'genres' => [], 'achievements' => 0
];

// Contar animes por lista — PREPARED
$result = secure_query($conn, "SELECT tipo_lista, COUNT(*) as count FROM listas_anime WHERE usuario_id = ? GROUP BY tipo_lista", "i", $usuario_id);
while ($row = mysqli_fetch_assoc($result)) {
    $stats[$row['tipo_lista']] = intval($row['count']);
}
$stats['totalAnimes'] = $stats['watching'] + $stats['planToWatch'] + $stats['completed'] + $stats['paused'] + $stats['dropped'];

// Episódios assistindo — PREPARED
$result = secure_query($conn, "SELECT SUM(progresso) as total FROM listas_anime WHERE usuario_id = ? AND tipo_lista = 'watching'", "i", $usuario_id);
$row = mysqli_fetch_assoc($result);
$watchingEps = intval($row['total'] ?? 0);

// Episódios completos — PREPARED
$result = secure_query($conn, "SELECT SUM(ac.episodios) as total FROM listas_anime la JOIN animes_cache ac ON la.anime_id = ac.anime_id WHERE la.usuario_id = ? AND la.tipo_lista = 'completed'", "i", $usuario_id);
$row = mysqli_fetch_assoc($result);
$completedEps = intval($row['total'] ?? 0);

$stats['totalEpisodes'] = $watchingEps + $completedEps;
$stats['totalHours'] = round($stats['totalEpisodes'] * 24 / 60);

// Favoritos — PREPARED
$result = secure_query($conn, "SELECT COUNT(*) as count FROM listas_anime WHERE usuario_id = ? AND favorito = 1", "i", $usuario_id);
$row = mysqli_fetch_assoc($result);
$stats['favorites'] = intval($row['count']);

// Gêneros — PREPARED
$result = secure_query($conn, "SELECT ac.generos FROM listas_anime la JOIN animes_cache ac ON la.anime_id = ac.anime_id WHERE la.usuario_id = ?", "i", $usuario_id);
$genreCount = [];
while ($row = mysqli_fetch_assoc($result)) {
    $genres = json_decode($row['generos'], true) ?: [];
    foreach ($genres as $genre) {
        $genreCount[$genre] = ($genreCount[$genre] ?? 0) + 1;
    }
}
arsort($genreCount);
$stats['genres'] = array_slice($genreCount, 0, 10, true);

// Conquistas — PREPARED
$result = secure_query($conn, "SELECT COUNT(*) as count FROM conquistas WHERE usuario_id = ?", "i", $usuario_id);
$row = mysqli_fetch_assoc($result);
$stats['achievements'] = intval($row['count']);

// Dados do usuário — PREPARED
$result = secure_query($conn, "SELECT username, xp, nivel FROM usuarios WHERE id = ?", "i", $usuario_id);
$user = mysqli_fetch_assoc($result);
$stats['username'] = $user['username'];
$stats['xp'] = intval($user['xp']);
$stats['level'] = intval($user['nivel']);

mysqli_close($conn);
jsonResponse($stats);
