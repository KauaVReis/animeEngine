<?php
/**
 * AnimeEngine v8 - View: Tierlist
 */
?>

<div class="page-header">
        <h1 class="page-title"><i class="fas fa-trophy"></i> Anime Tier List</h1>
        <p class="text-muted">Rankeie seus animes favoritos. Arraste e solte para organizar.</p>
    </div>

    <div class="tier-container" id="tier-board">
        <!-- Tier S -->
        <div class="tier-row" data-tier="S">
            <div class="tier-label tier-s">S</div>
            <div class="tier-items sortable-list" id="tier-list-S"></div>
        </div>

        <!-- Tier A -->
        <div class="tier-row" data-tier="A">
            <div class="tier-label tier-a">A</div>
            <div class="tier-items sortable-list" id="tier-list-A"></div>
        </div>

        <!-- Tier B -->
        <div class="tier-row" data-tier="B">
            <div class="tier-label tier-b">B</div>
            <div class="tier-items sortable-list" id="tier-list-B"></div>
        </div>

        <!-- Tier C -->
        <div class="tier-row" data-tier="C">
            <div class="tier-label tier-c">C</div>
            <div class="tier-items sortable-list" id="tier-list-C"></div>
        </div>

        <!-- Tier D -->
        <div class="tier-row" data-tier="D">
            <div class="tier-label tier-d">D</div>
            <div class="tier-items sortable-list" id="tier-list-D"></div>
        </div>

        <!-- Tier F -->
        <div class="tier-row" data-tier="F">
            <div class="tier-label tier-f">F</div>
            <div class="tier-items sortable-list" id="tier-list-F"></div>
        </div>
    </div>

    <div class="pool-section">
        <div class="pool-header">
            <h2>📦 Meus Animes Completos</h2>
            <button class="quick-filter" onclick="TierListPage.resetConfirm()">
                <i class="fas fa-trash-alt"></i> Resetar Tier List
            </button>
        </div>
        <div class="pool-grid sortable-list" id="anime-pool">
            <div class="carousel-loading">
                <div class="loader"></div>
            </div>
        </div>
    </div>

<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
