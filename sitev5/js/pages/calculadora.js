/**
 * AnimeEngine v5 - Calculadora Page
 * Progress bar e lógica exatamente como no v4
 */

const CalculadoraPage = {
    stack: [],
    activeIndex: -1,
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

    setupEpisodeControls() {
        // Input de episódio
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
            const current = parseInt(this.elements.globalEpInput.value) || 0;
            this.setGlobalEpisode(Math.max(0, current - 1));
        });
        
        this.elements.btnPlus.addEventListener('click', () => {
            const current = parseInt(this.elements.globalEpInput.value) || 0;
            this.setGlobalEpisode(current + 1);
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
            this.activeIndex = 0;
            this.renderStack();
            this.updateIdleState();
        }
    },

    saveStack() {
        Storage.save('calcStack', this.stack);
    },

    // ========================================
    // IDLE STATE
    // ========================================
    updateIdleState() {
        const idle = document.getElementById('calc-idle');
        if (this.activeIndex === -1 || this.stack.length === 0) {
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
                ...anime,
                currentEp: 0
            });
            
            if (this.activeIndex === -1) {
                this.activeIndex = 0;
            }
            
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
        this.stack.splice(index, 1);
        
        if (this.activeIndex >= this.stack.length) {
            this.activeIndex = Math.max(0, this.stack.length - 1);
        }
        
        if (this.stack.length === 0) {
            this.activeIndex = -1;
        }
        
        this.renderStack();
        this.saveStack();
        this.updateIdleState();
        this.calculate();
    },

    setActive(index) {
        this.activeIndex = index;
        this.renderStack();
        this.renderHero();
        this.calculate();
    },

    renderStack() {
        const container = document.getElementById('stack-list');
        const countEl = document.getElementById('stack-count');
        const totalEl = document.getElementById('stack-total-eps');
        
        countEl.textContent = this.stack.length;
        
        let totalEps = 0;
        this.stack.forEach(a => totalEps += (a.episodes || 0));
        totalEl.textContent = totalEps;
        
        if (this.stack.length === 0) {
            container.innerHTML = '<p class="empty-message">Adicione animes para calcular</p>';
            return;
        }
        
        container.innerHTML = this.stack.map((anime, index) => `
            <div class="stack-item ${index === this.activeIndex ? 'active' : ''}" onclick="CalculadoraPage.setActive(${index})">
                <img src="${anime.image}" alt="${anime.title}">
                <div class="stack-item-info">
                    <p class="stack-item-title">${anime.title}</p>
                    <p class="stack-item-meta">${anime.currentEp}/${anime.episodes || '?'} eps</p>
                </div>
                <button class="btn-remove" onclick="event.stopPropagation(); CalculadoraPage.removeFromStack(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    // ========================================
    // HERO DISPLAY
    // ========================================
    renderHero() {
        if (this.activeIndex === -1 || !this.stack[this.activeIndex]) return;
        
        const anime = this.stack[this.activeIndex];
        const total = anime.episodes || 0;
        const current = anime.currentEp || 0;
        
        document.getElementById('calc-hero-img').src = anime.image;
        document.getElementById('calc-hero-title').textContent = anime.title;
        document.getElementById('calc-hero-progress').textContent = `${current} / ${total}`;
        this.elements.globalEpInput.value = current;
        this.elements.globalEpInput.max = total;
        
        this.updateProgressBar();
    },

    // ========================================
    // GLOBAL EPISODE - Estilo v4
    // ========================================
    setGlobalEpisode(value) {
        if (this.activeIndex === -1 || !this.stack[this.activeIndex]) return;
        
        const anime = this.stack[this.activeIndex];
        const max = anime.episodes || 9999;
        const newValue = Math.max(0, Math.min(max, value));
        
        anime.currentEp = newValue;
        this.elements.globalEpInput.value = newValue;
        
        // Atualizar display
        document.getElementById('calc-hero-progress').textContent = `${newValue} / ${max}`;
        
        this.updateProgressBar();
        this.renderStack();
        this.saveStack();
        this.calculate();
    },

    updateProgressBar() {
        if (this.activeIndex === -1 || !this.stack[this.activeIndex]) {
            if (this.elements.progressBar) this.elements.progressBar.style.width = '0%';
            if (this.elements.progressPercent) this.elements.progressPercent.textContent = '0%';
            return;
        }
        
        const anime = this.stack[this.activeIndex];
        const total = anime.episodes || 0;
        const current = anime.currentEp || 0;
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        
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
            if (this.activeIndex === -1 || !this.stack[this.activeIndex]) return;
            
            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
            
            const anime = this.stack[this.activeIndex];
            const totalEps = anime.episodes || 0;
            if (totalEps === 0) return;
            
            const newEp = Math.round((percent / 100) * totalEps);
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
        let totalEps = 0;
        let savedEps = 0;
        
        this.stack.forEach(anime => {
            let eps = (anime.episodes || 0) - (anime.currentEp || 0);
            
            // Subtrair fillers se configurado
            if (this.settings.skipFillers && this.fillerEpisodes[anime.title]) {
                const fillers = this.fillerEpisodes[anime.title];
                fillers.forEach(range => {
                    for (let i = range[0]; i <= range[1]; i++) {
                        if (i > (anime.currentEp || 0) && i <= (anime.episodes || 0)) {
                            eps--;
                            savedEps++;
                        }
                    }
                });
            }
            
            totalEps += Math.max(0, eps);
        });
        
        // Duração por episódio (20 min no speedrun, 24 normal)
        const epDuration = this.settings.speedrun ? 20 : 24;
        const totalMinutes = totalEps * epDuration;
        const totalHours = Math.round(totalMinutes / 60);
        
        const daysNeeded = Math.ceil(totalEps / this.settings.epsPerDay);
        const finishDate = new Date();
        finishDate.setDate(finishDate.getDate() + daysNeeded);
        
        // Update UI - Results
        document.getElementById('result-remaining').textContent = totalEps;
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
