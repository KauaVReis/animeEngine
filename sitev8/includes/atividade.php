<?php
/**
 * AnimeEngine v8 - Sistema de Atividades
 * Registra e busca atividades do usuário com Prepared Statements obrigatórios (ZERO PDO)
 */

require_once __DIR__ . '/database.php';

/**
 * Registrar atividade do usuário via Prepared Statement
 * 
 * @param int $usuario_id
 * @param string $tipo
 * @param int|null $anime_id
 * @param array $detalhes
 * @return bool
 */
function registrarAtividade(int $usuario_id, string $tipo, ?int $anime_id = null, array $detalhes = []): bool
{
    $conn = conectar();
    $uid = (int)$usuario_id;
    $tipo = substr(trim($tipo), 0, 50);
    $detalhes_json = json_encode($detalhes ?: new stdClass(), JSON_UNESCAPED_UNICODE);
    
    if ($anime_id !== null && $anime_id > 0) {
        $stmt = secure_query(
            $conn,
            "INSERT INTO atividades (usuario_id, tipo, anime_id, detalhes) VALUES (?, ?, ?, ?)",
            "isis",
            $uid,
            $tipo,
            (int)$anime_id,
            $detalhes_json
        );
    } else {
        $stmt = secure_query(
            $conn,
            "INSERT INTO atividades (usuario_id, tipo, anime_id, detalhes) VALUES (?, ?, NULL, ?)",
            "iss",
            $uid,
            $tipo,
            $detalhes_json
        );
    }
    
    $success = ($stmt !== false);
    mysqli_close($conn);
    return $success;
}

/**
 * Obter atividades recentes do usuário via Prepared Statement
 * 
 * @param int $usuario_id
 * @param int $limite
 * @return array
 */
function getAtividades(int $usuario_id, int $limite = 20): array
{
    $conn = conectar();
    $uid = (int)$usuario_id;
    $limite = max(1, min(100, (int)$limite));
    
    $result = secure_query(
        $conn,
        "SELECT a.*, ac.titulo as anime_titulo, ac.imagem as anime_imagem
         FROM atividades a
         LEFT JOIN animes_cache ac ON a.anime_id = ac.anime_id
         WHERE a.usuario_id = ?
         ORDER BY a.criado_em DESC
         LIMIT ?",
        "ii",
        $uid,
        $limite
    );
    
    $atividades = [];
    if ($result instanceof mysqli_result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $row['detalhes'] = json_decode($row['detalhes'] ?? '{}', true) ?: [];
            $atividades[] = $row;
        }
        mysqli_free_result($result);
    }
    
    mysqli_close($conn);
    return $atividades;
}

/**
 * Formatar atividade para exibição com proteção contra XSS
 * 
 * @param array $atividade
 * @return string
 */
function formatarAtividade(array $atividade): string
{
    $tipo = $atividade['tipo'] ?? '';
    $anime = htmlspecialchars($atividade['anime_titulo'] ?? 'Anime', ENT_QUOTES, 'UTF-8');
    $detalhes = is_array($atividade['detalhes'] ?? null) ? $atividade['detalhes'] : [];
    
    switch ($tipo) {
        case 'add':
            return "Adicionou <strong>{$anime}</strong> à lista";
        case 'complete':
            return "Completou <strong>{$anime}</strong>";
        case 'rate':
            $nota = htmlspecialchars((string)($detalhes['nota'] ?? '?'), ENT_QUOTES, 'UTF-8');
            return "Avaliou <strong>{$anime}</strong> com ⭐ {$nota}";
        case 'favorite':
            return "Favoritou <strong>{$anime}</strong>";
        case 'achievement':
            $badge = htmlspecialchars((string)($detalhes['badge'] ?? 'conquista'), ENT_QUOTES, 'UTF-8');
            return "Desbloqueou a conquista <strong>{$badge}</strong>";
        case 'titulo':
            $titulo = htmlspecialchars((string)($detalhes['titulo'] ?? 'título'), ENT_QUOTES, 'UTF-8');
            return "Obteve o título <strong>{$titulo}</strong>";
        default:
            return "Fez uma nova atividade";
    }
}
