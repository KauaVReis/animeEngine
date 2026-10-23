-- ============================================================
-- ANIMEENGINE v8 - DATABASE SETUP & SCHEMA
-- Target Engine: MariaDB 10.4+ / MySQL 8.0+
-- Collation: utf8mb4_unicode_ci
-- Rules: STRICT 3NF, Prepared Statements with mysqli (ZERO PDO)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `animeengine_v8` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `animeengine_v8`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. USUARIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `senha_hash` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `banner` VARCHAR(500) DEFAULT NULL,
  `bio` VARCHAR(255) DEFAULT 'Otaku em busca de novas aberturas.',
  `xp` INT DEFAULT 0,
  `nivel` INT DEFAULT 1,
  `role` ENUM('admin', 'moderador', 'membro') DEFAULT 'membro' NOT NULL,
  `status` ENUM('ativo', 'banido', 'suspenso') DEFAULT 'ativo' NOT NULL,
  `tema` VARCHAR(30) DEFAULT 'default',
  `idioma` VARCHAR(10) DEFAULT 'pt-br',
  `sfw` TINYINT(1) DEFAULT 1,
  `particulas` TINYINT(1) DEFAULT 1,
  `status_emoji` VARCHAR(10) DEFAULT '🎮',
  `moldura` VARCHAR(50) DEFAULT 'default',
  `badges_exibidos` JSON DEFAULT NULL,
  `perfil_publico` TINYINT(1) DEFAULT 1,
  `cor_nome` VARCHAR(20) DEFAULT NULL,
  `streak_atual` INT DEFAULT 0,
  `streak_max` INT DEFAULT 0,
  `ultimo_acesso_streak` DATE DEFAULT NULL,
  `titulo_ativo` INT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ultimo_acesso` DATETIME DEFAULT NULL,
  INDEX `idx_usuario_nivel` (`nivel`),
  INDEX `idx_usuario_xp` (`xp` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. SESSOES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `token` VARCHAR(64) NOT NULL UNIQUE,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expira_em` DATETIME NOT NULL,
  `ultimo_acesso` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  INDEX `idx_sessoes_token` (`token`),
  INDEX `idx_sessoes_expira` (`usuario_id`, `expira_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. TITULOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `titulos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nome` VARCHAR(100) NOT NULL,
  `descricao` VARCHAR(255) DEFAULT NULL,
  `tipo` ENUM('genero', 'sazonal', 'secreto', 'conquista', 'nivel', 'radio') DEFAULT 'conquista' NOT NULL,
  `raridade` ENUM('comum', 'raro', 'epico', 'lendario', 'secreto') DEFAULT 'comum' NOT NULL,
  `icone` VARCHAR(20) DEFAULT '🏆',
  `cor` VARCHAR(20) DEFAULT '#ffd700',
  `requisito` JSON DEFAULT NULL,
  `ativo` TINYINT(1) DEFAULT 1,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_titulos_tipo` (`tipo`, `ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. USUARIOS_TITULOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios_titulos` (
  `usuario_id` INT NOT NULL,
  `titulo_id` INT NOT NULL,
  `desbloqueado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_id`, `titulo_id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`titulo_id`) REFERENCES `titulos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. CONQUISTAS (BADGES)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conquistas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `badge_id` VARCHAR(50) NOT NULL UNIQUE,
  `nome` VARCHAR(100) NOT NULL,
  `descricao` VARCHAR(255) NOT NULL,
  `categoria` ENUM('exploracao', 'social', 'colecao', 'radio', 'progresso') DEFAULT 'exploracao' NOT NULL,
  `icone` VARCHAR(20) DEFAULT '✨',
  `xp_recompensa` INT DEFAULT 100,
  `requisito` JSON DEFAULT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. USUARIOS_CONQUISTAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios_conquistas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `badge_id` VARCHAR(50) NOT NULL,
  `desbloqueado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_badge` (`usuario_id`, `badge_id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. ANIMES_CACHE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `animes_cache` (
  `anime_id` INT PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `titulo_en` VARCHAR(255) DEFAULT NULL,
  `imagem` VARCHAR(500) DEFAULT NULL,
  `banner` VARCHAR(500) DEFAULT NULL,
  `episodios` INT DEFAULT 0,
  `duracao` INT DEFAULT 24,
  `nota` DECIMAL(3, 1) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT NULL,
  `sinopse` TEXT DEFAULT NULL,
  `generos` JSON DEFAULT NULL,
  `estudios` JSON DEFAULT NULL,
  `trailer` VARCHAR(255) DEFAULT NULL,
  `ano` INT DEFAULT NULL,
  `temporada` VARCHAR(20) DEFAULT NULL,
  `atualizado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_animes_ano_temp` (`ano`, `temporada`),
  INDEX `idx_animes_nota` (`nota` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. LISTAS_ANIME
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `listas_anime` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `anime_id` INT NOT NULL,
  `tipo_lista` ENUM('watching', 'planToWatch', 'completed', 'paused', 'dropped') NOT NULL,
  `progresso` INT DEFAULT 0,
  `nota` INT DEFAULT 0,
  `favorito` TINYINT(1) DEFAULT 0,
  `notas_pessoais` TEXT DEFAULT NULL,
  `adicionado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `observacao` TEXT DEFAULT NULL,
  UNIQUE KEY `uq_user_anime` (`usuario_id`, `anime_id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`anime_id`) REFERENCES `animes_cache`(`anime_id`) ON DELETE CASCADE,
  INDEX `idx_usuario_lista` (`usuario_id`, `tipo_lista`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. METAS_SEMANAIS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `metas_semanais` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `semana_ano` VARCHAR(10) NOT NULL,
  `episodios_meta` INT DEFAULT 10,
  `episodios_atual` INT DEFAULT 0,
  `minutos_meta` INT DEFAULT 240,
  `minutos_atual` INT DEFAULT 0,
  `completos_meta` INT DEFAULT 2,
  `completos_atual` INT DEFAULT 0,
  `reclamou_xp` TINYINT(1) DEFAULT 0,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_week` (`usuario_id`, `semana_ano`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. ATIVIDADES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `atividades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `tipo` ENUM('add', 'complete', 'rate', 'favorite', 'achievement', 'titulo', 'radio_host') NOT NULL,
  `anime_id` INT DEFAULT NULL,
  `detalhes` JSON DEFAULT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  INDEX `idx_usuario_atividade` (`usuario_id`, `criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. COMENTARIOS_PERFIL
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `comentarios_perfil` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `perfil_id` INT NOT NULL,
  `autor_id` INT NOT NULL,
  `conteudo` TEXT NOT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`perfil_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  INDEX `idx_perfil_comentarios` (`perfil_id`, `criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. SEGUIDORES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `seguidores` (
  `seguidor_id` INT NOT NULL,
  `seguindo_id` INT NOT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`seguidor_id`, `seguindo_id`),
  FOREIGN KEY (`seguidor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seguindo_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  INDEX `idx_seguindo` (`seguindo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. RADIO_SALAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `radio_salas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `slug` VARCHAR(100) UNIQUE NULL,
  `criador_id` INT NOT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `descricao` VARCHAR(255) NULL,
  `tipo` ENUM('publica', 'privada', 'oficial') DEFAULT 'publica' NOT NULL,
  `senha_hash` VARCHAR(255) NULL,
  `status` ENUM('ativa', 'encerrada', 'arquivada') DEFAULT 'ativa' NOT NULL,
  `tema_visual` VARCHAR(50) DEFAULT 'default',
  `max_ouvintes` INT DEFAULT 50,
  `tocando_agora_fila_id` INT NULL,
  `playback_started_at` DATETIME(3) NULL,
  `playback_paused_at_sec` INT DEFAULT 0,
  `is_paused` TINYINT(1) DEFAULT 0,
  `ouvintes_count` INT DEFAULT 1,
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `encerrada_em` DATETIME NULL,
  `arquivada_em` DATETIME NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`criador_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  INDEX `idx_salas_publicas` (`status`, `tipo`, `ouvintes_count` DESC),
  INDEX `idx_salas_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 14. RADIO_MEMBROS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `radio_membros` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sala_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `role` ENUM('host', 'dj', 'ouvinte') DEFAULT 'ouvinte' NOT NULL,
  `is_muted` TINYINT(1) DEFAULT 0,
  `ultimo_heartbeat` DATETIME NOT NULL,
  `entrou_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_sala_usuario` (`sala_id`, `usuario_id`),
  FOREIGN KEY (`sala_id`) REFERENCES `radio_salas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  INDEX `idx_membros_presenca` (`sala_id`, `ultimo_heartbeat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. RADIO_FILA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `radio_fila` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sala_id` INT NOT NULL,
  `adicionado_por_id` INT NOT NULL,
  `anilist_id` INT NOT NULL,
  `anime_titulo` VARCHAR(255) NOT NULL,
  `tipo_tema` ENUM('OP', 'ED', 'OST', 'INSERT') DEFAULT 'OP' NOT NULL,
  `tema_numero` INT DEFAULT 1,
  `musica_titulo` VARCHAR(255) NULL,
  `artista` VARCHAR(255) NULL,
  `audio_url` VARCHAR(500) NOT NULL,
  `video_url` VARCHAR(500) NULL,
  `duracao_segundos` INT NOT NULL DEFAULT 90,
  `capa_url` VARCHAR(500) NULL,
  `posicao` DECIMAL(12, 5) NOT NULL DEFAULT 1000.00000,
  `status` ENUM('pendente', 'tocando', 'tocada', 'pulada') DEFAULT 'pendente' NOT NULL,
  `votos_pular` INT DEFAULT 0,
  `iniciou_em` DATETIME(3) NULL,
  `terminou_em` DATETIME(3) NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sala_id`) REFERENCES `radio_salas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`adicionado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  INDEX `idx_fila_ordem` (`sala_id`, `status`, `posicao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 16. RADIO_FILA_VOTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `radio_fila_votos` (
  `fila_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `tipo_voto` ENUM('skip', 'like') NOT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fila_id`, `usuario_id`, `tipo_voto`),
  FOREIGN KEY (`fila_id`) REFERENCES `radio_fila`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 17. RADIO_CHAT
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `radio_chat` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `sala_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `tipo_msg` ENUM('texto', 'sistema', 'musica_pedida', 'reacao') DEFAULT 'texto' NOT NULL,
  `mensagem` VARCHAR(500) NOT NULL,
  `metadados` JSON NULL,
  `is_deletada` TINYINT(1) DEFAULT 0,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`sala_id`) REFERENCES `radio_salas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  INDEX `idx_chat_poll` (`sala_id`, `is_deletada`, `id`),
  INDEX `idx_chat_retencao` (`sala_id`, `criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 18. RADIO_CHAT_ARQUIVO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `radio_chat_arquivo` (
  `id` BIGINT PRIMARY KEY,
  `sala_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `tipo_msg` VARCHAR(20) NOT NULL,
  `mensagem` VARCHAR(500) NOT NULL,
  `metadados` JSON NULL,
  `criado_em` DATETIME(3) NOT NULL,
  `arquivado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_arquivo_sala` (`sala_id`, `criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 19. RADIO_HISTORICO_REPRODUCAO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `radio_historico_reproducao` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sala_id` INT NOT NULL,
  `anilist_id` INT NOT NULL,
  `anime_titulo` VARCHAR(255) NOT NULL,
  `musica_titulo` VARCHAR(255) NULL,
  `artista` VARCHAR(255) NULL,
  `tipo_tema` VARCHAR(20) NOT NULL,
  `solicitado_por_id` INT NULL,
  `total_ouvintes` INT DEFAULT 0,
  `total_likes` INT DEFAULT 0,
  `foi_pulada` TINYINT(1) DEFAULT 0,
  `tocou_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sala_id`) REFERENCES `radio_salas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 20. MIGRAÇÃO / CARGA INICIAL DE DADOS DE v7
-- ------------------------------------------------------------
-- Importar Usuários de animeengine_v7
INSERT IGNORE INTO `usuarios` (
  `id`, `uuid`, `username`, `email`, `senha_hash`, `avatar`, `bio`, `xp`, `nivel`, 
  `tema`, `idioma`, `sfw`, `particulas`, `status_emoji`, `moldura`, `badges_exibidos`, 
  `perfil_publico`, `cor_nome`, `streak_atual`, `streak_max`, `ultimo_acesso_streak`, 
  `titulo_ativo`, `criado_em`, `ultimo_acesso`
)
SELECT 
  u.`id`, UUID(), u.`username`, u.`email`, u.`senha_hash`, u.`avatar`, COALESCE(u.`bio`, 'Otaku em busca de novas aberturas.'),
  u.`xp`, u.`nivel`, u.`tema`, u.`idioma`, u.`sfw`, u.`particulas`, u.`status_emoji`, u.`moldura`, 
  u.`badges_exibidos`, u.`perfil_publico`, u.`cor_nome`, u.`streak_atual`, u.`streak_max`, 
  u.`ultimo_acesso_streak`, u.`titulo_ativo`, u.`criado_em`, u.`ultimo_acesso`
FROM `animeengine_v7`.`usuarios` u;

-- Importar Títulos
INSERT IGNORE INTO `titulos` (`id`, `codigo`, `nome`, `descricao`, `tipo`, `icone`, `cor`, `requisito`)
SELECT `id`, `codigo`, `nome`, `descricao`, `tipo`, `icone`, `cor`, `requisito`
FROM `animeengine_v7`.`titulos`;

-- Inserir Novos Títulos para a Rádio v8
INSERT IGNORE INTO `titulos` (`codigo`, `nome`, `descricao`, `tipo`, `raridade`, `icone`, `cor`)
VALUES 
  ('dj_akihabara', 'DJ de Akihabara', 'Criou e transmitiu em uma sala de rádio com mais de 5 ouvintes', 'radio', 'raro', '🎧', '#a855f7'),
  ('rei_do_hype', 'Rei do Hype', 'Recebeu mais de 50 curtidas de ouvintes em músicas sugeridas na fila', 'radio', 'epico', '🔥', '#f97316'),
  ('seletor_lendario', 'Seletor Lendário', 'Manteve uma sala ativa por mais de 2 horas consecutivas com público', 'radio', 'lendario', '👑', '#eab308');

-- Importar Usuários_Títulos
INSERT IGNORE INTO `usuarios_titulos` (`usuario_id`, `titulo_id`, `desbloqueado_em`)
SELECT `usuario_id`, `titulo_id`, `desbloqueado_em`
FROM `animeengine_v7`.`usuarios_titulos`;

-- Importar Animes Cache
INSERT IGNORE INTO `animes_cache` (
  `anime_id`, `titulo`, `titulo_en`, `imagem`, `episodios`, `nota`, 
  `status`, `sinopse`, `generos`, `estudios`, `trailer`, `ano`, `temporada`, `atualizado_em`
)
SELECT 
  `anime_id`, `titulo`, `titulo_en`, `imagem`, `episodios`, `nota`, 
  `status`, `sinopse`, `generos`, `estudios`, `trailer`, `ano`, `temporada`, `atualizado_em`
FROM `animeengine_v7`.`animes_cache`;

-- Importar Listas de Anime
INSERT IGNORE INTO `listas_anime` (
  `id`, `usuario_id`, `anime_id`, `tipo_lista`, `progresso`, `nota`, `favorito`, 
  `notas_pessoais`, `adicionado_em`, `atualizado_em`, `observacao`
)
SELECT 
  `id`, `usuario_id`, `anime_id`, `tipo_lista`, `progresso`, `nota`, `favorito`, 
  `notas_pessoais`, `adicionado_em`, `atualizado_em`, `observacao`
FROM `animeengine_v7`.`listas_anime`;

-- Importar Conquistas
INSERT IGNORE INTO `usuarios_conquistas` (`usuario_id`, `badge_id`, `desbloqueado_em`)
SELECT `usuario_id`, `badge_id`, `desbloqueado_em`
FROM `animeengine_v7`.`conquistas`;

-- Importar Atividades
INSERT IGNORE INTO `atividades` (`id`, `usuario_id`, `tipo`, `anime_id`, `detalhes`, `criado_em`)
SELECT `id`, `usuario_id`, `tipo`, `anime_id`, `detalhes`, `criado_em`
FROM `animeengine_v7`.`atividades`;

-- Importar Metas Semanais
INSERT IGNORE INTO `metas_semanais` (
  `id`, `usuario_id`, `semana_ano`, `episodios_meta`, `episodios_atual`, 
  `minutos_meta`, `minutos_atual`, `completos_meta`, `completos_atual`
)
SELECT 
  `id`, `usuario_id`, `semana_ano`, `episodios_meta`, `episodios_atual`, 
  `minutos_meta`, `minutos_atual`, `completos_meta`, `completos_atual`
FROM `animeengine_v7`.`metas_semanais`;

SET FOREIGN_KEY_CHECKS = 1;
