<?php
/**
 * AnimeEngine v7 - Database Connection
 * Conexão com MySQL usando mysqli
 */

function loadEnvFile($path)
{
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");

        if ($key !== '' && getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }
}

loadEnvFile(__DIR__ . '/../.env');

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'animeengine_v7');
define('DB_PORT', getenv('DB_PORT') ?: '3308');

require_once __DIR__ . '/security-headers.php';
require_once __DIR__ . '/logger.php';

/**
 * Definir headers CORS para APIs.
 */
function setCorsHeaders($methods = 'POST, OPTIONS')
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $allowedHosts = array_filter([
        $host,
        'localhost',
        '127.0.0.1'
    ]);

    if ($origin) {
        $originHost = parse_url($origin, PHP_URL_HOST);
        if ($originHost && in_array($originHost, $allowedHosts, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }
    }

    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
    header('Access-Control-Allow-Methods: ' . $methods);
}

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
 * Executar query preparada.
 */
function dbStatement($conn, $sql, $types = '', $params = [])
{
    $startedAt = microtime(true);
    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        logAppEvent('database.log', 'sql_prepare_error', [
            'error' => mysqli_error($conn),
            'sql' => $sql
        ]);
        return false;
    }

    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }

    if (!mysqli_stmt_execute($stmt)) {
        logAppEvent('database.log', 'sql_execute_error', [
            'error' => mysqli_stmt_error($stmt),
            'sql' => $sql
        ]);
        mysqli_stmt_close($stmt);
        return false;
    }

    $durationMs = round((microtime(true) - $startedAt) * 1000, 2);
    if ($durationMs >= 500) {
        logAppEvent('database.log', 'slow_query', [
            'duration_ms' => $durationMs,
            'sql' => $sql
        ]);
    }

    return $stmt;
}

/**
 * Executar SELECT preparado e retornar resultado.
 */
function dbSelect($conn, $sql, $types = '', $params = [])
{
    $stmt = dbStatement($conn, $sql, $types, $params);

    if (!$stmt) {
        return false;
    }

    return mysqli_stmt_get_result($stmt);
}

/**
 * Retornar resposta JSON
 */
function jsonResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    if ($statusCode >= 400 || !empty($data['error'])) {
        logAppEvent('api.log', 'api_error_response', [
            'status_code' => $statusCode,
            'message' => $data['message'] ?? null
        ]);
    }
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
