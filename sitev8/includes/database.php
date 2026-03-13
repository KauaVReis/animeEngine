<?php
/**
 * AnimeEngine v8 - Database Connection & Security Layer
 * Conexão segura com MySQL usando mysqli + Prepared Statements obrigatórios
 * 
 * REGRAS DE OURO:
 * 1. NUNCA usar PDO
 * 2. SEMPRE usar secure_query() com bind_param — PROIBIDA concatenação de variáveis em queries
 * 3. TODAS as queries passam por prepared statements
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'animeengine_v7');
define('DB_PORT', '3308');

// ============================================================
// CONEXÃO
// ============================================================

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

// ============================================================
// QUERY SEGURA (PREPARED STATEMENTS)
// ============================================================

/**
 * Executa uma query parametrizada segura usando prepared statements.
 * PROIBIDO concatenar variáveis — use placeholders ? no SQL.
 *
 * @param mysqli $conn       Conexão mysqli
 * @param string $sql        Query SQL com placeholders ?
 * @param string $types      Tipos dos parâmetros: 's'=string, 'i'=int, 'd'=double, 'b'=blob
 * @param mixed  ...$params  Valores para bind (na mesma ordem dos ?)
 *
 * @return mysqli_result|bool  Resultado da query (result set para SELECT, bool para INSERT/UPDATE/DELETE)
 *
 * Exemplos:
 *   SELECT: $result = secure_query($conn, "SELECT * FROM usuarios WHERE id = ?", "i", $id);
 *   INSERT: secure_query($conn, "INSERT INTO lista (usuario_id, anime_id) VALUES (?, ?)", "ii", $uid, $aid);
 *   UPDATE: secure_query($conn, "UPDATE usuarios SET xp = ? WHERE id = ?", "ii", $xp, $id);
 */
function secure_query($conn, $sql, $types = '', ...$params)
{
    // Se não há parâmetros, executar diretamente (queries sem variáveis são seguras)
    if (empty($types) && empty($params)) {
        $result = mysqli_query($conn, $sql);
        if ($result === false) {
            error_log("[AnimeEngine] Query Error: " . mysqli_error($conn) . " | SQL: " . $sql);
        }
        return $result;
    }

    // Prepared Statement
    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        error_log("[AnimeEngine] Prepare Error: " . mysqli_error($conn) . " | SQL: " . $sql);
        return false;
    }

    // Bind params
    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }

    // Executar
    $success = mysqli_stmt_execute($stmt);

    if (!$success) {
        error_log("[AnimeEngine] Execute Error: " . mysqli_stmt_error($stmt));
        mysqli_stmt_close($stmt);
        return false;
    }

    // Para SELECT: retorna result set
    $result = mysqli_stmt_get_result($stmt);
    if ($result !== false) {
        // É um SELECT — retorna o result set (compatível com mysqli_fetch_assoc)
        return $result;
    }

    // Para INSERT/UPDATE/DELETE: retorna o statement para acesso a affected_rows e insert_id
    return $stmt;
}

/**
 * Obter o último ID inserido após INSERT
 */
function last_insert_id($conn)
{
    return mysqli_insert_id($conn);
}

/**
 * Obter quantidade de linhas afetadas pelo último UPDATE/DELETE via statement
 */
function affected_rows_stmt($stmt)
{
    if ($stmt instanceof mysqli_stmt) {
        return mysqli_stmt_affected_rows($stmt);
    }
    return 0;
}

// ============================================================
// CSRF PROTECTION
// ============================================================

/**
 * Gerar ou obter token CSRF da sessão atual
 */
function csrf_token()
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Gerar campo hidden do CSRF para formulários HTML
 */
function csrf_field()
{
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrf_token()) . '">';
}

/**
 * Validar token CSRF (para endpoints POST)
 * Procura em POST body, JSON body ou header X-CSRF-Token
 */
function validar_csrf()
{
    $token_sessao = $_SESSION['csrf_token'] ?? '';

    // 1. Buscar no POST normal
    $token_recebido = $_POST['csrf_token'] ?? '';

    // 2. Buscar no JSON body (para fetch com Content-Type: application/json)
    if (empty($token_recebido)) {
        $input = json_decode(file_get_contents('php://input'), true);
        $token_recebido = $input['csrf_token'] ?? '';
    }

    // 3. Buscar no header (para requests AJAX)
    if (empty($token_recebido)) {
        $token_recebido = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    }

    if (empty($token_sessao) || !hash_equals($token_sessao, $token_recebido)) {
        jsonError('Token CSRF inválido. Recarregue a página.', 403);
    }
}

// ============================================================
// RESPOSTAS JSON
// ============================================================

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

// ============================================================
// ESCAPE (mantido para retrocompatibilidade temporária)
// ============================================================

/**
 * @deprecated Use secure_query() com prepared statements em vez disso
 */
function escape($conn, $string)
{
    return mysqli_real_escape_string($conn, $string);
}
