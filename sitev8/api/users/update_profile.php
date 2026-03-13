<?php
/**
 * AnimeEngine v8 - Update Profile API (Seguro)
 * POST: Atualizar informações do perfil
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/rate_limiter.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

verificar_rate_limit();
requerLoginAPI();

$data = json_decode(file_get_contents('php://input'), true);
$conn = conectar();
$usuario_id = getUsuarioId();

// Construir UPDATE dinâmico com prepared statements
$sets = [];
$types = '';
$params = [];

// Bio (máximo 500 caracteres)
if (isset($data['bio'])) {
    $sets[] = "bio = ?";
    $types .= "s";
    $params[] = substr($data['bio'], 0, 500);
}

// Status emoji (validado contra whitelist)
if (isset($data['status_emoji'])) {
    $emojis_validos = ['🎮', '😴', '🔥', '📺', '⏸️', '🎯', '💤', '🚀', '🌙', '☕'];
    $emoji = in_array($data['status_emoji'], $emojis_validos) ? $data['status_emoji'] : '🎮';
    $sets[] = "status_emoji = ?";
    $types .= "s";
    $params[] = $emoji;
}

// Moldura (validado contra whitelist)
if (isset($data['moldura'])) {
    $molduras_validas = ['default', 'gold', 'diamond', 'fire', 'rainbow', 'neon', 'sakura'];
    $moldura = in_array($data['moldura'], $molduras_validas) ? $data['moldura'] : 'default';
    $sets[] = "moldura = ?";
    $types .= "s";
    $params[] = $moldura;
}

// Badges exibidos (máximo 3)
if (isset($data['badges_exibidos']) && is_array($data['badges_exibidos'])) {
    $badges = array_slice($data['badges_exibidos'], 0, 3);
    $sets[] = "badges_exibidos = ?";
    $types .= "s";
    $params[] = json_encode($badges);
}

// Cor do nome (validado contra whitelist)
if (isset($data['cor_nome'])) {
    $cores_validas = ['default', 'gold', 'purple', 'red', 'blue', 'green', 'rainbow'];
    $cor = in_array($data['cor_nome'], $cores_validas) ? $data['cor_nome'] : 'default';
    $sets[] = "cor_nome = ?";
    $types .= "s";
    $params[] = $cor;
}

// Perfil público
if (isset($data['perfil_publico'])) {
    $sets[] = "perfil_publico = ?";
    $types .= "i";
    $params[] = $data['perfil_publico'] ? 1 : 0;
}

// Waifu/Husbando
if (isset($data['waifu_personagem']) && is_array($data['waifu_personagem'])) {
    $waifu = [
        'nome' => substr(strip_tags($data['waifu_personagem']['nome'] ?? ''), 0, 100),
        'imagem' => filter_var($data['waifu_personagem']['imagem'] ?? '', FILTER_VALIDATE_URL) ? $data['waifu_personagem']['imagem'] : ''
    ];
    $sets[] = "waifu_personagem = ?";
    $types .= "s";
    $params[] = json_encode($waifu);
}

// Redes Sociais (validadas contra whitelist)
if (isset($data['redes_sociais']) && is_array($data['redes_sociais'])) {
    $allowed_socials = ['discord', 'twitter', 'instagram', 'youtube', 'twitch'];
    $socials = [];
    foreach ($allowed_socials as $network) {
        if (isset($data['redes_sociais'][$network])) {
            $socials[$network] = substr(strip_tags($data['redes_sociais'][$network]), 0, 100);
        }
    }
    $sets[] = "redes_sociais = ?";
    $types .= "s";
    $params[] = json_encode($socials);
}

if (empty($sets)) {
    jsonError('Nada para atualizar');
}

// WHERE id = ?
$types .= "i";
$params[] = $usuario_id;

$sql = "UPDATE usuarios SET " . implode(', ', $sets) . " WHERE id = ?";
$stmt = secure_query($conn, $sql, $types, ...$params);

if ($stmt) {
    mysqli_close($conn);
    jsonSuccess('Perfil atualizado!');
} else {
    mysqli_close($conn);
    jsonError('Erro ao atualizar perfil');
}
