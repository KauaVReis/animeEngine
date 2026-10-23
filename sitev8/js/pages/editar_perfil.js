/**
 * AnimeEngine v8 - Editar Perfil Page (Modernizado com AniList GraphQL)
 */

const EditarPerfilPage = {
    selectedBadges: [],

    init() {
        console.log('🛠️ [EditarPerfilPage] Inicializando...');
        this.bindEvents();
        this.loadBadges();
        this.setupLivePreviews();
    },

    bindEvents() {
        // Emoji selector
        document.querySelectorAll('.emoji-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.emoji-pill-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const emoji = btn.dataset.emoji;
                document.getElementById('status_emoji').value = emoji;
                const prev = document.getElementById('preview-status');
                if (prev) prev.textContent = emoji;
            });
        });

        // Moldura selector
        document.querySelectorAll('.moldura-item-card').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.moldura-item-card').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const m = opt.dataset.moldura;
                document.getElementById('moldura').value = m;

                const preview = document.getElementById('preview-avatar-box');
                if (preview) {
                    preview.className = `edit-preview-avatar-box moldura-${m}`;
                }
            });
        });

        // Cor selector
        document.querySelectorAll('.cor-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cor-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cor = btn.dataset.cor;
                document.getElementById('cor_nome').value = cor;

                const preview = document.getElementById('preview-name');
                if (preview) {
                    preview.className = `preview-username cor-${cor}`;
                }
            });
        });

        // Bio counter & live preview
        const bioInput = document.getElementById('bio');
        if (bioInput) {
            bioInput.addEventListener('input', () => {
                const countEl = document.getElementById('bio-count');
                if (countEl) countEl.textContent = bioInput.value.length;
                const prevBio = document.getElementById('preview-bio-text');
                if (prevBio) {
                    prevBio.textContent = bioInput.value.trim() || 'Sua bio aparecerá aqui...';
                }
            });
        }

        // Live Preview para Avatar URL
        const avatarInput = document.getElementById('avatar_url');
        if (avatarInput) {
            avatarInput.addEventListener('input', () => {
                this.updateAvatarPreview(avatarInput.value.trim());
            });
        }

        // Live Preview para Banner URL
        const bannerInput = document.getElementById('banner_url');
        if (bannerInput) {
            bannerInput.addEventListener('input', () => {
                const url = bannerInput.value.trim();
                const card = document.getElementById('edit-preview-card');
                if (card) {
                    card.style.backgroundImage = url ? `url('${url}')` : `url('https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/default_banner.jpg')`;
                }
            });
        }

        // Waifu Live Preview
        const waifuNome = document.getElementById('waifu-nome');
        const waifuImg = document.getElementById('waifu-imagem');
        const updateWaifu = () => {
            const nome = waifuNome?.value.trim() || '';
            const img = waifuImg?.value.trim() || '';
            const pill = document.getElementById('preview-waifu-pill');
            const pNome = document.getElementById('preview-waifu-name');
            const pImg = document.getElementById('preview-waifu-img');

            if (pill && pNome && pImg) {
                if (nome && img) {
                    pill.style.display = 'inline-flex';
                    pNome.textContent = nome;
                    pImg.src = img;
                } else {
                    pill.style.display = 'none';
                }
            }
        };
        if (waifuNome) waifuNome.addEventListener('input', updateWaifu);
        if (waifuImg) waifuImg.addEventListener('input', updateWaifu);

        // Form submit
        const form = document.getElementById('edit-profile-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Enter key em buscas AniList
        document.getElementById('anilist-char-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchCharacter();
            }
        });
        document.getElementById('anilist-username-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.syncAniListProfile();
            }
        });
    },

    setupLivePreviews() {
        const avatarUrl = document.getElementById('avatar_url')?.value.trim();
        if (avatarUrl) {
            this.updateAvatarPreview(avatarUrl);
        }
    },

    updateAvatarPreview(url) {
        const box = document.getElementById('preview-avatar-box');
        if (!box) return;

        let img = document.getElementById('preview-avatar-img');
        let fallback = document.getElementById('preview-avatar-fallback');

        if (url) {
            if (!img) {
                img = document.createElement('img');
                img.id = 'preview-avatar-img';
                img.alt = 'Avatar';
                box.prepend(img);
            }
            img.src = url;
            img.style.display = 'block';
            if (fallback) fallback.style.display = 'none';
        } else {
            if (img) img.style.display = 'none';
            if (fallback) fallback.style.display = 'block';
        }
    },

    // ==========================================
    // RECURSOS ANILIST GRAPHQL
    // ==========================================

    async searchCharacter() {
        const input = document.getElementById('anilist-char-input');
        const resultsBox = document.getElementById('anilist-char-results');
        const query = input?.value.trim();

        if (!query || !resultsBox) return;

        resultsBox.innerHTML = '<div class="anilist-searching"><i class="fas fa-spinner fa-spin"></i> Consultando AniList...</div>';

        const graphqlQuery = `
            query ($search: String) {
                Page(perPage: 6) {
                    characters(search: $search) {
                        id
                        name {
                            full
                            native
                        }
                        image {
                            large
                        }
                    }
                }
            }
        `;

        try {
            const res = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { search: query }
                })
            });

            const data = await res.json();
            const characters = data?.data?.Page?.characters || [];

            if (characters.length === 0) {
                resultsBox.innerHTML = '<p class="anilist-empty">Nenhum personagem encontrado no AniList com este nome.</p>';
                return;
            }

            resultsBox.innerHTML = characters.map(c => `
                <div class="anilist-char-card" onclick="EditarPerfilPage.selectCharacter('${c.name.full.replace(/'/g, "\\'")}', '${c.image.large}')">
                    <img src="${c.image.large}" alt="${c.name.full}" loading="lazy">
                    <span class="char-name">${c.name.full}</span>
                    <button type="button" class="btn-pick-char"><i class="fas fa-check"></i> Selecionar</button>
                </div>
            `).join('');

        } catch (e) {
            console.error('Erro na consulta AniList:', e);
            resultsBox.innerHTML = '<p class="anilist-error">Falha ao consultar AniList. Tente novamente em instantes.</p>';
        }
    },

    selectCharacter(name, imageUrl) {
        const nomeInput = document.getElementById('waifu-nome');
        const imgInput = document.getElementById('waifu-imagem');

        if (nomeInput) nomeInput.value = name;
        if (imgInput) imgInput.value = imageUrl;

        // Atualiza preview
        const pill = document.getElementById('preview-waifu-pill');
        const pNome = document.getElementById('preview-waifu-name');
        const pImg = document.getElementById('preview-waifu-img');

        if (pill && pNome && pImg) {
            pill.style.display = 'inline-flex';
            pNome.textContent = name;
            pImg.src = imageUrl;
        }

        const resultsBox = document.getElementById('anilist-char-results');
        if (resultsBox) {
            resultsBox.innerHTML = `<div class="anilist-success-banner"><i class="fas fa-check-circle"></i> "${name}" selecionado(a) como sua Waifu/Husbando!</div>`;
        }
    },

    async syncAniListProfile() {
        const input = document.getElementById('anilist-username-input');
        const username = input?.value.trim();

        if (!username) {
            alert('Por favor digite o seu nome de usuário do AniList.');
            return;
        }

        const btn = document.querySelector('[onclick="EditarPerfilPage.syncAniListProfile()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        }

        const graphqlQuery = `
            query ($username: String) {
                User(name: $username) {
                    name
                    avatar {
                        large
                    }
                    bannerImage
                    about
                }
            }
        `;

        try {
            const res = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { username: username }
                })
            });

            const data = await res.json();
            const user = data?.data?.User;

            if (!user) {
                alert(`Usuário "${username}" não encontrado no AniList.`);
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Importar'; }
                return;
            }

            if (user.avatar?.large) {
                const av = document.getElementById('avatar_url');
                if (av) av.value = user.avatar.large;
                this.updateAvatarPreview(user.avatar.large);
            }

            if (user.bannerImage) {
                const bn = document.getElementById('banner_url');
                if (bn) bn.value = user.bannerImage;
                const card = document.getElementById('edit-preview-card');
                if (card) card.style.backgroundImage = `url('${user.bannerImage}')`;
            }

            if (user.about) {
                // Remove tags HTML básicas do about se houver
                const cleanBio = user.about.replace(/<[^>]*>?/gm, '').substring(0, 500);
                const bio = document.getElementById('bio');
                if (bio) {
                    bio.value = cleanBio;
                    const countEl = document.getElementById('bio-count');
                    if (countEl) countEl.textContent = cleanBio.length;
                    const prevBio = document.getElementById('preview-bio-text');
                    if (prevBio) prevBio.textContent = cleanBio;
                }
            }

            alert(`✅ Perfil de "${user.name}" importado com sucesso do AniList!`);

        } catch (e) {
            console.error('Erro ao sincronizar AniList:', e);
            alert('Falha ao comunicar com a API do AniList.');
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-download"></i> Importar';
        }
    },

    // ==========================================
    // BADGES & SALVAMENTO
    // ==========================================

    async loadBadges() {
        const container = document.getElementById('badges-selector');
        const selectedInput = document.getElementById('badges_exibidos');
        this.selectedBadges = JSON.parse(selectedInput?.value || '[]');

        try {
            const response = await fetch('api/achievements/get.php');
            const data = await response.json();
            const unlockedIds = Object.keys(data.unlocked || {});

            const allBadges = [
                { id: "first_step", name: "Primeiro Passo", icon: "🚀" },
                { id: "explorer", name: "Explorador", icon: "🧭" },
                { id: "collector", name: "Colecionador", icon: "📚" },
                { id: "started", name: "Começando", icon: "▶️" },
                { id: "dedicated_viewer", name: "Espectador", icon: "🎬" },
                { id: "centurion", name: "Centurião", icon: "💯" },
                { id: "finisher", name: "Finalizador", icon: "🎯" },
                { id: "first_love", name: "Primeiro Amor", icon: "💕" },
                { id: "night_owl", name: "Coruja", icon: "🦉" },
                { id: "theme_changer", name: "Estilista", icon: "🎨" }
            ];

            if (container) {
                container.innerHTML = allBadges.map(badge => {
                    const isUnlocked = unlockedIds.includes(badge.id);
                    const isSelected = this.selectedBadges.includes(badge.id);

                    return `
                        <div class="badge-item-neo ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}" 
                             data-badge="${badge.id}" 
                             ${isUnlocked ? `onclick="EditarPerfilPage.toggleBadge('${badge.id}')"` : ''}
                             title="${isUnlocked ? (isSelected ? 'Clique para remover' : 'Clique para exibir') : 'Bloqueado'}">
                            <span class="badge-icon">${badge.icon}</span>
                            <span class="badge-name">${badge.name}</span>
                            <span class="badge-status-tag">${isUnlocked ? (isSelected ? '⭐ EXIBIDO' : 'SELECIONAR') : '🔒 BLOQUEADO'}</span>
                        </div>
                    `;
                }).join('');
            }

        } catch (e) {
            if (container) container.innerHTML = '<p class="empty-column-message">Erro ao carregar conquistas</p>';
        }
    },

    toggleBadge(badgeId) {
        const input = document.getElementById('badges_exibidos');

        if (this.selectedBadges.includes(badgeId)) {
            this.selectedBadges = this.selectedBadges.filter(id => id !== badgeId);
        } else {
            if (this.selectedBadges.length >= 3) {
                alert('Você só pode selecionar até 3 insígnias para exibir no perfil.');
                return;
            }
            this.selectedBadges.push(badgeId);
        }

        if (input) input.value = JSON.stringify(this.selectedBadges);

        document.querySelectorAll('.badge-item-neo').forEach(item => {
            const id = item.getAttribute('data-badge');
            const isSelected = this.selectedBadges.includes(id);
            item.classList.toggle('selected', isSelected);
            const tag = item.querySelector('.badge-status-tag');
            if (tag && item.classList.contains('unlocked')) {
                tag.textContent = isSelected ? '⭐ EXIBIDO' : 'SELECIONAR';
            }
        });
    },

    async handleSubmit(e) {
        e.preventDefault();

        const btn = document.getElementById('save-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SALVANDO ALTERAÇÕES...';

        const data = {
            avatar: document.getElementById('avatar_url')?.value.trim() || '',
            banner: document.getElementById('banner_url')?.value.trim() || '',
            bio: document.getElementById('bio')?.value.trim() || '',
            status_emoji: document.getElementById('status_emoji')?.value || '🎮',
            moldura: document.getElementById('moldura')?.value || 'default',
            cor_nome: document.getElementById('cor_nome')?.value || 'default',
            badges_exibidos: this.selectedBadges,
            perfil_publico: document.getElementById('perfil_publico')?.checked ? 1 : 0,
            redes_sociais: {
                discord: document.getElementById('social-discord')?.value.trim() || '',
                twitter: document.getElementById('social-twitter')?.value.trim() || '',
                instagram: document.getElementById('social-instagram')?.value.trim() || '',
                youtube: document.getElementById('social-youtube')?.value.trim() || ''
            },
            waifu_personagem: {
                nome: document.getElementById('waifu-nome')?.value.trim() || '',
                imagem: document.getElementById('waifu-imagem')?.value.trim() || ''
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
                if (window.createParticles) {
                    createParticles(25, 'star', ['#00ff41', '#ffd700', '#ff3366']);
                }
                alert('✨ Perfil atualizado com sucesso!');
                if (window.Common && Common.navigate) {
                    Common.navigate('perfil');
                } else {
                    window.location.href = 'perfil';
                }
            } else {
                alert(result.message || 'Erro ao atualizar perfil.');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> SALVAR TODAS AS ALTERAÇÕES';
            }
        } catch (err) {
            console.error(err);
            alert('Falha de conexão ao salvar perfil.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> SALVAR TODAS AS ALTERAÇÕES';
        }
    }
};

window.EditarPerfilPage = EditarPerfilPage;
document.addEventListener('DOMContentLoaded', () => {
    EditarPerfilPage.init();
});
