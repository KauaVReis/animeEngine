<?php
/**
 * AnimeEngine v7 - Página de Ranking
 * Top usuários por XP
 */

$titulo_pagina = 'Ranking - ANIME.ENGINE v7';
require_once 'includes/auth.php';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-ranking-star"></i> Ranking</h1>
        <p class="page-subtitle">Os maiores otakus do ANIME.ENGINE</p>
    </div>

    <div class="ranking-container">
        <!-- Sua Posição -->
        <?php if (estaLogado()): ?>
        <div class="my-rank-card" id="my-rank">
            <span class="my-rank-label">Sua posição:</span>
            <span class="my-rank-position" id="my-position">...</span>
        </div>
        <?php endif; ?>

        <!-- Top 3 -->
        <div class="top3-podium" id="top3-podium">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>

        <!-- Lista Completa -->
        <div class="ranking-list" id="ranking-list">
            <div class="carousel-loading"><div class="loader"></div></div>
        </div>
    </div>
</main>

<style>
.ranking-container {
    max-width: 800px;
    margin: 0 auto;
}

.my-rank-card {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
    padding: 20px 30px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.my-rank-label {
    font-size: 1.1rem;
}

.my-rank-position {
    font-size: 2rem;
    font-weight: 700;
}

.top3-podium {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 40px;
    min-height: 200px;
}

.podium-item {
    text-align: center;
    padding: 20px;
    background: var(--color-surface);
    border: 2px solid var(--border-color);
    cursor: pointer;
    transition: all 0.2s;
}

.podium-item:hover {
    transform: translateY(-5px);
    border-color: var(--color-primary);
}

.podium-item.gold {
    order: 0;
    border-color: #ffd700;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.podium-item.silver {
    order: -1;
}

.podium-item.bronze {
    order: 1;
}

.podium-rank {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

.podium-avatar {
    font-size: 3rem;
    margin-bottom: 10px;
}

.podium-name {
    font-weight: 700;
    font-size: 1.1rem;
    margin-bottom: 5px;
}

.podium-xp {
    color: var(--color-primary);
    font-weight: 700;
}

.podium-level {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.ranking-list {
    background: var(--color-surface);
    border: 2px solid var(--border-color);
}

.ranking-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background 0.2s;
}

.ranking-item:hover {
    background: var(--color-bg);
}

.ranking-item:last-child {
    border-bottom: none;
}

.rank-position {
    font-size: 1.3rem;
    font-weight: 700;
    width: 40px;
    text-align: center;
    color: var(--color-text-muted);
}

.rank-position.top1 { color: #ffd700; }
.rank-position.top2 { color: #c0c0c0; }
.rank-position.top3 { color: #cd7f32; }

.rank-avatar {
    font-size: 2rem;
}

.rank-info {
    flex: 1;
}

.rank-name {
    font-weight: 700;
}

.rank-level {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.rank-xp {
    text-align: right;
}

.rank-xp-value {
    font-weight: 700;
    color: var(--color-primary);
}

.rank-xp-label {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

@media (max-width: 768px) {
    .top3-podium {
        flex-direction: column;
        align-items: stretch;
    }
    
    .podium-item {
        order: 0 !important;
    }
}
</style>

<script>
const nivelIcons = ['🌱','🌿','🍃','🔥','⚡','💎','🏆','👑','🌟','🐉'];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('api/users/ranking.php');
        const data = await response.json();
        
        // Minha posição
        if (data.minha_posicao) {
            document.getElementById('my-position').textContent = '#' + data.minha_posicao;
        }
        
        // Top 3 Podium
        const top3 = data.ranking.slice(0, 3);
        const podiumContainer = document.getElementById('top3-podium');
        
        const podiumClasses = ['gold', 'silver', 'bronze'];
        const medals = ['🥇', '🥈', '🥉'];
        
        podiumContainer.innerHTML = top3.map((user, i) => `
            <div class="podium-item ${podiumClasses[i]}" onclick="window.location='perfil.php?user=${user.username}'">
                <div class="podium-rank">${medals[i]}</div>
                <div class="podium-avatar">${nivelIcons[Math.min(user.nivel-1, 9)]}</div>
                <div class="podium-name">${user.username}</div>
                <div class="podium-xp">${user.xp} XP</div>
                <div class="podium-level">Nível ${user.nivel}</div>
            </div>
        `).join('');
        
        // Lista completa (4+)
        const rest = data.ranking.slice(3);
        const listContainer = document.getElementById('ranking-list');
        
        if (rest.length === 0) {
            listContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--color-text-muted)">Apenas 3 usuários no ranking</p>';
        } else {
            listContainer.innerHTML = rest.map(user => `
                <div class="ranking-item" onclick="window.location='perfil.php?user=${user.username}'">
                    <div class="rank-position">#${user.posicao}</div>
                    <div class="rank-avatar">${nivelIcons[Math.min(user.nivel-1, 9)]}</div>
                    <div class="rank-info">
                        <div class="rank-name">${user.username}</div>
                        <div class="rank-level">Nível ${user.nivel} • ${user.completos} completos</div>
                    </div>
                    <div class="rank-xp">
                        <div class="rank-xp-value">${user.xp}</div>
                        <div class="rank-xp-label">XP</div>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (e) {
        console.error('Erro:', e);
        document.getElementById('top3-podium').innerHTML = '<p>Erro ao carregar ranking</p>';
    }
});
</script>

<?php
require_once 'includes/footer.php';
?>
