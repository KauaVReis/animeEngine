<?php
/**
 * AnimeEngine v7 - Set Título Ativo API
 * POST: Definir título ativo
 */

require_once '../../includes/database.php';
require_once '../../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método não permitido', 405);
}

requerLoginAPI();

$data = json_decode(file_get_contents('php://input'), true);
$titulo_id = intval($data['titulo_id'] ?? 0);

$conn = conectar();
$usuario_id = getUsuarioId();

// Se título_id = 0, remover título
if ($titulo_id === 0) {
    $sql = "UPDATE usuarios SET titulo_ativo = NULL WHERE id = $usuario_id";
    mysqli_query($conn, $sql);
    mysqli_close($conn);
    jsonSuccess('Título removido');
}

// Verificar se usuário desbloqueou este título
$sql = "SELECT 1 FROM usuarios_titulos WHERE usuario_id = $usuario_id AND titulo_id = $titulo_id";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) === 0) {
    mysqli_close($conn);
    jsonError('Título não desbloqueado');
}

// Definir como ativo
$sql = "UPDATE usuarios SET titulo_ativo = $titulo_id WHERE id = $usuario_id";
mysqli_query($conn, $sql);

mysqli_close($conn);
jsonSuccess('Título ativo atualizado!');
