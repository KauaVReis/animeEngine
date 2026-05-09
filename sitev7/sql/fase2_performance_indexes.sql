-- AnimeEngine v7 - Fase 2: Performance indexes
-- Execute uma vez no banco animeengine_v7.

ALTER TABLE listas_anime
    ADD INDEX idx_listas_usuario_atualizado (usuario_id, atualizado_em),
    ADD INDEX idx_listas_usuario_favorito (usuario_id, favorito),
    ADD INDEX idx_listas_anime_tipo (anime_id, tipo_lista);

ALTER TABLE usuarios
    ADD INDEX idx_usuarios_xp (xp),
    ADD INDEX idx_usuarios_ultimo_acesso (ultimo_acesso);

ALTER TABLE atividades
    ADD INDEX idx_atividades_anime (anime_id);
