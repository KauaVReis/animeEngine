-- ============================================
-- Sprint 9 - Features Sociais
-- Execute no phpMyAdmin
-- ============================================

-- Tabela de Seguidores
CREATE TABLE IF NOT EXISTS seguidores (
    seguidor_id INT NOT NULL,
    seguindo_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (seguidor_id, seguindo_id),
    FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (seguindo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_seguindo (seguindo_id)
);

-- Tabela de Comentários no Perfil
CREATE TABLE IF NOT EXISTS comentarios_perfil (
    id INT PRIMARY KEY AUTO_INCREMENT,
    perfil_id INT NOT NULL,
    autor_id INT NOT NULL,
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (perfil_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_perfil (perfil_id, criado_em)
);

-- ============================================
-- Pronto! Execute acima no phpMyAdmin
-- ============================================
