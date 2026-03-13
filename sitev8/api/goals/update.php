<?php
/**
 * AnimeEngine v8 - Update Goals API (Seguro)
 * POST: Atualizar progresso das metas
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
$semana = date('Y-\WW');

// Construir UPDATE dinâmico com prepared statements
$sets = [];
$types = '';
$params = [];

if (isset($data['episodios'])) {
    $sets[] = "episodios_atual = episodios_atual + ?";
    $types .= "i";
    $params[] = intval($data['episodios']);
}
if (isset($data['minutos'])) {
    $sets[] = "minutos_atual = minutos_atual + ?";
    $types .= "i";
    $params[] = intval($data['minutos']);
}
if (isset($data['completos'])) {
    $sets[] = "completos_atual = completos_atual + ?";
    $types .= "i";
    $params[] = intval($data['completos']);
}

if (empty($sets)) {
    mysqli_close($conn);
    jsonError('Nada para atualizar');
}

// Garantir que existe — PREPARED
secure_query($conn, "INSERT IGNORE INTO metas_semanais (usuario_id, semana_ano) VALUES (?, ?)", "is", $usuario_id, $semana);

// Atualizar — PREPARED (dinâmico)
$types .= "is";
$params[] = $usuario_id;
$params[] = $semana;

$sql = "UPDATE metas_semanais SET " . implode(', ', $sets) . " WHERE usuario_id = ? AND semana_ano = ?";
secure_query($conn, $sql, $types, ...$params);

mysqli_close($conn);
jsonSuccess('Meta atualizada!');
