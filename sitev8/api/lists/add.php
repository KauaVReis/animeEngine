<?php
/**
 * AnimeEngine v8 - Add to List API (Seguro)
 * POST: Adicionar anime à lista do usuário
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/atividade.php';
require_once '../../includes/rate_limiter.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

verificar_rate_limit();
requerLoginAPI();

// Receber dados
$data = json_decode(file_get_contents('php://input'), true);

$anime_id = intval($data['anime_id'] ?? 0);
$tipo_lista = $data['tipo_lista'] ?? 'planToWatch';
$anime_data = $data['anime_data'] ?? [];

// Validações
if ($anime_id <= 0) {
    jsonError('ID do anime inválido');
}

$tipos_validos = ['watching', 'planToWatch', 'completed', 'paused', 'dropped'];
if (!in_array($tipo_lista, $tipos_validos)) {
    jsonError('Tipo de lista inválido');
}

$conn = conectar();
$usuario_id = getUsuarioId();

// Salvar/atualizar cache do anime — PREPARED STATEMENT
$titulo = $anime_data['title'] ?? 'Sem título';
$titulo_en = $anime_data['titleEn'] ?? '';
$imagem = $anime_data['image'] ?? '';
$episodios = intval($anime_data['episodes'] ?? 0);
$nota_anime = floatval($anime_data['score'] ?? 0);
$status = $anime_data['status'] ?? '';
$sinopse = $anime_data['synopsis'] ?? '';
$generos = json_encode($anime_data['genres'] ?? []);
$estudios = json_encode($anime_data['studios'] ?? []);
$trailer = $anime_data['trailer'] ?? '';
$ano = intval($anime_data['year'] ?? 0);

secure_query(
    $conn,
    "INSERT INTO animes_cache 
    (anime_id, titulo, titulo_en, imagem, episodios, nota, status, sinopse, generos, estudios, trailer, ano)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        titulo = VALUES(titulo),
        imagem = VALUES(imagem),
        episodios = VALUES(episodios),
        nota = VALUES(nota)",
    "isssidssssis",
    $anime_id, $titulo, $titulo_en, $imagem, $episodios, $nota_anime,
    $status, $sinopse, $generos, $estudios, $trailer, $ano
);

// Adicionar à lista do usuário — PREPARED STATEMENT
$progresso_final = ($tipo_lista === 'completed') ? $episodios : 0;

$stmt = secure_query(
    $conn,
    "INSERT INTO listas_anime (usuario_id, anime_id, tipo_lista, progresso)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        tipo_lista = VALUES(tipo_lista),
        progresso = GREATEST(progresso, VALUES(progresso)),
        atualizado_em = NOW()",
    "iisi",
    $usuario_id, $anime_id, $tipo_lista, $progresso_final
);

if ($stmt) {
    $tipo_atividade = $tipo_lista === 'completed' ? 'complete' : 'add';
    registrarAtividade($usuario_id, $tipo_atividade, $anime_id, ['titulo' => $anime_data['title'] ?? '']);

    mysqli_close($conn);

    jsonSuccess('Anime adicionado à lista!', [
        'anime_id' => $anime_id,
        'tipo_lista' => $tipo_lista
    ]);
} else {
    mysqli_close($conn);
    jsonError('Erro ao adicionar anime');
}
