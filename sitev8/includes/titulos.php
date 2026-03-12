<?php
/**
 * AnimeEngine v7 - Sistema de Títulos
 * Verifica e desbloqueia títulos automaticamente
 */

/**
 * Verificar e desbloquear títulos do usuário
 */
function verificarTitulos($usuario_id) {
    $conn = conectar();
    $desbloqueados = [];
    
    // Buscar dados do usuário
    $sql = "SELECT nivel, streak_atual FROM usuarios WHERE id = $usuario_id";
    $result = mysqli_query($conn, $sql);
    $user = mysqli_fetch_assoc($result);
    
    // Buscar contagem de gêneros
    $sql = "SELECT ac.generos, COUNT(*) as count 
            FROM listas_anime la 
            JOIN animes_cache ac ON la.anime_id = ac.anime_id 
            WHERE la.usuario_id = $usuario_id AND la.tipo_lista = 'completed'
            GROUP BY la.anime_id";
    $result = mysqli_query($conn, $sql);
    
    $generos_count = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $generos = json_decode($row['generos'], true) ?: [];
        foreach ($generos as $genero) {
            $generos_count[$genero] = ($generos_count[$genero] ?? 0) + 1;
        }
    }
    
    // Total de completos
    $sql = "SELECT COUNT(*) as total FROM listas_anime WHERE usuario_id = $usuario_id AND tipo_lista = 'completed'";
    $result = mysqli_query($conn, $sql);
    $completos = mysqli_fetch_assoc($result)['total'];
    
    // Buscar todos os títulos não desbloqueados
    $sql = "SELECT t.* FROM titulos t 
            WHERE t.id NOT IN (SELECT titulo_id FROM usuarios_titulos WHERE usuario_id = $usuario_id)";
    $result = mysqli_query($conn, $sql);
    
    while ($titulo = mysqli_fetch_assoc($result)) {
        $requisito = json_decode($titulo['requisito'], true);
        $desbloqueou = false;
        
        switch ($titulo['tipo']) {
            case 'nivel':
                if (isset($requisito['nivel']) && $user['nivel'] >= $requisito['nivel']) {
                    $desbloqueou = true;
                }
                break;
                
            case 'genero':
                if (isset($requisito['genero']) && isset($requisito['completos'])) {
                    $genero = $requisito['genero'];
                    $necessario = $requisito['completos'];
                    if (($generos_count[$genero] ?? 0) >= $necessario) {
                        $desbloqueou = true;
                    }
                }
                break;
                
            case 'secreto':
                // Streak
                if (isset($requisito['streak']) && $user['streak_atual'] >= $requisito['streak']) {
                    $desbloqueou = true;
                }
                // Complecionista
                if (isset($requisito['completos']) && $completos >= $requisito['completos']) {
                    $desbloqueou = true;
                }
                // Hora (noturno)
                if (isset($requisito['hora_min']) && isset($requisito['hora_max'])) {
                    $hora = (int) date('G');
                    if ($hora >= $requisito['hora_min'] && $hora < $requisito['hora_max']) {
                        $desbloqueou = true;
                    }
                }
                break;
        }
        
        if ($desbloqueou) {
            $sql2 = "INSERT IGNORE INTO usuarios_titulos (usuario_id, titulo_id) VALUES ($usuario_id, {$titulo['id']})";
            mysqli_query($conn, $sql2);
            $desbloqueados[] = $titulo;
        }
    }
    
    mysqli_close($conn);
    return $desbloqueados;
}

/**
 * Obter título ativo do usuário
 */
function getTituloAtivo($usuario_id) {
    $conn = conectar();
    
    $sql = "SELECT t.* FROM usuarios u 
            JOIN titulos t ON u.titulo_ativo = t.id 
            WHERE u.id = $usuario_id";
    $result = mysqli_query($conn, $sql);
    
    if (mysqli_num_rows($result) === 0) {
        mysqli_close($conn);
        return null;
    }
    
    $titulo = mysqli_fetch_assoc($result);
    mysqli_close($conn);
    return $titulo;
}
