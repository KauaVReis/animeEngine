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

$titulo_pagina = $usuario['username'] . ' - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';

// Dados
$nivelIcons = ['🌱','🌿','🍃','🔥','⚡','💎','🏆','👑','🌟','🐉'];
$nivelNomes = ['Iniciante','Amador','Novato','Regular','Veterano','Expert','Mestre','Lenda','Supremo','Otaku Deus'];
$badges_exibidos = json_decode($usuario['badges_exibidos'] ?? '[]', true) ?: [];
?>

<main class="main-content">
    <div class="profile-container">
        <!-- HEADER DO PERFIL -->
        <div class="profile-header">
            <div class="profile-avatar moldura-<?= $usuario['moldura'] ?? 'default' ?>">
                <?= $nivelIcons[min(($usuario['nivel'] ?? 1)-1, 9)] ?>
            </div>
            <div class="profile-info">
                <div class="profile-name-row">
                    <span class="profile-status"><?= $usuario['status_emoji'] ?? '🎮' ?></span>
                    <h1 class="profile-username cor-<?= $usuario['cor_nome'] ?? 'default' ?>">
                        <?= htmlspecialchars($usuario['username']) ?>
                    </h1>
                </div>
                
                <div class="profile-level">
                    <span class="level-badge-big">
                        <?= $nivelIcons[min(($usuario['nivel'] ?? 1)-1, 9)] ?> 
                        Nível <?= $usuario['nivel'] ?? 1 ?> - <?= $nivelNomes[min(($usuario['nivel'] ?? 1)-1, 9)] ?>
                    </span>
                </div>
                
                <?php
                // Buscar título ativo
                if (isset($usuario['titulo_ativo']) && $usuario['titulo_ativo']) {
                    $conn = conectar();
                    $sql = "SELECT nome, icone, cor FROM titulos WHERE id = " . intval($usuario['titulo_ativo']);
                    $result = mysqli_query($conn, $sql);
                    $titulo = mysqli_fetch_assoc($result);
                    mysqli_close($conn);
                    if ($titulo): ?>
                    <div class="profile-title" style="color: <?= $titulo['cor'] ?>">
                        <?= $titulo['icone'] ?> <?= $titulo['nome'] ?>
                    </div>
                    <?php endif;
                }
                ?>
                
                <div class="profile-xp">
                    <div class="xp-bar">
                        <div class="xp-fill" style="width: <?= min(($usuario['xp'] ?? 0) % 100, 100) ?>%"></div>
                    </div>
                    <span><?= $usuario['xp'] ?? 0 ?> XP</span>
                </div>
                
                <?php if (!empty($usuario['bio'])): ?>
                <p class="profile-bio"><?= nl2br(htmlspecialchars($usuario['bio'])) ?></p>
                <?php endif; ?>
                
                <!-- Badges Exibidos -->
                <?php if (!empty($badges_exibidos)): ?>
                <div class="profile-badges-display">
                    <?php 
                    $badge_icons = [
                        'first_step' => '🚀', 'explorer' => '🧭', 'collector' => '📚',
                        'hoarder' => '🗄️', 'started' => '▶️', 'dedicated_viewer' => '🎬',
                        'centurion' => '💯', 'marathon' => '🏃', 'finisher' => '🎯',
                        'first_love' => '💕', 'night_owl' => '🦉', 'theme_changer' => '🎨'
                    ];
                    foreach ($badges_exibidos as $badge_id):
                        if (isset($badge_icons[$badge_id])):
                    ?>
                        <span class="displayed-badge" title="<?= $badge_id ?>"><?= $badge_icons[$badge_id] ?></span>
                    <?php 
                        endif;
                    endforeach; 
                    ?>
                </div>
                <?php endif; ?>
                
                <!-- Seguidor count e botões -->
                <div class="profile-social">
                    <span class="follower-count" id="follower-count">
                        <strong id="followers-num">0</strong> seguidores
                    </span>
                </div>
                
                <?php if ($viewing_own): ?>
                <div class="profile-actions">
                    <a href="editar_perfil.php" class="profile-btn edit-btn">
                        <i class="fas fa-edit"></i> Editar Perfil
                    </a>
                    <a href="titulos.php" class="profile-btn title-btn">
                        <i class="fas fa-crown"></i> Títulos
                    </a>
                </div>
                <?php else: ?>
                <div class="profile-actions">
                    <button class="btn btn-primary btn-sm" id="follow-btn" onclick="toggleFollow()">
                        <i class="fas fa-user-plus"></i> Seguir
                    </button>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- STATS -->
        <div class="profile-stats" id="profile-stats">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
        
        <!-- ATIVIDADE RECENTE -->
        <div class="profile-section">
            <h2><i class="fas fa-history"></i> Atividade Recente</h2>
            <div class="activity-feed" id="activity-feed">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>
        
        <!-- ANIMES COMPLETOS -->
        <div class="profile-section">
            <h2><i class="fas fa-check-circle"></i> Animes Completos</h2>
            <div class="completed-animes-grid" id="completed-animes">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>
        
        <!-- CONQUISTAS -->
        <div class="achievements-section">
            <h2><i class="fas fa-trophy"></i> Conquistas</h2>
            <p class="achievements-summary" id="achievements-summary">Carregando...</p>
            <div class="achievements-grid" id="achievements-grid">
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>
        
        <!-- COMENTÁRIOS / MURAL -->
        <div class="profile-section comments-section">
            <h2><i class="fas fa-comments"></i> Mural</h2>
            
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
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>
    </div>
</main>

<style>
.profile-container { max-width: 900px; margin: 0 auto; }

.profile-header {
    display: flex;
    align-items: flex-start;
    gap: 30px;
    padding: 30px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
    margin-bottom: 30px;
}

.profile-avatar {
    font-size: 4rem;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    flex-shrink: 0;
}

/* Molduras */
.moldura-default { border: 4px solid rgba(255,255,255,0.5); }
.moldura-gold { border: 4px solid #ffd700; box-shadow: 0 0 20px #ffd700; }
.moldura-diamond { border: 4px solid #b9f2ff; box-shadow: 0 0 20px #b9f2ff; }
.moldura-fire { border: 4px solid #ff4500; box-shadow: 0 0 20px #ff4500; animation: fire-pulse 1s infinite; }
.moldura-rainbow { border: 4px solid transparent; background: linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2)) padding-box,
                   linear-gradient(45deg, red, orange, yellow, green, blue, purple) border-box; animation: rainbow-spin 3s linear infinite; }
.moldura-neon { border: 4px solid #0ff; box-shadow: 0 0 15px #0ff, 0 0 30px #0ff; }
.moldura-sakura { border: 4px solid #ffb7c5; box-shadow: 0 0 15px #ffb7c5; }

@keyframes fire-pulse {
    0%, 100% { box-shadow: 0 0 15px #ff4500; }
    50% { box-shadow: 0 0 30px #ff4500, 0 0 40px #ff6600; }
}

@keyframes rainbow-spin {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
}

.profile-name-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}

.profile-status { font-size: 2.5rem; }

.profile-username { font-size: 2rem; margin: 0; }

/* Cores do nome */
.cor-default { color: white; }
.cor-gold { color: #ffd700; text-shadow: 0 0 10px #ffd700; }
.cor-purple { color: #d8b4fe; text-shadow: 0 0 10px #9b59b6; }
.cor-red { color: #fca5a5; text-shadow: 0 0 10px #e74c3c; }
.cor-blue { color: #93c5fd; text-shadow: 0 0 10px #3498db; }
.cor-green { color: #86efac; text-shadow: 0 0 10px #2ecc71; }
.cor-rainbow { background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff); 
               -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: rainbow-text 2s linear infinite; }

@keyframes rainbow-text {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
}

.level-badge-big { font-size: 1rem; opacity: 0.9; }

.profile-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 5px;
    text-shadow: 0 0 10px currentColor;
}

.profile-xp {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 15px;
}

.xp-bar {
    width: 200px;
    height: 8px;
    background: rgba(255,255,255,0.3);
    border-radius: 4px;
    overflow: hidden;
}

.xp-fill { height: 100%; background: white; }

.profile-bio {
    margin-top: 15px;
    font-size: 0.95rem;
    opacity: 0.9;
    max-width: 400px;
}

.profile-badges-display {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.displayed-badge {
    font-size: 2rem;
    background: rgba(255,255,255,0.2);
    padding: 8px;
    border-radius: 50%;
}

.profile-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 30px;
}

.profile-stat-card {
    background: var(--color-surface);
    border: 2px solid var(--border-color);
    padding: 20px;
    text-align: center;
}

.profile-stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-primary);
}

.profile-stat-label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.streak-card {
    background: linear-gradient(135deg, #ff4500, #ff6600);
    border-color: #ff4500;
    color: white;
}

.streak-card .profile-stat-value {
    color: white;
}

.streak-card .profile-stat-label {
    color: rgba(255,255,255,0.8);
}

.streak-max {
    font-size: 0.75rem;
    margin-top: 5px;
    opacity: 0.8;
}

.profile-section, .achievements-section {
    background: var(--color-surface);
    border: 2px solid var(--border-color);
    padding: 25px;
    margin-bottom: 20px;
}

.profile-section h2, .achievements-section h2 {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.completed-animes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
}

.completed-anime-card {
    position: relative;
    cursor: pointer;
}

.completed-anime-card img {
    width: 100%;
    aspect-ratio: 2/3;
    object-fit: cover;
    border: 2px solid var(--border-color);
}

.completed-anime-card:hover img {
    border-color: var(--color-primary);
}

.anime-rating {
    position: absolute;
    bottom: 5px;
    right: 5px;
    background: rgba(0,0,0,0.8);
    color: #ffd700;
    padding: 3px 8px;
    font-size: 0.8rem;
    font-weight: 700;
}

.achievements-summary {
    color: var(--color-text-muted);
    margin-bottom: 15px;
}

.achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
}

.achievement-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border: 2px solid var(--border-color);
    background: var(--color-bg);
}

.achievement-card.unlocked {
    border-color: var(--color-primary);
}

.achievement-card.locked {
    opacity: 0.5;
    filter: grayscale(1);
}

.achievement-icon { font-size: 2.5rem; }
.achievement-info { flex: 1; }
.achievement-name { font-weight: 700; }
.achievement-desc { font-size: 0.8rem; color: var(--color-text-muted); }
.achievement-xp { font-size: 0.75rem; color: var(--color-primary); font-weight: 700; }
.achievement-status { font-size: 1.5rem; }

/* Activity Feed */
.activity-feed {
    max-height: 400px;
    overflow-y: auto;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-thumb {
    width: 50px;
    height: 70px;
    object-fit: cover;
    border-radius: 4px;
}

.activity-icon {
    font-size: 2rem;
    width: 50px;
    text-align: center;
}

.activity-content {
    flex: 1;
}

.activity-text {
    font-size: 0.95rem;
}

.activity-text strong {
    color: var(--color-primary);
}

.activity-time {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-top: 2px;
}

.empty-message {
    color: var(--color-text-muted);
    text-align: center;
    padding: 20px;
}

/* Social */
.profile-social {
    margin-top: 15px;
    font-size: 0.95rem;
}

.profile-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.profile-actions .btn {
    padding: 8px 16px;
}

/* Profile Action Buttons - Styled */
.profile-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
}

.edit-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.edit-btn:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.title-btn {
    background: linear-gradient(135deg, #ffd700, #ffaa00);
    color: #1a1a1a;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.title-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(255, 215, 0, 0.6);
}

.title-btn i {
    animation: crown-pulse 2s infinite;
}

@keyframes crown-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

#follow-btn.following {
    background: var(--color-surface);
    color: var(--color-text);
    border: 2px solid var(--border-color);
}

/* Comments */
.comments-section {
    margin-top: 20px;
}

.comment-form {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.comment-form textarea {
    flex: 1;
    padding: 10px;
    border: 2px solid var(--border-color);
    background: var(--color-bg);
    font-family: inherit;
    resize: none;
    min-height: 60px;
}

.comments-list {
    max-height: 400px;
    overflow-y: auto;
}

.comment-item {
    display: flex;
    gap: 15px;
    padding: 15px 0;
    border-bottom: 1px solid var(--border-color);
}

.comment-item:last-child {
    border-bottom: none;
}

.comment-avatar {
    font-size: 1.5rem;
}

.comment-content {
    flex: 1;
}

.comment-header {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 5px;
}

.comment-author {
    font-weight: 700;
    color: var(--color-primary);
    cursor: pointer;
}

.comment-time {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.comment-text {
    font-size: 0.95rem;
}

.login-prompt {
    color: var(--color-text-muted);
    margin-bottom: 20px;
}

.login-prompt a {
    color: var(--color-primary);
}

@media (max-width: 768px) {
    .profile-header { flex-direction: column; text-align: center; }
    .profile-name-row { justify-content: center; }
    .profile-badges-display { justify-content: center; }
    .profile-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>

<script>
const profileUserId = <?= $usuario['id'] ?>;
const viewingOwn = <?= $viewing_own ? 'true' : 'false' ?>;

document.addEventListener('DOMContentLoaded', async () => {
    // Carregar stats
    try {
        const response = await fetch('api/users/stats.php');
        const stats = await response.json();
        
        // Carregar streak
        const streakRes = await fetch('api/users/streak.php');
        const streakData = await streakRes.json();
        
        document.getElementById('profile-stats').innerHTML = `
            <div class="profile-stat-card">
                <div class="profile-stat-value">${stats.totalAnimes}</div>
                <div class="profile-stat-label">Animes</div>
            </div>
            <div class="profile-stat-card">
                <div class="profile-stat-value">${stats.completed}</div>
                <div class="profile-stat-label">Completos</div>
            </div>
            <div class="profile-stat-card streak-card">
                <div class="profile-stat-value">🔥 ${streakData.streak_atual || 0}</div>
                <div class="profile-stat-label">Streak Dias</div>
                <div class="streak-max">Recorde: ${streakData.streak_max || 0}</div>
            </div>
            <div class="profile-stat-card">
                <div class="profile-stat-value">${stats.achievements}</div>
                <div class="profile-stat-label">Conquistas</div>
            </div>
        `;
    } catch (e) { console.error(e); }
    
    // Carregar atividade recente
    try {
        const actRes = await fetch(`api/users/atividade.php?user_id=${profileUserId}`);
        const activities = await actRes.json();
        
        const actContainer = document.getElementById('activity-feed');
        if (activities.length === 0) {
            actContainer.innerHTML = '<p class="empty-message">Nenhuma atividade ainda</p>';
        } else {
            actContainer.innerHTML = activities.slice(0, 10).map(a => `
                <div class="activity-item">
                    ${a.anime_imagem ? `<img src="${a.anime_imagem}" class="activity-thumb">` : '<span class="activity-icon">📝</span>'}
                    <div class="activity-content">
                        <div class="activity-text">${a.texto}</div>
                        <div class="activity-time">${a.tempo}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { console.error(e); }
    
    // Carregar animes completos
    try {
        const response = await fetch('api/lists/get.php');
        const data = await response.json();
        const completed = data.lists?.completed || [];
        
        const container = document.getElementById('completed-animes');
        
        if (completed.length === 0) {
            container.innerHTML = '<p>Nenhum anime completo ainda</p>';
        } else {
            container.innerHTML = completed.slice(0, 12).map(anime => `
                <div class="completed-anime-card" onclick="window.location='detalhes.php?id=${anime.anime_id}'">
                    <img src="${anime.imagem}" alt="${anime.titulo}">
                    ${anime.nota ? `<div class="anime-rating">⭐ ${anime.nota}</div>` : ''}
                </div>
            `).join('');
        }
    } catch (e) { 
        document.getElementById('completed-animes').innerHTML = '<p>Erro ao carregar</p>';
    }
    
    // Carregar achievements
    loadAchievements();
});

async function loadAchievements() {
    try {
        const response = await fetch('api/achievements/get.php');
        const data = await response.json();
        const unlockedIds = Object.keys(data.unlocked || {});
        
        const allBadges = [
            { id: "first_step", name: "Primeiro Passo", description: "Adicione seu primeiro anime", icon: "🚀", xp: 10 },
            { id: "explorer", name: "Explorador", description: "Adicione 3 animes", icon: "🧭", xp: 15 },
            { id: "collector", name: "Colecionador", description: "Tenha 5 animes na lista", icon: "📚", xp: 25 },
            { id: "started", name: "Começando", description: "Assista 10 episódios", icon: "▶️", xp: 15 },
            { id: "dedicated_viewer", name: "Espectador", description: "Assista 50 episódios", icon: "🎬", xp: 50 },
            { id: "centurion", name: "Centurião", description: "Assista 100 eps", icon: "💯", xp: 100 },
            { id: "finisher", name: "Finalizador", description: "Complete 1 anime", icon: "🎯", xp: 20 },
            { id: "first_love", name: "Primeiro Amor", description: "1 favorito", icon: "💕", xp: 10 },
            { id: "night_owl", name: "Coruja", description: "Use à noite", icon: "🦉", xp: 15 },
            { id: "theme_changer", name: "Estilista", description: "Mude o tema", icon: "🎨", xp: 10 }
        ];
        
        document.getElementById('achievements-summary').textContent = 
            `${unlockedIds.length} de ${allBadges.length} conquistas`;
        
        document.getElementById('achievements-grid').innerHTML = allBadges.map(badge => {
            const isUnlocked = unlockedIds.includes(badge.id);
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${badge.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${badge.name}</div>
                        <div class="achievement-desc">${badge.description}</div>
                        <div class="achievement-xp">+${badge.xp} XP</div>
                    </div>
                    <div class="achievement-status">${isUnlocked ? '✅' : '🔒'}</div>
                </div>
            `;
        }).join('');
    } catch (e) {
        document.getElementById('achievements-grid').innerHTML = '<p>Erro</p>';
    }
}

// === SOCIAL FEATURES ===
let isFollowing = false;

// Carregar seguidores e status
async function loadSocialData() {
    try {
        // Contar seguidores
        const countRes = await fetch(`api/users/comentarios.php?perfil_id=${profileUserId}`);
        
        // TODO: endpoint para contar seguidores
        // Por enquanto, apenas carregar comentários
        
    } catch (e) { console.error(e); }
    
    // Carregar comentários
    await loadComments();
}

// Check if following
async function checkFollowStatus() {
    // Load and check follow status from API if needed
}

// Toggle follow
async function toggleFollow() {
    const btn = document.getElementById('follow-btn');
    const action = isFollowing ? 'unfollow' : 'follow';
    
    try {
        const response = await fetch('api/users/seguir.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: profileUserId, action })
        });
        
        const result = await response.json();
        
        if (result.success) {
            isFollowing = !isFollowing;
            document.getElementById('followers-num').textContent = result.seguidores;
            
            if (isFollowing) {
                btn.classList.add('following');
                btn.innerHTML = '<i class="fas fa-user-check"></i> Seguindo';
            } else {
                btn.classList.remove('following');
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir';
            }
        }
    } catch (e) {
        console.error('Erro:', e);
    }
}

// Load comments
async function loadComments() {
    try {
        const response = await fetch(`api/users/comentarios.php?perfil_id=${profileUserId}`);
        const comments = await response.json();
        
        const container = document.getElementById('comments-list');
        
        if (comments.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum comentário ainda. Seja o primeiro!</p>';
        } else {
            container.innerHTML = comments.map(c => `
                <div class="comment-item">
                    <div class="comment-avatar">💬</div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-author" onclick="window.location='perfil.php?user=${c.autor_username}'">${c.autor_username}</span>
                            <span class="comment-time">${formatTime(c.criado_em)}</span>
                        </div>
                        <div class="comment-text">${escapeHtml(c.conteudo)}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        document.getElementById('comments-list').innerHTML = '<p>Erro ao carregar comentários</p>';
    }
}

// Submit comment
const commentForm = document.getElementById('comment-form');
if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const input = document.getElementById('comment-input');
        const conteudo = input.value.trim();
        
        if (!conteudo) return;
        
        try {
            const response = await fetch('api/users/comentarios.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ perfil_id: profileUserId, conteudo })
            });
            
            const result = await response.json();
            
            if (result.success) {
                input.value = '';
                await loadComments();
            } else {
                alert(result.message || 'Erro ao adicionar comentário');
            }
        } catch (e) {
            console.error('Erro:', e);
        }
    });
}

// Helpers
function formatTime(datetime) {
    const d = new Date(datetime);
    return d.toLocaleDateString('pt-BR');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Init social
loadComments();
</script>

<?php
require_once 'includes/footer.php';
?>
