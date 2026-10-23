<?php
/**
 * AnimeEngine v8 - Sistema de Títulos
 * Verifica e desbloqueia títulos automaticamente com Prepared Statements obrigatórios (ZERO PDO)
 */

require_once __DIR__ . '/database.php';

/**
 * Verificar e desbloquear títulos do usuário via Prepared Statements
 * 
 * @param int $usuario_id
 * @return array
 */
function verificarTitulos(int $usuario_id): array
{
    $conn = conectar();
    $uid = (int)$usuario_id;
    $desbloqueados = [];
    
    // 1. Buscar dados de nível e streak do usuário
    $user = secure_fetch_one(
        $conn,
        "SELECT nivel, streak_atual FROM usuarios WHERE id = ?",
        "i",
        $uid
    );
    
    if (!$user) {
        mysqli_close($conn);
        return [];
    }
    
    $userNivel = (int)($user['nivel'] ?? 1);
    $userStreak = (int)($user['streak_atual'] ?? 0);
    
    // 2. Buscar contagem de animes completos por gênero
    $resGeneros = secure_query(
        $conn,
        "SELECT ac.generos, COUNT(*) as count 
         FROM listas_anime la 
         JOIN animes_cache ac ON la.anime_id = ac.anime_id 
         WHERE la.usuario_id = ? AND la.tipo_lista = 'completed'
         GROUP BY la.anime_id",
        "i",
        $uid
    );
    
    $generos_count = [];
    if ($resGeneros instanceof mysqli_result) {
        while ($row = mysqli_fetch_assoc($resGeneros)) {
            $generos = json_decode($row['generos'] ?? '[]', true) ?: [];
            foreach ($generos as $genero) {
                $generos_count[$genero] = ($generos_count[$genero] ?? 0) + 1;
            }
        }
        mysqli_free_result($resGeneros);
    }
    
    // 3. Total de animes completos
    $rowCompletos = secure_fetch_one(
        $conn,
        "SELECT COUNT(*) as total FROM listas_anime WHERE usuario_id = ? AND tipo_lista = 'completed'",
        "i",
        $uid
    );
    $completos = (int)($rowCompletos['total'] ?? 0);
    
    // 4. Buscar títulos que o usuário ainda não desbloqueou
    $resTitulos = secure_query(
        $conn,
        "SELECT t.* FROM titulos t 
         WHERE t.id NOT IN (SELECT titulo_id FROM usuarios_titulos WHERE usuario_id = ?)",
        "i",
        $uid
    );
    
    if ($resTitulos instanceof mysqli_result) {
        while ($titulo = mysqli_fetch_assoc($resTitulos)) {
            $requisito = json_decode($titulo['requisito'] ?? '{}', true) ?: [];
            $desbloqueou = false;
            $tipo = $titulo['tipo'] ?? '';
            
            switch ($tipo) {
                case 'nivel':
                    if (isset($requisito['nivel']) && $userNivel >= (int)$requisito['nivel']) {
                        $desbloqueou = true;
                    }
                    break;
                    
                case 'genero':
                    if (isset($requisito['genero'], $requisito['completos'])) {
                        $genero = $requisito['genero'];
                        $necessario = (int)$requisito['completos'];
                        if (($generos_count[$genero] ?? 0) >= $necessario) {
                            $desbloqueou = true;
                        }
                    }
                    break;
                    
                case 'secreto':
                    // Streak consecutivo
                    if (isset($requisito['streak']) && $userStreak >= (int)$requisito['streak']) {
                        $desbloqueou = true;
                    }
                    // Meta de animes completos
                    if (isset($requisito['completos']) && $completos >= (int)$requisito['completos']) {
                        $desbloqueou = true;
                    }
                    // Acesso noturno
                    if (isset($requisito['hora_min'], $requisito['hora_max'])) {
                        $hora = (int)date('G');
                        if ($hora >= (int)$requisito['hora_min'] && $hora < (int)$requisito['hora_max']) {
                            $desbloqueou = true;
                        }
                    }
                    break;
            }
            
            if ($desbloqueou) {
                secure_query(
                    $conn,
                    "INSERT IGNORE INTO usuarios_titulos (usuario_id, titulo_id) VALUES (?, ?)",
                    "ii",
                    $uid,
                    (int)$titulo['id']
                );
                $desbloqueados[] = $titulo;
            }
        }
        mysqli_free_result($resTitulos);
    }
    
    mysqli_close($conn);
    return $desbloqueados;
}

/**
 * Obter título ativo do usuário via Prepared Statement
 * 
 * @param int $usuario_id
 * @return array|null
 */
function getTituloAtivo(int $usuario_id): ?array
{
    $conn = conectar();
    $uid = (int)$usuario_id;
    
    $titulo = secure_fetch_one(
        $conn,
        "SELECT t.* FROM usuarios u 
         JOIN titulos t ON u.titulo_ativo = t.id 
         WHERE u.id = ?",
        "i",
        $uid
    );
    
    mysqli_close($conn);
    return $titulo;
}
