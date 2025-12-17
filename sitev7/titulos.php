<?php
/**
 * AnimeEngine v7 - Página de Títulos
 * Ver e selecionar títulos
 */

require_once 'includes/auth.php';
require_once 'includes/titulos.php';

if (!estaLogado()) {
    header('Location: login.php?redirect=titulos.php');
    exit;
}

// Verificar novos títulos automaticamente
verificarTitulos(getUsuarioId());

$titulo_pagina = 'Títulos - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-crown"></i> Meus Títulos</h1>
        <p class="page-subtitle">Escolha um título para exibir no seu perfil</p>
    </div>

    <div class="titles-container">
        <!-- Título Ativo -->
        <div class="active-title-section">
            <h3>Título Ativo</h3>
            <div class="active-title-display" id="active-title">
                <span class="no-title">Nenhum título selecionado</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="removeTitulo()">
                <i class="fas fa-times"></i> Remover Título
            </button>
        </div>

        <!-- Categorias de Títulos -->
        <div class="title-categories">
            <div class="title-category">
                <h3>🎭 Títulos de Gênero</h3>
                <p class="category-desc">Desbloqueados completando animes de gêneros específicos</p>
                <div class="titles-grid" id="titulos-genero"></div>
            </div>

            <div class="title-category">
                <h3>📈 Títulos de Nível</h3>
                <p class="category-desc">Desbloqueados alcançando níveis de XP</p>
                <div class="titles-grid" id="titulos-nivel"></div>
            </div>

            <div class="title-category">
                <h3>🌸 Títulos Sazonais</h3>
                <p class="category-desc">Limitados por temporada</p>
                <div class="titles-grid" id="titulos-sazonal"></div>
            </div>

            <div class="title-category">
                <h3>🔮 Títulos Secretos</h3>
                <p class="category-desc">Descubra como desbloqueá-los!</p>
                <div class="titles-grid" id="titulos-secreto"></div>
            </div>
        </div>
    </div>
</main>

<style>
.titles-container {
    max-width: 900px;
    margin: 0 auto;
}

.active-title-section {
    background: var(--color-surface);
    border: 2px solid var(--border-color);
    padding: 25px;
    margin-bottom: 30px;
    text-align: center;
}

.active-title-display {
    font-size: 1.5rem;
    margin: 15px 0;
    padding: 15px;
    background: var(--color-bg);
    border: 2px dashed var(--border-color);
}

.active-title-display .title-badge {
    font-size: 1.8rem;
}

.no-title {
    color: var(--color-text-muted);
    font-style: italic;
}

.title-category {
    background: var(--color-surface);
    border: 2px solid var(--border-color);
    padding: 25px;
    margin-bottom: 20px;
}

.title-category h3 {
    margin-bottom: 5px;
}

.category-desc {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin-bottom: 20px;
}

.titles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
}

.title-card {
    padding: 15px;
    border: 2px solid var(--border-color);
    background: var(--color-bg);
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.title-card:hover:not(.locked) {
    border-color: var(--color-primary);
    transform: translateY(-2px);
}

.title-card.locked {
    opacity: 0.5;
    cursor: not-allowed;
}

.title-card.active {
    border-color: #ffd700;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.title-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

.title-name {
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 5px;
}

.title-desc {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.title-status {
    margin-top: 10px;
    font-size: 0.75rem;
}

.title-status.unlocked {
    color: #22c55e;
}

.title-status.locked {
    color: #ef4444;
}

@media (max-width: 768px) {
    .titles-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>

<script>
let tituloAtivo = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadTitulos();
});

async function loadTitulos() {
    try {
        const response = await fetch('api/users/titulos.php');
        const data = await response.json();
        
        tituloAtivo = data.titulo_ativo;
        
        // Renderizar cada categoria
        for (const [tipo, titulos] of Object.entries(data.titulos)) {
            const container = document.getElementById(`titulos-${tipo}`);
            if (!container) continue;
            
            if (titulos.length === 0) {
                container.innerHTML = '<p style="color: var(--color-text-muted)">Nenhum título disponível</p>';
                continue;
            }
            
            container.innerHTML = titulos.map(t => `
                <div class="title-card ${t.desbloqueado ? '' : 'locked'} ${t.id == tituloAtivo ? 'active' : ''}" 
                     data-id="${t.id}" ${t.desbloqueado ? `onclick="selectTitulo(${t.id})"` : ''}>
                    <div class="title-icon">${t.icone}</div>
                    <div class="title-name" style="color: ${t.cor}">${t.nome}</div>
                    <div class="title-desc">${t.desbloqueado ? t.descricao : '???'}</div>
                    <div class="title-status ${t.desbloqueado ? 'unlocked' : 'locked'}">
                        ${t.desbloqueado ? '✅ Desbloqueado' : '🔒 Bloqueado'}
                    </div>
                </div>
            `).join('');
        }
        
        // Atualizar título ativo
        updateActiveDisplay();
        
    } catch (e) {
        console.error('Erro:', e);
    }
}

function updateActiveDisplay() {
    const container = document.getElementById('active-title');
    const activeCard = document.querySelector(`.title-card[data-id="${tituloAtivo}"]`);
    
    if (activeCard) {
        const icon = activeCard.querySelector('.title-icon').textContent;
        const name = activeCard.querySelector('.title-name').textContent;
        const color = activeCard.querySelector('.title-name').style.color;
        container.innerHTML = `<span class="title-badge" style="color: ${color}">${icon} ${name}</span>`;
    } else {
        container.innerHTML = '<span class="no-title">Nenhum título selecionado</span>';
    }
}

async function selectTitulo(id) {
    try {
        const response = await fetch('api/users/set_titulo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo_id: id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Atualizar UI
            document.querySelectorAll('.title-card').forEach(c => c.classList.remove('active'));
            document.querySelector(`.title-card[data-id="${id}"]`)?.classList.add('active');
            tituloAtivo = id;
            updateActiveDisplay();
        }
    } catch (e) {
        console.error('Erro:', e);
    }
}

async function removeTitulo() {
    try {
        await fetch('api/users/set_titulo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo_id: 0 })
        });
        
        document.querySelectorAll('.title-card').forEach(c => c.classList.remove('active'));
        tituloAtivo = null;
        updateActiveDisplay();
    } catch (e) {
        console.error('Erro:', e);
    }
}
</script>

<?php
require_once 'includes/footer.php';
?>
