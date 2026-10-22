-- ============================================================
-- AnimeEngine v8 - Radio Rooms Database Schema
-- Compatível com XAMPP MySQL / MariaDB (InnoDB, utf8mb4)
-- Executar no phpMyAdmin (Banco: animeengine_v7 ou animeengine_v8)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. TABELA PRINCIPAL DE SALAS (radio_salas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS radio_salas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE COMMENT 'UUIDv4 público para URL e conexões de clientes',
    slug VARCHAR(100) UNIQUE NULL COMMENT 'Slug opcional para canais oficiais/estáticos',
    criador_id INT NOT NULL COMMENT 'Usuário proprietário da sala',
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NULL,
    tipo ENUM('publica', 'privada', 'oficial') DEFAULT 'publica' NOT NULL,
    senha_hash VARCHAR(255) NULL COMMENT 'Hash da senha via password_hash() se privada',
    status ENUM('ativa', 'encerrada', 'arquivada') DEFAULT 'ativa' NOT NULL,
    tema_visual VARCHAR(50) DEFAULT 'default' COMMENT 'Tema neo-brutalist / anime da sala',
    max_ouvintes INT DEFAULT 50,
    tocando_agora_fila_id INT NULL COMMENT 'Ponteiro para item ativo de radio_fila',
    playback_started_at DATETIME(3) NULL COMMENT 'Momento do servidor em que a faixa começou (para drift sync)',
    playback_paused_at_sec INT DEFAULT 0 COMMENT 'Segundos decorridos caso pausado',
    is_paused TINYINT(1) DEFAULT 0,
    ouvintes_count INT DEFAULT 1 COMMENT 'Contador em cache de membros conectados',
    encerrada_em DATETIME NULL,
    arquivada_em DATETIME NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_salas_publicas (status, tipo, ouvintes_count DESC),
    INDEX idx_salas_uuid (uuid),
    INDEX idx_salas_criador (criador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. MEMBROS E PARTICIPANTES ONLINE (radio_membros)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS radio_membros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sala_id INT NOT NULL,
    usuario_id INT NOT NULL,
    role ENUM('host', 'dj', 'ouvinte') DEFAULT 'ouvinte' NOT NULL,
    is_muted TINYINT(1) DEFAULT 0,
    ultimo_heartbeat DATETIME NOT NULL COMMENT 'Timestamp de presença; inativo se > 30s',
    entrou_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sala_id) REFERENCES radio_salas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY uq_sala_usuario (sala_id, usuario_id),
    INDEX idx_membros_sala_presenca (sala_id, ultimo_heartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. FILA DE REPRODUÇÃO COLABORATIVA (radio_fila)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS radio_fila (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sala_id INT NOT NULL,
    adicionado_por_id INT NOT NULL,
    anilist_id INT NOT NULL COMMENT 'ID do anime no AniList',
    anime_titulo VARCHAR(255) NOT NULL,
    tipo_tema ENUM('OP', 'ED', 'OST', 'INSERT') DEFAULT 'OP' NOT NULL,
    tema_numero INT DEFAULT 1,
    musica_titulo VARCHAR(255) NULL,
    artista VARCHAR(255) NULL,
    audio_url VARCHAR(500) NOT NULL COMMENT 'URL do stream/video AnimeThemes v.animethemes.moe',
    video_url VARCHAR(500) NULL,
    duracao_segundos INT NOT NULL DEFAULT 90,
    capa_url VARCHAR(500) NULL,
    ordem INT NOT NULL DEFAULT 0,
    status ENUM('pendente', 'tocando', 'tocada', 'pulada') DEFAULT 'pendente' NOT NULL,
    votos_pular INT DEFAULT 0,
    iniciou_em DATETIME(3) NULL,
    terminou_em DATETIME(3) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sala_id) REFERENCES radio_salas(id) ON DELETE CASCADE,
    FOREIGN KEY (adicionado_por_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_fila_status_ordem (sala_id, status, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. VOTOS DE PULAR E CURTIR (radio_fila_votos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS radio_fila_votos (
    fila_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_voto ENUM('skip', 'like') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (fila_id, usuario_id, tipo_voto),
    FOREIGN KEY (fila_id) REFERENCES radio_fila(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. CHAT ATIVO EM TEMPO REAL (radio_chat)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS radio_chat (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sala_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_msg ENUM('texto', 'sistema', 'musica_pedida', 'palmas', 'reacao') DEFAULT 'texto' NOT NULL,
    mensagem VARCHAR(500) NOT NULL,
    metadados JSON NULL COMMENT 'Badges, tema, emojis ou sticker',
    is_deletada TINYINT(1) DEFAULT 0,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (sala_id) REFERENCES radio_salas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_chat_poll (sala_id, is_deletada, id ASC),
    INDEX idx_chat_retencao (sala_id, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. ARQUIVO MORTO / RETENÇÃO HISTÓRICA DO CHAT (radio_chat_arquivo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS radio_chat_arquivo (
    id BIGINT PRIMARY KEY,
    sala_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_msg ENUM('texto', 'sistema', 'musica_pedida', 'palmas', 'reacao') NOT NULL,
    mensagem VARCHAR(500) NOT NULL,
    metadados JSON NULL,
    arquivado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_em DATETIME(3) NOT NULL,
    
    INDEX idx_arquivo_sala (sala_id, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. HISTÓRICO DE REPRODUÇÃO & SCROBBLER (radio_historico_reproducao)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS radio_historico_reproducao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sala_id INT NOT NULL,
    anilist_id INT NOT NULL,
    anime_titulo VARCHAR(255) NOT NULL,
    musica_titulo VARCHAR(255) NULL,
    artista VARCHAR(255) NULL,
    tipo_tema VARCHAR(20) NOT NULL,
    solicitado_por_id INT NULL,
    total_ouvintes INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    foi_pulada TINYINT(1) DEFAULT 0,
    tocado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_hist_sala (sala_id, tocado_em),
    INDEX idx_hist_anime (anilist_id),
    INDEX idx_hist_dj (solicitado_por_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
