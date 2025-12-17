<?php
/**
 * AnimeEngine v7 - Calculadora Page
 * Igual ao v6 - não requer login
 */

$titulo_pagina = 'Calculadora - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content">
    <div class="calculator-layout">
        <!-- LEFT: Stack -->
        <div class="calc-stack">
            <div class="calc-section">
                <h3 class="calc-section-title">🔍 ADD TO STACK</h3>
                <div class="calc-search">
                    <input type="text" id="calc-search" class="calc-input" placeholder="SEARCH ANIME...">
                    <div id="calc-results" class="calc-results"></div>
                </div>
            </div>

            <div class="calc-section">
                <h3 class="calc-section-title">📚 BUILD STACK <span id="stack-count" class="stack-badge">0</span></h3>
                <div id="stack-list" class="stack-list">
                    <p class="empty-message">Adicione animes para calcular</p>
                </div>
                <div class="stack-total">
                    <span>Total Stack Size</span>
                    <span id="stack-total-eps" class="stack-total-number">0</span>
                </div>
            </div>
        </div>

        <!-- RIGHT: Calculator -->
        <div class="calc-main">
            <!-- Active Anime Display - HERO AREA -->
            <div class="calc-hero" id="calc-hero">
                <!-- Cover -->
                <div class="calc-hero-cover" id="calc-hero-cover">
                    <img src="" alt="" id="calc-hero-img">
                </div>
                
                <!-- Info -->
                <div class="calc-hero-info">
                    <div class="calc-hero-badge">NOW WATCHING</div>
                    <h2 class="calc-hero-title" id="calc-hero-title">...</h2>
                    <div class="calc-hero-eps">
                        SEASON PROGRESS: 
                        <span id="calc-hero-progress" class="calc-hero-progress-num">0 / 0</span>
                    </div>
                    
                    <!-- PROGRESS CONTROLS - V4 STYLE -->
                    <div class="v4-progress-box">
                        <label class="v4-progress-label">Current Episode</label>
                        
                        <div class="v4-ep-controls">
                            <button class="v4-ep-btn v4-btn-minus" id="btn-minus">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" id="global-ep-input" class="v4-ep-input" value="0" min="0">
                            <button class="v4-ep-btn v4-btn-plus" id="btn-plus">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <!-- V4 PROGRESS BAR -->
                        <div id="progress-container" class="v4-progress-container">
                            <div id="progress-bar" class="v4-progress-bar">
                                <div class="v4-progress-stripes"></div>
                            </div>
                        </div>
                        <div class="v4-progress-labels">
                            <span>START</span>
                            <span id="progress-percent" class="v4-progress-percent">0%</span>
                        </div>
                    </div>

                    <!-- Calendar Card -->
                    <div class="calc-calendar">
                        <div class="calc-calendar-ring left"></div>
                        <div class="calc-calendar-ring right"></div>
                        <p class="calc-calendar-label">Estimated Completion</p>
                        <h3 class="calc-calendar-date" id="calc-finish-date">...</h3>
                        <p class="calc-calendar-days" id="calc-days-left">Calculating...</p>
                    </div>
                </div>
                
                <!-- IDLE OVERLAY -->
                <div class="calc-idle-overlay" id="calc-idle">
                    <div class="radar-container">
                        <div class="radar-ring"></div>
                        <div class="radar-ring-dashed"></div>
                        <div class="radar-scan"></div>
                        <i class="fas fa-satellite-dish radar-icon"></i>
                    </div>
                    <div class="idle-status">
                        <h3 class="idle-title">SYSTEM IDLE</h3>
                        <div class="idle-pulse"></div>
                    </div>
                </div>
            </div>

            <!-- Stats & Configuration -->
            <div class="calc-bottom">
                <!-- Configuration -->
                <div class="calc-config">
                    <h3 class="calc-config-title">CONFIGURATION</h3>
                    
                    <!-- Pace Slider -->
                    <div class="calc-pace">
                        <div class="calc-pace-header">
                            <span>Daily Pace (eps/day)</span>
                            <span id="pace-display" class="calc-pace-value">3</span>
                        </div>
                        <input type="range" id="pace-slider" min="1" max="24" value="3" class="calc-slider">
                    </div>
                    
                    <!-- Toggle Options -->
                    <div class="calc-toggles">
                        <!-- Skip Fillers -->
                        <div class="calc-toggle-item" onclick="CalculadoraPage.toggleOption('skipFillers')">
                            <div class="toggle-info">
                                <div class="toggle-label">
                                    <i class="fas fa-ban toggle-icon toggle-icon-red"></i>
                                    Skip Fillers
                                </div>
                                <div class="toggle-hint">DB Check Required</div>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" id="toggle-fillers" class="toggle-input">
                                <div class="toggle-track"></div>
                                <div class="toggle-thumb"></div>
                            </div>
                        </div>
                        
                        <!-- Speedrun -->
                        <div class="calc-toggle-item" onclick="CalculadoraPage.toggleOption('speedrun')">
                            <div class="toggle-info">
                                <div class="toggle-label">
                                    <i class="fas fa-forward toggle-icon toggle-icon-blue"></i>
                                    Speedrun
                                </div>
                                <div class="toggle-hint">Skip OP/ED (-4m)</div>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" id="toggle-speedrun" class="toggle-input">
                                <div class="toggle-track"></div>
                                <div class="toggle-thumb"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results -->
                <div class="calc-results-panel">
                    <div class="calc-result-item">
                        <span class="result-label">REMAINING</span>
                        <span class="result-value" id="result-remaining">0</span>
                        <span class="result-unit">EPS</span>
                    </div>
                    <div class="calc-result-divider"></div>
                    <div class="calc-result-item">
                        <span class="result-label">TIME COST</span>
                        <span class="result-value" id="result-hours">0</span>
                        <span class="result-unit result-unit-blue">HOURS</span>
                    </div>
                    
                    <div class="calc-saved" id="calc-saved">
                        <span class="saved-badge">SAVED 0h</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<?php
$scripts_pagina = ['js/animedata.js', 'js/pages/calculadora.js'];
require_once 'includes/footer.php';
?>
