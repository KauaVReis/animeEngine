<?php
/**
 * AnimeEngine v8 - Radio Rooms API: Queue Management
 * Adição, remoção, ordenação fracionária e votação de faixas na fila
 * ZERO PDO - mysqli + prepared statements obrigatórios
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/auth.php';

if (!estaLogado()) {
    http_response_code(401);
    echo json_encode(['error' => true, 'message' => 'Faça login para interagir com a fila da rádio.']);
    exit;
}

$user = getUsuarioLogado();
$userId = (int)$user['id'];

$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?: $_POST;

$action = trim($input['action'] ?? '');
$roomUuid = trim($input['room_uuid'] ?? '');

if (empty($roomUuid) || empty($action)) {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'Ação e UUID da sala são obrigatórios.']);
    exit;
}

$conn = conectar();

// Obter sala
$sala = secure_fetch_one(
    $conn,
    "SELECT id, criador_id, status, tocando_agora_fila_id, ouvintes_count, version 
     FROM radio_salas 
     WHERE uuid = ? AND status = 'ativa'",
    "s",
    $roomUuid
);

if (!$sala) {
    mysqli_close($conn);
    http_response_code(404);
    echo json_encode(['error' => true, 'message' => 'Sala não encontrada ou inativa.']);
    exit;
}

$salaId = (int)$sala['id'];
$isHost = ($userId === (int)$sala['criador_id']);

// Verificar papel de DJ
$membro = secure_fetch_one(
    $conn,
    "SELECT role FROM radio_membros WHERE sala_id = ? AND usuario_id = ?",
    "ii",
    $salaId,
    $userId
);
$isDJ = $isHost || ($membro && in_array($membro['role'], ['host', 'dj']));

switch ($action) {

    // ------------------------------------------------------------
    // 1. ADICIONAR MÚSICA À FILA
    // ------------------------------------------------------------
    case 'add':
        $anilistId = (int)($input['anilist_id'] ?? 0);
        $animeTitulo = trim($input['anime_titulo'] ?? '');
        $tipoTema = in_array($input['tipo_tema'] ?? '', ['OP', 'ED', 'OST', 'INSERT']) ? $input['tipo_tema'] : 'OP';
        $temaNumero = max(1, (int)($input['tema_numero'] ?? 1));
        $musicaTitulo = trim($input['musica_titulo'] ?? '');
        $artista = trim($input['artista'] ?? '');
        $audioUrl = trim($input['audio_url'] ?? '');
        $videoUrl = trim($input['video_url'] ?? '');
        $duracaoSec = min(max((int)($input['duracao_segundos'] ?? 90), 30), 600);
        $capaUrl = trim($input['capa_url'] ?? '');

        if (empty($anilistId) || empty($animeTitulo) || empty($audioUrl)) {
            mysqli_close($conn);
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'Dados da música inválidos ou incompletos.']);
            exit;
        }

        // Calcular próxima posição fracionária
        $maxPos = secure_fetch_one(
            $conn,
            "SELECT COALESCE(MAX(posicao), 0) AS max_p FROM radio_fila WHERE sala_id = ?",
            "i",
            $salaId
        );
        $novaPosicao = ((float)$maxPos['max_p']) + 1000.0;

        // Inserir faixa na fila
        $inseriu = secure_query(
            $conn,
            "INSERT INTO radio_fila 
             (sala_id, adicionado_por_id, anilist_id, anime_titulo, tipo_tema, tema_numero, 
              musica_titulo, artista, audio_url, video_url, duracao_segundos, capa_url, posicao, status, criado_em)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', NOW())",
            "iiississssisd",
            $salaId,
            $userId,
            $anilistId,
            $animeTitulo,
            $tipoTema,
            $temaNumero,
            $musicaTitulo,
            $artista,
            $audioUrl,
            $videoUrl,
            $duracaoSec,
            $capaUrl,
            $novaPosicao
        );

        if (!$inseriu) {
            mysqli_close($conn);
            http_response_code(500);
            echo json_encode(['error' => true, 'message' => 'Erro ao enfileirar música.']);
            exit;
        }

        $filaId = last_insert_id($conn);

        // Se a sala estiver sem música tocando, inicia esta imediatamente!
        if (empty($sala['tocando_agora_fila_id'])) {
            secure_query(
                $conn,
                "UPDATE radio_salas 
                 SET tocando_agora_fila_id = ?, playback_started_at = NOW(3), is_paused = 0, version = version + 1 
                 WHERE id = ?",
                "ii",
                $filaId,
                $salaId
            );
            secure_query(
                $conn,
                "UPDATE radio_fila SET status = 'tocando', iniciou_em = NOW(3) WHERE id = ?",
                "i",
                $filaId
            );
        } else {
            secure_query($conn, "UPDATE radio_salas SET version = version + 1 WHERE id = ?", "i", $salaId);
        }

        // Notificar no chat da sala
        $msgSistema = sprintf("🎵 %s adicionou à fila: %s (%s)", $user['username'], $musicaTitulo ?: $animeTitulo, $tipoTema);
        secure_query(
            $conn,
            "INSERT INTO radio_chat (sala_id, usuario_id, tipo_msg, mensagem, criado_em) VALUES (?, ?, 'musica_pedida', ?, NOW(3))",
            "iis",
            $salaId,
            $userId,
            $msgSistema
        );

        mysqli_close($conn);
        echo json_encode([
            'success'   => true,
            'message'   => 'Música adicionada à fila!',
            'fila_id'   => $filaId,
            'tocando'   => empty($sala['tocando_agora_fila_id'])
        ], JSON_UNESCAPED_UNICODE);
        break;

    // ------------------------------------------------------------
    // 2. PULAR MÚSICA (HOST / DJ DIRETO)
    // ------------------------------------------------------------
    case 'skip':
        if (!$isDJ) {
            mysqli_close($conn);
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Apenas o Host ou DJ podem pular faixas diretamente.']);
            exit;
        }

        // Marcar faixa atual como pulada
        if (!empty($sala['tocando_agora_fila_id'])) {
            secure_query(
                $conn,
                "UPDATE radio_fila SET status = 'pulada', terminou_em = NOW(3) WHERE id = ?",
                "i",
                $sala['tocando_agora_fila_id']
            );
        }

        // Buscar próxima faixa pendente
        $proxima = secure_fetch_one(
            $conn,
            "SELECT id FROM radio_fila WHERE sala_id = ? AND status = 'pendente' ORDER BY posicao ASC LIMIT 1",
            "i",
            $salaId
        );

        if ($proxima) {
            secure_query(
                $conn,
                "UPDATE radio_salas 
                 SET tocando_agora_fila_id = ?, playback_started_at = NOW(3), is_paused = 0, version = version + 1 
                 WHERE id = ?",
                "ii",
                $proxima['id'],
                $salaId
            );
            secure_query($conn, "UPDATE radio_fila SET status = 'tocando', iniciou_em = NOW(3) WHERE id = ?", "i", $proxima['id']);
        } else {
            secure_query(
                $conn,
                "UPDATE radio_salas SET tocando_agora_fila_id = NULL, is_paused = 1, version = version + 1 WHERE id = ?",
                "i",
                $salaId
            );
        }

        mysqli_close($conn);
        echo json_encode(['success' => true, 'message' => 'Faixa pulada com sucesso!']);
        break;

    // ------------------------------------------------------------
    // 3. VOTAR PARA PULAR (VOTE-SKIP DOS OUVINTES)
    // ------------------------------------------------------------
    case 'vote_skip':
        if (empty($sala['tocando_agora_fila_id'])) {
            mysqli_close($conn);
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'Nenhuma música está tocando no momento.']);
            exit;
        }

        $filaIdAtual = (int)$sala['tocando_agora_fila_id'];

        // Registrar voto único
        $inseriuVoto = secure_query(
            $conn,
            "INSERT IGNORE INTO radio_fila_votos (fila_id, usuario_id, tipo_voto, criado_em) VALUES (?, ?, 'skip', NOW())",
            "ii",
            $filaIdAtual,
            $userId
        );

        // Contar votos atuais
        $totalVotos = secure_fetch_one(
            $conn,
            "SELECT COUNT(*) AS total FROM radio_fila_votos WHERE fila_id = ? AND tipo_voto = 'skip'",
            "i",
            $filaIdAtual
        );
        $votosCount = (int)($totalVotos['total'] ?? 0);
        secure_query($conn, "UPDATE radio_fila SET votos_pular = ? WHERE id = ?", "ii", $votosCount, $filaIdAtual);

        // Regra de Votação: Mais de 50% dos ouvintes ativos (mínimo 2 votos)
        $metaVotos = max(2, (int)ceil($sala['ouvintes_count'] * 0.5));
        $foiPulada = false;

        if ($votosCount >= $metaVotos) {
            // Avançar faixa
            secure_query($conn, "UPDATE radio_fila SET status = 'pulada', terminou_em = NOW(3) WHERE id = ?", "i", $filaIdAtual);
            
            $proxima = secure_fetch_one(
                $conn,
                "SELECT id FROM radio_fila WHERE sala_id = ? AND status = 'pendente' ORDER BY posicao ASC LIMIT 1",
                "i",
                $salaId
            );

            if ($proxima) {
                secure_query(
                    $conn,
                    "UPDATE radio_salas 
                     SET tocando_agora_fila_id = ?, playback_started_at = NOW(3), is_paused = 0, version = version + 1 
                     WHERE id = ?",
                    "ii",
                    $proxima['id'],
                    $salaId
                );
                secure_query($conn, "UPDATE radio_fila SET status = 'tocando', iniciou_em = NOW(3) WHERE id = ?", "i", $proxima['id']);
            } else {
                secure_query(
                    $conn,
                    "UPDATE radio_salas SET tocando_agora_fila_id = NULL, is_paused = 1, version = version + 1 WHERE id = ?",
                    "i",
                    $salaId
                );
            }
            $foiPulada = true;
        }

        mysqli_close($conn);
        echo json_encode([
            'success'     => true,
            'votos_atuais'=> $votosCount,
            'meta_votos'  => $metaVotos,
            'foi_pulada'  => $foiPulada
        ]);
        break;

    // ------------------------------------------------------------
    // 4. CURTIR MÚSICA (LIKE / HYPE)
    // ------------------------------------------------------------
    case 'vote_like':
        if (empty($sala['tocando_agora_fila_id'])) {
            mysqli_close($conn);
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'Nenhuma música tocando.']);
            exit;
        }

        $filaIdAtual = (int)$sala['tocando_agora_fila_id'];
        secure_query(
            $conn,
            "INSERT IGNORE INTO radio_fila_votos (fila_id, usuario_id, tipo_voto, criado_em) VALUES (?, ?, 'like', NOW())",
            "ii",
            $filaIdAtual,
            $userId
        );

        // Bonificar o Host da sala com +2 XP por curtida recebida
        secure_query($conn, "UPDATE usuarios SET xp = xp + 2 WHERE id = ?", "i", $sala['criador_id']);

        mysqli_close($conn);
        echo json_encode(['success' => true, 'message' => 'Curtida registrada! (+2 XP para o DJ)']);
        break;

    // ------------------------------------------------------------
    // 5. REORDENAR FAIXA (FRACTIONAL INDEXING)
    // ------------------------------------------------------------
    case 'reorder':
        if (!$isDJ) {
            mysqli_close($conn);
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Permissão negada.']);
            exit;
        }

        $filaIdAlvo = (int)($input['fila_id'] ?? 0);
        $posAntes = (float)($input['pos_antes'] ?? 0.0);
        $posDepois = (float)($input['pos_depois'] ?? 0.0);

        if (empty($filaIdAlvo)) {
            mysqli_close($conn);
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'ID da faixa inválido.']);
            exit;
        }

        // Se colocou no início (antes do primeiro)
        if ($posAntes <= 0 && $posDepois > 0) {
            $novaPos = $posDepois / 2.0;
        } 
        // Se colocou no final (após o último)
        elseif ($posAntes > 0 && $posDepois <= 0) {
            $novaPos = $posAntes + 1000.0;
        } 
        // Entre dois itens
        elseif ($posAntes > 0 && $posDepois > 0) {
            $novaPos = ($posAntes + $posDepois) / 2.0;
        } else {
            $novaPos = 1000.0;
        }

        secure_query(
            $conn,
            "UPDATE radio_fila SET posicao = ? WHERE id = ? AND sala_id = ?",
            "dii",
            $novaPos,
            $filaIdAlvo,
            $salaId
        );
        secure_query($conn, "UPDATE radio_salas SET version = version + 1 WHERE id = ?", "i", $salaId);

        mysqli_close($conn);
        echo json_encode(['success' => true, 'nova_posicao' => $novaPos]);
        break;

    default:
        mysqli_close($conn);
        http_response_code(400);
        echo json_encode(['error' => true, 'message' => 'Ação não suportada.']);
        break;
}
