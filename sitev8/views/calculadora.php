<?php
/**
 * AnimeEngine v8 - View: Calculadora
 * Calculadora de Maratona de Animes & Planejador de Missão
 */
?>

<div class="calculator-layout">
    <!-- LEFT: Stack & Import Actions -->
    <div class="calc-stack">
        <!-- Search to Stack -->
        <div class="calc-section">
            <h3 class="calc-section-title"><i class="fas fa-search"></i> BUSCAR ANIME</h3>
            <div class="calc-search">
                <input type="text" id="calc-search" class="calc-input" placeholder="DIGITE O NOME DO ANIME...">
                <div id="calc-results" class="calc-results"></div>
            </div>
        </div>

        <!-- Quick Import & Backlog Integration -->
        <div class="calc-section">
            <div class="calc-quick-actions-header">
                <h3 class="calc-section-title"><i class="fas fa-cloud-download-alt"></i> IMPORTAR LISTA</h3>
            </div>
            <div class="calc-quick-import-buttons">
                <button type="button" class="btn-calc-import" onclick="CalculadoraPage.importFromWatching()" title="Importar animes da lista Assistindo">
                    <i class="fas fa-play-circle"></i> Assistindo
                </button>
                <button type="button" class="btn-calc-import" onclick="CalculadoraPage.importFromPlanToWatch()" title="Importar animes da lista Planejo Assistir">
                    <i class="fas fa-bookmark"></i> Planejados
                </button>
                <button type="button" class="btn-calc-import btn-calc-clear" onclick="CalculadoraPage.clearStackPrompt()" title="Limpar toda a stack">
                    <i class="fas fa-trash-alt"></i> Limpar
                </button>
            </div>
            
            <!-- Snapshot / Project Presets -->
            <div class="calc-snapshot-tools">
                <button type="button" class="btn-calc-snapshot" onclick="CalculadoraPage.promptSaveSnapshot()" title="Salvar stack atual como Projeto de Maratona">
                    <i class="fas fa-save"></i> Salvar Projeto
                </button>
                <button type="button" class="btn-calc-snapshot" onclick="CalculadoraPage.showProjectsModal()" title="Gerenciar projetos salvos">
                    <i class="fas fa-folder-open"></i> Meus Projetos
                </button>
            </div>
        </div>

        <!-- Stack List -->
        <div class="calc-section">
            <div class="stack-header-row">
                <h3 class="calc-section-title">
                    <i class="fas fa-layer-group"></i> STACK ATIVA 
                    <span id="stack-count" class="stack-badge">0</span>
                </h3>
            </div>
            
            <div id="stack-list" class="stack-list">
                <p class="empty-message">Adicione animes para calcular a maratona</p>
            </div>

            <div class="stack-total">
                <span>Total de Episódios na Stack:</span>
                <span id="stack-total-eps" class="stack-total-number">0</span>
            </div>
        </div>
    </div>

    <!-- RIGHT: Calculator, Controls & Analytics -->
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
                <h2 class="calc-hero-title" id="calc-hero-title">Carregando...</h2>
                <div class="calc-hero-eps">
                    PROCESSO GLOBAL DA STACK: 
                    <span id="calc-hero-progress" class="calc-hero-progress-num">0 / 0</span>
                </div>
                
                <!-- PROGRESS CONTROLS -->
                <div class="v4-progress-box">
                    <label class="v4-progress-label">Episódio Atual Acumulado</label>
                    
                    <div class="v4-ep-controls">
                        <button class="v4-ep-btn v4-btn-minus" id="btn-minus" type="button">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" id="global-ep-input" class="v4-ep-input" value="0" min="0">
                        <button class="v4-ep-btn v4-btn-plus" id="btn-plus" type="button">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <!-- PROGRESS BAR -->
                    <div id="progress-container" class="v4-progress-container" title="Arraste para ajustar o progresso">
                        <div id="progress-bar" class="v4-progress-bar">
                            <div class="v4-progress-stripes"></div>
                        </div>
                    </div>
                    <div class="v4-progress-labels">
                        <span>INÍCIO</span>
                        <span id="progress-percent" class="v4-progress-percent">0%</span>
                    </div>
                </div>

                <!-- Calendar Card -->
                <div class="calc-calendar">
                    <div class="calc-calendar-ring left"></div>
                    <div class="calc-calendar-ring right"></div>
                    <p class="calc-calendar-label">Previsão de Término</p>
                    <h3 class="calc-calendar-date" id="calc-finish-date">...</h3>
                    <p class="calc-calendar-days" id="calc-days-left">Calculando...</p>
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
                    <h3 class="idle-title">CALCULADORA EM ESPERA</h3>
                    <p class="idle-desc">Adicione animes à stack ou importe da sua lista para iniciar a simulação</p>
                    <div class="idle-pulse"></div>
                </div>
            </div>

            <!-- FILLER RADAR WIDGET -->
            <div class="calc-filler-radar" id="filler-radar" title="Filler Scanner">
                <canvas id="radar-canvas"></canvas>
                <div class="radar-overlay">
                    <span class="radar-label">FILLER SCAN</span>
                    <span id="radar-percent" class="radar-value">0%</span>
                </div>
            </div>
        </div>

        <!-- Stats & Configuration Grid -->
        <div class="calc-bottom">
            <!-- Configuration Column -->
            <div class="calc-config">
                <div class="calc-config-header">
                    <h3 class="calc-config-title"><i class="fas fa-sliders-h"></i> CONFIGURAÇÃO DE RITMO</h3>
                </div>

                <!-- Mode Switch Tabs: Pace vs Deadline -->
                <div class="calc-mode-tabs">
                    <button type="button" class="calc-mode-btn active" id="tab-mode-pace" onclick="CalculadoraPage.setMode('pace')">
                        <i class="fas fa-tachometer-alt"></i> Ritmo Diário
                    </button>
                    <button type="button" class="calc-mode-btn" id="tab-mode-deadline" onclick="CalculadoraPage.setMode('deadline')">
                        <i class="fas fa-calendar-check"></i> Meta por Prazo
                    </button>
                </div>

                <!-- Sub-panel 1: Pace Controls -->
                <div id="panel-pace" class="calc-subpanel active">
                    <!-- Pace Slider -->
                    <div class="calc-pace">
                        <div class="calc-pace-header">
                            <span>Velocidade Diária:</span>
                            <span class="calc-pace-value-wrap">
                                <strong id="pace-display" class="calc-pace-value">3</strong>
                                <span class="calc-pace-unit">eps / dia</span>
                            </span>
                        </div>
                        <input type="range" id="pace-slider" min="1" max="24" value="3" class="calc-slider">
                    </div>

                    <!-- Pace Presets (Otaku lifestyles) -->
                    <div class="calc-pace-presets">
                        <button type="button" class="pace-preset-btn" onclick="CalculadoraPage.setPacePreset(1)" title="1 ep/dia (~20m)">
                            ☕ Casual (1)
                        </button>
                        <button type="button" class="pace-preset-btn" onclick="CalculadoraPage.setPacePreset(3)" title="3 eps/dia (~1h)">
                            📺 Padrão (3)
                        </button>
                        <button type="button" class="pace-preset-btn" onclick="CalculadoraPage.setPacePreset(6)" title="6 eps/dia (~2h)">
                            🔥 Otaku (6)
                        </button>
                        <button type="button" class="pace-preset-btn" onclick="CalculadoraPage.setPacePreset(12)" title="12 eps/dia (~4h)">
                            ⚡ Hardcore (12)
                        </button>
                    </div>
                </div>

                <!-- Sub-panel 2: Reverse Deadline Mode -->
                <div id="panel-deadline" class="calc-subpanel">
                    <div class="deadline-form">
                        <label for="calc-deadline-input" class="deadline-label">Quero concluir até:</label>
                        <div class="deadline-input-row">
                            <input type="date" id="calc-deadline-input" class="calc-date-input" onchange="CalculadoraPage.onDeadlineChange()">
                            <span id="deadline-required-pace" class="deadline-badge">Defina a data</span>
                        </div>
                        <div class="deadline-quick-dates">
                            <button type="button" class="btn-deadline-chip" onclick="CalculadoraPage.setDeadlineDays(7)">+7 Dias</button>
                            <button type="button" class="btn-deadline-chip" onclick="CalculadoraPage.setDeadlineDays(14)">+2 Semanas</button>
                            <button type="button" class="btn-deadline-chip" onclick="CalculadoraPage.setDeadlineDays(30)">+1 Mês</button>
                            <button type="button" class="btn-deadline-chip" onclick="CalculadoraPage.setDeadlineDays(60)">+2 Meses</button>
                        </div>
                    </div>
                </div>
                
                <!-- Toggle Options -->
                <div class="calc-toggles">
                    <!-- Skip Fillers w/ Modal Button -->
                    <div class="calc-toggle-group">
                        <div class="calc-toggle-item" onclick="CalculadoraPage.toggleOption('skipFillers')">
                            <div class="toggle-info">
                                <div class="toggle-label">
                                    <i class="fas fa-ban toggle-icon toggle-icon-red"></i>
                                    PULAR FILLERS
                                </div>
                                <div class="toggle-hint">Desconta episódios filler do anime</div>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" id="toggle-fillers" class="toggle-input">
                                <div class="toggle-track"></div>
                                <div class="toggle-thumb"></div>
                            </div>
                        </div>
                        <button type="button" class="btn-filler-scan" onclick="CalculadoraPage.showFillersModal()" title="Ver lista de fillers identificados">
                            <i class="fas fa-satellite-dish"></i> SCAN LOG
                        </button>
                    </div>
                    
                    <!-- Speedrun -->
                    <div class="calc-toggle-group">
                        <div class="calc-toggle-item" onclick="CalculadoraPage.toggleOption('speedrun')">
                            <div class="toggle-info">
                                <div class="toggle-label">
                                    <i class="fas fa-forward toggle-icon toggle-icon-blue"></i>
                                    SPEEDRUN (SKIP OP/ED)
                                </div>
                                <div class="toggle-hint">Economiza 4 minutos por episódio (20m ao invés de 24m)</div>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" id="toggle-speedrun" class="toggle-input">
                                <div class="toggle-track"></div>
                                <div class="toggle-thumb"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Weekend Only -->
                    <div class="calc-toggle-group">
                        <div class="calc-toggle-item" onclick="CalculadoraPage.toggleOption('weekendsOnly')">
                            <div class="toggle-info">
                                <div class="toggle-label">
                                    <i class="fas fa-couch toggle-icon toggle-icon-yellow"></i>
                                    MARATONA SÓ NO FIM DE SEMANA
                                </div>
                                <div class="toggle-hint">Calcula progresso ocorrendo apenas aos sábados e domingos</div>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" id="toggle-weekends" class="toggle-input">
                                <div class="toggle-track"></div>
                                <div class="toggle-thumb"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> <!-- End of .calc-config (CORRECTLY CLOSED) -->

            <!-- Results & Analytics Panel -->
            <div class="calc-results-panel">
                <div class="calc-results-header">
                    <h3 class="calc-results-title"><i class="fas fa-chart-pie"></i> DIAGNÓSTICO DA MARATONA</h3>
                </div>

                <div class="calc-results-grid">
                    <div class="calc-result-item">
                        <span class="result-label">FALTAM ASSISTIR</span>
                        <span class="result-value" id="result-remaining">0</span>
                        <span class="result-unit">EPISÓDIOS</span>
                    </div>

                    <div class="calc-result-item">
                        <span class="result-label">TEMPO ESTIMADO</span>
                        <span class="result-value" id="result-hours">0</span>
                        <span class="result-unit result-unit-blue">HORAS TOTAIS</span>
                    </div>

                    <div class="calc-result-item">
                        <span class="result-label">TEMPO DIÁRIO</span>
                        <span class="result-value" id="result-daily-time">~1h00</span>
                        <span class="result-unit">POR DIA</span>
                    </div>
                </div>

                <!-- Savings Breakdown Box -->
                <div class="calc-savings-box" id="calc-savings-box">
                    <div class="savings-title"><i class="fas fa-piggy-bank"></i> ECONOMIA DE TEMPO</div>
                    <div class="savings-details">
                        <div class="saving-item" id="saving-filler-row">
                            <span class="saving-name">Fillers Pulados:</span>
                            <span class="saving-value" id="saving-filler-val">0 eps (0h)</span>
                        </div>
                        <div class="saving-item" id="saving-speedrun-row">
                            <span class="saving-name">Pular Aberturas/Encerramentos:</span>
                            <span class="saving-value" id="saving-speedrun-val">0h</span>
                        </div>
                        <div class="saving-total-row">
                            <span>Total Poupado:</span>
                            <strong id="saving-total-val">0 horas economizadas!</strong>
                        </div>
                    </div>
                </div>

                <!-- Share & Actions -->
                <div class="calc-actions">
                    <button type="button" class="btn-calc-action share-whatsapp" onclick="CalculadoraPage.copyForWhatsApp()" title="Copiar resumo para compartilhar">
                        <i class="fab fa-whatsapp"></i> COMPARTILHAR
                    </button>
                    <button type="button" class="btn-calc-action share-card" onclick="CalculadoraPage.shareMarathonCard()" title="Gerar Cartão Visual de Maratona">
                        <i class="fas fa-id-card"></i> MARATHON CARD
                    </button>
                </div>
            </div>
        </div> <!-- End of .calc-bottom -->

        <!-- INTERACTIVE TIMELINE -->
        <div class="calc-timeline-section">
            <div class="section-header">
                <h3 class="section-title"><i class="fas fa-stream"></i> CRONOGRAMA DA MISSÃO</h3>
                <div class="section-line"></div>
            </div>
            <div id="interactive-timeline" class="interactive-timeline">
                <div class="timeline-empty">Adicione animes para ver o cronograma dia a dia</div>
            </div>
        </div>
    </div>
</div>
