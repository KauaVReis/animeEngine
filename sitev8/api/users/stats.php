<?php
/**
 * AnimeEngine v7 - User Stats API
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
    'watching' => 0,
    'planToWatch' => 0,
    'completed' => 0,
    'paused' => 0,
    'dropped' => 0,
    'totalAnimes' => 0,
    'totalEpisodes' => 0,
    'totalHours' => 0,
    'favorites' => 0,
    'genres' => [],
    'achievements' => 0
];

// Contar animes por lista
$sql = "SELECT tipo_lista, COUNT(*) as count FROM listas_anime WHERE usuario_id = $usuario_id GROUP BY tipo_lista";
$result = mysqli_query($conn, $sql);
while ($row = mysqli_fetch_assoc($result)) {
    $stats[$row['tipo_lista']] = intval($row['count']);
}
$stats['totalAnimes'] = $stats['watching'] + $stats['planToWatch'] + $stats['completed'] + $stats['paused'] + $stats['dropped'];

// Contar episódios assistidos
$sql = "SELECT SUM(progresso) as total FROM listas_anime WHERE usuario_id = $usuario_id AND tipo_lista = 'watching'";
$result = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($result);
$watchingEps = intval($row['total'] ?? 0);

// Episódios de completos
$sql = "SELECT SUM(ac.episodios) as total 
        FROM listas_anime la 
        JOIN animes_cache ac ON la.anime_id = ac.anime_id 
        WHERE la.usuario_id = $usuario_id AND la.tipo_lista = 'completed'";
$result = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($result);
$completedEps = intval($row['total'] ?? 0);

$stats['totalEpisodes'] = $watchingEps + $completedEps;
$stats['totalHours'] = round($stats['totalEpisodes'] * 24 / 60);

// Favoritos
$sql = "SELECT COUNT(*) as count FROM listas_anime WHERE usuario_id = $usuario_id AND favorito = 1";
$result = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($result);
$stats['favorites'] = intval($row['count']);

// Gêneros mais assistidos
$sql = "SELECT ac.generos FROM listas_anime la 
        JOIN animes_cache ac ON la.anime_id = ac.anime_id 
        WHERE la.usuario_id = $usuario_id";
$result = mysqli_query($conn, $sql);

$genreCount = [];
while ($row = mysqli_fetch_assoc($result)) {
    $genres = json_decode($row['generos'], true) ?: [];
    foreach ($genres as $genre) {
        $genreCount[$genre] = ($genreCount[$genre] ?? 0) + 1;
    }
}
arsort($genreCount);
$stats['genres'] = array_slice($genreCount, 0, 10, true);

// Conquistas
$sql = "SELECT COUNT(*) as count FROM conquistas WHERE usuario_id = $usuario_id";
$result = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($result);
$stats['achievements'] = intval($row['count']);

// Dados do usuário
$sql = "SELECT username, xp, nivel FROM usuarios WHERE id = $usuario_id";
$result = mysqli_query($conn, $sql);
$user = mysqli_fetch_assoc($result);
$stats['username'] = $user['username'];
$stats['xp'] = intval($user['xp']);
$stats['level'] = intval($user['nivel']);

mysqli_close($conn);

jsonResponse($stats);
