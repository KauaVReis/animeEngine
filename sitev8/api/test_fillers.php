<?php
/**
 * AnimeEngine v8 - Test Endpoint Deactivated
 */
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['error' => true, 'message' => 'Endpoint de teste desativado.']);
exit;
