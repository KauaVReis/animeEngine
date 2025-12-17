<?php
/**
 * AnimeEngine v7 - Calculadora Page
 * Pública - não requer login
 */

$titulo_pagina = 'Calculadora - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-calculator"></i> Calculadora de Tempo</h1>
        <p class="page-subtitle">Calcule quanto tempo você precisa para terminar um anime</p>
    </div>

    <div class="calculator-container">
        <div class="calc-card">
            <h3>📺 Dados do Anime</h3>
            <div class="calc-field">
                <label>Total de Episódios</label>
                <input type="number" id="total-eps" value="12" min="1">
            </div>
            <div class="calc-field">
                <label>Episódios já Assistidos</label>
                <input type="number" id="watched-eps" value="0" min="0">
            </div>
            <div class="calc-field">
                <label>Duração por Episódio (min)</label>
                <input type="number" id="ep-duration" value="24" min="1">
            </div>
        </div>

        <div class="calc-card">
            <h3>⏰ Seu Tempo</h3>
            <div class="calc-field">
                <label>Episódios por Dia</label>
                <input type="number" id="eps-per-day" value="2" min="1">
            </div>
            <div class="calc-field">
                <label>Horas por Dia (alternativo)</label>
                <input type="number" id="hours-per-day" value="1" min="0.5" step="0.5">
            </div>
        </div>

        <button class="btn btn-primary btn-lg" onclick="calcular()">
            <i class="fas fa-calculator"></i> Calcular
        </button>

        <div class="calc-result" id="calc-result" style="display: none;">
            <h3>📊 Resultado</h3>
            <div class="result-grid">
                <div class="result-item">
                    <span class="result-value" id="result-remaining">-</span>
                    <span class="result-label">Episódios Restantes</span>
                </div>
                <div class="result-item">
                    <span class="result-value" id="result-time">-</span>
                    <span class="result-label">Tempo Total</span>
                </div>
                <div class="result-item">
                    <span class="result-value" id="result-days">-</span>
                    <span class="result-label">Dias para Terminar</span>
                </div>
                <div class="result-item">
                    <span class="result-value" id="result-date">-</span>
                    <span class="result-label">Data Prevista</span>
                </div>
            </div>
        </div>
    </div>
</main>

<script>
function calcular() {
    const totalEps = parseInt(document.getElementById('total-eps').value);
    const watchedEps = parseInt(document.getElementById('watched-eps').value);
    const epDuration = parseInt(document.getElementById('ep-duration').value);
    const epsPerDay = parseInt(document.getElementById('eps-per-day').value);
    
    const remaining = totalEps - watchedEps;
    const totalMinutes = remaining * epDuration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.ceil(remaining / epsPerDay);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    document.getElementById('result-remaining').textContent = remaining;
    document.getElementById('result-time').textContent = `${hours}h ${minutes}min`;
    document.getElementById('result-days').textContent = days;
    document.getElementById('result-date').textContent = endDate.toLocaleDateString('pt-BR');
    
    document.getElementById('calc-result').style.display = 'block';
}
</script>

<?php
require_once 'includes/footer.php';
?>
