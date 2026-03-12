<?php
require_once 'includes/database.php';

$conn = conectar();

$sql = "ALTER TABLE usuarios ADD COLUMN waifu_personagem TEXT DEFAULT NULL;";

if (mysqli_query($conn, $sql)) {
    echo "Coluna 'waifu_personagem' adicionada com sucesso!<br>";
} else {
    echo "Erro (ou coluna já existe): " . mysqli_error($conn) . "<br>";
}

mysqli_close($conn);
?>