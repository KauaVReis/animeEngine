<?php
/**
 * AnimeEngine v7 - File-based Rate Limiting
 */

function checkRateLimit($endpoint, $limit = 5, $window = 300)
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = hash('sha256', $endpoint . '|' . $ip);
    $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'animeengine_rate_' . $key . '.json';
    $now = time();
    $attempts = [];

    $handle = fopen($file, 'c+');
    if (!$handle) {
        error_log('Rate limit file open failed: ' . $file);
        return;
    }

    flock($handle, LOCK_EX);
    $contents = stream_get_contents($handle);

    if ($contents) {
        $decoded = json_decode($contents, true);
        if (is_array($decoded)) {
            $attempts = $decoded;
        }
    }

    $attempts = array_values(array_filter($attempts, function ($timestamp) use ($now, $window) {
        return is_int($timestamp) && ($timestamp + $window) > $now;
    }));

    if (count($attempts) >= $limit) {
        flock($handle, LOCK_UN);
        fclose($handle);
        jsonError('Muitas requisições. Tente novamente mais tarde.', 429);
    }

    $attempts[] = $now;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($attempts));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}
