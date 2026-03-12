<?php
/**
 * AnimeEngine v7 - Database Connection
 * Conexão com MySQL usando mysqli
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'animeengine_v7');
define('DB_PORT', '3308');

/**
 * Conectar ao banco de dados
 */
function conectar()
{
    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

    if (!$conn) {
        die(json_encode([
            'error' => true,
            'message' => 'Erro de conexão com o banco de dados'
        ]));
    }

    mysqli_set_charset($conn, 'utf8mb4');

    return $conn;
}

/**
 * Escapar string para prevenir SQL Injection
 */
function escape($conn, $string)
{
    return mysqli_real_escape_string($conn, $string);
}

/**
 * Retornar resposta JSON
 */
function jsonResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Retornar erro JSON
 */
function jsonError($message, $statusCode = 400)
{
    jsonResponse(['error' => true, 'message' => $message], $statusCode);
}

/**
 * Retornar sucesso JSON
 */
function jsonSuccess($message, $data = [])
{
    $response = ['success' => true, 'message' => $message];
    if (!empty($data)) {
        $response = array_merge($response, $data);
    }
    jsonResponse($response);
}
