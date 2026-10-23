/**
 * AnimeEngine v8 - Perfil Page (Aprimorado)
 * Gerencia perfil do usuário, resumo, conquistas, atividades e mural de recados.
 */

document.addEventListener('DOMContentLoaded', () => {
    PerfilPage.init();
});

async function loadStatsAndAchievements() {
    try {
        const [stats, streakData] = await Promise.all([
            fetch('api/users/stats.php').then(r => r.json()),
            fetch('api/users/streak.php').then(r => r.json()).catch(() => ({}))
        ]);

        const elTotal = document.getElementById('stat-total-animes');
        const elCompleted = document.getElementById('stat-completed');
        const elHours = document.getElementById('stat-hours');
        const elAch = document.getElementById('stat-achievements');

        if (elTotal) elTotal.textContent = stats.totalAnimes ?? 0;
        if (elCompleted) elCompleted.textContent = stats.completed ?? 0;
        if (elHours) elHours.textContent = (stats.totalHours ?? 0) + 'h';
        if (elAch) elAch.textContent = stats.achievements ?? 0;

        const legacyStats = document.getElementById('profile-stats');
        if (legacyStats) {
            legacyStats.innerHTML = `
                <div class="profile-stat-card">
                    <div class="profile-stat-value">${stats.totalAnimes || 0}</div>
                    <div class="profile-stat-label">Animes</div>
                </div>
                <div class="profile-stat-card">
                    <div class="profile-stat-value">${stats.completed || 0}</div>
                    <div class="profile-stat-label">Completos</div>
                </div>
                <div class="profile-stat-card streak-card">
                    <div class="profile-stat-value">🔥 ${streakData?.streak_atual || 0}</div>
                    <div class="profile-stat-label">Streak Dias</div>
                </div>
                <div class="profile-stat-card">
                    <div class="profile-stat-value">${stats.achievements || 0}</div>
                    <div class="profile-stat-label">Conquistas</div>
                </div>`;
        }

        loadAchievements();
    } catch (e) {
        console.error("Erro stats perfil:", e);
    }
}

async function loadAffinity() {
    if (typeof viewingOwn !== 'undefined' && viewingOwn) return;
    try {
        const affRes = await fetch(`api/users/affinity.php?user_id=${profileUserId}`);
        const affinity = await affRes.json();

        if (affinity.affinity_percent !== undefined && !affinity.self && !affinity.guest) {
            const section = document.getElementById('affinity-section');
            if (section) {
                section.style.display = 'block';
                const bar = document.getElementById('affinity-bar');
                const pct = document.getElementById('affinity-percent');
                const desc = document.getElementById('affinity-desc');

                setTimeout(() => {
                    bar.style.width = affinity.affinity_percent + '%';
                    if (affinity.affinity_percent >= 80) bar.style.background = '#00ff41';
                    else if (affinity.affinity_percent >= 50) bar.style.background = '#ffd700';
                    else bar.style.background = '#ff4b4b';
                }, 500);

                pct.textContent = affinity.affinity_percent + '%';

                if (affinity.shared_count === 0) {
                    desc.textContent = "Vocês não possuem animes em comum registrados com nota.";
                } else {
                    desc.textContent = `Baseado em ${affinity.shared_count} anime(s) em comum.`;
                    const sharedGrid = document.getElementById('shared-animes');
                    if (sharedGrid && affinity.shared_animes) {
                        sharedGrid.innerHTML = affinity.shared_animes.map(anime => `
                            <div class="shared-anime-card" onclick="if(window.Common) Common.navigate('detalhes?id=${anime.id}')">
                                <img src="${anime.imagem}" alt="${anime.titulo}">
                                <div class="shared-scores">
                                    <span class="my-score">V: ${anime.my_score || '-'}</span>
                                    <span class="their-score">E: ${anime.their_score || '-'}</span>
                                </div>
                            </div>
                        `).join('');
                        sharedGrid.style.display = 'flex';
                        sharedGrid.style.gap = '10px';
                        sharedGrid.style.overflowX = 'auto';
                        sharedGrid.style.marginTop = '15px';
                        sharedGrid.style.paddingBottom = '10px';
                    }
                }
            }
        }
    } catch (e) { console.error('Erro afinidade:', e); }
}

async function loadRecentActivity() {
    try {
        const actRes = await fetch(`api/users/atividade.php?user_id=${profileUserId}`);
        const activities = await actRes.json();
        const actContainer = document.getElementById('activity-feed');
        if (!actContainer) return;

        if (!Array.isArray(activities) || activities.length === 0) {
            actContainer.innerHTML = '<p class="empty-message">Nenhuma atividade recente registrada.</p>';
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
    } catch (e) { console.error('Erro atividade:', e); }
}

async function loadListsAndFavorites() {
    try {
        const response = await fetch('api/lists/get.php');
        const data = await response.json();
        const completed = data.lists?.completed || [];
        const favorites = data.lists?.favorites || [];

        const favSec = document.getElementById('vip-favorites-section');
        const favGrid = document.getElementById('vip-favorites-grid');
        if (favSec && favGrid && favorites.length > 0) {
            favSec.style.display = 'block';
            favGrid.innerHTML = favorites.slice(0, 6).map(anime => `
                <div class="vip-favorite-card" onclick="if(window.Common) Common.navigate('detalhes?id=${anime.anime_id}')">
                    <img src="${anime.imagem}" alt="${anime.titulo}">
                    <div class="vip-favorite-overlay">
                        <span class="vip-favorite-title">${anime.titulo}</span>
                    </div>
                </div>
            `).join('');
        }

        const compContainer = document.getElementById('completed-animes');
        if (compContainer) {
            if (completed.length === 0) {
                compContainer.innerHTML = '<p class="empty-message">Nenhum anime completo ainda.</p>';
            } else {
                compContainer.innerHTML = completed.slice(0, 12).map(anime => `
                    <div class="completed-anime-card" onclick="if(window.Common) Common.navigate('detalhes?id=${anime.anime_id}')">
                        <img src="${anime.imagem}" alt="${anime.titulo}">
                        ${anime.nota ? `<div class="anime-rating">⭐ ${anime.nota}</div>` : ''}
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        const c = document.getElementById('completed-animes');
        if (c) c.innerHTML = '<p class="empty-message">Sem registros de animes completos.</p>';
    }
}

function setupLazyLoad() {
    const activitySection = document.getElementById('activity-feed');
    const listsSection = document.getElementById('completed-animes');

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id === 'activity-feed') {
                    loadRecentActivity();
                } else if (entry.target.id === 'completed-animes') {
                    loadListsAndFavorites();
                }
                obs.unobserve(entry.target);
            }
        });
    }, { rootMargin: '100px' });

    if (activitySection) observer.observe(activitySection);
    if (listsSection) observer.observe(listsSection);
}

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

        const sumEl = document.getElementById('achievements-summary');
        if (sumEl) sumEl.textContent = `${unlockedIds.length} de ${allBadges.length} conquistas desbloqueadas`;

        const gridEl = document.getElementById('achievements-grid');
        if (gridEl) {
            gridEl.innerHTML = allBadges.map(badge => {
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
        }
    } catch (e) {
        const gridEl = document.getElementById('achievements-grid');
        if (gridEl) gridEl.innerHTML = '<p class="empty-message">Nenhuma conquista carregada</p>';
    }
}

// === SOCIAL & MURAL DE COMENTÁRIOS ===
let isFollowing = false;

async function toggleFollow() {
    const btn = document.getElementById('follow-btn');
    if (!btn) return;
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
            if (isFollowing) {
                btn.classList.add('following');
                btn.innerHTML = '<i class="fas fa-user-check"></i> Seguindo';
            } else {
                btn.classList.remove('following');
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir';
            }
        }
    } catch (e) {
        console.error('Erro follow:', e);
    }
}

async function loadComments() {
    try {
        const response = await fetch(`api/users/comentarios.php?perfil_id=${profileUserId}`);
        const comments = await response.json();
        const container = document.getElementById('comments-list');
        if (!container) return;

        if (!Array.isArray(comments) || comments.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum recado ainda. Seja o primeiro a escrever!</p>';
        } else {
            container.innerHTML = comments.map(c => `
                <div class="comment-item">
                    <div class="comment-avatar">
                        ${c.autor_avatar ? `<img src="${c.autor_avatar}" alt="Avatar">` : '💬'}
                    </div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-author" onclick="if(window.Common) Common.navigate('perfil?user=${c.autor_username}')">
                                ${c.autor_username}
                            </span>
                            ${c.titulo_nome ? `<span class="comment-title-badge" style="color: ${c.titulo_cor}; border-color: ${c.titulo_cor};">${c.titulo_icone} ${c.titulo_nome}</span>` : ''}
                            <span class="comment-time">${formatTime(c.criado_em)}</span>
                        </div>
                        <div class="comment-text">${escapeHtml(c.conteudo)}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        const container = document.getElementById('comments-list');
        if (container) container.innerHTML = '<p class="empty-message">Sem recados no momento.</p>';
    }
}

function bindCommentForm() {
    const commentForm = document.getElementById('comment-form');
    if (commentForm && !commentForm.dataset.bound) {
        commentForm.dataset.bound = 'true';
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('comment-input');
            const conteudo = input ? input.value.trim() : '';
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
                    alert(result.message || 'Erro ao publicar recado');
                }
            } catch (err) {
                console.error('Erro ao enviar comentário:', err);
            }
        });
    }
}

function formatTime(datetime) {
    if (!datetime) return '';
    const d = new Date(datetime);
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
    return d.toLocaleDateString('pt-BR');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

window.PerfilPage = {
    init() {
        loadStatsAndAchievements();
        loadAffinity();
        setupLazyLoad();
        loadComments();
        bindCommentForm();
    }
};
