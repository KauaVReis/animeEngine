/**
 * AnimeEngine v5 - Calculadora Page
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
        globalEpInput: null,
        progressBar: null,
        progressContainer: null,
        progressPercent: null,
        btnMinus: null,
        btnPlus: null
    },

    // Fillers conhecidos (do v4)
    fillerEpisodes: {
        'Naruto': [[26,26], [97,106], [136,220]],
        'Naruto Shippuden': [[57,71], [91,112], [144,151], [170,171], [176,196], [223,242], [257,260], [271,271], [279,281], [284,295], [303,320], [347,361], [376,377], [388,390], [394,413], [416,417], [422,423], [427,457], [460,462], [464,469], [480,483]],
        'One Piece': [[54,61], [98,99], [102,102], [131,143], [196,206], [213,216], [220,226], [279,283], [291,292], [303,303], [317,319], [326,336], [382,384], [406,407], [426,429], [457,458], [492,496], [506,506], [542,542], [575,578], [590,590], [626,628], [747,750], [775,778], [780,782], [807,807], [881,891], [895,896], [907,907]],
        'Bleach': [[33,33], [50,50], [64,109], [128,137], [168,189], [204,205], [213,214], [227,266], [287,287], [298,299], [303,305], [311,342], [355,355]]
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
        
        this.loadSettings();
        this.loadStack();
        this.setupSearch();
        this.setupSlider();
        this.setupProgressBarDrag();
        this.setupEpisodeControls();
        this.updateIdleState();
        this.calculate();
        
        console.log('✅ Calculadora Page loaded!');
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
            clearTimeout(this.debounceTimer);
            const query = e.target.value.trim();
            
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
            const results = await API.searchAnime(query, 5);
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
            const formatted = API.formatAnime(anime);
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
            const anime = API.formatAnime(data);
            
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
            
            return `
                <div class="stack-item ${statusClass}">
                    <img src="${anime.image}" alt="${anime.title}">
                    <div class="stack-item-info">
                        <p class="stack-item-title">${anime.title}</p>
                        <p class="stack-item-meta">${animeProgress}/${animeEps} eps ${isCompleted ? '✅' : ''}</p>
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
                
                if (this.fillerEpisodes[anime.title]) {
                    const fillers = this.fillerEpisodes[anime.title];
                    fillers.forEach(range => {
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
                cumulative += animeEps;
            });
        }
        
        remainingEps = Math.max(0, remainingEps);
        
        // Duração por episódio (20 min no speedrun, 24 normal)
        const epDuration = this.settings.speedrun ? 20 : 24;
        const totalMinutes = remainingEps * epDuration;
        const totalHours = Math.round(totalMinutes / 60);
        
        const daysNeeded = Math.ceil(remainingEps / this.settings.epsPerDay);
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
    }
};

document.addEventListener('DOMContentLoaded', () => CalculadoraPage.init());
