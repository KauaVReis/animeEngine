<?php
session_start();
// Mock login for user 1
$_SESSION['usuario_id'] = 1;

// Call stats logic
ob_start();
try {
    include 'stats.php';
} catch (Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage();
}
$output = ob_get_clean();

echo "RAW OUTPUT:\n";
var_dump($output);
?>