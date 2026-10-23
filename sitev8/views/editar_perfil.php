<?php
/**
 * AnimeEngine v8 - View: Editar Perfil
 * Interface Neo-Brutalista moderna com integração ativa AniList GraphQL
 * 100% Prepared Statements (mysqli + bind_param, ZERO PDO)
 */

require_once __DIR__ . '/../includes/database.php';
require_once __DIR__ . '/../includes/auth.php';

if (!estaLogado()) {
    header('Location: login');
    exit;
}

$conn = conectar();
$perfil = secure_fetch_one($conn, "SELECT * FROM usuarios WHERE id = ?", "i", getUsuarioId());
mysqli_close($conn);

if (!$perfil) {
    header('Location: home');
    exit;
}

$badges_exibidos = json_decode($perfil['badges_exibidos'] ?? '[]', true) ?: [];
$socials = json_decode($perfil['redes_sociais'] ?? '{}', true) ?: [];
$waifu = json_decode($perfil['waifu_personagem'] ?? '{}', true) ?: [];

$nivelIcons = ['🌱', '🌿', '🍃', '🔥', '⚡', '💎', '🏆', '👑', '🌟', '🐉'];
$nivelIdx = max(0, min(($perfil['nivel'] ?? 1) - 1, 9));
?>

<div class="edit-profile-page-container">
    <!-- PAGE HEADER -->
    <div class="page-header-neo">
        <div class="header-titles">
            <div class="header-badge"><i class="fas fa-sliders-h"></i> PERSONALIZAÇÃO v8</div>
            <h1 class="page-title"><i class="fas fa-user-edit"></i> Editar Perfil de Membro</h1>
            <p class="page-subtitle">Personalize seu avatar, banner, cores, status e integre dados diretamente da AniList</p>
        </div>
        <div class="header-actions">
            <a href="perfil" class="btn btn-secondary btn-sm">
                <i class="fas fa-arrow-left"></i> Voltar ao Perfil
            </a>
        </div>
    </div>

    <!-- PREVIEW AO VIVO EM TEMPO REAL -->
    <div class="edit-preview-card" id="edit-preview-card" style="background-image: url('<?= !empty($perfil['banner']) ? htmlspecialchars($perfil['banner']) : 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/default_banner.jpg' ?>');">
        <div class="edit-preview-overlay"></div>
        <div class="edit-preview-badge">PRÉ-VISUALIZAÇÃO AO VIVO</div>

        <div class="edit-preview-content">
            <div class="edit-preview-avatar-box moldura-<?= htmlspecialchars($perfil['moldura'] ?? 'default') ?>" id="preview-avatar-box">
                <?php if (!empty($perfil['avatar'])): ?>
                    <img src="<?= htmlspecialchars($perfil['avatar']) ?>" id="preview-avatar-img" alt="Avatar">
                <?php else: ?>
                    <div class="preview-avatar-fallback" id="preview-avatar-fallback"><?= $nivelIcons[$nivelIdx] ?></div>
                <?php endif; ?>
                <span class="preview-status-pill" id="preview-status"><?= htmlspecialchars($perfil['status_emoji'] ?? '🎮') ?></span>
            </div>

            <div class="edit-preview-info">
                <div class="preview-name-row">
                    <span class="preview-username cor-<?= htmlspecialchars($perfil['cor_nome'] ?? 'default') ?>" id="preview-name">
                        <?= htmlspecialchars($perfil['username']) ?>
                    </span>
                    <span class="preview-level-badge">
                        <?= $nivelIcons[$nivelIdx] ?> Lv.<?= intval($perfil['nivel'] ?? 1) ?>
                    </span>
                </div>
                <p class="preview-bio" id="preview-bio-text"><?= !empty($perfil['bio']) ? nl2br(htmlspecialchars($perfil['bio'])) : 'Sua bio aparecerá aqui...' ?></p>

                <div class="preview-waifu-pill" id="preview-waifu-pill" style="<?= (empty($waifu['nome']) || empty($waifu['imagem'])) ? 'display: none;' : '' ?>">
                    <i class="fas fa-heart text-danger"></i>
                    <img src="<?= htmlspecialchars($waifu['imagem'] ?? '') ?>" id="preview-waifu-img" alt="Waifu">
                    <span id="preview-waifu-name"><?= htmlspecialchars($waifu['nome'] ?? '') ?></span>
                </div>
            </div>
        </div>
    </div>

    <!-- FORMULÁRIO DE EDIÇÃO -->
    <form id="edit-profile-form" class="edit-profile-form" novalidate>
        <!-- SEÇÃO: INTEGRAÇÃO ANILIST -->
        <div class="form-section-card anilist-card">
            <div class="form-section-header">
                <h3><i class="fas fa-bolt text-primary"></i> Integração Inteligente com AniList</h3>
                <span class="anilist-status-badge"><i class="fas fa-check-circle"></i> API Online</span>
            </div>
            <p class="section-desc">Busque personagens para sua Waifu/Husbando ou importe seu avatar e banner diretamente do AniList.</p>

            <div class="anilist-tools-grid">
                <!-- FERRAMENTA 1: BUSCAR PERSONAGEM -->
                <div class="anilist-tool-box">
                    <label class="tool-label"><i class="fas fa-heart"></i> Buscar Personagem (Waifu/Husbando):</label>
                    <div class="tool-input-row">
                        <input type="text" id="anilist-char-input" placeholder="Ex: Rem, Gojo, Frieren, Megumin...">
                        <button type="button" class="btn btn-primary btn-sm" onclick="EditarPerfilPage.searchCharacter()">
                            <i class="fas fa-search"></i> Buscar
                        </button>
                    </div>
                    <div class="anilist-results-track" id="anilist-char-results"></div>
                </div>

                <!-- FERRAMENTA 2: SINCRONIZAR CONTA ANILIST -->
                <div class="anilist-tool-box">
                    <label class="tool-label"><i class="fas fa-sync-alt"></i> Sincronizar Perfil AniList:</label>
                    <div class="tool-input-row">
                        <input type="text" id="anilist-username-input" placeholder="Seu username no AniList...">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="EditarPerfilPage.syncAniListProfile()">
                            <i class="fas fa-download"></i> Importar
                        </button>
                    </div>
                    <span class="tool-hint">Importa automaticamente seu Avatar, Banner e Bio da sua conta AniList.</span>
                </div>
            </div>
        </div>

        <!-- SEÇÃO: APARÊNCIA VISUAL (AVATAR E BANNER) -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-image"></i> Imagens de Perfil (Avatar & Banner)</h3>
            </div>
            
            <div class="form-grid-two">
                <div class="form-group-neo">
                    <label for="avatar_url"><i class="fas fa-user-circle"></i> URL do Avatar:</label>
                    <input type="url" id="avatar_url" name="avatar" placeholder="https://... (PNG/JPG/GIF)" 
                           value="<?= htmlspecialchars($perfil['avatar'] ?? '') ?>">
                </div>

                <div class="form-group-neo">
                    <label for="banner_url"><i class="fas fa-panorama"></i> URL do Banner de Fundo:</label>
                    <input type="url" id="banner_url" name="banner" placeholder="https://... (1200x350 recomendado)" 
                           value="<?= htmlspecialchars($perfil['banner'] ?? '') ?>">
                </div>
            </div>
        </div>

        <!-- SEÇÃO: STATUS E EMOJI -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-smile text-warning"></i> Status & Emoji de Humor</h3>
            </div>
            <div class="emoji-selector-grid">
                <?php
                $emojis = [
                    '🎮' => 'Jogando',
                    '📺' => 'Assistindo',
                    '🔥' => 'On Fire',
                    '🎯' => 'Focado',
                    '☕' => 'Relaxando',
                    '🚀' => 'Hypado',
                    '🌙' => 'Noturno',
                    '💤' => 'AFK',
                    '😴' => 'Dormindo',
                    '⏸️' => 'Pausado'
                ];
                foreach ($emojis as $emoji => $label): ?>
                    <button type="button"
                        class="emoji-pill-btn <?= ($perfil['status_emoji'] ?? '🎮') === $emoji ? 'active' : '' ?>"
                        data-emoji="<?= $emoji ?>" title="<?= $label ?>">
                        <span class="emoji-icon"><?= $emoji ?></span>
                        <span class="emoji-label"><?= $label ?></span>
                    </button>
                <?php endforeach; ?>
            </div>
            <input type="hidden" name="status_emoji" id="status_emoji" value="<?= htmlspecialchars($perfil['status_emoji'] ?? '🎮') ?>">
        </div>

        <!-- SEÇÃO: BIO / SOBRE MIM -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-quote-left text-primary"></i> Biografia (Sobre Você)</h3>
                <span class="char-counter"><span id="bio-count"><?= strlen($perfil['bio'] ?? '') ?></span> / 500 caracteres</span>
            </div>
            <textarea name="bio" id="bio" maxlength="500" placeholder="Escreva um pouco sobre seu gosto por animes, gêneros favoritos..."><?= htmlspecialchars($perfil['bio'] ?? '') ?></textarea>
        </div>

        <!-- SEÇÃO: WAIFU / HUSBANDO SHOWCASE -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-heart text-danger"></i> Destaque de Waifu / Husbando</h3>
            </div>
            <div class="form-grid-two">
                <div class="form-group-neo">
                    <label for="waifu-nome"><i class="fas fa-user-tag"></i> Nome do Personagem:</label>
                    <input type="text" id="waifu-nome" placeholder="Ex: Rem, Gojo Satoru, Megumin" 
                           value="<?= htmlspecialchars($waifu['nome'] ?? '') ?>" maxlength="100">
                </div>
                <div class="form-group-neo">
                    <label for="waifu-imagem"><i class="fas fa-image"></i> URL da Foto do Personagem:</label>
                    <input type="url" id="waifu-imagem" placeholder="https://... ou use a busca AniList acima" 
                           value="<?= htmlspecialchars($waifu['imagem'] ?? '') ?>">
                </div>
            </div>
        </div>

        <!-- SEÇÃO: MOLDURA DO AVATAR -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-circle-notch text-primary"></i> Moldura Exclusiva do Avatar</h3>
            </div>
            <div class="moldura-selector-grid">
                <?php
                $molduras = [
                    'default'  => ['nome' => 'Padrão', 'req' => 'Livre'],
                    'gold'     => ['nome' => 'Dourado', 'req' => 'Nível 3+'],
                    'diamond'  => ['nome' => 'Diamante', 'req' => 'Nível 5+'],
                    'fire'     => ['nome' => 'Fogo', 'req' => 'Nível 7+'],
                    'rainbow'  => ['nome' => 'Arco-íris', 'req' => 'Nível 9+'],
                    'neon'     => ['nome' => 'Neon Cyber', 'req' => '100 eps'],
                    'sakura'   => ['nome' => 'Sakura Petals', 'req' => '10 completos']
                ];
                foreach ($molduras as $id => $info): ?>
                    <div class="moldura-item-card <?= ($perfil['moldura'] ?? 'default') === $id ? 'active' : '' ?>"
                         data-moldura="<?= $id ?>">
                        <div class="moldura-thumb-box moldura-<?= $id ?>">
                            <span>🐉</span>
                        </div>
                        <span class="moldura-title"><?= $info['nome'] ?></span>
                        <span class="moldura-req-badge"><?= $info['req'] ?></span>
                    </div>
                <?php endforeach; ?>
            </div>
            <input type="hidden" name="moldura" id="moldura" value="<?= htmlspecialchars($perfil['moldura'] ?? 'default') ?>">
        </div>

        <!-- SEÇÃO: COR DO NOME -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-palette text-warning"></i> Cor do Nome no Perfil</h3>
            </div>
            <div class="cor-selector-grid">
                <?php
                $cores = [
                    'default' => 'Branco Padrão',
                    'gold'    => 'Dourado Otaku',
                    'purple'  => 'Roxo Místico',
                    'red'     => 'Vermelho Shounen',
                    'blue'    => 'Azul Mecha',
                    'green'   => 'Verde Slime',
                    'rainbow' => 'Arco-íris Lendário'
                ];
                foreach ($cores as $id => $nome): ?>
                    <button type="button"
                        class="cor-option-btn cor-<?= $id ?> <?= ($perfil['cor_nome'] ?? 'default') === $id ? 'active' : '' ?>"
                        data-cor="<?= $id ?>">
                        <span class="cor-sample"></span>
                        <span class="cor-name-label"><?= $nome ?></span>
                    </button>
                <?php endforeach; ?>
            </div>
            <input type="hidden" name="cor_nome" id="cor_nome" value="<?= htmlspecialchars($perfil['cor_nome'] ?? 'default') ?>">
        </div>

        <!-- SEÇÃO: CONQUISTAS EM DESTAQUE (BADGES) -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-medal text-warning"></i> Insígnias em Destaque (Máximo 3)</h3>
                <span class="form-hint-info">Selecione até 3 conquistas desbloqueadas para exibir</span>
            </div>
            <div class="badges-selector-grid" id="badges-selector">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
            <input type="hidden" name="badges_exibidos" id="badges_exibidos" value='<?= json_encode($badges_exibidos) ?>'>
        </div>

        <!-- SEÇÃO: REDES SOCIAIS -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-share-alt"></i> Redes Sociais & Contatos</h3>
            </div>
            <div class="form-grid-two">
                <div class="form-group-neo">
                    <label for="social-discord"><i class="fab fa-discord"></i> Discord:</label>
                    <input type="text" id="social-discord" placeholder="Ex: usuario#0000 ou username" 
                           value="<?= htmlspecialchars($socials['discord'] ?? '') ?>">
                </div>

                <div class="form-group-neo">
                    <label for="social-twitter"><i class="fab fa-twitter"></i> Twitter / X:</label>
                    <input type="text" id="social-twitter" placeholder="Ex: usuario_otaku" 
                           value="<?= htmlspecialchars($socials['twitter'] ?? '') ?>">
                </div>

                <div class="form-group-neo">
                    <label for="social-instagram"><i class="fab fa-instagram"></i> Instagram:</label>
                    <input type="text" id="social-instagram" placeholder="Ex: usuario_insta" 
                           value="<?= htmlspecialchars($socials['instagram'] ?? '') ?>">
                </div>

                <div class="form-group-neo">
                    <label for="social-youtube"><i class="fab fa-youtube"></i> YouTube:</label>
                    <input type="text" id="social-youtube" placeholder="Ex: CanalOtaku" 
                           value="<?= htmlspecialchars($socials['youtube'] ?? '') ?>">
                </div>
            </div>
        </div>

        <!-- SEÇÃO: PRIVACIDADE -->
        <div class="form-section-card">
            <div class="form-section-header">
                <h3><i class="fas fa-shield-alt"></i> Privacidade do Perfil</h3>
            </div>
            <label class="neo-toggle-row">
                <input type="checkbox" name="perfil_publico" id="perfil_publico" <?= !empty($perfil['perfil_publico']) ? 'checked' : '' ?>>
                <span class="toggle-track"><span class="toggle-knob"></span></span>
                <span class="toggle-text">Perfil Público (qualquer membro da comunidade pode visualizar suas listas e títulos)</span>
            </label>
        </div>

        <!-- BOTÃO FIXO DE SALVAR -->
        <div class="edit-profile-actions-bar">
            <button type="submit" class="btn btn-primary btn-lg" id="save-btn">
                <i class="fas fa-save"></i> SALVAR TODAS AS ALTERAÇÕES
            </button>
        </div>
    </form>
</div>

<script src="js/pages/editar_perfil.js?v=10.2"></script>
