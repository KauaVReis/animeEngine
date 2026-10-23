<?php
/**
 * AnimeEngine v8 - User Stats API (Aprimorada & Segura)
 * 100% Prepared Statements (mysqli + bind_param, ZERO PDO)
 * GET: Estatísticas analíticas completas do usuário
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

// Estrutura padrão de resposta
$stats = [
    'watching' => 0,
    'planToWatch' => 0,
    'completed' => 0,
    'paused' => 0,
    'dropped' => 0,
    'totalAnimes' => 0,
    'totalEpisodes' => 0,
    'totalHours' => 0,
    'daysWatched' => 0,
    'favorites' => 0,
    'meanScore' => 0,
    'totalRated' => 0,
    'scoreDistribution' => array_fill(1, 10, 0),
    'genres' => [],
    'formats' => [],
    'topRated' => [],
    'achievements' => 0,
    'username' => '',
    'xp' => 0,
    'level' => 1
];

// 1. Contagem por status de lista — PREPARED
$result = secure_query(
    $conn,
    "SELECT tipo_lista, COUNT(*) as count FROM listas_anime WHERE usuario_id = ? GROUP BY tipo_lista",
    "i",
    $usuario_id
);
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $stats[$row['tipo_lista']] = intval($row['count']);
    }
}
$stats['totalAnimes'] = $stats['watching'] + $stats['planToWatch'] + $stats['completed'] + $stats['paused'] + $stats['dropped'];

// 2. Episódios assistidos e tempo total — PREPARED
$resultWatching = secure_query($conn, "SELECT SUM(progresso) as total FROM listas_anime WHERE usuario_id = ? AND tipo_lista != 'completed'", "i", $usuario_id);
$rowW = $resultWatching ? mysqli_fetch_assoc($resultWatching) : null;
$watchingEps = intval($rowW['total'] ?? 0);

$resultCompleted = secure_query(
    $conn,
    "SELECT SUM(COALESCE(ac.episodios, la.progresso, 12)) as total 
     FROM listas_anime la 
     LEFT JOIN animes_cache ac ON la.anime_id = ac.anime_id 
     WHERE la.usuario_id = ? AND la.tipo_lista = 'completed'",
    "i",
    $usuario_id
);
$rowC = $resultCompleted ? mysqli_fetch_assoc($resultCompleted) : null;
$completedEps = intval($rowC['total'] ?? 0);

$stats['totalEpisodes'] = $watchingEps + $completedEps;
$stats['totalHours'] = round(($stats['totalEpisodes'] * 24) / 60, 1);
$stats['daysWatched'] = round($stats['totalHours'] / 24, 1);

// 3. Favoritos — PREPARED
$resultFav = secure_query($conn, "SELECT COUNT(*) as count FROM listas_anime WHERE usuario_id = ? AND favorito = 1", "i", $usuario_id);
if ($resultFav && $rowF = mysqli_fetch_assoc($resultFav)) {
    $stats['favorites'] = intval($rowF['count']);
}

// 4. Média de Avaliações e Distribuição de Notas (1 a 10) — PREPARED
$resultAvg = secure_query(
    $conn,
    "SELECT AVG(nota) as media, COUNT(nota) as total FROM listas_anime WHERE usuario_id = ? AND nota > 0",
    "i",
    $usuario_id
);
if ($resultAvg && $rowA = mysqli_fetch_assoc($resultAvg)) {
    $stats['meanScore'] = round(floatval($rowA['media'] ?? 0), 1);
    $stats['totalRated'] = intval($rowA['total'] ?? 0);
}

$resultScores = secure_query(
    $conn,
    "SELECT nota, COUNT(*) as count FROM listas_anime WHERE usuario_id = ? AND nota BETWEEN 1 AND 10 GROUP BY nota ORDER BY nota ASC",
    "i",
    $usuario_id
);
if ($resultScores) {
    while ($rowS = mysqli_fetch_assoc($resultScores)) {
        $n = intval($rowS['nota']);
        if ($n >= 1 && $n <= 10) {
            $stats['scoreDistribution'][$n] = intval($rowS['count']);
        }
    }
}

// 5. Gêneros Favoritos — PREPARED
$resultGenres = secure_query(
    $conn,
    "SELECT ac.generos FROM listas_anime la JOIN animes_cache ac ON la.anime_id = ac.anime_id WHERE la.usuario_id = ?",
    "i",
    $usuario_id
);
$genreCount = [];
if ($resultGenres) {
    while ($rowG = mysqli_fetch_assoc($resultGenres)) {
        $genres = json_decode($rowG['generos'] ?? '[]', true) ?: [];
        foreach ($genres as $genre) {
            $genreCount[$genre] = ($genreCount[$genre] ?? 0) + 1;
        }
    }
}
arsort($genreCount);
$stats['genres'] = array_slice($genreCount, 0, 8, true);

// 6. Distribuição por Formato (TV, MOVIE, OVA, etc.) — PREPARED
$resultFormats = secure_query(
    $conn,
    "SELECT ac.formato, COUNT(*) as count 
     FROM listas_anime la 
     JOIN animes_cache ac ON la.anime_id = ac.anime_id 
     WHERE la.usuario_id = ? AND ac.formato IS NOT NULL AND ac.formato != '' 
     GROUP BY ac.formato 
     ORDER BY count DESC",
    "i",
    $usuario_id
);
if ($resultFormats) {
    while ($rowForm = mysqli_fetch_assoc($resultFormats)) {
        $fmt = strtoupper($rowForm['formato']);
        $stats['formats'][$fmt] = intval($rowForm['count']);
    }
}

// 7. Top Animes Avaliados do Usuário (Até 6) — PREPARED
$resultTop = secure_query(
    $conn,
    "SELECT la.anime_id, la.nota, ac.titulo, ac.imagem, ac.formato 
     FROM listas_anime la 
     JOIN animes_cache ac ON la.anime_id = ac.anime_id 
     WHERE la.usuario_id = ? AND la.nota > 0 
     ORDER BY la.nota DESC, la.atualizado_em DESC 
     LIMIT 6",
    "i",
    $usuario_id
);
if ($resultTop) {
    while ($rowT = mysqli_fetch_assoc($resultTop)) {
        $stats['topRated'][] = [
            'anime_id' => intval($rowT['anime_id']),
            'nota'     => intval($rowT['nota']),
            'titulo'   => $rowT['titulo'],
            'imagem'   => $rowT['imagem'],
            'formato'  => $rowT['formato'] ?? 'TV'
        ];
    }
}

// 8. Conquistas desbloqueadas — PREPARED
$resultAch = secure_query($conn, "SELECT COUNT(*) as count FROM usuarios_conquistas WHERE usuario_id = ?", "i", $usuario_id);
if ($resultAch && $rowAch = mysqli_fetch_assoc($resultAch)) {
    $stats['achievements'] = intval($rowAch['count'] ?? 0);
}

// 9. Dados do Usuário — PREPARED
$resultUser = secure_query($conn, "SELECT username, xp, nivel FROM usuarios WHERE id = ?", "i", $usuario_id);
if ($resultUser && $rowU = mysqli_fetch_assoc($resultUser)) {
    $stats['username'] = $rowU['username'] ?? '';
    $stats['xp'] = intval($rowU['xp'] ?? 0);
    $stats['level'] = intval($rowU['nivel'] ?? 1);
}

mysqli_close($conn);

jsonResponse($stats);
