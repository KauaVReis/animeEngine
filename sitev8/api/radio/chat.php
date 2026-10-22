<?php
/**
 * AnimeEngine v8 - Radio Rooms API: Chat & Quick Reactions
 * Envio, leitura incremental e reações rítmicas de emojis
 * ZERO PDO - mysqli + prepared statements obrigatórios
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/auth.php';

$conn = conectar();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (!estaLogado()) {
        mysqli_close($conn);
        http_response_code(401);
        echo json_encode(['error' => true, 'message' => 'Faça login para enviar mensagens no chat.']);
        exit;
    }

    $user = getUsuarioLogado();
    $userId = (int)$user['id'];

    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: $_POST;

    $roomUuid = trim($input['room_uuid'] ?? '');
    $mensagem = trim($input['mensagem'] ?? '');
    $tipoMsg = in_array($input['tipo_msg'] ?? '', ['texto', 'reacao', 'palmas']) ? $input['tipo_msg'] : 'texto';
    $emojiReacao = trim($input['emoji'] ?? '');

    if (empty($roomUuid)) {
        mysqli_close($conn);
        http_response_code(400);
        echo json_encode(['error' => true, 'message' => 'UUID da sala é obrigatório.']);
        exit;
    }

    // Verificar se a sala existe e está ativa
    $sala = secure_fetch_one(
        $conn,
        "SELECT id, status FROM radio_salas WHERE uuid = ? AND status = 'ativa'",
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

    // Rate limiting defensivo de chat: máximo 5 mensagens a cada 5 segundos
    $floodCheck = secure_fetch_one(
        $conn,
        "SELECT COUNT(*) AS total FROM radio_chat 
         WHERE sala_id = ? AND usuario_id = ? AND criado_em > NOW(3) - INTERVAL 5 SECOND",
        "ii",
        $salaId,
        $userId
    );

    if (((int)($floodCheck['total'] ?? 0)) >= 5) {
        mysqli_close($conn);
        http_response_code(429);
        echo json_encode(['error' => true, 'message' => 'Calma lá! Você está digitando rápido demais.']);
        exit;
    }

    // Tratar reações de emoji rápido
    if ($tipoMsg === 'reacao') {
        $allowedEmojis = ['🔥', '💖', '😭', '⚡', '🎸', '🌸', '👑'];
        if (!in_array($emojiReacao, $allowedEmojis)) {
            $emojiReacao = '🔥';
        }
        $mensagem = $emojiReacao;
    } else {
        // Sanitizar mensagem de texto (prevenir XSS)
        $mensagem = htmlspecialchars($mensagem, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        if (empty($mensagem) || mb_strlen($mensagem) > 300) {
            mysqli_close($conn);
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'Mensagem deve ter entre 1 e 300 caracteres.']);
            exit;
        }
    }

    // Inserir mensagem
    $inseriu = secure_query(
        $conn,
        "INSERT INTO radio_chat (sala_id, usuario_id, tipo_msg, mensagem, criado_em)
         VALUES (?, ?, ?, ?, NOW(3))",
        "iiss",
        $salaId,
        $userId,
        $tipoMsg,
        $mensagem
    );

    $msgId = last_insert_id($conn);
    mysqli_close($conn);

    echo json_encode([
        'success'    => true,
        'message_id' => $msgId,
        'tipo'       => $tipoMsg,
        'mensagem'   => $mensagem
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ------------------------------------------------------------
// GET: LEITURA INCREMENTAL (POLL)
// ------------------------------------------------------------
$roomUuid = trim($_GET['uuid'] ?? '');
$lastId = max(0, (int)($_GET['last_id'] ?? 0));

if (empty($roomUuid)) {
    mysqli_close($conn);
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'UUID da sala é obrigatório.']);
    exit;
}

$mensagens = secure_fetch_all(
    $conn,
    "SELECT c.id, c.usuario_id, c.tipo_msg, c.mensagem, c.criado_em,
            u.username, u.avatar, u.moldura, u.cor_nome,
            t.nome AS titulo_nome, t.icone AS titulo_icone, t.cor AS titulo_cor
     FROM radio_chat c
     JOIN radio_salas s ON s.id = c.sala_id
     JOIN usuarios u ON u.id = c.usuario_id
     LEFT JOIN titulos t ON t.id = u.titulo_ativo
     WHERE s.uuid = ? 
       AND s.status = 'ativa' 
       AND c.is_deletada = 0 
       AND c.id > ?
     ORDER BY c.id ASC
     LIMIT 40",
    "si",
    $roomUuid,
    $lastId
);

mysqli_close($conn);

$formatted = array_map(function($m) {
    return [
        'id'         => (int)$m['id'],
        'tipo'       => $m['tipo_msg'],
        'mensagem'   => $m['mensagem'],
        'criado_em'  => $m['criado_em'],
        'autor' => [
            'id'           => (int)$m['usuario_id'],
            'username'     => $m['username'],
            'avatar'       => $m['avatar'] ?: 'img/default-avatar.png',
            'moldura'      => $m['moldura'] ?: 'default',
            'cor_nome'     => $m['cor_nome'],
            'titulo'       => $m['titulo_nome'],
            'titulo_icone' => $m['titulo_icone'],
            'titulo_cor'   => $m['titulo_cor'] ?: '#ffd700'
        ]
    ];
}, $mensagens);

echo json_encode([
    'success'   => true,
    'total'     => count($formatted),
    'mensagens' => $formatted
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
