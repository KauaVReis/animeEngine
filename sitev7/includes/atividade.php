<?php
/**
 * AnimeEngine v7 - Sistema de Atividades
 * Registra e busca atividades do usuário
 */

/**
 * Registrar atividade
 */
function registrarAtividade($usuario_id, $tipo, $anime_id = null, $detalhes = []) {
    $conn = conectar();
    
    $detalhes_json = escape($conn, json_encode($detalhes));
    $anime_id_sql = $anime_id ? intval($anime_id) : 'NULL';
    
    $sql = "INSERT INTO atividades (usuario_id, tipo, anime_id, detalhes) 
            VALUES ($usuario_id, '$tipo', $anime_id_sql, '$detalhes_json')";
    
    mysqli_query($conn, $sql);
    mysqli_close($conn);
}

/**
 * Obter atividades recentes
 */
function getAtividades($usuario_id, $limite = 20) {
    $conn = conectar();
    
    $sql = "SELECT a.*, ac.titulo as anime_titulo, ac.imagem as anime_imagem
            FROM atividades a
            LEFT JOIN animes_cache ac ON a.anime_id = ac.anime_id
            WHERE a.usuario_id = $usuario_id
            ORDER BY a.criado_em DESC
            LIMIT $limite";
    
    $result = mysqli_query($conn, $sql);
    $atividades = [];
    
    while ($row = mysqli_fetch_assoc($result)) {
        $row['detalhes'] = json_decode($row['detalhes'], true);
        $atividades[] = $row;
    }
    
    mysqli_close($conn);
    return $atividades;
}

/**
 * Formatar atividade para exibição
 */
function formatarAtividade($atividade) {
    $tipo = $atividade['tipo'];
    $anime = $atividade['anime_titulo'] ?? 'Anime';
    $detalhes = $atividade['detalhes'] ?? [];
    
    switch ($tipo) {
        case 'add':
            return "Adicionou <strong>$anime</strong> à lista";
        case 'complete':
            return "Completou <strong>$anime</strong>";
        case 'rate':
            $nota = $detalhes['nota'] ?? '?';
            return "Avaliou <strong>$anime</strong> com ⭐ $nota";
        case 'favorite':
            return "Favoritou <strong>$anime</strong>";
        case 'achievement':
            $badge = $detalhes['badge'] ?? 'conquista';
            return "Desbloqueou a conquista <strong>$badge</strong>";
        case 'titulo':
            $titulo = $detalhes['titulo'] ?? 'título';
            return "Obteve o título <strong>$titulo</strong>";
        default:
            return "Fez algo misterioso";
    }
}
