-- ============================================
-- AnimeEngine v7 - Database Schema
-- Executar no phpMyAdmin
-- ============================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS animeengine_v7 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE animeengine_v7;

-- ============================================
-- Tabela de Usuários
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    xp INT DEFAULT 0,
    nivel INT DEFAULT 1,
    tema VARCHAR(20) DEFAULT 'default',
    idioma VARCHAR(10) DEFAULT 'pt-br',
    sfw TINYINT(1) DEFAULT 1,
    particulas TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP NULL
);

-- ============================================
-- Tabela de Sessões
-- ============================================
CREATE TABLE IF NOT EXISTS sessoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip VARCHAR(45),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Index para busca rápida de token
CREATE INDEX idx_token ON sessoes(token);

-- ============================================
-- Tabela de Cache de Animes
-- ============================================
CREATE TABLE IF NOT EXISTS animes_cache (
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
);

-- ============================================
-- Tabela de Listas de Anime
-- ============================================
CREATE TABLE IF NOT EXISTS listas_anime (
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
);

-- Index para busca por usuário
CREATE INDEX idx_usuario_lista ON listas_anime(usuario_id, tipo_lista);

-- ============================================
-- Tabela de Conquistas/Achievements
-- ============================================
CREATE TABLE IF NOT EXISTS conquistas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    badge_id VARCHAR(50) NOT NULL,
    desbloqueado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (usuario_id, badge_id)
);

-- ============================================
-- Tabela de Metas Semanais
-- ============================================
CREATE TABLE IF NOT EXISTS metas_semanais (
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
);

-- ============================================
-- Executar este SQL no phpMyAdmin!
-- ============================================
