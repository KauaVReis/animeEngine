<?php
/**
 * AnimeEngine v8 - Sistema de Streak
 * Gerencia dias consecutivos de acesso com Prepared Statements obrigatórios (ZERO PDO)
 */

require_once __DIR__ . '/database.php';

/**
 * Verifica e atualiza o streak do usuário após login bem-sucedido
 * 
 * @param int $usuario_id
 * @return array
 */
function verificarStreak(int $usuario_id): array
{
    $conn = conectar();
    $uid = (int)$usuario_id;
    
    // Buscar dados atuais via prepared statement
    $user = secure_fetch_one(
        $conn,
        "SELECT streak_atual, streak_max, ultimo_acesso_streak FROM usuarios WHERE id = ?",
        "i",
        $uid
    );
    
    if (!$user) {
        mysqli_close($conn);
        return ['streak' => 1, 'max' => 1, 'xp_bonus' => 0, 'new' => false];
    }
    
    $hoje = date('Y-m-d');
    $ultimo = $user['ultimo_acesso_streak'];
    $streak_atual = (int)($user['streak_atual'] ?? 0);
    $streak_max = (int)($user['streak_max'] ?? 0);
    
    // Se nunca acessou
    if (empty($ultimo)) {
        $streak_atual = 1;
    }
    // Se é hoje - já contou neste dia
    elseif ($ultimo === $hoje) {
        mysqli_close($conn);
        return ['streak' => $streak_atual, 'max' => $streak_max, 'new' => false];
    }
    // Se foi ontem - continua streak consecutivo
    elseif ($ultimo === date('Y-m-d', strtotime('-1 day'))) {
        $streak_atual++;
    }
    // Se foi antes de ontem - quebrou o streak
    else {
        $streak_atual = 1;
    }
    
    // Atualizar streak máximo histórico
    if ($streak_atual > $streak_max) {
        $streak_max = $streak_atual;
    }
    
    // XP bônus por streak
    $xp_bonus = 0;
    if ($streak_atual === 7) {
        $xp_bonus = 50;       // 1 semana
    } elseif ($streak_atual === 30) {
        $xp_bonus = 200;      // 1 mês
    } elseif ($streak_atual === 100) {
        $xp_bonus = 500;      // 100 dias
    } elseif ($streak_atual % 7 === 0) {
        $xp_bonus = 10;       // A cada semana fechada
    }
    
    // Atualizar banco via Prepared Statements
    if ($xp_bonus > 0) {
        secure_query(
            $conn,
            "UPDATE usuarios SET streak_atual = ?, streak_max = ?, ultimo_acesso_streak = ?, xp = xp + ? WHERE id = ?",
            "iisii",
            $streak_atual,
            $streak_max,
            $hoje,
            $xp_bonus,
            $uid
        );
    } else {
        secure_query(
            $conn,
            "UPDATE usuarios SET streak_atual = ?, streak_max = ?, ultimo_acesso_streak = ? WHERE id = ?",
            "iisi",
            $streak_atual,
            $streak_max,
            $hoje,
            $uid
        );
    }
    
    mysqli_close($conn);
    
    return [
        'streak' => $streak_atual,
        'max' => $streak_max,
        'xp_bonus' => $xp_bonus,
        'new' => true
    ];
}

/**
 * Obter dados de streak do usuário via Prepared Statement
 * 
 * @param int $usuario_id
 * @return array
 */
function getStreak(int $usuario_id): array
{
    $conn = conectar();
    $uid = (int)$usuario_id;
    
    $user = secure_fetch_one(
        $conn,
        "SELECT streak_atual, streak_max, ultimo_acesso_streak FROM usuarios WHERE id = ?",
        "i",
        $uid
    );
    
    mysqli_close($conn);
    
    if (!$user) {
        return [
            'atual' => 0,
            'max' => 0,
            'ultimo' => null
        ];
    }
    
    return [
        'atual' => (int)($user['streak_atual'] ?? 0),
        'max' => (int)($user['streak_max'] ?? 0),
        'ultimo' => $user['ultimo_acesso_streak'] ?? null
    ];
}
