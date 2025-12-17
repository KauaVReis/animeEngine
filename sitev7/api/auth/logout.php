<?php
/**
 * AnimeEngine v7 - Logout API
 * POST: Fazer logout
 */

require_once '../../includes/auth.php';

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

fazerLogout();

jsonSuccess('Logout realizado com sucesso!');
