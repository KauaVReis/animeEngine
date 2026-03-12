<?php
/**
 * AnimeEngine v7 - Unlock Achievement API
 * POST: Desbloquear conquista
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

requerLoginAPI();

$data = json_decode(file_get_contents('php://input'), true);
$badge_id = escape(conectar(), $data['badge_id'] ?? '');
$xp = intval($data['xp'] ?? 0);

if (empty($badge_id)) {
    jsonError('Badge ID é obrigatório');
}

$conn = conectar();
$usuario_id = getUsuarioId();

// Verificar se já desbloqueou
$sql = "SELECT id FROM conquistas WHERE usuario_id = $usuario_id AND badge_id = '$badge_id'";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
    mysqli_close($conn);
    jsonResponse(['already_unlocked' => true]);
}

// Desbloquear
$sql = "INSERT INTO conquistas (usuario_id, badge_id) VALUES ($usuario_id, '$badge_id')";
mysqli_query($conn, $sql);

// Adicionar XP ao usuário
if ($xp > 0) {
    $sql = "UPDATE usuarios SET xp = xp + $xp WHERE id = $usuario_id";
    mysqli_query($conn, $sql);
    
    // Verificar se subiu de nível
    $sql = "SELECT xp FROM usuarios WHERE id = $usuario_id";
    $result = mysqli_query($conn, $sql);
    $user = mysqli_fetch_assoc($result);
    $newXp = $user['xp'];
    
    // Calcular nível com base na tabela progressiva (mesma do JS)
    $levels = [
        ['level' => 1, 'xpRequired' => 0],
        ['level' => 2, 'xpRequired' => 50],
        ['level' => 3, 'xpRequired' => 150],
        ['level' => 4, 'xpRequired' => 300],
        ['level' => 5, 'xpRequired' => 500],
        ['level' => 6, 'xpRequired' => 800],
        ['level' => 7, 'xpRequired' => 1200],
        ['level' => 8, 'xpRequired' => 1800],
        ['level' => 9, 'xpRequired' => 2500],
        ['level' => 10, 'xpRequired' => 3500]
    ];

    $newLevel = 1;
    foreach ($levels as $l) {
        if ($newXp >= $l['xpRequired']) {
            $newLevel = $l['level'];
        } else {
            break;
        }
    }
    
    $sql = "UPDATE usuarios SET nivel = $newLevel WHERE id = $usuario_id";
    mysqli_query($conn, $sql);
}

mysqli_close($conn);

jsonSuccess('Conquista desbloqueada!', [
    'badge_id' => $badge_id,
    'xp_gained' => $xp
]);
