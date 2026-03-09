<?php
require_once 'includes/database.php';
$conn = conectar();

$queries = [
    "CREATE TABLE IF NOT EXISTS animes_cache (
        anime_id INT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        titulo_en VARCHAR(255),
        imagem VARCHAR(500),
        episodios INT DEFAULT 0,
        nota DECIMAL(3,1),
        status VARCHAR(50),
        sinopse TEXT,
        generos JSON,
        estudios JSON,
        trailer VARCHAR(255),
        ano INT,
        temporada VARCHAR(20),
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS listas_anime (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        anime_id INT NOT NULL,
        tipo_lista ENUM('watching', 'planToWatch', 'completed', 'paused', 'dropped') NOT NULL,
        progresso INT DEFAULT 0,
        nota INT DEFAULT 0,
        favorito TINYINT(1) DEFAULT 0,
        notas_pessoais TEXT,
        adicionado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (anime_id) REFERENCES animes_cache(anime_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_anime (usuario_id, anime_id)
    )",
    "CREATE TABLE IF NOT EXISTS conquistas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        badge_id VARCHAR(50) NOT NULL,
        desbloqueado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_badge (usuario_id, badge_id)
    )",
    "CREATE TABLE IF NOT EXISTS metas_semanais (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        semana_ano VARCHAR(10) NOT NULL,
        episodios_meta INT DEFAULT 10,
        episodios_atual INT DEFAULT 0,
        minutos_meta INT DEFAULT 240,
        minutos_atual INT DEFAULT 0,
        completos_meta INT DEFAULT 2,
        completos_atual INT DEFAULT 0,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_week (usuario_id, semana_ano)
    )",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS streak_atual INT DEFAULT 0",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS streak_max INT DEFAULT 0",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso_streak DATE"
];

foreach ($queries as $sql) {
    if (mysqli_query($conn, $sql)) {
        echo "OK: " . substr($sql, 0, 40) . "...\n";
    } else {
        echo "ERROR: " . mysqli_error($conn) . "\n";
    }
}
mysqli_close($conn);
echo "Setup completo.";
?>