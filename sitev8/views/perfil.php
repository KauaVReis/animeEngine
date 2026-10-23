<?php
/**
 * AnimeEngine v8 - View: Perfil do Usuário
 * Totalmente seguro (prepared statements com bind_param, ZERO PDO),
 * layout Neo-Brutalista focado na identidade, títulos, molduras e conquistas.
 */

require_once __DIR__ . '/../includes/database.php';
require_once __DIR__ . '/../includes/auth.php';

$username_param = $_GET['user'] ?? null;
$viewing_own = false;
$conn = conectar();

if (!empty($username_param)) {
    // Visualização de perfil de outro usuário — PREPARED STATEMENT
    $usuario = secure_fetch_one($conn, "SELECT * FROM usuarios WHERE username = ?", "s", $username_param);

    if (!$usuario) {
        mysqli_close($conn);
        header('Location: home');
        exit;
    }

    if (empty($usuario['perfil_publico']) && (!estaLogado() || getUsuarioId() != $usuario['id'])) {
        mysqli_close($conn);
        echo '<div class="alert alert-warning" style="margin: 40px auto; max-width: 600px; text-align: center;">Este perfil é privado.</div>';
        return;
    }

    $viewing_own = estaLogado() && (getUsuarioId() == $usuario['id']);
} else {
    // Visualização do próprio perfil
    if (!estaLogado()) {
        mysqli_close($conn);
        header('Location: login?redirect=perfil');
        exit;
    }

    $usuario = secure_fetch_one($conn, "SELECT * FROM usuarios WHERE id = ?", "i", getUsuarioId());
    if (!$usuario) {
        mysqli_close($conn);
        header('Location: home');
        exit;
    }
    $viewing_own = true;
}

// Buscar o título ativo do usuário — PREPARED STATEMENT
$titulo_ativo_info = null;
if (!empty($usuario['titulo_ativo'])) {
    $titulo_id = intval($usuario['titulo_ativo']);
    $titulo_ativo_info = secure_fetch_one($conn, "SELECT id, nome, icone, cor, raridade, descricao FROM titulos WHERE id = ?", "i", $titulo_id);
}

// Buscar títulos desbloqueados para o seletor rápido (se for o próprio usuário)
$titulos_desbloqueados = [];
if ($viewing_own) {
    $titulos_desbloqueados = secure_fetch_all(
        $conn,
        "SELECT t.id, t.nome, t.icone, t.cor, t.raridade, t.descricao 
         FROM titulos t 
         JOIN usuarios_titulos ut ON t.id = ut.titulo_id 
         WHERE ut.usuario_id = ? 
         ORDER BY t.id ASC",
        "i",
        $usuario['id']
    );
}

mysqli_close($conn);

// Configuração de dados visuais
$nivelIcons = ['🌱', '🌿', '🍃', '🔥', '⚡', '💎', '🏆', '👑', '🌟', '🐉'];
$nivelNomes = ['Iniciante', 'Amador', 'Novato', 'Regular', 'Veterano', 'Expert', 'Mestre', 'Lenda', 'Supremo', 'Otaku Deus'];
$nivelIdx = max(0, min(($usuario['nivel'] ?? 1) - 1, 9));
$userXp = intval($usuario['xp'] ?? 0);
$xpNext = ($usuario['nivel'] ?? 1) * 100;
$xpPercent = min(100, round(($userXp % 100)));
$socials = json_decode($usuario['redes_sociais'] ?? '{}', true) ?: [];
$waifu = json_decode($usuario['waifu_personagem'] ?? '{}', true) ?: [];
?>

<div class="profile-container-v8">
    <!-- HERO HEADER MODERNO -->
    <div class="profile-hero-v8" style="background-image: url('<?= !empty($usuario['banner']) ? htmlspecialchars($usuario['banner']) : 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/default_banner.jpg' ?>')">
        <div class="profile-hero-overlay"></div>
        
        <div class="profile-hero-content-v8">
            <!-- AVATAR COM MOLDURA NEO-BRUTALISTA -->
            <div class="profile-avatar-box moldura-<?= htmlspecialchars($usuario['moldura'] ?? 'default') ?>">
                <?php if (!empty($usuario['avatar'])): ?>
                    <img src="<?= htmlspecialchars($usuario['avatar']) ?>" alt="<?= htmlspecialchars($usuario['username']) ?>" class="profile-avatar-img">
                <?php else: ?>
                    <div class="profile-avatar-fallback"><?= $nivelIcons[$nivelIdx] ?></div>
                <?php endif; ?>
                <span class="profile-status-indicator" title="Status"><?= htmlspecialchars($usuario['status_emoji'] ?? '🎮') ?></span>
            </div>

            <!-- DETALHES PRINCIPAIS DO USUÁRIO -->
            <div class="profile-hero-info-v8">
                <div class="profile-user-headline">
                    <h1 class="profile-username cor-<?= htmlspecialchars($usuario['cor_nome'] ?? 'default') ?>">
                        <?= htmlspecialchars($usuario['username']) ?>
                    </h1>
                    <span class="profile-level-badge">
                        <?= $nivelIcons[$nivelIdx] ?> Lv.<?= intval($usuario['nivel'] ?? 1) ?> (<?= $nivelNomes[$nivelIdx] ?>)
                    </span>
                    <span class="profile-streak-pill" title="Dias seguidos de atividade">
                        🔥 <?= intval($usuario['streak_atual'] ?? 0) ?> dias
                    </span>
                </div>

                <!-- TÍTULO ATIVO EQUIPADO -->
                <div class="profile-equipped-title-row">
                    <?php if ($titulo_ativo_info): ?>
                        <div class="profile-title-badge-active" style="--title-color: <?= htmlspecialchars($titulo_ativo_info['cor']) ?>;">
                            <span class="title-badge-icon"><?= $titulo_ativo_info['icone'] ?></span>
                            <span class="title-badge-name"><?= htmlspecialchars($titulo_ativo_info['nome']) ?></span>
                            <span class="title-badge-rarity"><?= strtoupper($titulo_ativo_info['raridade']) ?></span>
                        </div>
                    <?php else: ?>
                        <div class="profile-title-badge-none">
                            <i class="fas fa-crown"></i> Sem título equipado
                        </div>
                    <?php endif; ?>

                    <?php if ($viewing_own): ?>
                        <button class="btn-change-title" onclick="openTitlePickerModal()" title="Trocar ou desequipar título">
                            <i class="fas fa-sync-alt"></i> Trocar Título
                        </button>
                    <?php endif; ?>
                </div>

                <!-- BIO -->
                <?php if (!empty($usuario['bio'])): ?>
                    <p class="profile-bio-text"><?= nl2br(htmlspecialchars($usuario['bio'])) ?></p>
                <?php endif; ?>

                <!-- BARRA DE XP PROGRESSIVO -->
                <div class="profile-xp-box">
                    <div class="profile-xp-header">
                        <span>XP: <strong><?= $userXp ?></strong></span>
                        <span>Próximo nível: <strong><?= 100 - ($userXp % 100) ?> XP</strong></span>
                    </div>
                    <div class="profile-xp-track">
                        <div class="profile-xp-fill" style="width: <?= $xpPercent ?>%;"></div>
                    </div>
                </div>

                <!-- REDES SOCIAIS E WAIFU -->
                <div class="profile-meta-row">
                    <?php if (!empty($socials)): ?>
                        <div class="profile-socials-list">
                            <?php if (!empty($socials['discord'])): ?>
                                <button class="social-btn discord" onclick="navigator.clipboard.writeText('<?= htmlspecialchars($socials['discord']) ?>'); alert('Discord copiado: <?= htmlspecialchars($socials['discord']) ?>');" title="Discord">
                                    <i class="fab fa-discord"></i>
                                </button>
                            <?php endif; ?>
                            <?php if (!empty($socials['twitter'])): ?>
                                <a href="https://twitter.com/<?= htmlspecialchars($socials['twitter']) ?>" target="_blank" rel="noopener" class="social-btn twitter" title="Twitter">
                                    <i class="fab fa-twitter"></i>
                                </a>
                            <?php endif; ?>
                            <?php if (!empty($socials['instagram'])): ?>
                                <a href="https://instagram.com/<?= htmlspecialchars($socials['instagram']) ?>" target="_blank" rel="noopener" class="social-btn instagram" title="Instagram">
                                    <i class="fab fa-instagram"></i>
                                </a>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>

                    <?php if (!empty($waifu['nome']) && !empty($waifu['imagem'])): ?>
                        <div class="profile-waifu-pill" title="Personagem Favorito(a)">
                            <i class="fas fa-heart text-danger"></i>
                            <img src="<?= htmlspecialchars($waifu['imagem']) ?>" alt="<?= htmlspecialchars($waifu['nome']) ?>" class="waifu-thumb">
                            <span><?= htmlspecialchars($waifu['nome']) ?></span>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- AÇÕES DO PERFIL -->
            <div class="profile-actions-box">
                <?php if ($viewing_own): ?>
                    <a href="editar_perfil" class="btn btn-primary btn-neo">
                        <i class="fas fa-pen"></i> Editar Perfil
                    </a>
                    <a href="estatisticas" class="btn btn-secondary btn-neo">
                        <i class="fas fa-chart-pie"></i> Ver Estatísticas
                    </a>
                <?php else: ?>
                    <button class="btn btn-primary btn-neo" id="follow-btn" onclick="toggleFollow()">
                        <i class="fas fa-user-plus"></i> Seguir
                    </button>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- CARDS DE VISÃO GERAL (RESUMO RÁPIDO DO PERFIL) -->
    <div class="profile-overview-row">
        <div class="profile-stat-box">
            <div class="stat-box-icon"><i class="fas fa-tv"></i></div>
            <div class="stat-box-info">
                <span class="stat-box-value" id="stat-total-animes">-</span>
                <span class="stat-box-label">Animes Salvos</span>
            </div>
        </div>

        <div class="profile-stat-box">
            <div class="stat-box-icon"><i class="fas fa-check-double"></i></div>
            <div class="stat-box-info">
                <span class="stat-box-value" id="stat-completed">-</span>
                <span class="stat-box-label">Completados</span>
            </div>
        </div>

        <div class="profile-stat-box">
            <div class="stat-box-icon"><i class="fas fa-clock"></i></div>
            <div class="stat-box-info">
                <span class="stat-box-value" id="stat-hours">-</span>
                <span class="stat-box-label">Horas Assistidas</span>
            </div>
        </div>

        <div class="profile-stat-box">
            <div class="stat-box-icon"><i class="fas fa-trophy"></i></div>
            <div class="stat-box-info">
                <span class="stat-box-value" id="stat-achievements">-</span>
                <span class="stat-box-label">Conquistas</span>
            </div>
        </div>

        <!-- CTA DIRETO PARA AS ESTATÍSTICAS APRIMORADAS -->
        <a href="estatisticas" class="profile-stat-cta" title="Abrir página dedicada com gráficos e histórico completo">
            <div class="cta-inner">
                <span class="cta-title"><i class="fas fa-chart-line"></i> Painel de Métricas</span>
                <span class="cta-desc">Gráficos de gêneros, notas e estatísticas aprimoradas →</span>
            </div>
        </a>
    </div>

    <?php if (!$viewing_own && estaLogado()): ?>
        <!-- AFINIDADE -->
        <div class="profile-section-card affinity-section" id="affinity-section" style="display: none;">
            <div class="section-card-header">
                <h3><i class="fas fa-handshake"></i> Afinidade de Gostos</h3>
            </div>
            <div class="affinity-container">
                <div class="affinity-bar-bg">
                    <div class="affinity-bar-fill" id="affinity-bar" style="width: 0%;"></div>
                </div>
                <div class="affinity-text">
                    <span id="affinity-percent" class="affinity-percent">0%</span>
                    <span id="affinity-desc" class="affinity-desc">Calculando afinidade...</span>
                </div>
                <div class="shared-animes-grid" id="shared-animes"></div>
            </div>
        </div>
    <?php endif; ?>

    <!-- VITRINE DE FAVORITOS (VIP) -->
    <div class="profile-section-card" id="vip-favorites-section" style="display: none;">
        <div class="section-card-header">
            <h3><i class="fas fa-star text-warning"></i> Animes Favoritos</h3>
        </div>
        <div class="vip-favorites-grid" id="vip-favorites-grid"></div>
    </div>

    <!-- ANIMES COMPLETOS -->
    <div class="profile-section-card">
        <div class="section-card-header">
            <h3><i class="fas fa-check-circle text-success"></i> Animes Completados</h3>
        </div>
        <div class="completed-animes-grid" id="completed-animes">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </div>

    <!-- CONQUISTAS (BADGES) -->
    <div class="profile-section-card achievements-section">
        <div class="section-card-header">
            <h3><i class="fas fa-medal text-warning"></i> Conquistas e Insígnias</h3>
            <span class="achievements-summary" id="achievements-summary">Carregando conquistas...</span>
        </div>
        <div class="achievements-grid" id="achievements-grid">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </div>

    <!-- ATIVIDADE RECENTE -->
    <div class="profile-section-card">
        <div class="section-card-header">
            <h3><i class="fas fa-history text-primary"></i> Atividade Recente</h3>
        </div>
        <div class="activity-feed" id="activity-feed">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </div>

    <!-- MURAL DE COMENTÁRIOS -->
    <div class="profile-section-card comments-section">
        <div class="section-card-header">
            <h3><i class="fas fa-comments"></i> Mural de Recados</h3>
        </div>

        <?php if (estaLogado()): ?>
            <form class="comment-form-v8" id="comment-form">
                <textarea id="comment-input" placeholder="Deixe um recado no mural..." maxlength="500" required></textarea>
                <button type="submit" class="btn btn-primary btn-sm">
                    <i class="fas fa-paper-plane"></i> Publicar Recado
                </button>
            </form>
        <?php else: ?>
            <p class="login-prompt"><a href="login">Faça login</a> para deixar um recado no mural.</p>
        <?php endif; ?>

        <div class="comments-list" id="comments-list">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </div>
</div>

<!-- MODAL PARA TROCA RÁPIDA DE TÍTULO -->
<?php if ($viewing_own): ?>
<div class="title-picker-modal-backdrop" id="title-picker-modal" style="display: none;" onclick="if(event.target === this) closeTitlePickerModal();">
    <div class="title-picker-modal-box">
        <div class="picker-modal-header">
            <h3><i class="fas fa-crown text-warning"></i> Selecionar Título Equipado</h3>
            <button class="picker-close-btn" onclick="closeTitlePickerModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="picker-modal-body">
            <div class="picker-current-status">
                <span>Título atual:</span>
                <strong><?= $titulo_ativo_info ? htmlspecialchars($titulo_ativo_info['nome']) : 'Nenhum' ?></strong>
                <?php if ($titulo_ativo_info): ?>
                    <button class="btn btn-danger btn-xs" onclick="equipTitle(0)" style="margin-left: 10px;">
                        <i class="fas fa-ban"></i> Desequipar
                    </button>
                <?php endif; ?>
            </div>

            <div class="picker-titles-list">
                <?php if (empty($titulos_desbloqueados)): ?>
                    <div class="picker-empty-message">
                        <i class="fas fa-lock"></i>
                        <p>Você ainda não desbloqueou títulos.</p>
                        <a href="titulos" class="btn btn-sm btn-primary">Ver Galeria de Títulos</a>
                    </div>
                <?php else: ?>
                    <?php foreach ($titulos_desbloqueados as $t): ?>
                        <div class="picker-title-item <?= ($usuario['titulo_ativo'] == $t['id']) ? 'active' : '' ?>" 
                             onclick="equipTitle(<?= $t['id'] ?>)" 
                             style="--badge-color: <?= htmlspecialchars($t['cor']) ?>;">
                            <div class="picker-item-icon" style="background: <?= htmlspecialchars($t['cor']) ?>;">
                                <?= $t['icone'] ?>
                            </div>
                            <div class="picker-item-details">
                                <span class="picker-item-name" style="color: <?= htmlspecialchars($t['cor']) ?>;">
                                    <?= htmlspecialchars($t['nome']) ?>
                                </span>
                                <span class="picker-item-desc"><?= htmlspecialchars($t['descricao']) ?></span>
                            </div>
                            <div class="picker-item-action">
                                <?php if ($usuario['titulo_ativo'] == $t['id']): ?>
                                    <span class="badge-equipped"><i class="fas fa-check"></i> Ativo</span>
                                <?php else: ?>
                                    <button class="btn-equip">Equipar</button>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
        <div class="picker-modal-footer">
            <a href="titulos" class="btn btn-secondary btn-sm"><i class="fas fa-trophy"></i> Ver Todos os Títulos do Sistema</a>
        </div>
    </div>
</div>
<?php endif; ?>

<script>
    const profileUserId = <?= intval($usuario['id']) ?>;
    const viewingOwn = <?= $viewing_own ? 'true' : 'false' ?>;

    function openTitlePickerModal() {
        const m = document.getElementById('title-picker-modal');
        if (m) m.style.display = 'flex';
    }

    function closeTitlePickerModal() {
        const m = document.getElementById('title-picker-modal');
        if (m) m.style.display = 'none';
    }

    async function equipTitle(tituloId) {
        try {
            const res = await fetch('api/users/set_titulo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo_id: tituloId })
            });
            const data = await res.json();
            if (data.success) {
                window.location.reload();
            } else {
                alert(data.message || 'Erro ao definir título');
            }
        } catch (e) {
            console.error('Erro ao equipar título:', e);
            alert('Falha na conexão com o servidor');
        }
    }
</script>
<script src="js/pages/perfil.js?v=10.2"></script>
