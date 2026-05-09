<?php
/**
 * AnimeEngine v7 - Simple File Cache
 */

function cacheDir()
{
    return __DIR__ . '/../api/cache/runtime';
}

function cachePath($key)
{
    return cacheDir() . '/' . hash('sha256', $key) . '.json';
}

function cacheGet($key)
{
    $path = cachePath($key);
    if (!is_readable($path)) {
        return null;
    }

    $payload = json_decode(file_get_contents($path), true);
    if (!is_array($payload) || ($payload['expires_at'] ?? 0) < time()) {
        @unlink($path);
        return null;
    }

    return $payload['data'] ?? null;
}

function cacheSet($key, $data, $ttl = 60)
{
    $dir = cacheDir();
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        error_log('Cache directory create failed: ' . $dir);
        return false;
    }

    $payload = [
        'key' => $key,
        'expires_at' => time() + $ttl,
        'data' => $data
    ];

    return file_put_contents(cachePath($key), json_encode($payload)) !== false;
}

function cacheDelete($key)
{
    $path = cachePath($key);
    if (is_file($path)) {
        @unlink($path);
    }
}

function clearUserCache($usuarioId)
{
    cacheDelete('user_lists:' . intval($usuarioId));
    cacheDelete('user_stats:' . intval($usuarioId));
}
