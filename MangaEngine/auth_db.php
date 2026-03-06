<?php
/**
 * MangaEngine — Conexão MySQLi Segura
 * 
 * Arquivo de configuração e conexão com o banco de dados MySQL.
 * Usa exclusivamente a extensão mysqli com prepared statements.
 * Auto-cria o banco e a tabela de favoritos se não existirem.
 */

// === Configurações do Banco de Dados ===
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'manga_engine');
define('DB_PORT', 3306);

// === Headers de Segurança ===
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

/**
 * Cria e retorna uma conexão MySQLi segura.
 * Auto-cria o banco de dados e a tabela de favoritos.
 *
 * @return mysqli Instância da conexão ativa
 */
function getConnection(): mysqli {
    // Primeiro, conectar sem selecionar banco (para poder criá-lo)
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, '', DB_PORT);

    if ($conn->connect_error) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error'   => 'Falha na conexão com o banco de dados.',
            'detail'  => $conn->connect_error
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Definir charset para UTF-8
    if (!$conn->set_charset('utf8mb4')) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error'   => 'Falha ao definir charset UTF-8.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Criar o banco de dados se não existir
    $dbName = $conn->real_escape_string(DB_NAME);
    $conn->query("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // Selecionar o banco
    if (!$conn->select_db(DB_NAME)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error'   => 'Falha ao selecionar o banco de dados.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Criar tabela de favoritos se não existir
    $createTable = "
        CREATE TABLE IF NOT EXISTS `favorites` (
            `id`          INT AUTO_INCREMENT PRIMARY KEY,
            `anilist_id`  INT NOT NULL,
            `mangadex_id` VARCHAR(36) DEFAULT NULL,
            `title`       VARCHAR(500) NOT NULL,
            `cover_url`   TEXT DEFAULT NULL,
            `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_anilist` (`anilist_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";

    if (!$conn->query($createTable)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error'   => 'Falha ao criar tabela de favoritos.',
            'detail'  => $conn->error
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return $conn;
}
