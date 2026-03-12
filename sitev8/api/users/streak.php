<?php
/**
 * AnimeEngine v7 - Get Streak API
 * GET: Obter streak do usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/streak.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

requerLoginAPI();

$usuario_id = getUsuarioId();

// Verificar streak (caso não tenha sido verificado ainda hoje)
$streak = verificarStreak($usuario_id);

jsonResponse([
    'streak_atual' => $streak['streak'],
    'streak_max' => $streak['max'],
    'xp_bonus' => $streak['xp_bonus'] ?? 0,
    'is_new_day' => $streak['new'] ?? false
]);
