<?php
/**
 * AnimeEngine v7 - Total Episodes Lightweight API
 * Retorna um dicionário JSON simplificado com as contagens de episódios cacheadas
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=3600'); // Cache no navegador por 1h

$cacheDir = __DIR__ . '/cache/';
$masterFile = $cacheDir . '_master_counts.json';
$cacheTime = 3600; // 1 hr server-side cache

// Retornar master cache se existir e for recente
if (file_exists($masterFile) && (time() - filemtime($masterFile) < $cacheTime)) {
    echo file_get_contents($masterFile);
    exit;
}

$counts = [];

if (is_dir($cacheDir)) {
    $files = glob($cacheDir . '*.json');
    foreach ($files as $file) {
        $basename = basename($file);
        if ($basename === '_master_counts.json')
            continue;

        $content = file_get_contents($file);
        $data = json_decode($content, true);

        if (isset($data['anime']) && isset($data['episodes']) && isset($data['slug'])) {
            $animeLower = mb_strtolower(trim($data['anime']), 'UTF-8');
            $slug = mb_strtolower(trim($data['slug']), 'UTF-8');
            $epCount = count($data['episodes']);

            // Registra pelo titulo original
            $counts[$animeLower] = $epCount;
            // Registra pelo slug criado na tentativa para ser mais robusto
            $counts[$slug] = $epCount;
        }
    }
}

$output = json_encode($counts);
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0777, true);
}
file_put_contents($masterFile, $output);

echo $output;
