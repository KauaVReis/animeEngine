<?php
/**
 * AnimeEngine v8 - Radio Rooms API: Host Actions & Room Control
 * Pausa, retomada, encerramento e moderação da sala
 * ZERO PDO - mysqli + prepared statements obrigatórios
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/auth.php';

if (!estaLogado()) {
    http_response_code(401);
    echo json_encode(['error' => true, 'message' => 'Faça login para controlar a sala.']);
    exit;
}

$user = getUsuarioLogado();
$userId = (int)$user['id'];

$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?: $_POST;

$roomUuid = trim($input['room_uuid'] ?? '');
$action = trim($input['action'] ?? '');

if (empty($roomUuid) || empty($action)) {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'UUID da sala e ação são obrigatórios.']);
    exit;
}

$conn = conectar();

$sala = secure_fetch_one(
    $conn,
    "SELECT id, criador_id, status, tocando_agora_fila_id, playback_started_at, 
            playback_paused_at_sec, is_paused, version 
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
    // 1. PAUSAR REPRODUÇÃO DA SALA
    // ------------------------------------------------------------
    case 'pause':
        if (!$isDJ) {
            mysqli_close($conn);
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Permissão negada. Apenas Host/DJ podem pausar.']);
            exit;
        }

        if ($sala['is_paused']) {
            mysqli_close($conn);
            echo json_encode(['success' => true, 'message' => 'A sala já está pausada.']);
            exit;
        }

        $nowFloat = microtime(true);
        $startedTimestamp = strtotime($sala['playback_started_at'] ?: 'now');
        $elapsed = max(0, (int)round($nowFloat - $startedTimestamp));

        secure_query(
            $conn,
            "UPDATE radio_salas 
             SET is_paused = 1, playback_paused_at_sec = ?, version = version + 1 
             WHERE id = ?",
            "ii",
            $elapsed,
            $salaId
        );

        mysqli_close($conn);
        echo json_encode(['success' => true, 'message' => 'Reprodução pausada.', 'elapsed' => $elapsed]);
        break;

    // ------------------------------------------------------------
    // 2. RETOMAR REPRODUÇÃO DA SALA
    // ------------------------------------------------------------
    case 'resume':
        if (!$isDJ) {
            mysqli_close($conn);
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Permissão negada. Apenas Host/DJ podem retomar.']);
            exit;
        }

        if (!$sala['is_paused']) {
            mysqli_close($conn);
            echo json_encode(['success' => true, 'message' => 'A sala já está reproduzindo.']);
            exit;
        }

        $pausedSec = (int)$sala['playback_paused_at_sec'];

        // Recalcular playback_started_at subtraindo os segundos já tocados
        secure_query(
            $conn,
            "UPDATE radio_salas 
             SET is_paused = 0, 
                 playback_started_at = NOW(3) - INTERVAL ? SECOND, 
                 playback_paused_at_sec = 0, 
                 version = version + 1 
             WHERE id = ?",
            "ii",
            $pausedSec,
            $salaId
        );

        mysqli_close($conn);
        echo json_encode(['success' => true, 'message' => 'Reprodução retomada.']);
        break;

    // ------------------------------------------------------------
    // 3. ENCERRAR SALA (HOST ONLY)
    // ------------------------------------------------------------
    case 'close':
        if (!$isHost) {
            mysqli_close($conn);
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Apenas o anfitrião pode encerrar a sala.']);
            exit;
        }

        secure_query(
            $conn,
            "UPDATE radio_salas 
             SET status = 'encerrada', encerrada_em = NOW(), version = version + 1 
             WHERE id = ?",
            "i",
            $salaId
        );

        // Remover membros ativos
        secure_query($conn, "DELETE FROM radio_membros WHERE sala_id = ?", "i", $salaId);

        // Notificar no chat que a sala foi finalizada
        secure_query(
            $conn,
            "INSERT INTO radio_chat (sala_id, usuario_id, tipo_msg, mensagem, criado_em)
             VALUES (?, ?, 'sistema', '🔴 Esta sala foi encerrada pelo anfitrião. Obrigado por ouvirem juntos!', NOW(3))",
            "ii",
            $salaId,
            $userId
        );

        mysqli_close($conn);
        echo json_encode(['success' => true, 'message' => 'Sala encerrada com sucesso.']);
        break;

    // ------------------------------------------------------------
    // 4. EXPULSAR MEMBRO (MODERAÇÃO)
    // ------------------------------------------------------------
    case 'kick':
        if (!$isHost) {
            mysqli_close($conn);
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Apenas o anfitrião pode expulsar ouvintes.']);
            exit;
        }

        $targetUserId = (int)($input['target_user_id'] ?? 0);
        if ($targetUserId === $userId) {
            mysqli_close($conn);
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'Você não pode expulsar a si mesmo.']);
            exit;
        }

        secure_query($conn, "DELETE FROM radio_membros WHERE sala_id = ? AND usuario_id = ?", "ii", $salaId, $targetUserId);

        mysqli_close($conn);
        echo json_encode(['success' => true, 'message' => 'Membro expulso da sala.']);
        break;

    default:
        mysqli_close($conn);
        http_response_code(400);
        echo json_encode(['error' => true, 'message' => 'Ação de sala inválida.']);
        break;
}
