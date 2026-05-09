<?php
/**
 * AnimeEngine v7 - Application Logging
 */

function logAppEvent($fileName, $eventType, $details = [])
{
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir) && !mkdir($logDir, 0755, true) && !is_dir($logDir)) {
        error_log('Log directory create failed: ' . $logDir);
        return;
    }

    $entry = [
        'timestamp' => date('c'),
        'event' => $eventType,
        'method' => $_SERVER['REQUEST_METHOD'] ?? null,
        'uri' => $_SERVER['REQUEST_URI'] ?? null,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        'details' => $details
    ];

    error_log(json_encode($entry, JSON_UNESCAPED_SLASHES) . PHP_EOL, 3, $logDir . '/' . $fileName);
}
