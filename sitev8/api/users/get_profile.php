<?php
/**
 * AnimeEngine v8 - Get Profile API (Seguro)
 * GET: Obter dados do perfil (para edição ou visualização)
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

$conn = conectar();

// Ver perfil próprio ou de outro usuário
$username = $_GET['user'] ?? null;

if ($username) {
    // Ver perfil de outro usuário — PREPARED STATEMENT
    $result = secure_query(
        $conn,
        "SELECT id, username, bio, status_emoji, moldura, badges_exibidos, 
                cor_nome, perfil_publico, xp, nivel, criado_em
         FROM usuarios WHERE username = ?",
        "s",
        $username
    );
    
    if (!$result || mysqli_num_rows($result) === 0) {
        mysqli_close($conn);
        jsonError('Usuário não encontrado', 404);
    }
    
    $profile = mysqli_fetch_assoc($result);
    
    // Verificar se perfil é privado
    if (!$profile['perfil_publico'] && (!estaLogado() || getUsuarioId() != $profile['id'])) {
        mysqli_close($conn);
        jsonError('Este perfil é privado');
    }
    
    $is_own = estaLogado() && getUsuarioId() == $profile['id'];
    
} else {
    // Ver próprio perfil — PREPARED STATEMENT
    requerLoginAPI();
    $usuario_id = getUsuarioId();
    
    $result = secure_query(
        $conn,
        "SELECT id, username, email, bio, status_emoji, moldura, badges_exibidos, 
                cor_nome, perfil_publico, xp, nivel, criado_em
         FROM usuarios WHERE id = ?",
        "i",
        $usuario_id
    );
    $profile = mysqli_fetch_assoc($result);
    $is_own = true;
}

// Decodificar JSON
$profile['badges_exibidos'] = json_decode($profile['badges_exibidos'], true) ?: [];

// Adicionar flag
$profile['is_own'] = $is_own;

// Remover email se não for próprio perfil
if (!$is_own) {
    unset($profile['email']);
}

mysqli_close($conn);
jsonResponse($profile);
