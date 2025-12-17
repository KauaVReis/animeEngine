<?php
/**
 * AnimeEngine v7 - Calendário Page
 * Pública - não requer login
 */

$titulo_pagina = 'Calendário - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="page-header">
        <h1 class="page-title"><i class="fas fa-calendar-alt"></i> Calendário de Lançamentos</h1>
    </div>

    <div class="calendar-tabs" id="calendar-tabs">
        <button class="calendar-tab" data-day="1">Segunda</button>
        <button class="calendar-tab" data-day="2">Terça</button>
        <button class="calendar-tab" data-day="3">Quarta</button>
        <button class="calendar-tab" data-day="4">Quinta</button>
        <button class="calendar-tab" data-day="5">Sexta</button>
        <button class="calendar-tab" data-day="6">Sábado</button>
        <button class="calendar-tab" data-day="0">Domingo</button>
    </div>

    <div class="anime-grid" id="calendar-grid">
        <div class="carousel-loading"><div class="loader"></div></div>
    </div>
</main>

<?php
$scripts_pagina = ['js/calendar.js'];
require_once 'includes/footer.php';
?>
