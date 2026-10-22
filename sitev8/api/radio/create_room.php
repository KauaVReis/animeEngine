<?php
/**
 * AnimeEngine v8 - Radio Rooms API: Create Room
 * Criação atômica de sala com UUIDv4 e registro de Host
 * ZERO PDO - mysqli + prepared statements obrigatórios
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/auth.php';

if (!estaLogado()) {
    http_response_code(401);
    echo json_encode(['error' => true, 'message' => 'Faça login para criar uma sala de rádio.']);
    exit;
}

$user = getUsuarioLogado();
$userId = (int)$user['id'];

$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?: $_POST;

$nome = trim($input['nome'] ?? '');
$descricao = trim($input['descricao'] ?? '');
$tipo = in_array($input['tipo'] ?? '', ['publica', 'privada']) ? $input['tipo'] : 'publica';
$senha = trim($input['senha'] ?? '');
$temaVisual = preg_replace('/[^a-zA-Z0-9_-]/', '', $input['tema_visual'] ?? 'default');
$maxOuvintes = min(max((int)($input['max_ouvintes'] ?? 50), 5), 100);

if (empty($nome) || mb_strlen($nome) < 3 || mb_strlen($nome) > 100) {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'O nome da sala deve ter entre 3 e 100 caracteres.']);
    exit;
}

if ($tipo === 'privada' && empty($senha)) {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'Salas privadas exigem uma senha de acesso.']);
    exit;
}

$senhaHash = ($tipo === 'privada') ? password_hash($senha, PASSWORD_BCRYPT) : null;

// Gerar UUIDv4
$data = random_bytes(16);
$data[6] = chr(ord($data[6]) & 0x0f | 0x40);
$data[8] = chr(ord($data[8]) & 0x3f | 0x80);
$uuid = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));

$conn = conectar();

// Verificar se o usuário já tem uma sala ativa como host (limite: 1 sala ativa por usuário)
$ativa = secure_fetch_one(
    $conn,
    "SELECT id, uuid FROM radio_salas WHERE criador_id = ? AND status = 'ativa'",
    "i",
    $userId
);

if ($ativa) {
    // Encerrar sala ativa anterior do mesmo criador
    secure_query(
        $conn,
        "UPDATE radio_salas SET status = 'encerrada', encerrada_em = NOW() WHERE id = ?",
        "i",
        $ativa['id']
    );
}

// Inserir nova sala
$insertSala = secure_query(
    $conn,
    "INSERT INTO radio_salas 
     (uuid, criador_id, nome, descricao, tipo, senha_hash, status, tema_visual, max_ouvintes, ouvintes_count, version, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, 'ativa', ?, ?, 1, NOW())",
    "sisssssi",
    $uuid,
    $userId,
    $nome,
    $descricao,
    $tipo,
    $senhaHash,
    $temaVisual,
    $maxOuvintes
);

if (!$insertSala) {
    mysqli_close($conn);
    http_response_code(500);
    echo json_encode(['error' => true, 'message' => 'Erro interno ao criar sala no banco de dados.']);
    exit;
}

$salaId = last_insert_id($conn);

// Inserir criador como host em radio_membros
secure_query(
    $conn,
    "INSERT INTO radio_membros (sala_id, usuario_id, role, is_muted, ultimo_heartbeat, entrou_em)
     VALUES (?, ?, 'host', 0, NOW(), NOW())
     ON DUPLICATE KEY UPDATE role = 'host', ultimo_heartbeat = NOW()",
    "ii",
    $salaId,
    $userId
);

// Registrar atividade do usuário
$detalhesAtividade = json_encode(['room_uuid' => $uuid, 'room_name' => $nome], JSON_UNESCAPED_UNICODE);
secure_query(
    $conn,
    "INSERT INTO atividades (usuario_id, tipo, detalhes, criado_em)
     VALUES (?, 'radio_host', ?, NOW())",
    "is",
    $userId,
    $detalhesAtividade
);

// Bonificar XP do Host (+25 XP por abrir rádio)
secure_query(
    $conn,
    "UPDATE usuarios SET xp = xp + 25 WHERE id = ?",
    "i",
    $userId
);

mysqli_close($conn);

echo json_encode([
    'success'   => true,
    'message'   => 'Sala criada com sucesso!',
    'room_uuid' => $uuid,
    'room_id'   => $salaId,
    'nome'      => $nome,
    'tipo'      => $tipo,
    'xp_ganho'  => 25
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
