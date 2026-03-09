<?php
/**
 * AnimeEngine v7 - Affinity API
 * GET: Comparar afinidade de animes entre usuário logado e outro usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

// Requer estar logado para comparar
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

// Se estiver vendo o próprio perfil, afinidade não faz sentido, retorna 100%
if ($logged_user_id === $target_user_id) {
    jsonResponse(['affinity_percent' => 100, 'shared_count' => 0, 'shared_animes' => [], 'self' => true]);
    exit;
}

// Buscar animes do usuário logado
$sql1 = "SELECT anime_id, nota FROM listas_anime WHERE usuario_id = $logged_user_id";
$res1 = mysqli_query($conn, $sql1);
$logged_animes = [];
while ($row = mysqli_fetch_assoc($res1)) {
    $logged_animes[$row['anime_id']] = intval($row['nota']);
}

// Buscar animes do alvo
$sql2 = "SELECT la.anime_id, la.nota, ac.titulo, ac.imagem 
         FROM listas_anime la
         JOIN animes_cache ac ON la.anime_id = ac.anime_id
         WHERE la.usuario_id = $target_user_id";
$res2 = mysqli_query($conn, $sql2);

$target_animes = [];
$shared_animes = [];
$total_score_diff = 0;
$shared_count = 0;

while ($row = mysqli_fetch_assoc($res2)) {
    $aid = $row['anime_id'];
    $target_nota = intval($row['nota']);

    if (isset($logged_animes[$aid])) {
        $logged_nota = $logged_animes[$aid];
        $shared_count++;

        // Se ambos deram nota (0 significa sem nota)
        if ($logged_nota > 0 && $target_nota > 0) {
            $diff = abs($logged_nota - $target_nota);
            $total_score_diff += $diff;
        }

        // Guardar pra exibir na UI
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

// Cálculo básico de afinidade
// Se não tem animes em comum:
if ($shared_count === 0) {
    jsonResponse(['affinity_percent' => 0, 'shared_count' => 0, 'shared_animes' => []]);
    exit;
}

// Se tem compartilhados, começa com base sólida e desconta diferenças de nota
// Diferença máx de nota é 10.
$max_possible_diff = $shared_count * 10;
$affinity = 100;

if ($max_possible_diff > 0 && $total_score_diff > 0) {
    $penalty = ($total_score_diff / $max_possible_diff) * 100;
    $affinity = max(10, 100 - $penalty);
} else {
    // Se não há notas ou todas as notas são iguais
    $affinity = 100; // Afinidade perfeita na lista em comum
}

// Ajuste para quantidade (mais animes em comum = mais confiança)
if ($shared_count < 5 && $affinity == 100) {
    $affinity = 85; // Limita a 85% se tiver poucos pra comparar
}

// Ordenar animes em comum por nota combinada
usort($shared_animes, function ($a, $b) {
    return ($b['my_score'] + $b['their_score']) - ($a['my_score'] + $a['their_score']);
});

// Retorna no máximo os 10 melhores pra UI não pesar
$top_shared = array_slice($shared_animes, 0, 10);

jsonResponse([
    'affinity_percent' => round($affinity, 1),
    'shared_count' => $shared_count,
    'shared_animes' => $top_shared
]);
