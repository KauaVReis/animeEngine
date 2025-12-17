<?php
/**
 * AnimeEngine v7 - Editar Perfil
 * Página de edição de perfil
 */

require_once 'includes/auth.php';

if (!estaLogado()) {
    header('Location: login.php?redirect=editar_perfil.php');
    exit;
}

$usuario = getUsuarioLogado();
$titulo_pagina = 'Editar Perfil - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';

// Buscar dados completos
$conn = conectar();
$sql = "SELECT * FROM usuarios WHERE id = " . getUsuarioId();
$result = mysqli_query($conn, $sql);
$perfil = mysqli_fetch_assoc($result);
mysqli_close($conn);

$badges_exibidos = json_decode($perfil['badges_exibidos'] ?? '[]', true) ?: [];
?>

<main class="main-content">
    <div class="edit-profile-container">
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-user-edit"></i> Editar Perfil</h1>
            <a href="perfil.php" class="btn btn-secondary">← Voltar ao Perfil</a>
        </div>

        <form id="edit-profile-form" class="edit-form">
            <!-- PREVIEW -->
            <div class="profile-preview">
                <div class="preview-avatar moldura-<?= $perfil['moldura'] ?? 'default' ?>" id="preview-avatar">
                    <?= ['🌱','🌿','🍃','🔥','⚡','💎','🏆','👑','🌟','🐉'][min($perfil['nivel']-1, 9)] ?>
                </div>
                <div class="preview-info">
                    <span class="preview-status" id="preview-status"><?= $perfil['status_emoji'] ?? '🎮' ?></span>
                    <span class="preview-name cor-<?= $perfil['cor_nome'] ?? 'default' ?>" id="preview-name">
                        <?= htmlspecialchars($perfil['username']) ?>
                    </span>
                </div>
            </div>

            <!-- STATUS -->
            <div class="form-section">
                <h3><i class="fas fa-smile"></i> Status</h3>
                <div class="emoji-selector">
                    <?php
                    $emojis = ['🎮' => 'Jogando', '😴' => 'Dormindo', '🔥' => 'On Fire', '📺' => 'Assistindo', 
                               '⏸️' => 'Pausado', '🎯' => 'Focado', '💤' => 'AFK', '🚀' => 'Hypado', 
                               '🌙' => 'Noturno', '☕' => 'Relaxando'];
                    foreach ($emojis as $emoji => $label): ?>
                        <button type="button" class="emoji-btn <?= ($perfil['status_emoji'] ?? '🎮') === $emoji ? 'active' : '' ?>" 
                                data-emoji="<?= $emoji ?>" title="<?= $label ?>">
                            <?= $emoji ?>
                        </button>
                    <?php endforeach; ?>
                </div>
                <input type="hidden" name="status_emoji" id="status_emoji" value="<?= $perfil['status_emoji'] ?? '🎮' ?>">
            </div>

            <!-- BIO -->
            <div class="form-section">
                <h3><i class="fas fa-quote-left"></i> Bio</h3>
                <textarea name="bio" id="bio" maxlength="500" placeholder="Conte um pouco sobre você..."><?= htmlspecialchars($perfil['bio'] ?? '') ?></textarea>
                <span class="char-count"><span id="bio-count"><?= strlen($perfil['bio'] ?? '') ?></span>/500</span>
            </div>

            <!-- MOLDURA -->
            <div class="form-section">
                <h3><i class="fas fa-circle-notch"></i> Moldura do Avatar</h3>
                <div class="moldura-selector">
                    <?php
                    $molduras = [
                        'default' => ['nome' => 'Padrão', 'req' => 'Desbloqueado'],
                        'gold' => ['nome' => 'Dourado', 'req' => 'Nível 3+'],
                        'diamond' => ['nome' => 'Diamante', 'req' => 'Nível 5+'],
                        'fire' => ['nome' => 'Fogo', 'req' => 'Nível 7+'],
                        'rainbow' => ['nome' => 'Arco-íris', 'req' => 'Nível 9+'],
                        'neon' => ['nome' => 'Neon', 'req' => '100 eps'],
                        'sakura' => ['nome' => 'Sakura', 'req' => '10 completos']
                    ];
                    foreach ($molduras as $id => $info): ?>
                        <div class="moldura-option <?= ($perfil['moldura'] ?? 'default') === $id ? 'active' : '' ?>" 
                             data-moldura="<?= $id ?>">
                            <div class="moldura-preview moldura-<?= $id ?>">🐉</div>
                            <span class="moldura-name"><?= $info['nome'] ?></span>
                            <span class="moldura-req"><?= $info['req'] ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
                <input type="hidden" name="moldura" id="moldura" value="<?= $perfil['moldura'] ?? 'default' ?>">
            </div>

            <!-- COR DO NOME -->
            <div class="form-section">
                <h3><i class="fas fa-palette"></i> Cor do Nome</h3>
                <div class="cor-selector">
                    <?php
                    $cores = [
                        'default' => 'Padrão',
                        'gold' => 'Dourado',
                        'purple' => 'Roxo',
                        'red' => 'Vermelho',
                        'blue' => 'Azul',
                        'green' => 'Verde',
                        'rainbow' => 'Arco-íris'
                    ];
                    foreach ($cores as $id => $nome): ?>
                        <button type="button" class="cor-btn cor-<?= $id ?> <?= ($perfil['cor_nome'] ?? 'default') === $id ? 'active' : '' ?>" 
                                data-cor="<?= $id ?>">
                            <?= $nome ?>
                        </button>
                    <?php endforeach; ?>
                </div>
                <input type="hidden" name="cor_nome" id="cor_nome" value="<?= $perfil['cor_nome'] ?? 'default' ?>">
            </div>

            <!-- BADGES EXIBIDOS -->
            <div class="form-section">
                <h3><i class="fas fa-medal"></i> Badges Exibidos (máx. 3)</h3>
                <p class="form-hint">Escolha até 3 conquistas para exibir no seu perfil</p>
                <div class="badges-selector" id="badges-selector">
                    <p>Carregando conquistas...</p>
                </div>
                <input type="hidden" name="badges_exibidos" id="badges_exibidos" value='<?= json_encode($badges_exibidos) ?>'>
            </div>

            <!-- PRIVACIDADE -->
            <div class="form-section">
                <h3><i class="fas fa-lock"></i> Privacidade</h3>
                <label class="toggle-label">
                    <input type="checkbox" name="perfil_publico" id="perfil_publico" <?= ($perfil['perfil_publico'] ?? 1) ? 'checked' : '' ?>>
                    <span class="toggle-slider"></span>
                    Perfil Público
                </label>
                <p class="form-hint">Se desativado, apenas você pode ver seu perfil</p>
            </div>

            <!-- SUBMIT -->
            <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-lg" id="save-btn">
                    <i class="fas fa-save"></i> Salvar Alterações
                </button>
            </div>
        </form>
    </div>
</main>

<style>
.edit-profile-container {
    max-width: 800px;
    margin: 0 auto;
}

.profile-preview {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 30px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
    margin-bottom: 30px;
}

.preview-avatar {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
}

.preview-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.preview-status {
    font-size: 2rem;
}

.preview-name {
    font-size: 1.8rem;
    font-weight: 700;
}

.form-section {
    background: var(--color-surface);
    border: 2px solid var(--border-color);
    padding: 20px;
    margin-bottom: 20px;
}

.form-section h3 {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.form-hint {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 5px;
}

/* Emoji Selector */
.emoji-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.emoji-btn {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
    border: 2px solid var(--border-color);
    background: var(--color-bg);
    cursor: pointer;
    transition: all 0.2s;
}

.emoji-btn:hover, .emoji-btn.active {
    border-color: var(--color-primary);
    transform: scale(1.1);
}

/* Bio */
textarea {
    width: 100%;
    min-height: 100px;
    padding: 15px;
    border: 2px solid var(--border-color);
    background: var(--color-bg);
    font-family: inherit;
    font-size: 1rem;
    resize: vertical;
}

.char-count {
    display: block;
    text-align: right;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-top: 5px;
}

/* Moldura Selector */
.moldura-selector {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 15px;
}

.moldura-option {
    text-align: center;
    padding: 15px;
    border: 2px solid var(--border-color);
    cursor: pointer;
    transition: all 0.2s;
}

.moldura-option:hover, .moldura-option.active {
    border-color: var(--color-primary);
}

.moldura-preview {
    width: 60px;
    height: 60px;
    margin: 0 auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    border-radius: 50%;
}

.moldura-name {
    display: block;
    font-weight: 600;
    font-size: 0.85rem;
}

.moldura-req {
    display: block;
    font-size: 0.7rem;
    color: var(--color-text-muted);
}

/* Molduras CSS */
.moldura-default { border: 3px solid #666; }
.moldura-gold { border: 3px solid #ffd700; box-shadow: 0 0 10px #ffd700; }
.moldura-diamond { border: 3px solid #b9f2ff; box-shadow: 0 0 15px #b9f2ff; }
.moldura-fire { border: 3px solid #ff4500; box-shadow: 0 0 15px #ff4500; animation: fire-pulse 1s infinite; }
.moldura-rainbow { border: 3px solid transparent; background: linear-gradient(var(--color-bg), var(--color-bg)) padding-box, 
                   linear-gradient(45deg, red, orange, yellow, green, blue, purple) border-box; animation: rainbow-rotate 3s linear infinite; }
.moldura-neon { border: 3px solid #0ff; box-shadow: 0 0 10px #0ff, 0 0 20px #0ff; }
.moldura-sakura { border: 3px solid #ffb7c5; box-shadow: 0 0 10px #ffb7c5; }

@keyframes fire-pulse {
    0%, 100% { box-shadow: 0 0 10px #ff4500; }
    50% { box-shadow: 0 0 25px #ff4500, 0 0 35px #ff6600; }
}

@keyframes rainbow-rotate {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
}

/* Cor Selector */
.cor-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.cor-btn {
    padding: 10px 20px;
    border: 2px solid var(--border-color);
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.cor-btn:hover, .cor-btn.active {
    border-color: var(--color-primary);
}

.cor-default { color: inherit; }
.cor-gold { color: #ffd700; }
.cor-purple { color: #9b59b6; }
.cor-red { color: #e74c3c; }
.cor-blue { color: #3498db; }
.cor-green { color: #2ecc71; }
.cor-rainbow { background: linear-gradient(90deg, red, orange, yellow, green, blue, purple); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

/* Badges Selector */
.badges-selector {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
}

.badge-option {
    padding: 10px;
    border: 2px solid var(--border-color);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.badge-option:hover {
    border-color: var(--color-primary);
}

.badge-option.selected {
    border-color: var(--color-primary);
    background: rgba(var(--primary-rgb), 0.1);
}

.badge-option.locked {
    opacity: 0.4;
    cursor: not-allowed;
}

.badge-icon {
    font-size: 2rem;
}

.badge-name {
    font-size: 0.75rem;
    margin-top: 5px;
}

/* Toggle */
.toggle-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.toggle-slider {
    width: 50px;
    height: 26px;
    background: #ccc;
    border-radius: 13px;
    position: relative;
    transition: 0.3s;
}

.toggle-slider::after {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: 0.3s;
}

.toggle-label input:checked + .toggle-slider {
    background: var(--color-primary);
}

.toggle-label input:checked + .toggle-slider::after {
    left: 26px;
}

.toggle-label input {
    display: none;
}

/* Actions */
.form-actions {
    text-align: center;
    margin-top: 30px;
}

.btn-lg {
    padding: 15px 40px;
    font-size: 1.1rem;
}

@media (max-width: 768px) {
    .moldura-selector {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-profile-form');
    
    // Emoji selector
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('status_emoji').value = btn.dataset.emoji;
            document.getElementById('preview-status').textContent = btn.dataset.emoji;
        });
    });
    
    // Moldura selector
    document.querySelectorAll('.moldura-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.moldura-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            document.getElementById('moldura').value = opt.dataset.moldura;
            
            const preview = document.getElementById('preview-avatar');
            preview.className = 'preview-avatar moldura-' + opt.dataset.moldura;
        });
    });
    
    // Cor selector
    document.querySelectorAll('.cor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cor-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('cor_nome').value = btn.dataset.cor;
            
            const preview = document.getElementById('preview-name');
            preview.className = 'preview-name cor-' + btn.dataset.cor;
        });
    });
    
    // Bio counter
    const bioInput = document.getElementById('bio');
    bioInput.addEventListener('input', () => {
        document.getElementById('bio-count').textContent = bioInput.value.length;
    });
    
    // Load badges
    loadBadges();
    
    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('save-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        const data = {
            bio: document.getElementById('bio').value,
            status_emoji: document.getElementById('status_emoji').value,
            moldura: document.getElementById('moldura').value,
            cor_nome: document.getElementById('cor_nome').value,
            badges_exibidos: JSON.parse(document.getElementById('badges_exibidos').value || '[]'),
            perfil_publico: document.getElementById('perfil_publico').checked
        };
        
        try {
            const response = await fetch('api/users/update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Perfil atualizado com sucesso!');
                window.location.href = 'perfil.php';
            } else {
                alert(result.message || 'Erro ao salvar');
            }
        } catch (e) {
            alert('Erro de conexão');
        }
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
    });
});

async function loadBadges() {
    const container = document.getElementById('badges-selector');
    const selectedInput = document.getElementById('badges_exibidos');
    let selected = JSON.parse(selectedInput.value || '[]');
    
    // Buscar conquistas desbloqueadas
    try {
        const response = await fetch('api/achievements/get.php');
        const data = await response.json();
        const unlockedIds = Object.keys(data.unlocked || {});
        
        const allBadges = [
            { id: "first_step", name: "Primeiro Passo", icon: "🚀" },
            { id: "explorer", name: "Explorador", icon: "🧭" },
            { id: "collector", name: "Colecionador", icon: "📚" },
            { id: "hoarder", name: "Acumulador", icon: "🗄️" },
            { id: "started", name: "Começando", icon: "▶️" },
            { id: "dedicated_viewer", name: "Espectador", icon: "🎬" },
            { id: "centurion", name: "Centurião", icon: "💯" },
            { id: "marathon", name: "Maratonista", icon: "🏃" },
            { id: "finisher", name: "Finalizador", icon: "🎯" },
            { id: "first_love", name: "Primeiro Amor", icon: "💕" },
            { id: "night_owl", name: "Coruja", icon: "🦉" },
            { id: "theme_changer", name: "Estilista", icon: "🎨" }
        ];
        
        container.innerHTML = allBadges.map(badge => {
            const isUnlocked = unlockedIds.includes(badge.id);
            const isSelected = selected.includes(badge.id);
            return `
                <div class="badge-option ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}" 
                     data-badge="${badge.id}" ${isUnlocked ? 'onclick="toggleBadge(this)"' : ''}>
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-name">${badge.name}</div>
                </div>
            `;
        }).join('');
        
    } catch (e) {
        container.innerHTML = '<p>Erro ao carregar conquistas</p>';
    }
}

function toggleBadge(element) {
    const badgeId = element.dataset.badge;
    const input = document.getElementById('badges_exibidos');
    let selected = JSON.parse(input.value || '[]');
    
    if (element.classList.contains('selected')) {
        selected = selected.filter(id => id !== badgeId);
        element.classList.remove('selected');
    } else {
        if (selected.length >= 3) {
            alert('Máximo de 3 badges!');
            return;
        }
        selected.push(badgeId);
        element.classList.add('selected');
    }
    
    input.value = JSON.stringify(selected);
}
</script>

<?php
require_once 'includes/footer.php';
?>
