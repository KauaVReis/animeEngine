<?php
/**
 * AnimeEngine v7 - Get Lists API
 * GET: Obter todas as listas do usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

// Verificar login
requerLoginAPI();

$conn = conectar();
$usuario_id = getUsuarioId();

// Buscar todos os animes do usuário com dados do cache
$sql = "SELECT 
            la.anime_id as id,
            la.tipo_lista,
            la.progresso,
            la.nota as user_rating,
            la.favorito,
            la.adicionado_em,
            la.atualizado_em,
            ac.titulo as title,
            ac.imagem as image,
            ac.episodios as episodes,
            ac.nota as score,
            ac.status,
            ac.generos as genres,
            ac.trailer,
            ac.ano as year
        FROM listas_anime la
        JOIN animes_cache ac ON la.anime_id = ac.anime_id
        WHERE la.usuario_id = $usuario_id
        ORDER BY la.atualizado_em DESC";

$result = mysqli_query($conn, $sql);

// Organizar por tipo de lista
$lists = [
    'watching' => [],
    'planToWatch' => [],
    'completed' => [],
    'paused' => [],
    'dropped' => [],
    'favorites' => []
];

while ($row = mysqli_fetch_assoc($result)) {
    // Decodificar JSON
    $row['genres'] = json_decode($row['genres'], true) ?: [];
    
    // Renomear para compatibilidade com frontend
    $anime = [
        'id' => intval($row['id']),
        'title' => $row['title'],
        'image' => $row['image'],
        'episodes' => intval($row['episodes']),
        'score' => floatval($row['score']),
        'status' => $row['status'],
        'genres' => $row['genres'],
        'trailer' => $row['trailer'],
        'year' => intval($row['year']),
        'progress' => intval($row['progresso']),
        'rating' => intval($row['user_rating']),
        'addedAt' => $row['adicionado_em'],
        'updatedAt' => $row['atualizado_em']
    ];
    
    // Adicionar à lista correspondente
    $lists[$row['tipo_lista']][] = $anime;
    
    // Se for favorito, adicionar também à lista de favoritos
    if ($row['favorito']) {
        $lists['favorites'][] = $anime;
    }
}

mysqli_close($conn);

jsonResponse($lists);
