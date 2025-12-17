<?php
/**
 * AnimeEngine v7 - Get Goals API
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

// Semana atual (formato: 2024-W50)
$semana = date('Y-\WW');

// Buscar ou criar meta
$sql = "SELECT * FROM metas_semanais WHERE usuario_id = $usuario_id AND semana_ano = '$semana'";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) === 0) {
    // Criar meta padrão
    $sql = "INSERT INTO metas_semanais (usuario_id, semana_ano) VALUES ($usuario_id, '$semana')";
    mysqli_query($conn, $sql);
    
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
