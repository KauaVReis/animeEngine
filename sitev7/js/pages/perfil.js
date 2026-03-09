document.addEventListener('DOMContentLoaded', () => {
    // Inicializa fetches imediatos (topo do perfil)
    loadStatsAndAchievements();
    loadAffinity();

    // Inicializa Lazy Loading para listas mais abaixo
    setupLazyLoad();
});

async function loadStatsAndAchievements() {
    // Stats e Streak podem carregar juntos
    Promise.all([
        fetch('api/users/stats.php').then(r => r.json()),
        fetch('api/users/streak.php').then(r => r.json())
    ]).then(([stats, streakData]) => {
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
            </div>`;

        // Desenhar Gráfico Radar de Gêneros
        if (stats.genres && Object.keys(stats.genres).length > 0) {
            const ctx = document.getElementById('genres-radar-chart').getContext('2d');
            const computedStyle = getComputedStyle(document.body);
            const primaryColor = computedStyle.getPropertyValue('--color-primary').trim() || '#00ff41';
            const textColor = computedStyle.getPropertyValue('--color-text').trim() || '#f0f0f5';

            // Definir cor transparente a partir do hex (RGB estimation)
            // Se primaryColor for hex puro ou var(), simplificamos usando uma cor base padrão pros gráficos
            const primaryRgb = '168, 85, 247'; // Fallback genérico, vamos usar borderColor com primaryColor puro

            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: Object.keys(stats.genres),
                    datasets: [{
                        label: 'Animes Assistidos',
                        data: Object.values(stats.genres),
                        backgroundColor: 'rgba(' + (primaryColor === '#00ff41' ? '0, 255, 65' : '168, 85, 247') + ', 0.2)',
                        borderColor: primaryColor,
                        pointBackgroundColor: primaryColor,
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: primaryColor,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: { color: textColor, font: { size: 12 } },
                            ticks: { display: false }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        } else {
            document.getElementById('genres-radar-chart').outerHTML = '<p class="empty-message">Nenhum gênero registrado ainda.</p>';
        }
    }).catch(e => console.error("Erro stats:", e));

    // Load achievements independently
    loadAchievements();
}

async function loadAffinity() {
    if (viewingOwn) return;
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
                                <div class="shared-anime-card" onclick="window.location='detalhes.php?id=${anime.id}'">
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
    } catch (e) { console.error('Erro atividade:', e); }
}

async function loadListsAndFavorites() {
    try {
        const response = await fetch('api/lists/get.php');
        const data = await response.json();
        const completed = data.lists?.completed || [];
        const favorites = data.lists?.favorites || [];

        if (favorites.length > 0) {
            document.getElementById('vip-favorites-section').style.display = 'block';
            document.getElementById('vip-favorites-grid').innerHTML = favorites.slice(0, 5).map(anime => `
                    <div class="vip-favorite-card" onclick="window.location='detalhes.php?id=${anime.anime_id}'">
                        <img src="${anime.imagem}" alt="${anime.titulo}">
                        <div class="vip-favorite-overlay">
                            <span class="vip-favorite-title">${anime.titulo}</span>
                        </div>
                    </div>
                `).join('');
        }

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
}

// Usando IntersectionObserver para Lazy Load das listas
function setupLazyLoad() {
    const activitySection = document.getElementById('activity-feed');
    const listsSection = document.getElementById('completed-animes');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id === 'activity-feed') {
                    loadRecentActivity();
                } else if (entry.target.id === 'completed-animes') {
                    loadListsAndFavorites();
                }
                observer.unobserve(entry.target);
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
                    <div class="comment-avatar">
                        ${c.autor_avatar ? `<img src="${c.autor_avatar}" alt="Avatar">` : '💬'}
                    </div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-author" onclick="window.location='perfil.php?user=${c.autor_username}'">
                                ${c.autor_username}
                            </span>
                            ${c.titulo_nome ? `<span class="comment-title-badge" style="color: ${c.titulo_cor}; border-color: ${c.titulo_cor}; background: rgba(0,0,0,0.5)">${c.titulo_icone} ${c.titulo_nome}</span>` : ''}
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
    div.textContent = str;
    return div.innerHTML;
}

// Init social
loadComments();
