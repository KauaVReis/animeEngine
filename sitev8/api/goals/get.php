<?php
/**
 * AnimeEngine v8 - Get Goals API (Seguro)
 * GET: Obter metas da semana atual
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método não permitido', 405);
}

requerLoginAPI();

$conn = conectar();
$usuario_id = getUsuarioId();
$semana = date('Y-\WW');

// Buscar meta — PREPARED
$result = secure_query($conn, "SELECT * FROM metas_semanais WHERE usuario_id = ? AND semana_ano = ?", "is", $usuario_id, $semana);

if (mysqli_num_rows($result) === 0) {
    // Criar meta padrão — PREPARED
    secure_query($conn, "INSERT INTO metas_semanais (usuario_id, semana_ano) VALUES (?, ?)", "is", $usuario_id, $semana);
    
    $goals = [
        'semana' => $semana,
        'episodios' => ['meta' => 10, 'atual' => 0],
        'minutos' => ['meta' => 240, 'atual' => 0],
        'completos' => ['meta' => 2, 'atual' => 0]
    ];
} else {
    $row = mysqli_fetch_assoc($result);
    $goals = [
        'semana' => $semana,
        'episodios' => ['meta' => intval($row['episodios_meta']), 'atual' => intval($row['episodios_atual'])],
        'minutos' => ['meta' => intval($row['minutos_meta']), 'atual' => intval($row['minutos_atual'])],
        'completos' => ['meta' => intval($row['completos_meta']), 'atual' => intval($row['completos_atual'])]
    ];
}

mysqli_close($conn);
jsonResponse($goals);
