-- ============================================
-- Sprint 8 - Sistema de Atividade
-- Execute no phpMyAdmin
-- ============================================

-- Tabela de Atividades/Feed
CREATE TABLE IF NOT EXISTS atividades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo ENUM('add','complete','rate','favorite','achievement','titulo') NOT NULL,
    anime_id INT,
    detalhes JSON,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_atividade (usuario_id, criado_em)
);

-- Coluna de observação/review na lista
ALTER TABLE listas_anime ADD COLUMN observacao TEXT;

-- ============================================
-- Pronto! Execute acima no phpMyAdmin
-- ============================================
