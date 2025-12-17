-- ============================================
-- Sprint 6 - Sistema de Streak
-- Execute no phpMyAdmin
-- ============================================

-- Streak atual do usuário
ALTER TABLE usuarios ADD COLUMN streak_atual INT DEFAULT 0;

-- Maior streak alcançado
ALTER TABLE usuarios ADD COLUMN streak_max INT DEFAULT 0;

-- Último dia que contou para o streak
ALTER TABLE usuarios ADD COLUMN ultimo_acesso_streak DATE;

-- ============================================
-- Pronto! Execute acima no phpMyAdmin
-- ============================================
