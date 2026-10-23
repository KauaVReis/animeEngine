/**
 * AnimeEngine v8 - Calculadora Page
 * Planejador de Maratona & Simulador de Progresso com AniList + AnimeData
 */

const CalculadoraPage = {
    stack: [],
    globalEp: 0,
    settings: {
        epsPerDay: 3,
        skipFillers: false,
        speedrun: false,
        weekendsOnly: false,
        calcMode: 'pace', // 'pace' ou 'deadline'
        targetDeadline: null
    },
    debounceTimer: null,
    isDragging: false,
    radarRaf: null,

    // Elementos DOM
    elements: {
        globalEpInput: null,
        progressBar: null,
        progressContainer: null,
        progressPercent: null,
        btnMinus: null,
        btnPlus: null,
        radarCanvas: null,
        radarCtx: null,
        timelineContainer: null
    },

    /**
     * Inicialização da página
     */
    init() {
        console.log('🧮 Loading Calculadora Page v8...');

        // Mapear elementos DOM
        this.elements.globalEpInput = document.getElementById('global-ep-input');
        this.elements.progressBar = document.getElementById('progress-bar');
        this.elements.progressContainer = document.getElementById('progress-container');
        this.elements.progressPercent = document.getElementById('progress-percent');
        this.elements.btnMinus = document.getElementById('btn-minus');
        this.elements.btnPlus = document.getElementById('btn-plus');
        this.elements.radarCanvas = document.getElementById('radar-canvas');
        this.elements.timelineContainer = document.getElementById('interactive-timeline');

        if (this.elements.radarCanvas) {
            this.elements.radarCtx = this.elements.radarCanvas.getContext('2d');
            this.elements.radarCanvas.width = 100;
            this.elements.radarCanvas.height = 100;
        }

        this.loadSettings();
        this.loadStack();
        this.setupSearch();
        this.setupSlider();
        this.setupProgressBarDrag();
        this.setupEpisodeControls();
        this.updateIdleState();
        this.calculate();
        this.initRadarAnimation();

        console.log('✅ Calculadora Page v8 pronta!');
    },

    /**
     * Limpeza ao desmontar
     */
    destroy() {
        if (this.radarRaf) {
            cancelAnimationFrame(this.radarRaf);
            this.radarRaf = null;
        }
    },

    // ========================================
    // IMPORTAÇÃO DE BACKLOG / LISTAS
    // ========================================

    /**
     * Normalizar objeto de anime para a stack
     */
    normalizeAnimeForStack(item) {
        if (!item) return null;
        
        let title = 'Anime';
        if (typeof item.title === 'object' && item.title !== null) {
            title = item.title.romaji || item.title.english || item.title.userPreferred || item.title.native || 'Anime';
        } else if (item.title || item.titulo) {
            title = item.title || item.titulo;
        }

        let image = 'img/placeholder.jpg';
        if (item.coverImage && typeof item.coverImage === 'object') {
            image = item.coverImage.large || item.coverImage.medium || image;
        } else if (item.image || item.imagem) {
            image = item.image || item.imagem;
        }

        const episodes = parseInt(item.episodes || item.episodios || 12) || 12;
        const progress = parseInt(item.progress || item.progresso || 0) || 0;
        const id = parseInt(item.id || item.anime_id || Date.now());

        return {
            id,
            title,
            image,
            episodes,
            currentEp: progress
        };
    },

    /**
     * Importar animes da lista "Assistindo" (Watching)
     */
    async importFromWatching() {
        let items = [];
        if (typeof Storage !== 'undefined' && Storage.getList) {
            items = Storage.getList('watching') || [];
        }

        // Tentar API do backend se a lista local estiver vazia
        if (items.length === 0) {
            try {
                const res = await fetch('api/lists/get.php');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.watching) items = data.watching;
                }
            } catch (e) {}
        }

        if (!items || items.length === 0) {
            Common.showNotification('Nenhum anime na lista "Assistindo". Adicione animes primeiro!', 'warning');
            return;
        }

        let addedCount = 0;
        items.forEach(rawItem => {
            const anime = this.normalizeAnimeForStack(rawItem);
            if (anime && !this.stack.some(s => s.id === anime.id)) {
                this.stack.push(anime);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.renderStack();
            this.saveStack();
            this.updateIdleState();
            this.calculate();
            Common.showNotification(`📥 ${addedCount} animes importados de "Assistindo"!`, 'success');
        } else {
            Common.showNotification('Todos os animes da lista "Assistindo" já estão na stack.', 'info');
        }
    },

    /**
     * Importar animes da lista "Planejados" (Plan to Watch)
     */
    async importFromPlanToWatch() {
        let items = [];
        if (typeof Storage !== 'undefined' && Storage.getList) {
            items = Storage.getList('planToWatch') || [];
        }

        if (items.length === 0) {
            try {
                const res = await fetch('api/lists/get.php');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.planToWatch) items = data.planToWatch;
                }
            } catch (e) {}
        }

        if (!items || items.length === 0) {
            Common.showNotification('Nenhum anime na lista "Planejados".', 'warning');
            return;
        }

        let addedCount = 0;
        items.forEach(rawItem => {
            const anime = this.normalizeAnimeForStack(rawItem);
            if (anime && !this.stack.some(s => s.id === anime.id)) {
                this.stack.push(anime);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.renderStack();
            this.saveStack();
            this.updateIdleState();
            this.calculate();
            Common.showNotification(`📋 ${addedCount} animes importados de "Planejados"!`, 'success');
        } else {
            Common.showNotification('Todos os animes planejados já estão na stack.', 'info');
        }
    },

    /**
     * Limpar stack com confirmação
     */
    clearStackPrompt() {
        if (this.stack.length === 0) {
            Common.showNotification('A stack já está vazia.', 'info');
            return;
        }

        if (confirm('Tem certeza de que deseja esvaziar a stack da calculadora?')) {
            this.stack = [];
            this.globalEp = 0;
            this.renderStack();
            this.saveStack();
            this.updateIdleState();
            this.calculate();
            Common.showNotification('🗑️ Stack esvaziada com sucesso.', 'info');
        }
    },

    // ========================================
    // PROJETOS / SNAPSHOTS SALVOS
    // ========================================

    promptSaveSnapshot() {
        if (this.stack.length === 0) {
            Common.showNotification('Adicione animes à stack antes de salvar um projeto!', 'warning');
            return;
        }

        const name = prompt('Nome do Projeto de Maratona (ex: Big Three, Temporada de Outono):');
        if (!name || !name.trim()) return;

        const projects = Storage.load('calcProjects', []);
        const newProject = {
            id: 'proj_' + Date.now(),
            name: name.trim(),
            date: new Date().toLocaleDateString('pt-BR'),
            stack: this.stack,
            globalEp: this.globalEp,
            settings: this.settings
        };

        projects.push(newProject);
        Storage.save('calcProjects', projects);
        Common.showNotification(`💾 Projeto "${newProject.name}" salvo com sucesso!`, 'success');
    },

    showProjectsModal() {
        const projects = Storage.load('calcProjects', []);
        if (projects.length === 0) {
            Common.showModal('MEUS PROJETOS DE MARATONA', `
                <div style="padding: 20px; text-align: center; color: var(--color-text-muted);">
                    <i class="fas fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                    <p>Nenhum projeto salvo ainda.</p>
                    <p style="font-size: 0.8rem;">Monte uma lista de animes e clique em "Salvar Projeto" para guardá-la.</p>
                </div>
            `);
            return;
        }

        let html = `<div class="calc-projects-modal" style="max-height: 400px; overflow-y: auto;">`;
        projects.forEach((proj, idx) => {
            const totalEps = proj.stack.reduce((acc, a) => acc + (a.episodes || 0), 0);
            html += `
                <div style="background: var(--color-surface); border: 2px solid var(--border-color); padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: var(--color-primary); font-size: 1rem; display: block;">${proj.name}</strong>
                        <span style="font-size: 0.75rem; color: var(--color-text-muted);">${proj.stack.length} animes • ${totalEps} eps • Salvo em ${proj.date}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="CalculadoraPage.loadProjectSnapshot(${idx})">
                            Carregar
                        </button>
                        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.75rem; border-color: #ef4444; color: #ef4444;" onclick="CalculadoraPage.deleteProjectSnapshot(${idx})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        Common.showModal('PROJETOS DE MARATONA SALVOS', html);
    },

    loadProjectSnapshot(index) {
        const projects = Storage.load('calcProjects', []);
        const proj = projects[index];
        if (!proj) return;

        this.stack = proj.stack || [];
        this.globalEp = proj.globalEp || 0;
        if (proj.settings) this.settings = { ...this.settings, ...proj.settings };

        this.renderStack();
        this.saveStack();
        this.saveSettings();
        this.updateIdleState();
        this.calculate();

        if (Common.closeModal) Common.closeModal();
        Common.showNotification(`📂 Projeto "${proj.name}" carregado!`, 'success');
    },

    deleteProjectSnapshot(index) {
        const projects = Storage.load('calcProjects', []);
        if (confirm(`Excluir o projeto "${projects[index].name}"?`)) {
            projects.splice(index, 1);
            Storage.save('calcProjects', projects);
            this.showProjectsModal();
            Common.showNotification('Projeto excluído.', 'info');
        }
    },

    // ========================================
    // MODOS: PACE VS REVERSE DEADLINE
    // ========================================

    setMode(mode) {
        this.settings.calcMode = mode;
        const btnPace = document.getElementById('tab-mode-pace');
        const btnDeadline = document.getElementById('tab-mode-deadline');
        const panelPace = document.getElementById('panel-pace');
        const panelDeadline = document.getElementById('panel-deadline');

        if (mode === 'pace') {
            btnPace.classList.add('active');
            btnDeadline.classList.remove('active');
            panelPace.classList.add('active');
            panelDeadline.classList.remove('active');
        } else {
            btnPace.classList.remove('active');
            btnDeadline.classList.add('active');
            panelPace.classList.remove('active');
            panelDeadline.classList.add('active');

            // Inicializar data default (ex: 30 dias a frente) se ainda não setada
            if (!this.settings.targetDeadline) {
                this.setDeadlineDays(30);
            }
        }

        this.saveSettings();
        this.calculate();
    },

    setPacePreset(eps) {
        this.settings.epsPerDay = eps;
        document.getElementById('pace-slider').value = eps;
        document.getElementById('pace-display').textContent = eps;

        // Atualizar classes ativas dos presets
        document.querySelectorAll('.pace-preset-btn').forEach(btn => {
            const match = btn.textContent.includes(`(${eps})`);
            btn.classList.toggle('active', match);
        });

        this.saveSettings();
        this.calculate();
        Common.showNotification(`Velocidade ajustada para ${eps} eps/dia!`, 'info');
    },

    setDeadlineDays(days) {
        const target = new Date();
        target.setDate(target.getDate() + days);
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const input = document.getElementById('calc-deadline-input');
        if (input) input.value = dateStr;

        this.settings.targetDeadline = dateStr;
        this.onDeadlineChange();
    },

    onDeadlineChange() {
        const input = document.getElementById('calc-deadline-input');
        if (!input || !input.value) return;

        this.settings.targetDeadline = input.value;
        const targetDate = new Date(input.value + 'T23:59:59');
        const today = new Date();
        const diffMs = targetDate - today;
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        const totalStackEps = this.getTotalStackEps();
        const remainingEps = Math.max(0, totalStackEps - this.globalEp);

        // Calcular ritmo necessário
        const requiredPace = Math.ceil(remainingEps / diffDays);
        const badge = document.getElementById('deadline-required-pace');
        if (badge) {
            badge.textContent = `${requiredPace} eps/dia (${diffDays} dias)`;
        }

        // Aplicar o ritmo calculado
        this.settings.epsPerDay = Math.max(1, Math.min(48, requiredPace));
        const slider = document.getElementById('pace-slider');
        if (slider) slider.value = Math.min(24, this.settings.epsPerDay);
        const display = document.getElementById('pace-display');
        if (display) display.textContent = this.settings.epsPerDay;

        this.saveSettings();
        this.calculate();
    },

    // ========================================
    // RADAR WIDGET ANIMATION
    // ========================================

    initRadarAnimation() {
        if (this.radarRaf) cancelAnimationFrame(this.radarRaf);
        const animate = () => {
            if (!document.getElementById('radar-canvas')) {
                this.radarRaf = null;
                return;
            }
            this.drawRadar();
            this.radarRaf = requestAnimationFrame(animate);
        };
        this.radarRaf = requestAnimationFrame(animate);
    },

    drawRadar() {
        const ctx = this.elements.radarCtx;
        if (!ctx) return;

        const w = 100;
        const h = 100;
        const time = Date.now() / 1000;

        ctx.clearRect(0, 0, w, h);

        // Background grid
        ctx.strokeStyle = 'rgba(255, 102, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair
        ctx.beginPath();
        ctx.moveTo(w / 2, 10); ctx.lineTo(w / 2, 90);
        ctx.moveTo(10, h / 2); ctx.lineTo(90, h / 2);
        ctx.stroke();

        // Scanning Line
        const angle = time * 2;
        ctx.strokeStyle = 'rgba(255, 102, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(w / 2 + Math.cos(angle) * 45, h / 2 + Math.sin(angle) * 45);
        ctx.stroke();

        // Glow
        ctx.fillStyle = 'rgba(255, 102, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.arc(w / 2, h / 2, 45, angle - 0.5, angle);
        ctx.fill();
    },

    updateRadar(percent) {
        const percentEl = document.getElementById('radar-percent');
        if (percentEl) {
            percentEl.textContent = `${Math.round(percent)}%`;
        }
    },

    // ========================================
    // CONFIG & SETTINGS STORAGE
    // ========================================

    loadSettings() {
        const saved = Storage.load('calcSettings');
        if (saved) {
            this.settings = { ...this.settings, ...saved };
            const slider = document.getElementById('pace-slider');
            if (slider) slider.value = this.settings.epsPerDay;
            const display = document.getElementById('pace-display');
            if (display) display.textContent = this.settings.epsPerDay;

            const tFillers = document.getElementById('toggle-fillers');
            if (tFillers) tFillers.checked = this.settings.skipFillers;

            const tSpeedrun = document.getElementById('toggle-speedrun');
            if (tSpeedrun) tSpeedrun.checked = this.settings.speedrun;

            const tWeekends = document.getElementById('toggle-weekends');
            if (tWeekends) tWeekends.checked = this.settings.weekendsOnly || false;

            if (this.settings.calcMode === 'deadline') {
                this.setMode('deadline');
            }
        }
    },

    saveSettings() {
        Storage.save('calcSettings', this.settings);
    },

    setupSlider() {
        const slider = document.getElementById('pace-slider');
        const display = document.getElementById('pace-display');

        if (slider) {
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                display.textContent = value;
                this.settings.epsPerDay = value;
                this.saveSettings();
                this.calculate();
            });
        }
    },

    getTotalStackEps() {
        return this.stack.reduce((acc, a) => acc + (a.episodes || 0), 0);
    },

    setupEpisodeControls() {
        if (this.elements.globalEpInput) {
            this.elements.globalEpInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value) || 0;
                this.setGlobalEpisode(value);
            });

            this.elements.globalEpInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 0;
                this.setGlobalEpisode(value);
            });
        }

        if (this.elements.btnMinus) {
            this.elements.btnMinus.addEventListener('click', () => {
                this.setGlobalEpisode(Math.max(0, this.globalEp - 1));
            });
        }

        if (this.elements.btnPlus) {
            this.elements.btnPlus.addEventListener('click', () => {
                this.setGlobalEpisode(this.globalEp + 1);
            });
        }
    },

    toggleOption(option) {
        let inputId = 'toggle-fillers';
        if (option === 'speedrun') inputId = 'toggle-speedrun';
        if (option === 'weekendsOnly') inputId = 'toggle-weekends';

        const input = document.getElementById(inputId);
        if (input) {
            input.checked = !input.checked;
            this.settings[option] = input.checked;
            this.saveSettings();
            this.calculate();
        }
    },

    loadStack() {
        const saved = Storage.load('calcStack');
        if (saved && saved.length > 0) {
            this.stack = saved;
            this.renderStack();
            this.updateIdleState();
        }
        const savedEp = Storage.load('calcGlobalEp');
        if (savedEp !== null && savedEp !== undefined) {
            this.globalEp = savedEp;
        }
    },

    saveStack() {
        Storage.save('calcStack', this.stack);
        Storage.save('calcGlobalEp', this.globalEp);
    },

    // ========================================
    // IDLE STATE
    // ========================================

    updateIdleState() {
        const idle = document.getElementById('calc-idle');
        if (!idle) return;

        if (this.stack.length === 0) {
            idle.classList.remove('hidden');
            if (this.elements.globalEpInput) this.elements.globalEpInput.value = 0;
        } else {
            idle.classList.add('hidden');
            this.renderHero();
        }
    },

    // ========================================
    // SEARCH
    // ========================================

    setupSearch() {
        const input = document.getElementById('calc-search');
        if (!input) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Lógica de Temas Secretos
            const secretThemes = ['benevaMode', 'parafaMode', 'migueliMode', 'kauaMode', 'ruanMode', 'johnMode', 'bonfinMode', 'arcadeMode', 'zenMode', 'goldMode', 'xpMode', 'sakuraMode', 'cyberHacker', 'vaporwaveMode', 'vestaMode', 'hollowMode', 'blueprintMode', 'pirraMode', 'mobyMode'];
            const matchedTheme = secretThemes.find(t => t.toLowerCase() === query.toLowerCase());

            if (matchedTheme && typeof Themes !== 'undefined' && Themes.unlock) {
                if (Themes.unlock(matchedTheme)) {
                    Common.showNotification(`🔓 Tema secreto desbloqueado: ${Themes.themes[matchedTheme].name}!`, 'success');
                    input.value = '';
                    this.hideResults();
                    if (Storage.addXP) Storage.addXP(50);
                    if (Common.updateLevelBadge) Common.updateLevelBadge();
                    return;
                }
            }

            clearTimeout(this.debounceTimer);
            if (query.length < 2) {
                this.hideResults();
                return;
            }

            this.debounceTimer = setTimeout(() => this.search(query), 300);
        });
    },

    async search(query) {
        const container = document.getElementById('calc-results');
        if (!container) return;
        container.innerHTML = '<div class="loader"></div>';
        container.style.display = 'block';

        try {
            const results = await API.searchAnime(query, 1, 6);
            this.renderSearchResults(results);
        } catch (error) {
            container.innerHTML = '<p class="error-message">Erro na busca de animes</p>';
        }
    },

    renderSearchResults(animes) {
        const container = document.getElementById('calc-results');
        if (!container) return;

        if (!animes || animes.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum resultado encontrado</p>';
            return;
        }

        container.innerHTML = animes.map(anime => {
            const formatted = anime;
            const img = formatted.image || (formatted.coverImage && formatted.coverImage.large) || 'img/placeholder.jpg';
            const eps = formatted.episodes || '?';
            return `
                <div class="calc-result-item" onclick="CalculadoraPage.addToStack(${formatted.id})">
                    <img src="${img}" alt="${formatted.title}" onerror="this.src='img/placeholder.jpg'">
                    <div class="calc-result-info">
                        <p class="calc-result-title">${formatted.title}</p>
                        <p class="calc-result-meta">${eps} eps</p>
                    </div>
                    <button class="btn-add" type="button"><i class="fas fa-plus"></i></button>
                </div>
            `;
        }).join('');
    },

    hideResults() {
        const el = document.getElementById('calc-results');
        if (el) el.style.display = 'none';
    },

    // ========================================
    // STACK MANAGEMENT
    // ========================================

    async addToStack(animeId) {
        if (this.stack.find(a => a.id === animeId)) {
            Common.showNotification('Anime já está na stack!', 'warning');
            return;
        }

        try {
            const data = await API.getAnimeById(animeId);
            const anime = this.normalizeAnimeForStack(data);

            this.stack.push(anime);

            this.renderStack();
            this.saveStack();
            this.updateIdleState();
            this.calculate();
            this.hideResults();
            const searchInput = document.getElementById('calc-search');
            if (searchInput) searchInput.value = '';

            Common.showNotification(`"${anime.title}" adicionado!`, 'success');
        } catch (error) {
            Common.showNotification('Erro ao carregar detalhes do anime', 'error');
        }
    },

    removeFromStack(index) {
        let cumulative = 0;
        for (let i = 0; i < index; i++) {
            cumulative += this.stack[i].episodes || 0;
        }
        const removedAnimeEps = this.stack[index].episodes || 0;

        if (this.globalEp > cumulative + removedAnimeEps) {
            this.globalEp -= removedAnimeEps;
        } else if (this.globalEp > cumulative) {
            this.globalEp = cumulative;
        }

        this.stack.splice(index, 1);

        this.renderStack();
        this.saveStack();
        this.updateIdleState();
        this.calculate();
    },

    renderStack() {
        const container = document.getElementById('stack-list');
        const countEl = document.getElementById('stack-count');
        const totalEl = document.getElementById('stack-total-eps');

        if (countEl) countEl.textContent = this.stack.length;

        const totalEps = this.getTotalStackEps();
        if (totalEl) totalEl.textContent = totalEps;

        if (!container) return;

        if (this.stack.length === 0) {
            container.innerHTML = '<p class="empty-message">Adicione animes para calcular a maratona</p>';
            return;
        }

        let cumulative = 0;
        container.innerHTML = this.stack.map((anime, index) => {
            const animeEps = anime.episodes || 0;
            const startEp = cumulative;
            const endEp = cumulative + animeEps;

            let animeProgress = 0;
            let isActive = false;
            let isCompleted = false;

            if (this.globalEp >= endEp) {
                animeProgress = animeEps;
                isCompleted = true;
            } else if (this.globalEp > startEp) {
                animeProgress = this.globalEp - startEp;
                isActive = true;
            }

            cumulative = endEp;
            const statusClass = isCompleted ? 'completed' : (isActive ? 'active' : '');

            let fillerInfo = '';
            if (typeof AnimeData !== 'undefined') {
                const data = AnimeData.formatAnimeInfo(anime.title);
                if (data && data.found && data.fillerCount > 0) {
                    fillerInfo = `<span class="filler-badge" title="${data.fillerCount} fillers identificados">${data.fillerCount} fillers (${data.fillerPercent}%)</span>`;
                }
            }

            return `
                <div class="stack-item ${statusClass}">
                    <img src="${anime.image}" alt="${anime.title}" onerror="this.src='img/placeholder.jpg'">
                    <div class="stack-item-info">
                        <p class="stack-item-title">${anime.title}</p>
                        <p class="stack-item-meta">${animeProgress}/${animeEps} eps ${isCompleted ? '✅' : ''} ${fillerInfo}</p>
                    </div>
                    <button class="btn-remove" type="button" onclick="event.stopPropagation(); CalculadoraPage.removeFromStack(${index})" title="Remover da stack">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    },

    // ========================================
    // HERO DISPLAY
    // ========================================

    getCurrentAnime() {
        let cumulative = 0;
        for (let i = 0; i < this.stack.length; i++) {
            const anime = this.stack[i];
            const animeEps = anime.episodes || 0;
            if (this.globalEp < cumulative + animeEps) {
                return {
                    anime: anime,
                    index: i,
                    localEp: this.globalEp - cumulative,
                    totalEps: animeEps
                };
            }
            cumulative += animeEps;
        }
        if (this.stack.length > 0) {
            const lastAnime = this.stack[this.stack.length - 1];
            return {
                anime: lastAnime,
                index: this.stack.length - 1,
                localEp: lastAnime.episodes || 0,
                totalEps: lastAnime.episodes || 0
            };
        }
        return null;
    },

    renderHero() {
        if (this.stack.length === 0) return;

        const current = this.getCurrentAnime();
        if (!current) return;

        const totalStackEps = this.getTotalStackEps();

        const imgEl = document.getElementById('calc-hero-img');
        if (imgEl) imgEl.src = current.anime.image;

        const titleEl = document.getElementById('calc-hero-title');
        if (titleEl) titleEl.textContent = current.anime.title;

        const progEl = document.getElementById('calc-hero-progress');
        if (progEl) progEl.textContent = `${this.globalEp} / ${totalStackEps}`;

        if (this.elements.globalEpInput) {
            this.elements.globalEpInput.value = this.globalEp;
            this.elements.globalEpInput.max = totalStackEps;
        }

        this.updateProgressBar();
    },

    setGlobalEpisode(value) {
        if (this.stack.length === 0) return;

        const totalStackEps = this.getTotalStackEps();
        const newValue = Math.max(0, Math.min(totalStackEps, value));

        this.globalEp = newValue;

        this.renderHero();
        this.updateProgressBar();
        this.renderStack();
        this.saveStack();
        this.calculate();
    },

    updateProgressBar() {
        const totalStackEps = this.getTotalStackEps();

        if (totalStackEps === 0) {
            if (this.elements.progressBar) this.elements.progressBar.style.width = '0%';
            if (this.elements.progressPercent) this.elements.progressPercent.textContent = '0%';
            return;
        }

        const percent = Math.round((this.globalEp / totalStackEps) * 100);

        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percent}%`;
        }
        if (this.elements.progressPercent) {
            this.elements.progressPercent.textContent = `${percent}%`;
        }
    },

    setupProgressBarDrag() {
        const container = this.elements.progressContainer;
        if (!container) return;

        const updateProgressFromPosition = (clientX) => {
            if (this.stack.length === 0) return;

            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

            const totalStackEps = this.getTotalStackEps();
            if (totalStackEps === 0) return;

            const newEp = Math.round((percent / 100) * totalStackEps);
            this.setGlobalEpisode(newEp);
        };

        container.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            updateProgressFromPosition(e.clientX);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                updateProgressFromPosition(e.clientX);
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        container.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            if (e.touches.length > 0) {
                updateProgressFromPosition(e.touches[0].clientX);
            }
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (this.isDragging && e.touches.length > 0) {
                updateProgressFromPosition(e.touches[0].clientX);
            }
        });

        document.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        container.addEventListener('click', (e) => {
            updateProgressFromPosition(e.clientX);
        });
    },

    // ========================================
    // CÁLCULO PRINCIPAL
    // ========================================

    calculate() {
        const totalStackEps = this.getTotalStackEps();
        let remainingEps = totalStackEps - this.globalEp;
        let savedFillerEps = 0;

        // Desconto de Fillers
        if (this.settings.skipFillers) {
            let cumulative = 0;
            this.stack.forEach(anime => {
                const animeEps = anime.episodes || 0;
                const startEp = cumulative;

                if (typeof AnimeData !== 'undefined') {
                    const data = AnimeData.getAnimeData(anime.title);
                    if (data && data.fillerRanges) {
                        data.fillerRanges.forEach(range => {
                            for (let i = range[0]; i <= range[1]; i++) {
                                const globalFillerEp = startEp + i;
                                if (globalFillerEp > this.globalEp && i <= animeEps) {
                                    remainingEps--;
                                    savedFillerEps++;
                                }
                            }
                        });
                    }
                }
                cumulative += animeEps;
            });
        }

        remainingEps = Math.max(0, remainingEps);

        // Duração por episódio (20m speedrun, 24m normal)
        const epDuration = this.settings.speedrun ? 20 : 24;
        const totalMinutes = remainingEps * epDuration;
        const totalHours = Math.round(totalMinutes / 60);

        // Economia de tempo
        const fillerHoursSaved = Math.round((savedFillerEps * 24) / 60);
        const speedrunHoursSaved = this.settings.speedrun ? Math.round((remainingEps * 4) / 60) : 0;
        const totalHoursSaved = fillerHoursSaved + speedrunHoursSaved;

        // Ritmo diário e previsão
        const pace = Math.max(1, this.settings.epsPerDay || 3);
        let daysNeeded = Math.ceil(remainingEps / pace);

        // Se maratona é apenas nos finais de semana (2 dias por semana)
        if (this.settings.weekendsOnly) {
            const weeksNeeded = Math.ceil(remainingEps / (pace * 2));
            daysNeeded = weeksNeeded * 7;
        }

        const finishDate = new Date();
        finishDate.setDate(finishDate.getDate() + daysNeeded);

        // Tempo gasto por dia
        const dailyMinutes = pace * epDuration;
        const dailyHoursStr = `~${Math.floor(dailyMinutes / 60)}h${String(dailyMinutes % 60).padStart(2, '0')}`;

        // Atualizar UI - Resultados
        const remEl = document.getElementById('result-remaining');
        if (remEl) remEl.textContent = remainingEps;

        const hoursEl = document.getElementById('result-hours');
        if (hoursEl) hoursEl.textContent = totalHours;

        const dailyTimeEl = document.getElementById('result-daily-time');
        if (dailyTimeEl) dailyTimeEl.textContent = dailyHoursStr;

        // Atualizar Savings Breakdown Box
        const fillerSavingEl = document.getElementById('saving-filler-val');
        if (fillerSavingEl) fillerSavingEl.textContent = `${savedFillerEps} eps (~${fillerHoursSaved}h)`;

        const speedrunSavingEl = document.getElementById('saving-speedrun-val');
        if (speedrunSavingEl) speedrunSavingEl.textContent = this.settings.speedrun ? `4m/ep (~${speedrunHoursSaved}h economizadas)` : 'Desativado';

        const totalSavingEl = document.getElementById('saving-total-val');
        if (totalSavingEl) {
            totalSavingEl.textContent = totalHoursSaved > 0 
                ? `${totalHoursSaved} horas economizadas no total! 🎉` 
                : 'Ative "Pular Fillers" ou "Speedrun" para economizar horas';
        }

        // Atualizar Calendário Previsão
        const dateEl = document.getElementById('calc-finish-date');
        const daysLeftEl = document.getElementById('calc-days-left');

        if (daysNeeded > 0 && remainingEps > 0) {
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            if (dateEl) dateEl.textContent = finishDate.toLocaleDateString('pt-BR', options).toUpperCase();
            if (daysLeftEl) daysLeftEl.textContent = `${daysNeeded} dias de maratona`;
        } else {
            if (dateEl) dateEl.textContent = 'CONCLUÍDO! 🎉';
            if (daysLeftEl) daysLeftEl.textContent = 'Stack 100% assistida!';
        }

        // Radar Widget
        const fillerPercent = totalStackEps > 0 ? (savedFillerEps / totalStackEps) * 100 : 0;
        this.updateRadar(fillerPercent);

        // Timeline Interativa
        this.renderTimeline(remainingEps);
    },

    renderTimeline(remainingEps) {
        const container = this.elements.timelineContainer;
        if (!container) return;

        if (this.stack.length === 0 || remainingEps <= 0) {
            container.innerHTML = '<div class="timeline-empty">Adicione animes para ver o cronograma dia a dia</div>';
            return;
        }

        const pace = this.settings.epsPerDay;
        const totalDays = Math.ceil(remainingEps / pace);
        let html = '';

        let pendingEpsList = [];
        let cumulative = 0;
        this.stack.forEach(anime => {
            const animeEps = anime.episodes || 0;
            const startEp = cumulative;

            let fillerRanges = [];
            if (typeof AnimeData !== 'undefined') {
                const data = AnimeData.getAnimeData(anime.title);
                if (data) fillerRanges = data.fillerRanges || [];
            }

            for (let i = 1; i <= animeEps; i++) {
                const globalEpPos = startEp + i;
                if (globalEpPos > this.globalEp) {
                    const isFiller = fillerRanges.some(r => i >= r[0] && i <= r[1]);
                    if (this.settings.skipFillers && isFiller) continue;

                    pendingEpsList.push({
                        title: anime.title,
                        ep: i,
                        isFiller: isFiller
                    });
                }
            }
            cumulative += animeEps;
        });

        const today = new Date();
        let currentDayOffset = 0;

        for (let d = 0; d < Math.min(totalDays, 45); d++) {
            const currentDate = new Date(today);
            
            if (this.settings.weekendsOnly) {
                // Pular dias de semana se weekendsOnly estiver ativo
                while (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                    currentDayOffset++;
                    currentDate.setDate(today.getDate() + currentDayOffset);
                }
            } else {
                currentDate.setDate(today.getDate() + d);
            }

            const dateStr = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
            const dayEps = pendingEpsList.slice(d * pace, (d + 1) * pace);
            if (dayEps.length === 0) break;

            html += `
                <div class="timeline-day">
                    <div class="td-header">
                        <span class="td-date">${dateStr}</span>
                        <span class="td-index">DIA ${d + 1}</span>
                    </div>
                    <div class="td-eps-list">
                        ${dayEps.map(item => `
                            <div class="td-ep-item ${item.isFiller ? 'filler' : ''}" title="${item.title}">
                                <span class="td-ep-name">${item.title}</span>
                                <span class="td-ep-num">EP ${item.ep}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            if (this.settings.weekendsOnly) {
                currentDayOffset++;
            }
        }

        if (totalDays > 45) {
            html += `<div class="timeline-day" style="display:flex; align-items:center; justify-content:center; border:none; opacity:0.6; flex: 0 0 100px;">... +${totalDays - 45}d</div>`;
        }

        container.innerHTML = html;
    },

    showFillersModal() {
        if (this.stack.length === 0) {
            Common.showNotification('Stack vazia. Adicione animes para escanear!', 'warning');
            return;
        }

        let content = `<div class="filler-scan-log" style="color: var(--color-text);">
            <p style="margin:0 0 15px 0; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px; opacity: 0.8; font-family: monospace;">[SISTEMA] INICIANDO VARREDURA PROFUNDA DE FILLERS...</p>`;

        let totalFound = 0;
        let cumulative = 0;

        this.stack.forEach(anime => {
            content += `<div style="margin-bottom: 20px;">
                <h4 style="color: var(--color-primary); margin: 0 0 8px 0; text-transform: uppercase; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-crosshairs"></i> ALVO: ${anime.title}
                </h4>`;

            let hasFillers = false;
            if (typeof AnimeData !== 'undefined') {
                const data = AnimeData.getAnimeData(anime.title);
                if (data && data.fillerRanges && data.fillerRanges.length > 0) {
                    hasFillers = true;
                    content += `<div style="display: flex; flex-wrap: wrap; gap: 6px;">`;

                    data.fillerRanges.forEach(range => {
                        const start = range[0];
                        const end = range[1];
                        const count = (end - start) + 1;
                        totalFound += count;

                        const globalStart = cumulative + start;
                        const globalEnd = cumulative + end;
                        let statusClass = '';

                        if (this.globalEp >= globalEnd) {
                            statusClass = 'completed';
                        } else if (this.globalEp >= globalStart && this.globalEp < globalEnd) {
                            statusClass = 'active';
                        }

                        const label = start === end ? `EP ${start}` : `EP ${start}-${end}`;
                        content += `<span class="filler-badge-item ${statusClass}" title="${count} episódios" style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #ef4444; padding: 2px 8px; font-size: 0.75rem; font-weight: 700;">${label}</span>`;
                    });
                    content += `</div>`;
                }
            }

            if (!hasFillers) {
                content += `<p style="margin:0; opacity: 0.5; font-size: 0.75rem; font-style: italic;">Status: CANÔNICO (Nenhuma anomalia filler detectada)</p>`;
            }
            content += `</div>`;
            cumulative += (anime.episodes || 0);
        });

        content += `<p style="margin:20px 0 0 0; border-top: 1px dashed var(--border-color); padding-top: 12px; font-weight: 800; color: var(--color-primary);">
            [VARREDURA CONCLUÍDA] TOTAL DE FILLERS DETECTADOS: ${totalFound} EPISÓDIOS
        </p></div>`;

        Common.showModal('LOGS DO RADAR DE FILLERS', content);
    },

    copyForWhatsApp() {
        if (this.stack.length === 0) {
            Common.showNotification('Adicione animes antes de compartilhar!', 'warning');
            return;
        }

        const totalEps = this.getTotalStackEps();
        const remaining = document.getElementById('result-remaining') ? document.getElementById('result-remaining').textContent : '0';
        const hours = document.getElementById('result-hours') ? document.getElementById('result-hours').textContent : '0';
        const finishDate = document.getElementById('calc-finish-date') ? document.getElementById('calc-finish-date').textContent : '...';
        const activeAnime = this.getCurrentAnime();

        let text = `🚀 *MINHA MISSÃO DE ANIME NO ANIMEENGINE v8* 🚀\n\n`;
        text += `📺 *Anime Atual:* ${activeAnime ? activeAnime.anime.title : 'Em andamento'}\n`;
        text += `📊 *Progresso:* ${this.globalEp} / ${totalEps} episódios\n`;
        text += `⏳ *Faltam:* ${remaining} episódios\n`;
        text += `⏰ *Tempo Restante:* ~${hours} horas\n`;
        text += `🏁 *Previsão de Término:* ${finishDate}\n`;
        text += `⚡ *Ritmo:* ${this.settings.epsPerDay} eps/dia\n\n`;
        text += `Calculado via *AnimeEngine v8*`;

        navigator.clipboard.writeText(text).then(() => {
            Common.showNotification('📋 Resumo da missão copiado para o WhatsApp!', 'success');
        }).catch(() => {
            Common.showNotification('Erro ao copiar resumo', 'error');
        });
    },

    shareMarathonCard() {
        const activeAnime = this.getCurrentAnime();
        if (!activeAnime) {
            Common.showNotification('Adicione animes para gerar o cartão!', 'warning');
            return;
        }

        const totalEps = this.getTotalStackEps();
        const remaining = document.getElementById('result-remaining') ? document.getElementById('result-remaining').textContent : '0';
        const hours = document.getElementById('result-hours') ? document.getElementById('result-hours').textContent : '0';
        const finishDate = document.getElementById('calc-finish-date') ? document.getElementById('calc-finish-date').textContent : '...';
        const dailyTime = document.getElementById('result-daily-time') ? document.getElementById('result-daily-time').textContent : '~1h00';

        const content = `
            <div class="marathon-card-canvas-wrap">
                <div class="marathon-card-header">
                    <img src="${activeAnime.anime.image}" class="marathon-card-cover" onerror="this.src='img/placeholder.jpg'">
                    <div>
                        <div style="font-size: 0.7rem; font-weight: 800; color: var(--color-primary); letter-spacing: 1px;">ANIMEENGINE MARATHON PASS</div>
                        <h3 style="margin: 4px 0 6px 0; font-size: 1.15rem; color: #ffffff;">${activeAnime.anime.title}</h3>
                        <p style="margin:0; font-size: 0.75rem; color: #aaaaaa;">Stack com ${this.stack.length} título(s) • ${this.globalEp}/${totalEps} eps assistidos</p>
                    </div>
                </div>

                <div class="marathon-card-body">
                    <div class="marathon-card-stat">
                        <div class="marathon-card-stat-label">EPISÓDIOS RESTANTES</div>
                        <div class="marathon-card-stat-val">${remaining} <span style="font-size:0.7rem; color:#888;">EPS</span></div>
                    </div>
                    <div class="marathon-card-stat">
                        <div class="marathon-card-stat-label">TEMPO DE TELA</div>
                        <div class="marathon-card-stat-val" style="color: #00f2ff;">~${hours}h</div>
                    </div>
                    <div class="marathon-card-stat">
                        <div class="marathon-card-stat-label">DEDICAÇÃO DIÁRIA</div>
                        <div class="marathon-card-stat-val" style="color: #eab308;">${dailyTime}</div>
                    </div>
                    <div class="marathon-card-stat">
                        <div class="marathon-card-stat-label">DATA ESTIMADA</div>
                        <div class="marathon-card-stat-val" style="color: #10b981; font-size: 0.95rem;">${finishDate}</div>
                    </div>
                </div>

                <div style="margin-top: 16px; display: flex; gap: 10px;">
                    <button class="btn btn-primary" style="flex:1;" onclick="CalculadoraPage.copyForWhatsApp()">
                        <i class="fab fa-whatsapp"></i> Copiar Texto Formatado
                    </button>
                </div>
            </div>
        `;

        Common.showModal('CARTÃO DA MISSÃO DE MARATONA', content);
    }
};

window.CalculadoraPage = CalculadoraPage;
if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        CalculadoraPage.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => CalculadoraPage.init());
    }
}
