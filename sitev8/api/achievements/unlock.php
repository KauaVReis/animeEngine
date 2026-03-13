<?php
/**
 * AnimeEngine v8 - Unlock Achievement API (Seguro)
 * POST: Desbloquear conquista
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/rate_limiter.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

verificar_rate_limit();
requerLoginAPI();

$data = json_decode(file_get_contents('php://input'), true);
$badge_id = trim($data['badge_id'] ?? '');
$xp = intval($data['xp'] ?? 0);

if (empty($badge_id)) {
    jsonError('Badge ID é obrigatório');
}

$conn = conectar();
$usuario_id = getUsuarioId();

// Verificar se já desbloqueou — PREPARED
$result = secure_query($conn, "SELECT id FROM conquistas WHERE usuario_id = ? AND badge_id = ?", "is", $usuario_id, $badge_id);

if (mysqli_num_rows($result) > 0) {
    mysqli_close($conn);
    jsonResponse(['already_unlocked' => true]);
}

// Desbloquear — PREPARED
secure_query($conn, "INSERT INTO conquistas (usuario_id, badge_id) VALUES (?, ?)", "is", $usuario_id, $badge_id);

// Adicionar XP ao usuário
if ($xp > 0) {
    secure_query($conn, "UPDATE usuarios SET xp = xp + ? WHERE id = ?", "ii", $xp, $usuario_id);
    
    // Verificar se subiu de nível — PREPARED
    $result = secure_query($conn, "SELECT xp FROM usuarios WHERE id = ?", "i", $usuario_id);
    $user = mysqli_fetch_assoc($result);
    $newXp = $user['xp'];
    
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
    
    secure_query($conn, "UPDATE usuarios SET nivel = ? WHERE id = ?", "ii", $newLevel, $usuario_id);
}

mysqli_close($conn);

jsonSuccess('Conquista desbloqueada!', [
    'badge_id' => $badge_id,
    'xp_gained' => $xp
]);
