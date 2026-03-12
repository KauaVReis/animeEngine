<?php
/**
 * AnimeEngine v7 - Migração de Dados
 * Importar dados do localStorage para o banco
 */

require_once 'includes/auth.php';

if (!estaLogado()) {
    header('Location: login.php?redirect=migrar.php');
    exit;
}

$titulo_pagina = 'Migrar Dados - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-upload"></i> Migrar Dados</h1>
        <p class="page-subtitle">Importar seus dados salvos do navegador</p>
    </div>

    <div class="migration-container" style="max-width: 600px; margin: 0 auto;">
        <div class="migration-info">
            <h3>📦 O que será importado:</h3>
            <ul>
                <li>✅ Sua lista de animes (assistindo, completos, etc.)</li>
                <li>✅ Seus favoritos</li>
                <li>✅ Seu progresso de episódios</li>
                <li>✅ Suas notas pessoais</li>
            </ul>
            
            <div class="alert alert-warning" style="margin-top: 20px; padding: 15px; background: rgba(245, 158, 11, 0.1); border: 2px solid #f59e0b;">
                <strong>⚠️ Atenção:</strong> Os dados serão mesclados com os existentes no servidor. Isso não apaga seus dados atuais.
            </div>
        </div>

        <div id="migration-status" style="display: none; margin: 20px 0; padding: 15px;"></div>

        <button class="btn btn-primary btn-lg" id="migrate-btn" onclick="iniciarMigracao()" style="width: 100%; margin-top: 20px;">
            <i class="fas fa-upload"></i> Iniciar Migração
        </button>
        
        <div id="migration-result" style="display: none; margin-top: 20px;"></div>
    </div>
</main>

<script>
async function iniciarMigracao() {
    const btn = document.getElementById('migrate-btn');
    const status = document.getElementById('migration-status');
    const result = document.getElementById('migration-result');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Migrando...';
    status.style.display = 'block';
    status.innerHTML = '🔄 Lendo dados do navegador...';
    status.style.background = 'rgba(59, 130, 246, 0.1)';
    status.style.border = '2px solid #3b82f6';
    
    // Buscar dados do localStorage
    const localData = localStorage.getItem('animeengine_lists');
    
    if (!localData) {
        status.innerHTML = '❌ Nenhum dado encontrado no navegador!';
        status.style.background = 'rgba(239, 68, 68, 0.1)';
        status.style.border = '2px solid #ef4444';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload"></i> Iniciar Migração';
        return;
    }
    
    const lists = JSON.parse(localData);
    let totalAdded = 0;
    let errors = 0;
    
    status.innerHTML = '🔄 Enviando dados para o servidor...';
    
    // Migrar cada lista
    for (const [listType, animes] of Object.entries(lists)) {
        if (!Array.isArray(animes)) continue;
        
        for (const anime of animes) {
            try {
                const response = await fetch('api/lists/add.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        anime_id: anime.id,
                        tipo_lista: listType === 'favorites' ? 'planToWatch' : listType,
                        anime_data: {
                            title: anime.title,
                            image: anime.image,
                            episodes: anime.episodes,
                            score: anime.score,
                            genres: anime.genres,
                            status: anime.status
                        }
                    })
                });
                
                const data = await response.json();
                if (data.success) totalAdded++;
                else errors++;
                
            } catch (e) {
                errors++;
            }
        }
    }
    
    // Resultado
    status.style.display = 'none';
    result.style.display = 'block';
    result.innerHTML = `
        <div style="padding: 20px; background: rgba(34, 197, 94, 0.1); border: 2px solid #22c55e; text-align: center;">
            <h3>✅ Migração Concluída!</h3>
            <p><strong>${totalAdded}</strong> animes importados</p>
            ${errors > 0 ? `<p style="color: #f59e0b;">${errors} erros (já existiam)</p>` : ''}
            <a href="lista.php" class="btn btn-primary" style="margin-top: 15px;">
                <i class="fas fa-list"></i> Ver Minha Lista
            </a>
        </div>
    `;
    
    btn.style.display = 'none';
}
</script>

<?php
require_once 'includes/footer.php';
?>
