<?php
/**
 * AnimeEngine v8 - Test Endpoint Deactivated
 * Desativado permanentemente para prevenção de bypass de autenticação.
 */
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['error' => true, 'message' => 'Endpoint de teste desativado.']);
exit;
