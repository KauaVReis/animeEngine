/**
 * AnimeEngine v6 - Calculadora Page
 * Progress bar e lógica exatamente como no v4
 * Contador global contínuo: percorre todos animes sequencialmente
 */

const CalculadoraPage = {
    stack: [],
    globalEp: 0,  // Contador GLOBAL (soma de todos animes)
    settings: {
        epsPerDay: 3,
        skipFillers: false,
        speedrun: false
    },
    debounceTimer: null,
    isDragging: false,

    // Elementos DOM
    elements: {
        btnMinus: null,
        btnPlus: null,
        radarCanvas: null,
        radarCtx: null,
        timelineContainer: null
    },



    init() {
        console.log('🧮 Loading Calculadora Page...');

        // Carregar elementos DOM
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

        console.log('✅ Calculadora Page loaded!');
    },

    initRadarAnimation() {
        const animate = () => {
            this.drawRadar();
            requestAnimationFrame(animate);
        };
        animate();
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

    loadSettings() {
        const saved = Storage.load('calcSettings');
        if (saved) {
            this.settings = { ...this.settings, ...saved };
            document.getElementById('pace-slider').value = this.settings.epsPerDay;
            document.getElementById('pace-display').textContent = this.settings.epsPerDay;
            document.getElementById('toggle-fillers').checked = this.settings.skipFillers;
            document.getElementById('toggle-speedrun').checked = this.settings.speedrun;
        }
    },

    saveSettings() {
        Storage.save('calcSettings', this.settings);
    },

    setupSlider() {
        const slider = document.getElementById('pace-slider');
        const display = document.getElementById('pace-display');

        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            display.textContent = value;
            this.settings.epsPerDay = value;
            this.saveSettings();
            this.calculate();
        });
    },

    // Total de eps de toda a stack
    getTotalStackEps() {
        return this.stack.reduce((acc, a) => acc + (a.episodes || 0), 0);
    },

    setupEpisodeControls() {
        // Input de episódio global
        this.elements.globalEpInput.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 0;
            this.setGlobalEpisode(value);
        });

        this.elements.globalEpInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 0;
            this.setGlobalEpisode(value);
        });

        // Botões +/-
        this.elements.btnMinus.addEventListener('click', () => {
            this.setGlobalEpisode(Math.max(0, this.globalEp - 1));
        });

        this.elements.btnPlus.addEventListener('click', () => {
            this.setGlobalEpisode(this.globalEp + 1);
        });
    },

    toggleOption(option) {
        const input = document.getElementById(`toggle-${option === 'skipFillers' ? 'fillers' : 'speedrun'}`);
        input.checked = !input.checked;
        this.settings[option] = input.checked;
        this.saveSettings();
        this.calculate();
    },

    loadStack() {
        const saved = Storage.load('calcStack');
        if (saved && saved.length > 0) {
            this.stack = saved;
            this.renderStack();
            this.updateIdleState();
        }
        // Carregar posição global salva
        const savedEp = Storage.load('calcGlobalEp');
        if (savedEp) {
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
        if (this.stack.length === 0) {
            idle.classList.remove('hidden');
            this.elements.globalEpInput.value = 0;
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
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Lógica de Temas Secretos
            const secretThemes = ['benevaMode', 'parafaMode', 'migueliMode', 'kauaMode', 'ruanMode', 'johnMode', 'bonfinMode', 'arcadeMode', 'zenMode', 'goldMode', 'xpMode', 'sakuraMode', 'cyberHacker', 'vaporwaveMode', 'vestaMode', 'hollowMode', 'blueprintMode'];
            const matchedTheme = secretThemes.find(t => t.toLowerCase() === query.toLowerCase());

            if (matchedTheme) {
                if (Themes.unlock(matchedTheme)) {
                    Common.showNotification(`🔓 Tema secreto desbloqueado: ${Themes.themes[matchedTheme].name}!`, 'success');
                    input.value = '';
                    this.hideResults();
                    // Adicionar XP por descobrir segredo
                    Storage.addXP(50);
                    Common.updateLevelBadge();
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
        container.innerHTML = '<div class="loader"></div>';
        container.style.display = 'block';

        try {
            const results = await API.searchAnime(query, 1, 5);
            this.renderSearchResults(results);
        } catch (error) {
            container.innerHTML = '<p class="error-message">Erro na busca</p>';
        }
    },

    renderSearchResults(animes) {
        const container = document.getElementById('calc-results');

        if (!animes || animes.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum resultado</p>';
            return;
        }

        container.innerHTML = animes.map(anime => {
            // const formatted = API.formatAnime(anime);
            const formatted = anime;
            return `
                <div class="calc-result-item" onclick="CalculadoraPage.addToStack(${formatted.id})">
                    <img src="${formatted.image}" alt="${formatted.title}">
                    <div class="calc-result-info">
                        <p class="calc-result-title">${formatted.title}</p>
                        <p class="calc-result-meta">${formatted.episodes || '?'} eps</p>
                    </div>
                    <button class="btn-add"><i class="fas fa-plus"></i></button>
                </div>
            `;
        }).join('');
    },

    hideResults() {
        document.getElementById('calc-results').style.display = 'none';
    },

    // ========================================
    // STACK
    // ========================================
    async addToStack(animeId) {
        if (this.stack.find(a => a.id === animeId)) {
            Common.showNotification('Anime já está na stack', 'error');
            return;
        }

        try {
            const data = await API.getAnimeById(animeId);
            // const anime = API.formatAnime(data);
            const anime = data;

            this.stack.push({
                ...anime
            });

            this.renderStack();
            this.saveStack();
            this.updateIdleState();
            this.calculate();
            this.hideResults();
            document.getElementById('calc-search').value = '';

            Common.showNotification(`"${anime.title}" adicionado!`);
        } catch (error) {
            Common.showNotification('Erro ao adicionar anime', 'error');
        }
    },

    removeFromStack(index) {
        // Recalcular globalEp se necessário (descontar eps do anime removido)
        let cumulative = 0;
        for (let i = 0; i < index; i++) {
            cumulative += this.stack[i].episodes || 0;
        }
        const removedAnimeEps = this.stack[index].episodes || 0;

        // Se globalEp estava além deste anime, descontar os eps dele
        if (this.globalEp > cumulative + removedAnimeEps) {
            this.globalEp -= removedAnimeEps;
        } else if (this.globalEp > cumulative) {
            // Se estava no meio do anime removido, voltar pro início dele
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

        countEl.textContent = this.stack.length;

        const totalEps = this.getTotalStackEps();
        totalEl.textContent = totalEps;

        if (this.stack.length === 0) {
            container.innerHTML = '<p class="empty-message">Adicione animes para calcular</p>';
            return;
        }

        // Calcular qual anime está ativo e progresso de cada um
        let cumulative = 0;
        container.innerHTML = this.stack.map((anime, index) => {
            const animeEps = anime.episodes || 0;
            const startEp = cumulative;
            const endEp = cumulative + animeEps;

            // Calcular progresso deste anime baseado no globalEp
            let animeProgress = 0;
            let isActive = false;
            let isCompleted = false;

            if (this.globalEp >= endEp) {
                // Anime completo
                animeProgress = animeEps;
                isCompleted = true;
            } else if (this.globalEp > startEp) {
                // Anime em progresso (ativo)
                animeProgress = this.globalEp - startEp;
                isActive = true;
            }

            cumulative = endEp;

            const statusClass = isCompleted ? 'completed' : (isActive ? 'active' : '');

            // Buscar dados de filler usando AnimeData
            let fillerInfo = '';
            if (typeof AnimeData !== 'undefined') {
                const data = AnimeData.formatAnimeInfo(anime.title);
                if (data.found && data.fillerCount > 0) {
                    fillerInfo = `<span class="filler-badge">${data.fillerCount} fillers (${data.fillerPercent}%)</span>`;
                }
            }

            return `
                <div class="stack-item ${statusClass}">
                    <img src="${anime.image}" alt="${anime.title}">
                    <div class="stack-item-info">
                        <p class="stack-item-title">${anime.title}</p>
                        <p class="stack-item-meta">${animeProgress}/${animeEps} eps ${isCompleted ? '✅' : ''} ${fillerInfo}</p>
                    </div>
                    <button class="btn-remove" onclick="event.stopPropagation(); CalculadoraPage.removeFromStack(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    },

    // ========================================
    // HERO DISPLAY - Mostra anime ativo atual
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
        // Se passou de todos, retorna o último
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

        document.getElementById('calc-hero-img').src = current.anime.image;
        document.getElementById('calc-hero-title').textContent = current.anime.title;
        document.getElementById('calc-hero-progress').textContent = `${this.globalEp} / ${totalStackEps}`;
        this.elements.globalEpInput.value = this.globalEp;
        this.elements.globalEpInput.max = totalStackEps;

        this.updateProgressBar();
    },

    // ========================================
    // GLOBAL EPISODE - Contador contínuo v4
    // ========================================
    setGlobalEpisode(value) {
        if (this.stack.length === 0) return;

        const totalStackEps = this.getTotalStackEps();
        const newValue = Math.max(0, Math.min(totalStackEps, value));

        this.globalEp = newValue;

        // Atualizar Hero (imagem, título e progresso)
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

    // ========================================
    // DRAGGABLE PROGRESS BAR - Estilo v4
    // ========================================
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

        // Mouse events
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

        // Touch events para mobile
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

        // Click para pular para posição
        container.addEventListener('click', (e) => {
            updateProgressFromPosition(e.clientX);
        });
    },

    // ========================================
    // CALCULATE
    // ========================================
    calculate() {
        const totalStackEps = this.getTotalStackEps();
        let remainingEps = totalStackEps - this.globalEp;
        let savedEps = 0;

        // Calcular fillers restantes se configurado
        if (this.settings.skipFillers) {
            let cumulative = 0;
            this.stack.forEach(anime => {
                const animeEps = anime.episodes || 0;
                const startEp = cumulative;

                // Tentar encontrar dados de filler usando o módulo central AnimeData
                if (typeof AnimeData !== 'undefined') {
                    const data = AnimeData.getAnimeData(anime.title);

                    if (data && data.fillerRanges) {
                        data.fillerRanges.forEach(range => {
                            for (let i = range[0]; i <= range[1]; i++) {
                                // Só contar fillers que ainda não foram assistidos
                                const globalFillerEp = startEp + i;
                                if (globalFillerEp > this.globalEp && i <= animeEps) {
                                    remainingEps--;
                                    savedEps++;
                                }
                            }
                        });
                    }
                }
                cumulative += animeEps;
            });
        }

        remainingEps = Math.max(0, remainingEps);

        // Duração por episódio (20 min no speedrun, 24 normal)
        const epDuration = this.settings.speedrun ? 20 : 24;
        const totalMinutes = remainingEps * epDuration;
        const totalHours = Math.round(totalMinutes / 60);

        // SPEEDRUN LOGIC: No speedrun, você ganha 20% de tempo extra por dia (24/20 = 1.2x)
        const paceMultiplier = this.settings.speedrun ? 1.2 : 1;
        const effectiveEpsPerDay = this.settings.epsPerDay * paceMultiplier;

        const daysNeeded = Math.ceil(remainingEps / effectiveEpsPerDay);
        const finishDate = new Date();
        finishDate.setDate(finishDate.getDate() + daysNeeded);

        // Update UI - Results
        document.getElementById('result-remaining').textContent = remainingEps;
        document.getElementById('result-hours').textContent = totalHours;

        // Saved indicator
        const savedEl = document.getElementById('calc-saved');
        if (savedEps > 0 || this.settings.speedrun) {
            savedEl.classList.add('show');
            let savedText = '';
            if (savedEps > 0) savedText += `SAVED ${Math.round(savedEps * 24 / 60)}h (FILLER)`;
            if (this.settings.speedrun) savedText += (savedText ? ' + ' : '') + '4m/ep (SPEEDRUN)';
            savedEl.querySelector('.saved-badge').textContent = savedText;
        } else {
            savedEl.classList.remove('show');
        }

        // Calendar
        if (daysNeeded > 0) {
            const options = { day: 'numeric', month: 'short' };
            document.getElementById('calc-finish-date').textContent = finishDate.toLocaleDateString('pt-BR', options).toUpperCase();
            document.getElementById('calc-days-left').textContent = `${daysNeeded} dias restantes`;
        } else {
            document.getElementById('calc-finish-date').textContent = 'HOJE! 🎉';
            document.getElementById('calc-days-left').textContent = 'Concluído!';
        }

        // Radar Update - Based on total stack filler
        const totalFillers = savedEps;
        const fillerPercent = totalStackEps > 0 ? (totalFillers / totalStackEps) * 100 : 0;
        this.updateRadar(fillerPercent);

        // Timeline Update
        this.renderTimeline(remainingEps);
    },


    renderTimeline(remainingEps) {
        if (this.stack.length === 0 || remainingEps <= 0) {
            this.elements.timelineContainer.innerHTML = '<div class="timeline-empty">Adicione animes para ver o cronograma</div>';
            return;
        }

        const pace = this.settings.epsPerDay;
        const totalDays = Math.ceil(remainingEps / pace);
        let html = '';

        // Pegar todos os episódios que faltam em uma lista linear
        let pendingEpsList = [];
        let cumulative = 0;
        this.stack.forEach(anime => {
            const animeEps = anime.episodes || 0;
            const startEp = cumulative;

            // Dados de filler
            let fillerRanges = [];
            if (typeof AnimeData !== 'undefined') {
                const data = AnimeData.getAnimeData(anime.title);
                if (data) fillerRanges = data.fillerRanges || [];
            }

            for (let i = 1; i <= animeEps; i++) {
                const globalEpPos = startEp + i;
                if (globalEpPos > this.globalEp) {
                    // Verificar se é filler e se deve pular
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
        for (let d = 0; d < Math.min(totalDays, 45); d++) { // Aumentado limite para 45 dias
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + d);
            const dateStr = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();

            const dayEps = pendingEpsList.slice(d * pace, (d + 1) * pace);
            if (dayEps.length === 0) break;

            html += `
                <div class="timeline-day">
                    <div class="td-header">
                        <span class="td-date">${dateStr}</span>
                        <span class="td-index">DAY ${d + 1}</span>
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
        }

        if (totalDays > 45) {
            html += `<div class="timeline-day" style="display:flex; align-items:center; justify-content:center; border:none; opacity:0.5; flex: 0 0 100px;">... +${totalDays - 45}d</div>`;
        }

        this.elements.timelineContainer.innerHTML = html;
    },

    showFillersModal() {
        if (this.stack.length === 0) {
            if (typeof Common !== 'undefined') Common.showNotification('STACK VAZIA. Adicione animes para escanear!', 'error');
            return;
        }

        let content = `<div class="filler-scan-log">
            <p style="margin:0 0 15px 0; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px; opacity: 0.7;">[SYSTEM] INITIATING DEEP FILLER SCAN...</p>`;

        let totalFound = 0;
        let cumulative = 0;

        this.stack.forEach(anime => {
            content += `<div style="margin-bottom: 25px;">
                <h4 style="color: var(--color-primary); margin: 0 0 10px 0; text-transform: uppercase; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-crosshairs"></i> TARGET: ${anime.title}
                </h4>`;

            let hasFillers = false;
            if (typeof AnimeData !== 'undefined') {
                const data = AnimeData.getAnimeData(anime.title);
                if (data && data.fillerRanges && data.fillerRanges.length > 0) {
                    hasFillers = true;
                    content += `<div style="display: flex; flex-wrap: wrap; gap: 8px;">`;

                    data.fillerRanges.forEach(range => {
                        const start = range[0];
                        const end = range[1];
                        const count = (end - start) + 1;
                        totalFound += count;

                        // Determinar o status atual
                        const globalStart = cumulative + start;
                        const globalEnd = cumulative + end;
                        let statusClass = '';

                        if (this.globalEp >= globalEnd) {
                            statusClass = 'completed';
                        } else if (this.globalEp >= globalStart && this.globalEp < globalEnd) {
                            statusClass = 'active';
                        }

                        const label = start === end ? `EP ${start}` : `EP ${start}-${end}`;
                        content += `<span class="filler-badge-item ${statusClass}" title="Total: ${count} episódios">${label}</span>`;
                    });
                    content += `</div>`;
                }
            }

            if (!hasFillers) {
                content += `<p style="margin:0; opacity: 0.3; font-size: 0.75rem; font-style: italic;">Status: CLEAR (No filler anomalies detected)</p>`;
            }
            content += `</div>`;
            cumulative += (anime.episodes || 0);
        });

        content += `<p style="margin:20px 0 0 0; border-top: 1px dashed var(--border-color); padding-top: 15px; font-weight: 800; color: var(--color-primary);">
            [SYSTEM] SCAN COMPLETE. TOTAL ANOMALIES IDENTIFIED: ${totalFound} EPS
        </p></div>`;

        if (typeof Common !== 'undefined' && Common.showModal) {
            Common.showModal('DEEP FILLER SCAN LOGS', content);
        } else {
            alert("Scanner Logs: " + totalFound + " fillers found.");
        }
    },

    copyForWhatsApp() {
        if (this.stack.length === 0) return;

        const totalEps = this.getTotalStackEps();
        const remaining = document.getElementById('result-remaining').textContent;
        const hours = document.getElementById('result-hours').textContent;
        const finishDate = document.getElementById('calc-finish-date').textContent;
        const activeAnime = this.getCurrentAnime();

        let text = `🚀 *MINHA MISSÃO ANIMEENGINE* 🚀\n\n`;
        text += `📺 *Assistindo:* ${activeAnime ? activeAnime.anime.title : 'Nenhum'}\n`;
        text += `📊 *Progresso:* ${this.globalEp} / ${totalEps} eps\n`;
        text += `⏳ *Faltam:* ${remaining} episódios\n`;
        text += `⏰ *Tempo:* ~${hours} horas\n`;
        text += `🏁 *Previsão:* ${finishDate}\n\n`;
        text += `Calculado via *ANIME.ENGINE v7*`;

        navigator.clipboard.writeText(text).then(() => {
            Common.showNotification('📋 Resumo copiado para o WhatsApp!', 'success');
        }).catch(err => {
            Common.showNotification('Erro ao copiar', 'error');
        });
    },

    shareMarathonCard() {
        // Por enquanto, mostra um modal estilizado com o resumo "Premium"
        const activeAnime = this.getCurrentAnime();
        if (!activeAnime) return;

        const content = `
            <div class="marathon-card-preview" style="background: #0d0d0d; border: 2px solid #ff6600; padding: 20px; color: #fff;">
                <div style="display: flex; gap: 20px;">
                    <img src="${activeAnime.anime.image}" style="width: 100px; border: 1px solid #ff6600;">
                    <div>
                        <h2 style="color: #ff6600; margin: 0;">MARATHON DATA</h2>
                        <h3 style="margin: 5px 0;">${activeAnime.anime.title}</h3>
                        <p style="font-family: monospace; opacity: 0.8;">SCANNING PROGRESS: ${this.globalEp}/${this.getTotalStackEps()}</p>
                    </div>
                </div>
                <div style="margin-top: 20px; border-top: 1px dashed #333; padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <span style="font-size: 10px; display: block; opacity: 0.6;">REMAINING</span>
                        <span style="font-size: 20px; font-weight: bold;">${document.getElementById('result-remaining').textContent} EPS</span>
                    </div>
                    <div>
                        <span style="font-size: 10px; display: block; opacity: 0.6;">FINISH DATE</span>
                        <span style="font-size: 20px; font-weight: bold; color: #00f2ff;">${document.getElementById('calc-finish-date').textContent}</span>
                    </div>
                </div>
            </div>
            <button class="btn" style="width: 100%; margin-top: 15px;" onclick="CalculadoraPage.copyForWhatsApp()">COPIAR RESUMO TEXTUAL</button>
        `;

        // Assumindo que o sistema v7 tem uma função de modal global
        if (typeof Common !== 'undefined' && Common.showModal) {
            Common.showModal('MARATHON COMMAND CARD', content);
        } else {
            // Em caso de erro, apenas copia para o WhatsApp como fallback
            this.copyForWhatsApp();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => CalculadoraPage.init());
