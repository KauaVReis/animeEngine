<?php
require_once 'includes/database.php';
require_once 'includes/auth.php';

// Mock login for user 1
$_SESSION['usuario_id'] = 1;

// Now include stats.php to see its output
ob_start();
try {
    include 'api/users/stats.php';
} catch (Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage();
}
$output = ob_get_clean();

echo "RAW OUTPUT:\n";
var_dump($output);
?>