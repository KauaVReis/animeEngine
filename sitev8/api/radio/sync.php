<?php
/**
 * AnimeEngine v8 - Radio Rooms API: Synchronize & State Engine
 * Smart Polling com suporte nativo a ETag / HTTP 304 Not Modified
 * ZERO PDO - mysqli + prepared statements obrigatórios
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/auth.php';

$roomUuid = trim($_GET['uuid'] ?? '');
$passwordProvided = trim($_GET['key'] ?? '');

if (empty($roomUuid)) {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'UUID da sala é obrigatório.']);
    exit;
}

$conn = conectar();

// Buscar sala por UUID
$sala = secure_fetch_one(
    $conn,
    "SELECT id, uuid, slug, criador_id, nome, descricao, tipo, senha_hash, 
            status, tema_visual, max_ouvintes, tocando_agora_fila_id, 
            playback_started_at, playback_paused_at_sec, is_paused, 
            ouvintes_count, version, encerrada_em, criado_em, atualizado_em
     FROM radio_salas 
     WHERE uuid = ?",
    "s",
    $roomUuid
);

if (!$sala || $sala['status'] === 'arquivada') {
    mysqli_close($conn);
    http_response_code(404);
    echo json_encode(['error' => true, 'message' => 'Sala não encontrada ou arquivada.']);
    exit;
}

$userId = getUsuarioId();
$isCreator = ($userId && (int)$userId === (int)$sala['criador_id']);

// Validação de Sala Privada
if ($sala['tipo'] === 'privada' && !$isCreator) {
    $hasAccess = false;
    
    // Verificar se já é membro ativo na sessão
    if ($userId) {
        $membroCheck = secure_fetch_one(
            $conn,
            "SELECT id FROM radio_membros WHERE sala_id = ? AND usuario_id = ?",
            "ii",
            $sala['id'],
            $userId
        );
        if ($membroCheck) {
            $hasAccess = true;
        }
    }
    
    // Se não for membro ainda, verificar a senha fornecida
    if (!$hasAccess) {
        if (!empty($passwordProvided) && password_verify($passwordProvided, $sala['senha_hash'])) {
            $hasAccess = true;
        } else {
            mysqli_close($conn);
            http_response_code(403);
            echo json_encode([
                'error'          => true, 
                'requires_auth'  => true,
                'message'        => 'Senha necessária para acessar esta sala privada.',
                'room_nome'      => $sala['nome'],
                'room_tipo'      => 'privada'
            ]);
            exit;
        }
    }
}

// Atualizar heartbeat de presença se o usuário estiver autenticado
if ($userId) {
    secure_query(
        $conn,
        "INSERT INTO radio_membros (sala_id, usuario_id, role, ultimo_heartbeat, entrou_em)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE ultimo_heartbeat = NOW()",
        "iis",
        $sala['id'],
        $userId,
        $isCreator ? 'host' : 'ouvinte'
    );
}

// ------------------------------------------------------------
// VERIFICAÇÃO AUTOMÁTICA DE PROGRESSÃO DE FAIXA (SERVER TIMECODE MASTER)
// ------------------------------------------------------------
$musicaAtual = null;
if (!empty($sala['tocando_agora_fila_id'])) {
    $musicaAtual = secure_fetch_one(
        $conn,
        "SELECT id, anilist_id, anime_titulo, tipo_tema, tema_numero, musica_titulo, 
                artista, audio_url, video_url, duracao_segundos, capa_url, status, 
                votos_pular, iniciou_em 
         FROM radio_fila 
         WHERE id = ?",
        "i",
        $sala['tocando_agora_fila_id']
    );
}

$nowFloat = microtime(true);
$elapsedSeconds = 0.0;

if ($musicaAtual && !$sala['is_paused'] && !empty($sala['playback_started_at'])) {
    $startedTimestamp = strtotime($sala['playback_started_at']);
    $elapsedSeconds = max(0.0, $nowFloat - $startedTimestamp);
    
    // Se a música atual estourou a duração (+ 2s de margem de buffer), avança para a próxima
    if ($elapsedSeconds >= ((int)$musicaAtual['duracao_segundos'] + 2)) {
        // Buscar próxima música pendente na fila
        $proxima = secure_fetch_one(
            $conn,
            "SELECT id, duracao_segundos FROM radio_fila 
             WHERE sala_id = ? AND status = 'pendente' 
             ORDER BY posicao ASC LIMIT 1",
            "i",
            $sala['id']
        );
        
        if ($proxima) {
            // Marcar atual como tocada
            secure_query($conn, "UPDATE radio_fila SET status = 'tocada', terminou_em = NOW(3) WHERE id = ?", "i", $musicaAtual['id']);
            
            // Iniciar próxima
            secure_query(
                $conn,
                "UPDATE radio_salas 
                 SET tocando_agora_fila_id = ?, playback_started_at = NOW(3), is_paused = 0, version = version + 1 
                 WHERE id = ?",
                "ii",
                $proxima['id'],
                $sala['id']
            );
            secure_query($conn, "UPDATE radio_fila SET status = 'tocando', iniciou_em = NOW(3) WHERE id = ?", "i", $proxima['id']);
            
            // Recarregar snapshot atualizado
            $sala['tocando_agora_fila_id'] = $proxima['id'];
            $sala['playback_started_at'] = date('Y-m-d H:i:s');
            $sala['version']++;
            $elapsedSeconds = 0.0;
            
            $musicaAtual = secure_fetch_one(
                $conn,
                "SELECT id, anilist_id, anime_titulo, tipo_tema, tema_numero, musica_titulo, 
                        artista, audio_url, video_url, duracao_segundos, capa_url, status, 
                        votos_pular, iniciou_em 
                 FROM radio_fila WHERE id = ?",
                "i",
                $proxima['id']
            );
        } else {
            // Sem próximas músicas: encerra reprodução da fila
            secure_query($conn, "UPDATE radio_fila SET status = 'tocada', terminou_em = NOW(3) WHERE id = ?", "i", $musicaAtual['id']);
            secure_query($conn, "UPDATE radio_salas SET tocando_agora_fila_id = NULL, is_paused = 1, version = version + 1 WHERE id = ?", "i", $sala['id']);
            $musicaAtual = null;
            $sala['tocando_agora_fila_id'] = null;
            $sala['is_paused'] = 1;
            $sala['version']++;
        }
    }
} elseif ($sala['is_paused']) {
    $elapsedSeconds = (float)$sala['playback_paused_at_sec'];
}

// ------------------------------------------------------------
// ETAG & CONDITIONAL 304 CACHE
// ------------------------------------------------------------
$lastChat = secure_fetch_one($conn, "SELECT MAX(id) AS max_id FROM radio_chat WHERE sala_id = ?", "i", $sala['id']);
$maxChatId = (int)($lastChat['max_id'] ?? 0);

$etagRaw = sprintf(
    'W/"%d_%d_%d_%d_%d"',
    $sala['version'],
    (int)($sala['tocando_agora_fila_id'] ?? 0),
    (int)$sala['is_paused'],
    (int)$sala['ouvintes_count'],
    $maxChatId
);

header("ETag: {$etagRaw}");
header('Cache-Control: public, max-age=1, must-revalidate');

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etagRaw) {
    mysqli_close($conn);
    http_response_code(304);
    exit;
}

// ------------------------------------------------------------
// BUSCAR DADOS COMPLETOS DA SALA
// ------------------------------------------------------------

// Fila pendente (próximas faixas)
$fila = secure_fetch_all(
    $conn,
    "SELECT id, anilist_id, anime_titulo, tipo_tema, tema_numero, musica_titulo, 
            artista, duracao_segundos, capa_url, posicao, votos_pular
     FROM radio_fila 
     WHERE sala_id = ? AND status = 'pendente' 
     ORDER BY posicao ASC 
     LIMIT 15",
    "i",
    $sala['id']
);

// Membros ativos (heartbeat < 45s)
$membros = secure_fetch_all(
    $conn,
    "SELECT m.usuario_id, m.role, m.is_muted, u.username, u.avatar, u.moldura, u.cor_nome,
            t.nome AS titulo_nome, t.icone AS titulo_icone
     FROM radio_membros m
     JOIN usuarios u ON u.id = m.usuario_id
     LEFT JOIN titulos t ON t.id = u.titulo_ativo
     WHERE m.sala_id = ? AND m.ultimo_heartbeat > NOW() - INTERVAL 45 SECOND
     ORDER BY (m.role = 'host') DESC, (m.role = 'dj') DESC, m.entrou_em ASC
     LIMIT 30",
    "i",
    $sala['id']
);

// Obter papel do usuário atual
$userRole = 'visitante';
if ($userId) {
    foreach ($membros as $m) {
        if ((int)$m['usuario_id'] === (int)$userId) {
            $userRole = $m['role'];
            break;
        }
    }
}

mysqli_close($conn);

echo json_encode([
    'success'          => true,
    'server_time'      => $nowFloat,
    'user_role'        => $userRole,
    'sala' => [
        'uuid'           => $sala['uuid'],
        'nome'           => $sala['nome'],
        'descricao'      => $sala['descricao'],
        'tipo'           => $sala['tipo'],
        'status'         => $sala['status'],
        'tema_visual'    => $sala['tema_visual'] ?: 'default',
        'is_paused'      => (bool)$sala['is_paused'],
        'ouvintes_count' => count($membros),
        'max_ouvintes'   => (int)$sala['max_ouvintes'],
        'version'        => (int)$sala['version']
    ],
    'tocando_agora' => $musicaAtual ? [
        'id'               => (int)$musicaAtual['id'],
        'anilist_id'       => (int)$musicaAtual['anilist_id'],
        'anime_titulo'     => $musicaAtual['anime_titulo'],
        'tipo_tema'        => $musicaAtual['tipo_tema'],
        'tema_numero'      => (int)$musicaAtual['tema_numero'],
        'musica_titulo'    => $musicaAtual['musica_titulo'] ?: $musicaAtual['anime_titulo'],
        'artista'          => $musicaAtual['artista'] ?: 'AnimeThemes',
        'audio_url'        => $musicaAtual['audio_url'],
        'video_url'        => $musicaAtual['video_url'],
        'duracao_segundos' => (int)$musicaAtual['duracao_segundos'],
        'capa_url'         => $musicaAtual['capa_url'],
        'tempo_decorrido'  => round($elapsedSeconds, 2),
        'votos_pular'      => (int)$musicaAtual['votos_pular']
    ] : null,
    'fila'    => $fila,
    'membros' => $membros
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
