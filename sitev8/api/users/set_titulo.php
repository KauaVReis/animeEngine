<?php
/**
 * AnimeEngine v8 - Set Título Ativo API (Seguro)
 * POST: Definir título ativo
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';
require_once '../../includes/rate_limiter.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

verificar_rate_limit();
requerLoginAPI();

$data = json_decode(file_get_contents('php://input'), true);
$titulo_id = intval($data['titulo_id'] ?? 0);

$conn = conectar();
$usuario_id = getUsuarioId();

// Se título_id = 0, remover título — PREPARED
if ($titulo_id === 0) {
    secure_query($conn, "UPDATE usuarios SET titulo_ativo = NULL WHERE id = ?", "i", $usuario_id);
    mysqli_close($conn);
    jsonSuccess('Título removido');
}

// Verificar se usuário desbloqueou este título — PREPARED
$result = secure_query($conn, "SELECT 1 FROM usuarios_titulos WHERE usuario_id = ? AND titulo_id = ?", "ii", $usuario_id, $titulo_id);

if (!$result || mysqli_num_rows($result) === 0) {
    mysqli_close($conn);
    jsonError('Título não desbloqueado');
}

// Definir como ativo — PREPARED
secure_query($conn, "UPDATE usuarios SET titulo_ativo = ? WHERE id = ?", "ii", $titulo_id, $usuario_id);

mysqli_close($conn);
jsonSuccess('Título ativo atualizado!');
