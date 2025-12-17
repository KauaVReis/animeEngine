<?php
/**
 * AnimeEngine v7 - Profile Comments API
 * GET: Listar comentários
 * POST: Adicionar comentário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

$conn = conectar();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Listar comentários de um perfil
    $perfil_id = intval($_GET['perfil_id'] ?? 0);
    
    if ($perfil_id <= 0) {
        jsonError('ID de perfil inválido');
    }
    
    $sql = "SELECT c.*, u.username as autor_username 
            FROM comentarios_perfil c
            JOIN usuarios u ON c.autor_id = u.id
            WHERE c.perfil_id = $perfil_id
            ORDER BY c.criado_em DESC
            LIMIT 50";
    
    $result = mysqli_query($conn, $sql);
    $comentarios = [];
    
    while ($row = mysqli_fetch_assoc($result)) {
        $comentarios[] = $row;
    }
    
    mysqli_close($conn);
    jsonResponse($comentarios);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Adicionar comentário
    requerLoginAPI();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $perfil_id = intval($data['perfil_id'] ?? 0);
    $conteudo = trim($data['conteudo'] ?? '');
    
    if ($perfil_id <= 0) {
        jsonError('ID de perfil inválido');
    }
    
    if (empty($conteudo)) {
        jsonError('Comentário não pode estar vazio');
    }
    
    if (strlen($conteudo) > 500) {
        jsonError('Comentário muito longo (máx. 500 caracteres)');
    }
    
    $autor_id = getUsuarioId();
    $conteudo_safe = escape($conn, $conteudo);
    
    // Verificar se perfil existe e é público
    $sql = "SELECT perfil_publico FROM usuarios WHERE id = $perfil_id";
    $result = mysqli_query($conn, $sql);
    $perfil = mysqli_fetch_assoc($result);
    
    if (!$perfil) {
        mysqli_close($conn);
        jsonError('Perfil não encontrado', 404);
    }
    
    // Inserir comentário
    $sql = "INSERT INTO comentarios_perfil (perfil_id, autor_id, conteudo) 
            VALUES ($perfil_id, $autor_id, '$conteudo_safe')";
    
    if (mysqli_query($conn, $sql)) {
        $id = mysqli_insert_id($conn);
        
        // Buscar dados do autor
        $sql = "SELECT username FROM usuarios WHERE id = $autor_id";
        $result = mysqli_query($conn, $sql);
        $autor = mysqli_fetch_assoc($result);
        
        mysqli_close($conn);
        jsonSuccess('Comentário adicionado!', [
            'id' => $id,
            'autor_username' => $autor['username'],
            'conteudo' => $conteudo,
            'criado_em' => date('Y-m-d H:i:s')
        ]);
    } else {
        mysqli_close($conn);
        jsonError('Erro ao adicionar comentário');
    }
    
} else {
    jsonError('Método não permitido', 405);
}
