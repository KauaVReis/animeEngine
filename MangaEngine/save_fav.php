<?php
/**
 * MangaEngine — API de Favoritos
 * 
 * Endpoint REST para gerenciar mangás favoritos.
 * Todas as operações usam mysqli com prepared statements (bind_param).
 * 
 * Métodos:
 *   GET    → Listar todos os favoritos
 *   POST   → Adicionar/atualizar favorito
 *   DELETE → Remover favorito por anilist_id
 */

require_once __DIR__ . '/auth_db.php';

// === Headers CORS e JSON ===
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Obter conexão
$conn = getConnection();

// Determinar método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {

        // =============================================
        // GET — Listar todos os favoritos
        // =============================================
        case 'GET':
            $result = $conn->query("SELECT * FROM `favorites` ORDER BY `created_at` DESC");

            if (!$result) {
                throw new Exception('Erro ao buscar favoritos: ' . $conn->error);
            }

            $favorites = [];
            while ($row = $result->fetch_assoc()) {
                $favorites[] = $row;
            }
            $result->free();

            echo json_encode([
                'success' => true,
                'data'    => $favorites,
                'count'   => count($favorites)
            ], JSON_UNESCAPED_UNICODE);
            break;

        // =============================================
        // POST — Adicionar ou atualizar favorito
        // =============================================
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);

            // Validação dos campos obrigatórios
            if (empty($input['anilist_id']) || empty($input['title'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Campos obrigatórios: anilist_id, title'
                ], JSON_UNESCAPED_UNICODE);
                break;
            }

            $anilistId  = (int) $input['anilist_id'];
            $mangadexId = isset($input['mangadex_id']) ? trim($input['mangadex_id']) : null;
            $title      = trim($input['title']);
            $coverUrl   = isset($input['cover_url']) ? trim($input['cover_url']) : null;

            // Sanitização básica
            if ($anilistId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error'   => 'anilist_id deve ser um número positivo.'
                ], JSON_UNESCAPED_UNICODE);
                break;
            }

            if (mb_strlen($title) > 500) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Título excede o limite de 500 caracteres.'
                ], JSON_UNESCAPED_UNICODE);
                break;
            }

            // INSERT com ON DUPLICATE KEY UPDATE usando bind_param
            $sql = "INSERT INTO `favorites` (`anilist_id`, `mangadex_id`, `title`, `cover_url`)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        `mangadex_id` = VALUES(`mangadex_id`),
                        `title`       = VALUES(`title`),
                        `cover_url`   = VALUES(`cover_url`)";

            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception('Erro ao preparar statement: ' . $conn->error);
            }

            $stmt->bind_param('isss', $anilistId, $mangadexId, $title, $coverUrl);

            if (!$stmt->execute()) {
                throw new Exception('Erro ao salvar favorito: ' . $stmt->error);
            }

            $isNew = ($stmt->affected_rows === 1);
            $stmt->close();

            http_response_code($isNew ? 201 : 200);
            echo json_encode([
                'success' => true,
                'message' => $isNew ? 'Favorito adicionado!' : 'Favorito atualizado!',
                'data'    => [
                    'anilist_id'  => $anilistId,
                    'mangadex_id' => $mangadexId,
                    'title'       => $title,
                    'cover_url'   => $coverUrl
                ]
            ], JSON_UNESCAPED_UNICODE);
            break;

        // =============================================
        // DELETE — Remover favorito por anilist_id
        // =============================================
        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input['anilist_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Campo obrigatório: anilist_id'
                ], JSON_UNESCAPED_UNICODE);
                break;
            }

            $anilistId = (int) $input['anilist_id'];

            $stmt = $conn->prepare("DELETE FROM `favorites` WHERE `anilist_id` = ?");
            if (!$stmt) {
                throw new Exception('Erro ao preparar statement: ' . $conn->error);
            }

            $stmt->bind_param('i', $anilistId);

            if (!$stmt->execute()) {
                throw new Exception('Erro ao remover favorito: ' . $stmt->error);
            }

            $deleted = ($stmt->affected_rows > 0);
            $stmt->close();

            echo json_encode([
                'success' => true,
                'message' => $deleted ? 'Favorito removido!' : 'Favorito não encontrado.',
                'deleted' => $deleted
            ], JSON_UNESCAPED_UNICODE);
            break;

        // =============================================
        // Método não suportado
        // =============================================
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error'   => 'Método não permitido. Use GET, POST ou DELETE.'
            ], JSON_UNESCAPED_UNICODE);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Fechar conexão
$conn->close();
