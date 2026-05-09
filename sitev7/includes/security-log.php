<?php
/**
 * AnimeEngine v7 - Security Event Logging
 */

function logSecurityEvent($eventType, $userId = null, $details = [])
{
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir) && !mkdir($logDir, 0755, true) && !is_dir($logDir)) {
        error_log('Security log directory create failed: ' . $logDir);
        return;
    }

    $entry = [
        'timestamp' => date('c'),
        'event' => $eventType,
        'user_id' => $userId,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        'details' => $details
    ];

    error_log(json_encode($entry, JSON_UNESCAPED_SLASHES) . PHP_EOL, 3, $logDir . '/security.log');
}
