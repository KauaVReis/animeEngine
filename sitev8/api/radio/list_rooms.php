<?php
/**
 * AnimeEngine v8 - Radio Rooms API: List Public Rooms
 * Retorna as salas ativas e públicas com cache e paginação
 * ZERO PDO - mysqli + prepared statements obrigatórios
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');

require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/auth.php';

$conn = conectar();

$limit = isset($_GET['limit']) ? min(max((int)$_GET['limit'], 1), 50) : 24;
$offset = isset($_GET['offset']) ? max((int)$_GET['offset'], 0) : 0;

// Atualizar ouvintes inativos (membros sem heartbeat há mais de 45 segundos)
secure_query(
    $conn,
    "DELETE FROM radio_membros WHERE ultimo_heartbeat < NOW() - INTERVAL 45 SECOND"
);

// Recalcular contador de ouvintes ativos das salas
secure_query(
    $conn,
    "UPDATE radio_salas s
     SET s.ouvintes_count = (
         SELECT COUNT(*) FROM radio_membros m WHERE m.sala_id = s.id
     )
     WHERE s.status = 'ativa'"
);

// Encerrar automaticamente salas públicas sem ouvintes nem host ativo há mais de 30 minutos
secure_query(
    $conn,
    "UPDATE radio_salas 
     SET status = 'encerrada', encerrada_em = NOW()
     WHERE status = 'ativa' AND ouvintes_count = 0 AND tipo = 'publica' 
       AND atualizado_em < NOW() - INTERVAL 30 MINUTE"
);

// Buscar salas públicas ativas
$sql = "SELECT s.id, s.uuid, s.slug, s.nome, s.descricao, s.tipo, s.tema_visual,
               s.max_ouvintes, s.ouvintes_count, s.is_paused, s.version, s.criado_em,
               u.username AS host_username, u.avatar AS host_avatar, u.moldura AS host_moldura,
               t.nome AS host_titulo, t.icone AS host_titulo_icone,
               f.anilist_id, f.anime_titulo, f.tipo_tema, f.tema_numero, 
               f.musica_titulo, f.artista, f.audio_url, f.duracao_segundos, f.capa_url
        FROM radio_salas s
        JOIN usuarios u ON u.id = s.criador_id
        LEFT JOIN titulos t ON t.id = u.titulo_ativo
        LEFT JOIN radio_fila f ON f.id = s.tocando_agora_fila_id
        WHERE s.status = 'ativa' AND s.tipo = 'publica'
        ORDER BY s.ouvintes_count DESC, s.id DESC
        LIMIT ? OFFSET ?";

$rooms = secure_fetch_all($conn, $sql, "ii", $limit, $offset);

$formatted = array_map(function($r) {
    return [
        'uuid'           => $r['uuid'],
        'slug'           => $r['slug'],
        'nome'           => $r['nome'],
        'descricao'      => $r['descricao'],
        'tipo'           => $r['tipo'],
        'tema_visual'    => $r['tema_visual'] ?: 'default',
        'max_ouvintes'   => (int)$r['max_ouvintes'],
        'ouvintes_count' => (int)$r['ouvintes_count'],
        'is_paused'      => (bool)$r['is_paused'],
        'criado_em'      => $r['criado_em'],
        'host' => [
            'username'     => $r['host_username'],
            'avatar'       => $r['host_avatar'] ?: 'img/default-avatar.png',
            'moldura'      => $r['host_moldura'] ?: 'default',
            'titulo'       => $r['host_titulo'],
            'titulo_icone' => $r['host_titulo_icone'] ?: '🎧'
        ],
        'musica_atual' => !empty($r['anilist_id']) ? [
            'anilist_id'       => (int)$r['anilist_id'],
            'anime_titulo'     => $r['anime_titulo'],
            'tipo_tema'        => $r['tipo_tema'],
            'tema_numero'      => (int)$r['tema_numero'],
            'musica_titulo'    => $r['musica_titulo'] ?: $r['anime_titulo'],
            'artista'          => $r['artista'] ?: 'AnimeThemes',
            'audio_url'        => $r['audio_url'],
            'duracao_segundos' => (int)$r['duracao_segundos'],
            'capa_url'         => $r['capa_url']
        ] : null
    ];
}, $rooms);

mysqli_close($conn);

echo json_encode([
    'success' => true,
    'total'   => count($formatted),
    'salas'   => $formatted
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
