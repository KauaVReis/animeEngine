/**
 * AnimeEngine v8 - Galeria de Títulos (Aprimorado)
 * Gerenciamento de títulos desbloqueados, preview ao vivo e equipar/desequipar instantâneo
 */

const TitulosPage = {
    tituloAtivo: null,
    todosTitulos: [],

    async init() {
        console.log('👑 [TitulosPage] Inicializando Galeria de Títulos...');
        await this.loadTitulos();
        console.log('✅ [TitulosPage] Galeria carregada!');
    },

    async loadTitulos() {
        try {
            const response = await fetch('api/users/titulos.php');
            const data = await response.json();

            this.tituloAtivo = data.titulo_ativo;
            this.todosTitulos = [];

            const categories = ['nivel', 'genero', 'radio', 'sazonal', 'secreto'];

            for (const cat of categories) {
                const container = document.getElementById(`titulos-${cat}`);
                if (!container) continue;

                const titulos = data.titulos?.[cat] || [];
                this.todosTitulos.push(...titulos);

                if (titulos.length === 0) {
                    container.innerHTML = '<p class="empty-column-message">Nenhum título disponível nesta categoria ainda.</p>';
                    continue;
                }

                container.innerHTML = titulos.map(t => {
                    const isEquipped = (t.id == this.tituloAtivo);
                    const isUnlocked = !!t.desbloqueado;

                    return `
                        <div class="title-card-v8 ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'active-equipped' : ''}" 
                             data-id="${t.id}" 
                             style="--title-accent: ${t.cor || '#00ff41'};"
                             ${isUnlocked ? `onclick="TitulosPage.selectTitulo(${t.id})"` : ''}
                             title="${isUnlocked ? 'Clique para equipar este título' : 'Bloqueado: Requisito não concluído'}">
                            
                            <div class="title-badge-header">
                                <span class="title-status-tag ${isUnlocked ? 'status-unlocked' : 'status-locked'}">
                                    ${isUnlocked ? (isEquipped ? '✨ EQUIPADO' : '🔓 DESBLOQUEADO') : '🔒 BLOQUEADO'}
                                </span>
                                <span class="title-rarity-tag">${(t.raridade || 'comum').toUpperCase()}</span>
                            </div>

                            <div class="title-icon-box" style="background: ${isUnlocked ? t.cor : 'var(--border-color)'};">
                                ${t.icone || '👑'}
                            </div>

                            <div class="title-main-name" style="color: ${isUnlocked ? t.cor : 'var(--color-text-muted)'};">
                                ${t.nome}
                            </div>

                            <p class="title-card-desc">
                                ${isUnlocked ? (t.descricao || 'Título conquistado!') : 'Requisito Secreto ou Nível Insuficiente...'}
                            </p>

                            <div class="title-card-footer">
                                ${isUnlocked 
                                    ? (isEquipped 
                                        ? '<span class="label-active"><i class="fas fa-check-circle"></i> Em uso no perfil</span>' 
                                        : '<button class="btn-equip-card">Equipar</button>') 
                                    : '<span class="label-locked"><i class="fas fa-lock"></i> Bloqueado</span>'
                                }
                            </div>
                        </div>
                    `;
                }).join('');
            }

            this.updateActiveDisplay();

        } catch (e) {
            console.error('Erro ao carregar títulos:', e);
            const activeCont = document.getElementById('active-title');
            if (activeCont) activeCont.innerHTML = '<p class="empty-column-message">Erro de conexão ao carregar títulos.</p>';
        }
    },

    updateActiveDisplay() {
        const container = document.getElementById('active-title');
        const unequipBtn = document.getElementById('btn-unequip-title');
        if (!container) return;

        const activeTitle = this.todosTitulos.find(t => t.id == this.tituloAtivo);

        if (activeTitle && this.tituloAtivo) {
            container.innerHTML = `
                <div class="active-title-preview-pill" style="--accent: ${activeTitle.cor || '#ffd700'};">
                    <span class="preview-icon" style="background: ${activeTitle.cor || '#ffd700'};">${activeTitle.icone || '👑'}</span>
                    <div class="preview-text">
                        <span class="preview-name" style="color: ${activeTitle.cor || '#ffd700'};">${activeTitle.nome}</span>
                        <span class="preview-desc">${activeTitle.descricao || ''}</span>
                    </div>
                    <span class="preview-badge-status"><i class="fas fa-check"></i> EQUIPADO</span>
                </div>
            `;
            if (unequipBtn) unequipBtn.style.display = 'inline-flex';
        } else {
            container.innerHTML = `
                <div class="no-title-preview">
                    <i class="fas fa-user-slash"></i>
                    <span>Nenhum título equipado no momento. Selecione um dos títulos desbloqueados abaixo para exibir no seu perfil!</span>
                </div>
            `;
            if (unequipBtn) unequipBtn.style.display = 'none';
        }
    },

    async selectTitulo(id) {
        if (id == this.tituloAtivo) return;

        try {
            const response = await fetch('api/users/set_titulo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo_id: id })
            });

            const result = await response.json();

            if (result.success) {
                this.tituloAtivo = id;
                document.querySelectorAll('.title-card-v8').forEach(c => {
                    const cardId = c.getAttribute('data-id');
                    if (cardId == id) {
                        c.classList.add('active-equipped');
                    } else {
                        c.classList.remove('active-equipped');
                    }
                });

                this.updateActiveDisplay();

                if (window.createParticles) {
                    createParticles(25, 'star', ['#ffd700', '#ff3366', '#ffffff']);
                }
            } else {
                alert(result.message || 'Erro ao equipar o título.');
            }
        } catch (e) {
            console.error('Erro ao definir título:', e);
        }
    },

    async removeTitulo() {
        try {
            const response = await fetch('api/users/set_titulo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo_id: 0 })
            });
            const result = await response.json();

            if (result.success) {
                this.tituloAtivo = null;
                document.querySelectorAll('.title-card-v8').forEach(c => c.classList.remove('active-equipped'));
                this.updateActiveDisplay();
            } else {
                alert(result.message || 'Erro ao desequipar o título.');
            }
        } catch (e) {
            console.error('Erro ao remover título:', e);
        }
    }
};

window.TitulosPage = TitulosPage;
document.addEventListener('DOMContentLoaded', () => {
    TitulosPage.init();
});
