/**
 * AnimeEngine v7 - Galeria de Títulos
 * JS para buscar, exibir e equipar títulos
 */

const TitulosPage = {
    tituloAtivo: null,

    async init() {
        console.log('👑 Inicializando Galeria de Títulos...');
        await this.loadTitulos();
        console.log('✅ Galeria carregada!');
    },

    async loadTitulos() {
        try {
            const response = await fetch('api/users/titulos.php');
            const data = await response.json();

            this.tituloAtivo = data.titulo_ativo;

            // Renderizar cada categoria
            for (const [tipo, titulos] of Object.entries(data.titulos)) {
                const container = document.getElementById(`titulos-${tipo}`);
                if (!container) continue;

                if (titulos.length === 0) {
                    container.innerHTML = '<p class="empty-column-message">Nenhum título disponível nesta categoria.</p>';
                    continue;
                }

                container.innerHTML = titulos.map(t => `
                    <div class="title-card ${t.desbloqueado ? '' : 'locked'} ${t.id == this.tituloAtivo ? 'active' : ''}" 
                         data-id="${t.id}" ${t.desbloqueado ? `onclick="TitulosPage.selectTitulo(${t.id})"` : ''}>
                        
                        <div class="title-status-indicator ${t.desbloqueado ? 'unlocked' : 'locked'}">
                            ${t.desbloqueado ? '🔓 Desbloqueado' : '🔒 Bloqueado'}
                        </div>
                        
                        <div class="title-icon" style="background: ${t.desbloqueado ? t.cor : 'var(--border-color)'}">
                            ${t.icone}
                        </div>
                        
                        <div class="title-name" style="color: ${t.desbloqueado ? t.cor : 'var(--text-muted)'}">${t.nome}</div>
                        
                        <p class="title-desc">${t.desbloqueado ? t.descricao : 'Requisito Secreto...'}</p>
                        
                    </div>
                `).join('');
            }

            // Atualizar título ativo na seção principal
            this.updateActiveDisplay();

        } catch (e) {
            console.error('Erro ao carregar títulos:', e);
            alert('Falha ao carregar a galeria de títulos.');
        }
    },

    updateActiveDisplay() {
        const container = document.getElementById('active-title');
        if (!container) return;

        const activeCard = document.querySelector(`.title-card[data-id="${this.tituloAtivo}"]`);

        if (activeCard && this.tituloAtivo) {
            const icon = activeCard.querySelector('.title-icon').textContent.trim();
            const name = activeCard.querySelector('.title-name').textContent.trim();
            const color = activeCard.querySelector('.title-name').style.color;

            container.innerHTML = `
                <div class="active-title-badge" style="border-color: ${color}">
                    <span class="active-title-icon" style="background: ${color}">${icon}</span>
                    <span class="active-title-name" style="color: ${color}">${name}</span>
                </div>
            `;
            // Show unequip button
            const btn = document.querySelector('[onclick="TitulosPage.removeTitulo()"]');
            if (btn) btn.style.display = 'inline-block';
        } else {
            container.innerHTML = '<span class="no-title">Nenhum título selecionado</span>';
            // Hide unequip button
            const btn = document.querySelector('[onclick="TitulosPage.removeTitulo()"]');
            if (btn) btn.style.display = 'none';
        }
    },

    async selectTitulo(id) {
        if (id == this.tituloAtivo) return; // Já está ativo

        try {
            const response = await fetch('api/users/set_titulo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo_id: id })
            });

            const result = await response.json();

            if (result.success) {
                // Atualizar UI Visualmente
                document.querySelectorAll('.title-card').forEach(c => c.classList.remove('active'));
                document.querySelector(`.title-card[data-id="${id}"]`)?.classList.add('active');

                this.tituloAtivo = id;
                this.updateActiveDisplay();

                // Animação de Sucesso (Confete)
                if (window.createParticles) {
                    createParticles(20, 'star', ['#ffd700', '#ffaa00', '#ffffff']);
                }
            } else {
                alert(result.error || 'Erro ao equipar o título.');
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
                document.querySelectorAll('.title-card').forEach(c => c.classList.remove('active'));
                this.tituloAtivo = null;
                this.updateActiveDisplay();
            } else {
                alert(result.error || 'Erro ao desequipar o título.');
            }
        } catch (e) {
            console.error('Erro ao remover título:', e);
            alert('Falha ao desequipar o título. Verifique sua conexão.');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => TitulosPage.init());
