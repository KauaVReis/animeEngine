<?php
/**
 * AnimeEngine v8 - Logout API
 * Fazer logout (Seguro)
 */

require_once '../../includes/auth.php';

// Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');

fazerLogout();

// Redirecionar para login
header('Location: ../../?page=login');
