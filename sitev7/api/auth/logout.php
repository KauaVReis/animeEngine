<?php
/**
 * AnimeEngine v7 - Logout API
 * POST: Fazer logout
 */

require_once '../../includes/auth.php';

// Headers
// header('Content-Type: application/json');
setCorsHeaders('POST, GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

fazerLogout();

// jsonSuccess('Logout realizado com sucesso!');
header('Location: ../../login.php');
