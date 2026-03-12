<?php
/**
 * AnimeEngine v7 - Update Goals API
 * POST: Atualizar progresso das metas
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
$semana = date('Y-\WW');

// Construir UPDATE
$updates = [];
if (isset($data['episodios'])) {
    $updates[] = "episodios_atual = episodios_atual + " . intval($data['episodios']);
}
if (isset($data['minutos'])) {
    $updates[] = "minutos_atual = minutos_atual + " . intval($data['minutos']);
}
if (isset($data['completos'])) {
    $updates[] = "completos_atual = completos_atual + " . intval($data['completos']);
}

if (empty($updates)) {
    mysqli_close($conn);
    jsonError('Nada para atualizar');
}

// Garantir que existe
$sql = "INSERT IGNORE INTO metas_semanais (usuario_id, semana_ano) VALUES ($usuario_id, '$semana')";
mysqli_query($conn, $sql);

// Atualizar
$sql = "UPDATE metas_semanais SET " . implode(', ', $updates) . " 
        WHERE usuario_id = $usuario_id AND semana_ano = '$semana'";
mysqli_query($conn, $sql);

mysqli_close($conn);
jsonSuccess('Meta atualizada!');
