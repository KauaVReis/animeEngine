-- ============================================
-- Sprint 7 - Sistema de Títulos
-- Execute no phpMyAdmin
-- ============================================

-- Tabela de Títulos disponíveis
CREATE TABLE IF NOT EXISTS titulos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo ENUM('genero','sazonal','secreto','conquista','nivel') DEFAULT 'conquista',
    icone VARCHAR(10),
    cor VARCHAR(20) DEFAULT '#ffffff',
    requisito JSON
);

-- Títulos desbloqueados por usuário
CREATE TABLE IF NOT EXISTS usuarios_titulos (
    usuario_id INT NOT NULL,
    titulo_id INT NOT NULL,
    desbloqueado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, titulo_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (titulo_id) REFERENCES titulos(id) ON DELETE CASCADE
);

-- Título ativo do usuário
ALTER TABLE usuarios ADD COLUMN titulo_ativo INT;

-- ============================================
-- INSERIR TÍTULOS
-- ============================================

-- Títulos de Gênero
INSERT INTO titulos (codigo, nome, descricao, tipo, icone, cor, requisito) VALUES
('shounen_master', 'Mestre Shounen', 'Complete 5 animes de ação/aventura', 'genero', '⚔️', '#ff6b35', '{"genero": "Action", "completos": 5}'),
('isekai_lord', 'Senhor do Isekai', 'Complete 3 animes isekai', 'genero', '🌀', '#9b59b6', '{"genero": "Fantasy", "completos": 3}'),
('romance_king', 'Rei do Romance', 'Complete 5 animes de romance', 'genero', '💕', '#e91e63', '{"genero": "Romance", "completos": 5}'),
('comedy_master', 'Mestre da Comédia', 'Complete 5 animes de comédia', 'genero', '😂', '#ffc107', '{"genero": "Comedy", "completos": 5}'),
('horror_survivor', 'Sobrevivente do Horror', 'Complete 3 animes de terror', 'genero', '👻', '#2c3e50', '{"genero": "Horror", "completos": 3}'),
('mecha_pilot', 'Piloto de Mecha', 'Complete 3 animes mecha', 'genero', '🤖', '#3498db', '{"genero": "Mecha", "completos": 3}'),
('slice_enjoyer', 'Apreciador de Slice', 'Complete 5 slice of life', 'genero', '☕', '#27ae60', '{"genero": "Slice of Life", "completos": 5}');

-- Títulos de Nível
INSERT INTO titulos (codigo, nome, descricao, tipo, icone, cor, requisito) VALUES
('novato', 'Novato', 'Alcance nível 2', 'nivel', '🌱', '#4ade80', '{"nivel": 2}'),
('veterano', 'Veterano', 'Alcance nível 5', 'nivel', '⚡', '#f59e0b', '{"nivel": 5}'),
('mestre', 'Mestre Otaku', 'Alcance nível 8', 'nivel', '👑', '#ffd700', '{"nivel": 8}'),
('lenda', 'Lenda Viva', 'Alcance nível 10', 'nivel', '🐉', '#ef4444', '{"nivel": 10}');

-- Títulos Sazonais
INSERT INTO titulos (codigo, nome, descricao, tipo, icone, cor, requisito) VALUES
('winter_2024', 'Veterano Inverno 2024', 'Assistiu na temporada de inverno 2024', 'sazonal', '❄️', '#00bcd4', '{"temporada": "winter_2024"}'),
('spring_2024', 'Veterano Primavera 2024', 'Assistiu na temporada de primavera 2024', 'sazonal', '🌸', '#ff69b4', '{"temporada": "spring_2024"}'),
('fall_2024', 'Veterano Outono 2024', 'Assistiu na temporada de outono 2024', 'sazonal', '🍂', '#ff8c00', '{"temporada": "fall_2024"}');

-- Títulos Secretos
INSERT INTO titulos (codigo, nome, descricao, tipo, icone, cor, requisito) VALUES
('night_watcher', 'Observador Noturno', 'Use o app entre 2h e 5h da manhã', 'secreto', '🦉', '#1a1a2e', '{"hora_min": 2, "hora_max": 5}'),
('speedrunner', 'Speedrunner', 'Complete um anime em menos de 24h', 'secreto', '⚡', '#ff00ff', '{"speedrun": true}'),
('completionist', 'Complecionista', 'Complete 50 animes', 'secreto', '🏆', '#ffd700', '{"completos": 50}'),
('early_adopter', 'Early Adopter', 'Um dos primeiros 100 usuários', 'secreto', '🌟', '#00ffff', '{"early": true}'),
('streak_master', 'Mestre do Streak', 'Mantenha um streak de 30 dias', 'secreto', '🔥', '#ff4500', '{"streak": 30}');

-- ============================================
-- Pronto! Execute acima no phpMyAdmin
-- ============================================
