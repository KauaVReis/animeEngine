-- ============================================
-- Sprint 5 - Personalização do Perfil
-- Execute no phpMyAdmin
-- ============================================

-- Bio do usuário
ALTER TABLE usuarios ADD COLUMN bio TEXT;

-- Emoji de status
ALTER TABLE usuarios ADD COLUMN status_emoji VARCHAR(10) DEFAULT '🎮';

-- Moldura do avatar
ALTER TABLE usuarios ADD COLUMN moldura VARCHAR(50) DEFAULT 'default';

-- 3 badges para exibir
ALTER TABLE usuarios ADD COLUMN badges_exibidos JSON;

-- Perfil público ou privado
ALTER TABLE usuarios ADD COLUMN perfil_publico TINYINT(1) DEFAULT 1;

-- Cor especial do nome
ALTER TABLE usuarios ADD COLUMN cor_nome VARCHAR(20);

-- ============================================
-- Pronto! Execute acima no phpMyAdmin
-- ============================================
