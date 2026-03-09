<?php
/**
 * AnimeEngine v7 - Filler API Scraper
 * Source: AnimeFillerList
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, must-revalidate');

$anime = $_GET['anime'] ?? '';

if (empty($anime)) {
    echo json_encode(['error' => 'No anime specified']);
    exit;
}

// 1. Tratamento de Input
function sanitizeTitle($title)
{
    // Limpeza de sufixos comuns que atrapalham o slug
    $title = preg_replace('/\s+\(TV\)$/i', '', $title);
    $title = preg_replace('/\s+Season\s+\d+$/i', '', $title);
    $title = preg_replace('/:.*$/', '', $title); // Remover subtítulos após dois pontos

    $title = mb_strtolower($title, 'UTF-8');

    // Substituir caracteres acentuados
    $replacements = [
        'ā' => 'a', 'ē' => 'e', 'ī' => 'i', 'ō' => 'o', 'ū' => 'u',
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
        'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
        'â' => 'a', 'ê' => 'e', 'î' => 'i', 'ô' => 'o', 'û' => 'u',
        'ã' => 'a', 'õ' => 'o', 'ç' => 'c'
    ];
    $title = strtr($title, $replacements);

    // Remover caracteres não permitidos
    $title = preg_replace('/[^a-z0-9\s-]/', '', $title);
    // Espaços para hífens
    $title = preg_replace('/\s+/', '-', trim($title));
    // Hífens duplos
    $title = preg_replace('/-+/', '-', $title);

    return $title;
}

$slug = sanitizeTitle($anime);
$cacheDir = __DIR__ . '/cache/';
$cacheFile = $cacheDir . $slug . '.json';
$cacheTime = 24 * 60 * 60; // 24h

// 6. Cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTime)) {
    echo file_get_contents($cacheFile);
    exit;
}

// 2. Requisição (Tentativas com variações de slug)
$slugsToTry = [$slug];
// Se o slug original tem hífens, tentar também a versão sem o que vem depois do último hífen se falhar? 
// Não, vamos simplificar: o AnimeFillerList costuma ser bem direto.

$html = false;
foreach ($slugsToTry as $currentSlug) {
    $url = "https://www.animefillerlist.com/shows/" . $currentSlug;
    $options = [
        'http' => [
            'method' => "GET",
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36\r\n"
        ]
    ];
    $context = stream_context_create($options);
    $html = @file_get_contents($url, false, $context);

    if ($html !== false) {
        $slug = $currentSlug;
        break;
    }
}

if ($html === false) {
    echo json_encode([
        'error' => 'Could not fetch data',
        'attempted_slug' => $slug,
        'msg' => 'Anime not found on AnimeFillerList. Check if the title matches their URL slug.'
    ]);
    exit;
}

// 3. Parsing
libxml_use_internal_errors(true);
$dom = new DOMDocument();
$dom->loadHTML($html);
$xpath = new DOMXPath($dom);

// Buscar as tabelas com a classe .fl_table ou .EpisodeList
$tables = $xpath->query("//table[contains(@class, 'fl_table') or contains(@class, 'EpisodeList')]");

$episodes = [];

foreach ($tables as $table) {
    // 4. Captura de Dados
    $rows = $xpath->query(".//tr", $table);

    foreach ($rows as $row) {
        $cols = $xpath->query("./td", $row);

        if ($cols->length >= 3) {
            $number = trim($cols->item(0)->nodeValue);
            $title = trim($cols->item(1)->nodeValue);
            $type = 'unknown';

            // A classificação deve ser baseada na classe CSS da linha
            $classAttr = $row->getAttribute('class');
            if (strpos($classAttr, 'mixed_canon/filler') !== false || strpos($classAttr, 'mixed') !== false) {
                $type = 'mixed';
            }
            elseif (strpos($classAttr, 'filler') !== false) {
                $type = 'filler';
            }
            elseif (strpos($classAttr, 'canon') !== false) {
                $type = 'canon';
            }

            $episodes[] = [
                'number' => $number,
                'title' => $title,
                'type' => $type
            ];
        }
    }
}

if (empty($episodes)) {
    echo json_encode(['error' => 'No episodes found', 'slug' => $slug]);
    exit;
}

$output = json_encode([
    'anime' => $anime,
    'slug' => $slug,
    'episodes' => $episodes,
    'updated_at' => date('c')
]);

// Salvar no cache
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0777, true);
}
file_put_contents($cacheFile, $output);

echo $output;
