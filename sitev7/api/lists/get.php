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
            la.anime_id,
            la.tipo_lista,
            la.progresso,
            la.nota,
            la.favorito,
            la.adicionado_em,
            la.atualizado_em,
            ac.titulo,
            ac.imagem,
            ac.episodios,
            ac.nota as nota_anime,
            ac.status,
            ac.generos,
            ac.trailer,
            ac.ano
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
    $anime = [
        'anime_id' => intval($row['anime_id']),
        'titulo' => $row['titulo'],
        'imagem' => $row['imagem'],
        'episodios_total' => intval($row['episodios']),
        'progresso' => intval($row['progresso']),
        'nota' => intval($row['nota']),
        'nota_anime' => floatval($row['nota_anime']),
        'status' => $row['status'],
        'adicionado_em' => $row['adicionado_em'],
        'atualizado_em' => $row['atualizado_em']
    ];
    
    // Adicionar à lista correspondente
    $tipo = $row['tipo_lista'];
    if (isset($lists[$tipo])) {
        $lists[$tipo][] = $anime;
    }
    
    // Se for favorito, adicionar também à lista de favoritos
    if ($row['favorito']) {
        $lists['favorites'][] = $anime;
    }
}

mysqli_close($conn);

jsonResponse(['lists' => $lists]);

