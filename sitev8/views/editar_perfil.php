<?php
/**
 * AnimeEngine v7 - Editar Perfil
 * Página de edição de perfil
 */


if (!estaLogado()) {
    header('Location: login.php?redirect=editar_perfil.php');
    exit;
}

$usuario = getUsuarioLogado();


// Buscar dados completos
$conn = conectar();
$sql = "SELECT * FROM usuarios WHERE id = " . getUsuarioId();
$result = mysqli_query($conn, $sql);
$perfil = mysqli_fetch_assoc($result);
mysqli_close($conn);

$badges_exibidos = json_decode($perfil['badges_exibidos'] ?? '[]', true) ?: [];
?>
?>

<div class="edit-profile-container">
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-user-edit"></i> Editar Perfil</h1>
            <a href="?page=perfil" class="btn btn-secondary">← Voltar ao Perfil</a>
        </div>

        <form id="edit-profile-form" class="edit-form">
            <!-- PREVIEW -->
            <div class="profile-preview">
                <div class="preview-avatar moldura-<?= $perfil['moldura'] ?? 'default' ?>" id="preview-avatar">
                    <?= ['🌱', '🌿', '🍃', '🔥', '⚡', '💎', '🏆', '👑', '🌟', '🐉'][min($perfil['nivel'] - 1, 9)] ?>
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
                    $emojis = [
                        '🎮' => 'Jogando',
                        '😴' => 'Dormindo',
                        '🔥' => 'On Fire',
                        '📺' => 'Assistindo',
                        '⏸️' => 'Pausado',
                        '🎯' => 'Focado',
                        '💤' => 'AFK',
                        '🚀' => 'Hypado',
                        '🌙' => 'Noturno',
                        '☕' => 'Relaxando'
                    ];
                    foreach ($emojis as $emoji => $label): ?>
                        <button type="button"
                            class="emoji-btn <?= ($perfil['status_emoji'] ?? '🎮') === $emoji ? 'active' : '' ?>"
                            data-emoji="<?= $emoji ?>" title="<?= $label ?>">
                            <?= $emoji ?>
                        </button>
                    <?php endforeach; ?>
                </div>
                <input type="hidden" name="status_emoji" id="status_emoji"
                    value="<?= $perfil['status_emoji'] ?? '🎮' ?>">
            </div>

            <!-- BIO -->
            <div class="form-section">
                <h3><i class="fas fa-quote-left"></i> Bio</h3>
                <textarea name="bio" id="bio" maxlength="500"
                    placeholder="Conte um pouco sobre você..."><?= htmlspecialchars($perfil['bio'] ?? '') ?></textarea>
                <span class="char-count"><span id="bio-count"><?= strlen($perfil['bio'] ?? '') ?></span>/500</span>
            </div>

            <!-- REDES SOCIAIS -->
            <div class="form-section">
                <h3><i class="fas fa-share-alt"></i> Redes Sociais</h3>
                <?php
                $socials = json_decode($perfil['redes_sociais'] ?? '{}', true) ?: [];
                ?>
                <div class="social-inputs">
                    <div class="input-group">
                        <span class="input-icon"><i class="fab fa-discord"></i></span>
                        <input type="text" id="social-discord" placeholder="Discord User (ex: user#1234)"
                            value="<?= htmlspecialchars($socials['discord'] ?? '') ?>">
                    </div>
                    <div class="input-group">
                        <span class="input-icon"><i class="fab fa-twitter"></i></span>
                        <input type="text" id="social-twitter" placeholder="Twitter/X Username"
                            value="<?= htmlspecialchars($socials['twitter'] ?? '') ?>">
                    </div>
                    <div class="input-group">
                        <span class="input-icon"><i class="fab fa-instagram"></i></span>
                        <input type="text" id="social-instagram" placeholder="Instagram Username"
                            value="<?= htmlspecialchars($socials['instagram'] ?? '') ?>">
                    </div>
                    <div class="input-group">
                        <span class="input-icon"><i class="fab fa-youtube"></i></span>
                        <input type="text" id="social-youtube" placeholder="YouTube Channel Link/User"
                            value="<?= htmlspecialchars($socials['youtube'] ?? '') ?>">
                    </div>
                </div>
            </div>

            <!-- WAIFU / HUSBANDO SHOWCASE -->
            <div class="form-section">
                <h3><i class="fas fa-heart"></i> Waifu/Husbando (Showcase)</h3>
                <?php $waifu = json_decode($perfil['waifu_personagem'] ?? '{}', true) ?: []; ?>
                <div class="social-inputs">
                    <div class="input-group">
                        <span class="input-icon"><i class="fas fa-user-tag"></i></span>
                        <input type="text" id="waifu-nome" placeholder="Nome do Personagem (Ex: Rem, Gojo Satoru)"
                            value="<?= htmlspecialchars($waifu['nome'] ?? '') ?>" maxlength="100">
                    </div>
                    <div class="input-group">
                        <span class="input-icon"><i class="fas fa-image"></i></span>
                        <input type="url" id="waifu-imagem" placeholder="URL da Imagem (Ex: https://...)"
                            value="<?= htmlspecialchars($waifu['imagem'] ?? '') ?>">
                    </div>
                </div>
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
                        <button type="button"
                            class="cor-btn cor-<?= $id ?> <?= ($perfil['cor_nome'] ?? 'default') === $id ? 'active' : '' ?>"
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
                <input type="hidden" name="badges_exibidos" id="badges_exibidos"
                    value='<?= json_encode($badges_exibidos) ?>'>
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
                perfil_publico: document.getElementById('perfil_publico').checked,
                redes_sociais: {
                    discord: document.getElementById('social-discord').value,
                    twitter: document.getElementById('social-twitter').value,
                    instagram: document.getElementById('social-instagram').value,
                    youtube: document.getElementById('social-youtube').value
                },
                waifu_personagem: {
                    nome: document.getElementById('waifu-nome').value.trim(),
                    imagem: document.getElementById('waifu-imagem').value.trim()
                }
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
