<?php
/**
 * AnimeEngine v7 - Get Atividade API
 * GET: Obter atividades recentes do usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/atividade.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

// Pode ver atividade de si mesmo ou de outro (se público)
$target_user = intval($_GET['user_id'] ?? 0);

if ($target_user) {
    // Verificar se perfil é público
    $conn = conectar();
    $sql = "SELECT perfil_publico FROM usuarios WHERE id = $target_user";
    $result = mysqli_query($conn, $sql);
    $user = mysqli_fetch_assoc($result);
    mysqli_close($conn);
    
    if (!$user) {
        jsonError('Usuário não encontrado', 404);
    }
    
    if (!$user['perfil_publico'] && (!estaLogado() || getUsuarioId() != $target_user)) {
        jsonError('Perfil privado');
    }
    
    $usuario_id = $target_user;
} else {
    requerLoginAPI();
    $usuario_id = getUsuarioId();
}

$limite = min(intval($_GET['limit'] ?? 20), 50);
$atividades = getAtividades($usuario_id, $limite);

// Formatar para exibição
$formatted = array_map(function($a) {
    return [
        'id' => $a['id'],
        'tipo' => $a['tipo'],
        'anime_id' => $a['anime_id'],
        'anime_titulo' => $a['anime_titulo'],
        'anime_imagem' => $a['anime_imagem'],
        'texto' => formatarAtividade($a),
        'tempo' => tempoRelativo($a['criado_em']),
        'criado_em' => $a['criado_em']
    ];
}, $atividades);

jsonResponse($formatted);

// Helper
function tempoRelativo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    
    if ($diff->d > 7) return $ago->format('d/m/Y');
    if ($diff->d > 0) return $diff->d . ' dia' . ($diff->d > 1 ? 's' : '') . ' atrás';
    if ($diff->h > 0) return $diff->h . 'h atrás';
    if ($diff->i > 0) return $diff->i . 'min atrás';
    return 'agora';
}
