<?php
/**
 * AnimeEngine v7 - Healthcheck
 */

require_once '../includes/database.php';

header('Content-Type: application/json');

$startedAt = microtime(true);
$dbOk = false;
$dbMs = null;

$conn = conectar();
$dbStartedAt = microtime(true);
$result = dbSelect($conn, 'SELECT 1');
if ($result) {
    $dbOk = true;
    $dbMs = round((microtime(true) - $dbStartedAt) * 1000, 2);
}
mysqli_close($conn);

jsonResponse([
    'status' => $dbOk ? 'ok' : 'degraded',
    'app' => 'AnimeEngine v7',
    'time' => date('c'),
    'checks' => [
        'database' => [
            'ok' => $dbOk,
            'latency_ms' => $dbMs
        ]
    ],
    'duration_ms' => round((microtime(true) - $startedAt) * 1000, 2)
], $dbOk ? 200 : 503);
