<?php
/**
 * AnimeEngine v7 - Sistema de Streak
 * Gerencia dias consecutivos de acesso
 */

/**
 * Verifica e atualiza o streak do usuário
 * Chamar após login bem sucedido
 */
function verificarStreak($usuario_id) {
    $conn = conectar();
    $usuario_id = intval($usuario_id);
    
    // Buscar dados atuais
    $sql = "SELECT streak_atual, streak_max, ultimo_acesso_streak FROM usuarios WHERE id = ?";
    $result = dbSelect($conn, $sql, 'i', [$usuario_id]);
    $user = mysqli_fetch_assoc($result);

    if (!$user) {
        mysqli_close($conn);
        return ['streak' => 0, 'max' => 0, 'new' => false];
    }
    
    $hoje = date('Y-m-d');
    $ultimo = $user['ultimo_acesso_streak'];
    $streak_atual = intval($user['streak_atual']);
    $streak_max = intval($user['streak_max']);
    
    // Se nunca acessou
    if (!$ultimo) {
        $streak_atual = 1;
    }
    // Se é hoje - já contou
    elseif ($ultimo === $hoje) {
        // Não faz nada
        mysqli_close($conn);
        return ['streak' => $streak_atual, 'max' => $streak_max, 'new' => false];
    }
    // Se foi ontem - continua streak
    elseif ($ultimo === date('Y-m-d', strtotime('-1 day'))) {
        $streak_atual++;
    }
    // Se foi antes de ontem - perdeu streak
    else {
        $streak_atual = 1;
    }
    
    // Atualizar streak máximo
    if ($streak_atual > $streak_max) {
        $streak_max = $streak_atual;
    }
    
    // XP bônus por streak
    $xp_bonus = 0;
    if ($streak_atual == 7) $xp_bonus = 50;       // 1 semana
    elseif ($streak_atual == 30) $xp_bonus = 200; // 1 mês
    elseif ($streak_atual == 100) $xp_bonus = 500; // 100 dias
    elseif ($streak_atual % 7 == 0) $xp_bonus = 10; // a cada semana
    
    // Atualizar banco
    $sql = "UPDATE usuarios SET 
            streak_atual = ?, 
            streak_max = ?, 
            ultimo_acesso_streak = ?";
    
    if ($xp_bonus > 0) {
        $sql .= ", xp = xp + ?";
    }
    
    $sql .= " WHERE id = ?";

    if ($xp_bonus > 0) {
        dbStatement($conn, $sql, 'iisii', [$streak_atual, $streak_max, $hoje, $xp_bonus, $usuario_id]);
    } else {
        dbStatement($conn, $sql, 'iisi', [$streak_atual, $streak_max, $hoje, $usuario_id]);
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
 * Obter dados de streak do usuário
 */
function getStreak($usuario_id) {
    $conn = conectar();
    $usuario_id = intval($usuario_id);
    $sql = "SELECT streak_atual, streak_max, ultimo_acesso_streak FROM usuarios WHERE id = ?";
    $result = dbSelect($conn, $sql, 'i', [$usuario_id]);
    $user = mysqli_fetch_assoc($result);
    mysqli_close($conn);

    if (!$user) {
        return [
            'atual' => 0,
            'max' => 0,
            'ultimo' => null
        ];
    }
    
    return [
        'atual' => intval($user['streak_atual']),
        'max' => intval($user['streak_max']),
        'ultimo' => $user['ultimo_acesso_streak']
    ];
}
