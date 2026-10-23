<?php
/**
 * AnimeEngine v8 - View: Configurações
 * Central completa de preferências, personalização de temas,
 * áudio, interface, backup de dados e diagnóstico Tri-API
 */
?>

<div class="config-page-wrapper">
    <!-- CABEÇALHO DA PÁGINA -->
    <div class="config-header-card">
        <div class="config-header-main">
            <div class="config-badge-top"><i class="fas fa-sliders-h"></i> PREFERÊNCIAS DO SISTEMA</div>
            <h1 class="config-title">⚙️ Configurações &amp; Ajustes</h1>
            <p class="config-sub">
                Personalize temas visuais, comportamento de reprodução de áudio, densidade de interface e gerencie seus dados com autonomia.
            </p>
        </div>
        <div class="config-header-actions">
            <button type="button" class="btn btn-secondary" onclick="ConfiguracoesPage.resetToDefaults()">
                <i class="fas fa-undo"></i> Restaurar Padrões
            </button>
            <button type="button" class="btn btn-primary" onclick="ConfiguracoesPage.saveAll()">
                <i class="fas fa-save"></i> Salvar Alterações
            </button>
        </div>
    </div>

    <!-- NAVEGAÇÃO SEGMENTADA POR ABAS -->
    <nav class="config-tabs-bar" role="tablist">
        <button type="button" class="config-tab-btn active" data-tab="themes" onclick="ConfiguracoesPage.switchTab('themes')">
            <i class="fas fa-palette"></i> <span>Temas &amp; Visual</span>
        </button>
        <button type="button" class="config-tab-btn" data-tab="audio" onclick="ConfiguracoesPage.switchTab('audio')">
            <i class="fas fa-volume-up"></i> <span>Áudio &amp; Rádio</span>
        </button>
        <button type="button" class="config-tab-btn" data-tab="interface" onclick="ConfiguracoesPage.switchTab('interface')">
            <i class="fas fa-desktop"></i> <span>Interface &amp; UX</span>
        </button>
        <button type="button" class="config-tab-btn" data-tab="data" onclick="ConfiguracoesPage.switchTab('data')">
            <i class="fas fa-database"></i> <span>Dados &amp; Backup</span>
        </button>
        <button type="button" class="config-tab-btn" data-tab="telemetry" onclick="ConfiguracoesPage.switchTab('telemetry')">
            <i class="fas fa-satellite-dish"></i> <span>Diagnóstico Tri-API</span>
        </button>
    </nav>

    <!-- PAINEL 1: TEMAS & PERSONALIZAÇÃO VISUAL -->
    <div class="config-tab-panel active" id="config-panel-themes">
        <div class="config-section-card">
            <div class="section-card-header">
                <h2><i class="fas fa-palette"></i> Paletas Neo-Brutalistas (30 Temas)</h2>
                <span class="section-hint">Clique para aplicar instantaneamente em todo o site</span>
            </div>

            <div class="themes-swatch-grid" id="themes-swatch-grid">
                <!-- Injetado dinamicamente via ConfiguracoesPage.renderThemeSwatches() -->
                <div class="carousel-loading"><div class="loader"></div></div>
            </div>
        </div>

        <div class="config-section-card">
            <div class="section-card-header">
                <h2><i class="fas fa-magic"></i> Efeitos Visuais &amp; Acessibilidade</h2>
            </div>
            <div class="config-options-list">
                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Efeito Matrix (Chuva de Código Digital)</strong>
                        <span>Ativa partículas digitais animadas no fundo ao utilizar temas escuros ou Matrix.</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="cfg-matrix-effects" onchange="ConfiguracoesPage.updateVisualPreference('matrixEffects', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Redução de Movimento (Motion Safe)</strong>
                        <span>Desativa animações e transições complexas para maior conforto e acessibilidade.</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="cfg-reduce-motion" onchange="ConfiguracoesPage.updateVisualPreference('reduceMotion', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Profundidade de Sombra Neo-Brutalista</strong>
                        <span>Ajuste a intensidade das sombras duras da interface.</span>
                    </div>
                    <div class="option-control">
                        <select id="cfg-shadow-depth" class="config-select" onchange="ConfiguracoesPage.updateVisualPreference('shadowDepth', this.value)">
                            <option value="4px">Padrão (4px)</option>
                            <option value="6px">Profundo &amp; Marcado (6px)</option>
                            <option value="2px">Sutil (2px)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- PAINEL 2: ÁUDIO & RÁDIO -->
    <div class="config-tab-panel" id="config-panel-audio">
        <div class="config-section-card">
            <div class="section-card-header">
                <h2><i class="fas fa-headphones-alt"></i> Reprodução de Trilha Sonora &amp; Rádio FM</h2>
            </div>

            <div class="config-options-list">
                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Volume Padrão Inicial</strong>
                        <span>Nível sonoro definido ao iniciar uma música ou sintonizar a rádio.</span>
                    </div>
                    <div class="option-control" style="display: flex; align-items: center; gap: 12px; min-width: 220px;">
                        <input type="range" id="cfg-master-volume" min="0" max="100" value="70" class="config-range" oninput="ConfiguracoesPage.updateVolume(this.value)">
                        <span id="cfg-volume-display" style="font-family: var(--font-mono); font-weight: 800; min-width: 45px;">70%</span>
                    </div>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Mini-Player Flutuante Discreto (Micro-Dock)</strong>
                        <span>Controle compacto e não chamativo no canto da tela para play/pause, próxima faixa e título.</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="cfg-micro-dock" checked onchange="ConfiguracoesPage.updateAudioPreference('showMicroDock', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Auto-Play ao Sintonizar Estações</strong>
                        <span>Começar a tocar faixas imediatamente ao clicar em uma estação de rádio.</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="cfg-radio-autoplay" checked onchange="ConfiguracoesPage.updateAudioPreference('radioAutoplay', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Qualidade de Streaming Preferida</strong>
                        <span>Priorizar áudio de alta definição (AnimeThemes HD) ou modo otimizado de dados.</span>
                    </div>
                    <div class="option-control">
                        <select id="cfg-audio-quality" class="config-select" onchange="ConfiguracoesPage.updateAudioPreference('audioQuality', this.value)">
                            <option value="hd">Alta Fidelidade (AnimeThemes HD)</option>
                            <option value="economy">Econômico (Menor Consumo de Dados)</option>
                        </select>
                    </div>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Dual Skin Engine (Sincronizar Tema com a Rádio)</strong>
                        <span>Permite que a estação de rádio aplique sua paleta visual aos elementos musicais.</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="cfg-dual-skin" checked onchange="ConfiguracoesPage.updateAudioPreference('dualSkin', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    </div>

    <!-- PAINEL 3: INTERFACE & UX -->
    <div class="config-tab-panel" id="config-panel-interface">
        <div class="config-section-card">
            <div class="section-card-header">
                <h2><i class="fas fa-desktop"></i> Navegação e Disposição de Conteúdo</h2>
            </div>

            <div class="config-options-list">
                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Modo Padrão da Tela Explorar</strong>
                        <span>Defina a visualização inicial ao navegar para o catálogo de animes.</span>
                    </div>
                    <div class="option-control">
                        <select id="cfg-explore-view" class="config-select" onchange="ConfiguracoesPage.updateUIPreference('exploreView', this.value)">
                            <option value="grid">Modo Grade (Pôsteres e Cards Grandes)</option>
                            <option value="table">Modo Tabela (Lista Compacta com Dados Técnicos)</option>
                        </select>
                    </div>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Fita Ticker de Telemetria no Rodapé</strong>
                        <span>Exibe o status das APIs em tempo real e a faixa em reprodução no rodapé da página.</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="cfg-telemetry-footer" checked onchange="ConfiguracoesPage.updateUIPreference('telemetryFooter', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Notificações Toast na Tela</strong>
                        <span>Exibe avisos flutuantes ao favoritar, marcar episódios ou desbloquear conquistas.</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="cfg-toast-notifications" checked onchange="ConfiguracoesPage.updateUIPreference('toastNotifications', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    </div>

    <!-- PAINEL 4: DADOS & BACKUP -->
    <div class="config-tab-panel" id="config-panel-data">
        <div class="config-section-card">
            <div class="section-card-header">
                <h2><i class="fas fa-cloud-download-alt"></i> Backup &amp; Restauração da Minha Lista</h2>
                <span class="section-hint">Seus dados locais nunca se perdem — exporte e importe a qualquer momento</span>
            </div>

            <div class="data-actions-grid">
                <div class="data-action-box">
                    <div class="action-icon"><i class="fas fa-file-export"></i></div>
                    <h3>Exportar Dados (JSON)</h3>
                    <p>Faça download imediato de todos os animes salvos, histórico de episódios vistos e favoritos.</p>
                    <button type="button" class="btn btn-primary" onclick="ConfiguracoesPage.exportData()">
                        <i class="fas fa-download"></i> Baixar Arquivo de Backup
                    </button>
                </div>

                <div class="data-action-box">
                    <div class="action-icon"><i class="fas fa-file-import"></i></div>
                    <h3>Restaurar Backup</h3>
                    <p>Envie um arquivo JSON exportado anteriormente para recuperar seus animes salvos.</p>
                    <input type="file" id="cfg-import-file" accept=".json" style="display: none;" onchange="ConfiguracoesPage.importData(event)">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('cfg-import-file').click()">
                        <i class="fas fa-upload"></i> Selecionar Arquivo JSON
                    </button>
                </div>
            </div>
        </div>

        <div class="config-section-card danger-zone">
            <div class="section-card-header">
                <h2><i class="fas fa-exclamation-triangle"></i> Zona de Segurança &amp; Manutenção</h2>
            </div>

            <div class="config-options-list">
                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Limpar Cache Temporário de APIs</strong>
                        <span>Remove dados em cache do AniList, AnimeThemes e Jikan sem afetar sua lista de animes.</span>
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="ConfiguracoesPage.clearApiCache()">
                        <i class="fas fa-broom"></i> Limpar Cache
                    </button>
                </div>

                <div class="config-option-row">
                    <div class="option-info">
                        <strong>Resetar Histórico de Episódios Vistos</strong>
                        <span>Zera a contagem de episódios assistidos mantendo os animes na lista.</span>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" onclick="ConfiguracoesPage.confirmResetWatched()">
                        <i class="fas fa-trash-alt"></i> Resetar Histórico
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- PAINEL 5: DIAGNÓSTICO TRI-API -->
    <div class="config-tab-panel" id="config-panel-telemetry">
        <div class="config-section-card">
            <div class="section-card-header">
                <h2><i class="fas fa-satellite-dish"></i> Status em Tempo Real dos Provedores</h2>
                <button type="button" class="btn btn-secondary btn-sm" onclick="ConfiguracoesPage.pingAllApis()">
                    <i class="fas fa-sync"></i> Testar Conexão Agora
                </button>
            </div>

            <div class="tri-api-status-grid">
                <!-- ANILIST -->
                <div class="api-status-card" id="card-status-anilist">
                    <div class="api-card-top">
                        <span class="api-title">AniList GraphQL</span>
                        <span class="api-pill-status" id="diag-status-anilist">Verificando...</span>
                    </div>
                    <div class="api-latency" id="diag-lat-anilist">Latência: -- ms</div>
                    <p class="api-desc">Catálogo primário de animes, sinopses, personagens e estúdios.</p>
                </div>

                <!-- ANIMETHEMES -->
                <div class="api-status-card" id="card-status-animethemes">
                    <div class="api-card-top">
                        <span class="api-title">AnimeThemes REST (HD)</span>
                        <span class="api-pill-status pill-ok" id="diag-status-animethemes">OK (HD)</span>
                    </div>
                    <div class="api-latency" id="diag-lat-animethemes">Latência: -- ms</div>
                    <p class="api-desc">Streaming oficial de openings e encerramentos sem anúncios.</p>
                </div>

                <!-- JIKAN -->
                <div class="api-status-card" id="card-status-jikan">
                    <div class="api-card-top">
                        <span class="api-title">Jikan v4 (MyAnimeList)</span>
                        <span class="api-pill-status pill-standby" id="diag-status-jikan">STANDBY</span>
                    </div>
                    <div class="api-latency" id="diag-lat-jikan">Latência: -- ms</div>
                    <p class="api-desc">Provedor de contingência para dubladores (seiyuu), staff e notas.</p>
                </div>
            </div>
        </div>
    </div>
</div>
