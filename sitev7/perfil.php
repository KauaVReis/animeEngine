<?php
/**
 * AnimeEngine v7 - Perfil do Usuário
 * Com personalização avançada
 */

require_once 'includes/auth.php';

// Verificar se está vendo perfil próprio ou de outro
$username_param = $_GET['user'] ?? null;
$viewing_own = false;

if ($username_param) {
    // Ver perfil de outro
    $conn = conectar();
    $username_safe = escape($conn, $username_param);
    $sql = "SELECT * FROM usuarios WHERE username = '$username_safe'";
    $result = mysqli_query($conn, $sql);

    if (mysqli_num_rows($result) === 0) {
        mysqli_close($conn);
        header('Location: index.php');
        exit;
    }

    $usuario = mysqli_fetch_assoc($result);

    // Verificar privacidade
    if (!$usuario['perfil_publico'] && (!estaLogado() || getUsuarioId() != $usuario['id'])) {
        mysqli_close($conn);
        die('Este perfil é privado.');
    }

    $viewing_own = estaLogado() && getUsuarioId() == $usuario['id'];
    mysqli_close($conn);
} else {
    // Ver próprio perfil
    if (!estaLogado()) {
        header('Location: login.php?redirect=perfil.php');
        exit;
    }

    $conn = conectar();
    $sql = "SELECT * FROM usuarios WHERE id = " . getUsuarioId();
    $result = mysqli_query($conn, $sql);
    $usuario = mysqli_fetch_assoc($result);
    mysqli_close($conn);
    $viewing_own = true;
}

// Buscar o título ativo do usuário
$titulo_ativo_info = null;
if (!empty($usuario['titulo_ativo'])) {
    $conn = conectar();
    $titulo_id = intval($usuario['titulo_ativo']);
    $sql = "SELECT nome, icone, cor FROM titulos WHERE id = $titulo_id";
    $result = mysqli_query($conn, $sql);
    if ($result && mysqli_num_rows($result) > 0) {
        $titulo_ativo_info = mysqli_fetch_assoc($result);
    }
    mysqli_close($conn);
}

$titulo_pagina = $usuario['username'] . ' - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';

// Dados
$nivelIcons = ['🌱', '🌿', '🍃', '🔥', '⚡', '💎', '🏆', '👑', '🌟', '🐉'];
$nivelNomes = ['Iniciante', 'Amador', 'Novato', 'Regular', 'Veterano', 'Expert', 'Mestre', 'Lenda', 'Supremo', 'Otaku Deus'];
$badges_exibidos = json_decode($usuario['badges_exibidos'] ?? '[]', true) ?: [];
?>

<main class="main-content">
    <div class="profile-container">
        <!-- HEADER DO PERFIL -->
        <!-- HEADER HERO MODERNO -->
        <div class="profile-content-wrapper">
            <!-- Banner Area -->
            <div class="profile-hero"
                style="background-image: url('<?= !empty($usuario['banner']) ? $usuario['banner'] : 'https://via.placeholder.com/1200x350?text=Banner' ?>')">

                <div class="profile-hero-content">
                    <!-- Avatar -->
                    <div class="profile-hero-avatar moldura-<?= $usuario['moldura'] ?? 'default' ?>">
                        <?php if (!empty($usuario['avatar'])): ?>
                            <img src="<?= htmlspecialchars($usuario['avatar']) ?>" alt="Avatar">
                        <?php else: ?>
                            <?= $nivelIcons[min(($usuario['nivel'] ?? 1) - 1, 9)] ?>
                        <?php endif; ?>
                    </div>

                    <!-- Info -->
                    <div class="profile-hero-info">
                        <div class="profile-hero-name-row">
                            <span class="profile-hero-status"><?= $usuario['status_emoji'] ?? '🎮' ?></span>
                            <h1 class="profile-hero-username cor-<?= $usuario['cor_nome'] ?? 'default' ?>">
                                <?= htmlspecialchars($usuario['username']) ?>
                            </h1>
                            <span class="level-badge-big">
                                <?= $nivelIcons[min(($usuario['nivel'] ?? 1) - 1, 9)] ?>
                                Nível <?= $usuario['nivel'] ?? 1 ?>
                            </span>
                        </div>

                        <?php if ($titulo_ativo_info): ?>
                            <div class="profile-hero-title-badge"
                                style="border: 2px solid <?= $titulo_ativo_info['cor'] ?>; background: rgba(0,0,0,0.5); display: inline-flex; align-items: center; padding: 4px 12px; margin-top: 10px; border-radius: 20px; box-shadow: 2px 2px 0px <?= $titulo_ativo_info['cor'] ?>;">
                                <span style="margin-right: 8px;"><?= $titulo_ativo_info['icone'] ?></span>
                                <span
                                    style="font-weight: bold; font-size: 0.9rem; color: <?= $titulo_ativo_info['cor'] ?>;"><?= htmlspecialchars($titulo_ativo_info['nome']) ?></span>
                            </div>
                        <?php endif; ?>

                        <?php if (!empty($usuario['bio'])): ?>
                            <p class="profile-hero-bio"><?= nl2br(htmlspecialchars($usuario['bio'])) ?></p>
                        <?php endif; ?>

                        <!-- XP Bar Mini -->
                        <div class="profile-xp" style="margin-top: 10px;">
                            <div class="xp-bar" style="width: 150px; height: 6px;">
                                <div class="xp-fill" style="width: <?= min(($usuario['xp'] ?? 0) % 100, 100) ?>%"></div>
                            </div>
                            <span style="font-size: 0.8rem; opacity: 0.8;"><?= $usuario['xp'] ?? 0 ?> XP</span>
                        </div>
                    </div>

                    <!-- Redes Sociais -->
                    <?php
                    $socials = json_decode($usuario['redes_sociais'] ?? '{}', true) ?: [];
                    if (!empty($socials)): ?>
                        <div class="profile-hero-socials">
                            <?php if (!empty($socials['discord'])): ?>
                                <button class="social-icon discord"
                                    title="Discord: <?= htmlspecialchars($socials['discord']) ?>"
                                    onclick="navigator.clipboard.writeText('<?= htmlspecialchars($socials['discord']) ?>'); alert('Discord copiado: <?= htmlspecialchars($socials['discord']) ?>')">
                                    <i class="fab fa-discord"></i>
                                </button>
                            <?php endif; ?>

                            <?php if (!empty($socials['twitter'])): ?>
                                <a href="https://twitter.com/<?= htmlspecialchars($socials['twitter']) ?>" target="_blank"
                                    class="social-icon twitter">
                                    <i class="fab fa-twitter"></i>
                                </a>
                            <?php endif; ?>

                            <?php if (!empty($socials['instagram'])): ?>
                                <a href="https://instagram.com/<?= htmlspecialchars($socials['instagram']) ?>" target="_blank"
                                    class="social-icon instagram">
                                    <i class="fab fa-instagram"></i>
                                </a>
                            <?php endif; ?>

                            <?php if (!empty($socials['youtube'])): ?>
                                <a href="<?= strpos($socials['youtube'], 'http') === 0 ? htmlspecialchars($socials['youtube']) : 'https://youtube.com/@' . htmlspecialchars($socials['youtube']) ?>"
                                    target="_blank" class="social-icon youtube">
                                    <i class="fab fa-youtube"></i>
                                </a>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>

                    <!-- Waifu/Husbando -->
                    <?php
                    $waifu = json_decode($usuario['waifu_personagem'] ?? '{}', true) ?: [];
                    if (!empty($waifu['nome']) && !empty($waifu['imagem'])):
                        ?>
                        <div class="profile-hero-waifu">
                            <span class="waifu-label"><i class="fas fa-heart"></i>
                                <?= htmlspecialchars($waifu['nome']) ?></span>
                            <img src="<?= htmlspecialchars($waifu['imagem']) ?>"
                                alt="<?= htmlspecialchars($waifu['nome']) ?>" class="waifu-img">
                        </div>
                    <?php endif; ?>

                    <!-- Actions -->
                    <div class="profile-hero-actions">
                        <?php if ($viewing_own): ?>
                            <a href="editar_perfil.php" class="btn btn-secondary btn-sm" style="border-radius: 50px;">
                                <i class="fas fa-edit"></i> Editar
                            </a>
                        <?php else: ?>
                            <button class="btn btn-primary btn-sm" id="follow-btn" onclick="toggleFollow()"
                                style="border-radius: 50px;">
                                <i class="fas fa-user-plus"></i> Seguir
                            </button>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <?php if (!$viewing_own && estaLogado()): ?>
            <!-- AFINIDADE -->
            <div class="profile-section affinity-section" id="affinity-section" style="display: none;">
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-handshake"></i> Afinidade de Gostos</h2>
                </div>
                <div class="affinity-container">
                    <div class="affinity-bar-bg">
                        <div class="affinity-bar-fill" id="affinity-bar" style="width: 0%;"></div>
                    </div>
                    <div class="affinity-text">
                        <span id="affinity-percent" class="affinity-percent">0%</span>
                        <span id="affinity-desc" class="affinity-desc">Calculando afinidade...</span>
                    </div>
                    <div class="shared-animes-grid" id="shared-animes">
                        <!-- Javascript Will Populate Snippets -->
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <!-- VITRINE DE FAVORITOS (VIP) -->
        <div class="profile-section vip-favorites-section" id="vip-favorites-section" style="display: none;">
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-star" style="color: #ffd700;"></i> Top Favoritos</h2>
            </div>
            <div class="vip-favorites-grid" id="vip-favorites-grid">
                <!-- Injected via JS -->
            </div>
        </div>

        <!-- STATS -->
        <div class="profile-stats" id="profile-stats">
            <div class="carousel-loading">
                <div class="loader"></div>
            </div>
        </div>

        <!-- GRÁFICO DE GÊNEROS -->
        <div class="profile-section">
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-chart-pie"></i> Gêneros Favoritos</h2>
            </div>
            <div style="max-width: 400px; margin: 0 auto; position: relative;">
                <canvas id="genres-radar-chart"></canvas>
            </div>
        </div>

        <!-- ATIVIDADE RECENTE -->
        <div class="profile-section">
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-history"></i> Atividade Recente</h2>
            </div>
            <div class="activity-feed" id="activity-feed">
                <div class="carousel-loading">
                    <div class="loader"></div>
                </div>
            </div>
        </div>

        <!-- ANIMES COMPLETOS -->
        <div class="profile-section">
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-check-circle"></i> Animes Completos</h2>
            </div>
            <div class="completed-animes-grid" id="completed-animes">
                <div class="carousel-loading">
                    <div class="loader"></div>
                </div>
            </div>
        </div>

        <!-- CONQUISTAS -->
        <div class="achievements-section">
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-trophy"></i> Conquistas</h2>
            </div>
            <p class="achievements-summary" id="achievements-summary">Carregando...</p>
            <div class="achievements-grid" id="achievements-grid">
                <div class="carousel-loading">
                    <div class="loader"></div>
                </div>
            </div>
        </div>

        <!-- COMENTÁRIOS / MURAL -->
        <div class="profile-section comments-section">
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-comments"></i> Mural</h2>
            </div>

            <?php if (estaLogado()): ?>
                <form class="comment-form" id="comment-form">
                    <textarea id="comment-input" placeholder="Deixe um comentário..." maxlength="500"></textarea>
                    <button type="submit" class="btn btn-primary btn-sm">
                        <i class="fas fa-paper-plane"></i> Enviar
                    </button>
                </form>
            <?php else: ?>
                <p class="login-prompt"><a href="login.php">Faça login</a> para comentar</p>
            <?php endif; ?>

            <div class="comments-list" id="comments-list">
                <div class="carousel-loading">
                    <div class="loader"></div>
                </div>
            </div>
        </div>
    </div>
</main>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const profileUserId = <?= $usuario['id'] ?>;
    const viewingOwn = <?= $viewing_own ? 'true' : 'false' ?>;
</script>
<script src="js/pages/perfil.js"></script>

<?php
require_once 'includes/footer.php';
?>