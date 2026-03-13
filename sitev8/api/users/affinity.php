<?php
/**
 * AnimeEngine v8 - Affinity API (Seguro)
 * GET: Comparar afinidade de animes entre usuário logado e outro usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

if (!estaLogado()) {
    jsonResponse(['affinity_percent' => 0, 'shared_count' => 0, 'shared_animes' => [], 'guest' => true]);
    exit;
}

if (!isset($_GET['user_id']) || !is_numeric($_GET['user_id'])) {
    jsonError('ID de usuário inválido');
}

$conn = conectar();
$logged_user_id = getUsuarioId();
$target_user_id = intval($_GET['user_id']);

if ($logged_user_id === $target_user_id) {
    jsonResponse(['affinity_percent' => 100, 'shared_count' => 0, 'shared_animes' => [], 'self' => true]);
    exit;
}

// Animes do usuário logado — PREPARED
$result = secure_query($conn, "SELECT anime_id, nota FROM listas_anime WHERE usuario_id = ?", "i", $logged_user_id);
$logged_animes = [];
while ($row = mysqli_fetch_assoc($result)) {
    $logged_animes[$row['anime_id']] = intval($row['nota']);
}

// Animes do alvo — PREPARED
$result = secure_query(
    $conn,
    "SELECT la.anime_id, la.nota, ac.titulo, ac.imagem 
     FROM listas_anime la
     JOIN animes_cache ac ON la.anime_id = ac.anime_id
     WHERE la.usuario_id = ?",
    "i",
    $target_user_id
);

$shared_animes = [];
$total_score_diff = 0;
$shared_count = 0;

while ($row = mysqli_fetch_assoc($result)) {
    $aid = $row['anime_id'];
    $target_nota = intval($row['nota']);

    if (isset($logged_animes[$aid])) {
        $logged_nota = $logged_animes[$aid];
        $shared_count++;

        if ($logged_nota > 0 && $target_nota > 0) {
            $diff = abs($logged_nota - $target_nota);
            $total_score_diff += $diff;
        }

        $shared_animes[] = [
            'id' => $aid,
            'titulo' => $row['titulo'],
            'imagem' => $row['imagem'],
            'my_score' => $logged_nota,
            'their_score' => $target_nota
        ];
    }
}

mysqli_close($conn);

if ($shared_count === 0) {
    jsonResponse(['affinity_percent' => 0, 'shared_count' => 0, 'shared_animes' => []]);
    exit;
}

$max_possible_diff = $shared_count * 10;
$affinity = 100;

if ($max_possible_diff > 0 && $total_score_diff > 0) {
    $penalty = ($total_score_diff / $max_possible_diff) * 100;
    $affinity = max(10, 100 - $penalty);
}

if ($shared_count < 5 && $affinity == 100) {
    $affinity = 85;
}

usort($shared_animes, function ($a, $b) {
    return ($b['my_score'] + $b['their_score']) - ($a['my_score'] + $a['their_score']);
});

$top_shared = array_slice($shared_animes, 0, 10);

jsonResponse([
    'affinity_percent' => round($affinity, 1),
    'shared_count' => $shared_count,
    'shared_animes' => $top_shared
]);
