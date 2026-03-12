<?php
require_once 'includes/database.php';
$conn = conectar();

// Check if column exists
$check = mysqli_query($conn, "SHOW COLUMNS FROM usuarios LIKE 'redes_sociais'");
if (mysqli_num_rows($check) == 0) {
    echo "Adicionando coluna 'redes_sociais'...\n";
    $sql = "ALTER TABLE usuarios ADD COLUMN redes_sociais TEXT DEFAULT NULL";
    if (mysqli_query($conn, $sql)) {
        echo "Sucesso! Coluna criada.";
    } else {
        echo "Erro: " . mysqli_error($conn);
    }
} else {
    echo "Coluna 'redes_sociais' já existe.";
}
mysqli_close($conn);
?>