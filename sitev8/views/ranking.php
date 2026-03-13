<?php
/**
 * AnimeEngine v8 - View: Ranking
 */
?>

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
