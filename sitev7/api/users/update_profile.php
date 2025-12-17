<?php
/**
 * AnimeEngine v7 - Update Profile API
 * POST: Atualizar informações do perfil
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

requerLoginAPI();

$data = json_decode(file_get_contents('php://input'), true);
$conn = conectar();
$usuario_id = getUsuarioId();

$updates = [];

// Bio (máximo 500 caracteres)
if (isset($data['bio'])) {
    $bio = escape($conn, substr($data['bio'], 0, 500));
    $updates[] = "bio = '$bio'";
}

// Status emoji
if (isset($data['status_emoji'])) {
    $emojis_validos = ['🎮', '😴', '🔥', '📺', '⏸️', '🎯', '💤', '🚀', '🌙', '☕'];
    $emoji = in_array($data['status_emoji'], $emojis_validos) ? $data['status_emoji'] : '🎮';
    $updates[] = "status_emoji = '$emoji'";
}

// Moldura
if (isset($data['moldura'])) {
    $molduras_validas = ['default', 'gold', 'diamond', 'fire', 'rainbow', 'neon', 'sakura'];
    $moldura = in_array($data['moldura'], $molduras_validas) ? $data['moldura'] : 'default';
    $updates[] = "moldura = '$moldura'";
}

// Badges exibidos (máximo 3)
if (isset($data['badges_exibidos']) && is_array($data['badges_exibidos'])) {
    $badges = array_slice($data['badges_exibidos'], 0, 3);
    $badges_json = escape($conn, json_encode($badges));
    $updates[] = "badges_exibidos = '$badges_json'";
}

// Cor do nome
if (isset($data['cor_nome'])) {
    $cores_validas = ['default', 'gold', 'purple', 'red', 'blue', 'green', 'rainbow'];
    $cor = in_array($data['cor_nome'], $cores_validas) ? $data['cor_nome'] : 'default';
    $updates[] = "cor_nome = '$cor'";
}

// Perfil público
if (isset($data['perfil_publico'])) {
    $publico = $data['perfil_publico'] ? 1 : 0;
    $updates[] = "perfil_publico = $publico";
}

if (empty($updates)) {
    jsonError('Nada para atualizar');
}

$sql = "UPDATE usuarios SET " . implode(', ', $updates) . " WHERE id = $usuario_id";

if (mysqli_query($conn, $sql)) {
    mysqli_close($conn);
    jsonSuccess('Perfil atualizado!');
} else {
    mysqli_close($conn);
    jsonError('Erro ao atualizar perfil');
}
