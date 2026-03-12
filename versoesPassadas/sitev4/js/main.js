/**
 * AnimeEngine v4 - Main Application
 * Sistema principal com integração de Storage
 */

// --- CONFIG & STATE ---
const API_BASE = "https://api.jikan.moe/v4";

// Estado global da aplicação (será carregado do Storage)
let appState = {
    playlist: [],
    globalEp: 0,
    settings: {
        pace: 3,
        skipFillers: false,
        skipOP: false
    },
    history: [],
    favorites: [],
    achievements: {
        unlocked: [],
        xp: 0,
        totalEpisodes: 0,
        totalMinutes: 0
    },
    theme: 'default'
};

const FILLER_DB = {
    'One Piece': [[54,61], [98,99], [131,143], [196,206], [220,225], [279,283], [326,336], [382,384], [406,407], [426,429], [457,458], [575,578], [626,628], [747,750], [780,782], [895,896], [1029,1030]],
    'Naruto': [[26,26], [97,97], [101,106], [136,140], [143,219]],
    'Naruto: Shippuuden': [[28,28], [57,71], [90,112], [144,151], [170,171], [176,196], [223,242], [257,260], [271,271], [279,281], [284,289], [290,295], [303,320], [347,361], [376,377], [388,390], [394,413], [416,416], [422,423], [427,450], [464,469], [480,483]],
    'Bleach': [[33,33], [50,50], [64,109], [128,137], [168,189], [204,205], [213,214], [227,266], [287,287], [298,299], [303,305], [311,342], [355,355]]
};

// --- DOM ELEMENTS ---
const elements = {
    searchInput: null,
    searchResults: null,
    loader: null,
    playlistContainer: null,
    emptyState: null,
    stackCount: null,
    globalTotal: null,
    activeCover: null,
    activeTitle: null,
    activeStatus: null,
    activeEps: null,
    activeOverlay: null,
    globalEpInput: null,
    paceSlider: null,
    paceDisplay: null,
    fillerToggle: null,
    opToggle: null,
    statRemaining: null,
    statHours: null,
    statDate: null,
    statDaysLeft: null,
    statSaved: null,
    progressBar: null,
    progressContainer: null,
    progressPercent: null,
    // Bento Grid Elements
    bentoTotalHours: null,
    bentoTotalMinutes: null,
    bentoTotalEps: null,
    bentoStreak: null,
    bentoCompletedCount: null,
    bentoLastAnime: null,
    bentoLastDate: null,
    genreChart: null,
    pages: {} // Will hold page references
};

// --- INITIALIZATION ---
function initializeApp() {
    // Carregar elementos DOM
    elements.searchInput = document.getElementById('search-input');
    elements.searchResults = document.getElementById('search-results');
    elements.loader = document.getElementById('loader');
    elements.playlistContainer = document.getElementById('playlist-container');
    elements.emptyState = document.getElementById('empty-state');
    elements.stackCount = document.getElementById('stack-count');
    elements.globalTotal = document.getElementById('global-total-display');
    elements.activeCover = document.getElementById('active-cover');
    elements.activeTitle = document.getElementById('active-title');
    elements.activeStatus = document.getElementById('active-status');
    elements.activeEps = document.getElementById('active-eps');
    elements.activeOverlay = document.getElementById('active-overlay');
    elements.globalEpInput = document.getElementById('global-ep-input');
    elements.paceSlider = document.getElementById('pace-slider');
    elements.paceDisplay = document.getElementById('pace-display');
    elements.fillerToggle = document.getElementById('filler-toggle');
    elements.opToggle = document.getElementById('op-toggle');
    elements.statRemaining = document.getElementById('stat-remaining');
    elements.statHours = document.getElementById('stat-hours');
    elements.statDate = document.getElementById('stat-date');
    elements.statDaysLeft = document.getElementById('stat-days-left');
    elements.statSaved = document.getElementById('stat-saved');
    elements.progressBar = document.getElementById('progress-bar');
    elements.progressContainer = document.getElementById('progress-container');
    elements.progressPercent = document.getElementById('progress-percent');
    
    // Bento Elements
    elements.bentoTotalHours = document.getElementById('bento-total-hours');
    elements.bentoTotalMinutes = document.getElementById('bento-total-minutes');
    elements.bentoTotalEps = document.getElementById('bento-total-eps');
    elements.bentoStreak = document.getElementById('bento-streak');
    elements.bentoCompletedCount = document.getElementById('bento-completed-count');
    elements.bentoLastAnime = document.getElementById('bento-last-anime');
    elements.bentoLastDate = document.getElementById('bento-last-date');
    elements.genreChart = document.getElementById('genre-chart');

    // Pages
    elements.pages['calculator'] = document.getElementById('page-calculator');
    elements.pages['stats'] = document.getElementById('page-stats');
    elements.pages['history'] = document.getElementById('page-history');
    elements.pages['favorites'] = document.getElementById('page-favorites');

    // Carregar dados salvos
    loadSavedData();

    // Configurar event listeners
    setupEventListeners();

    // Atualizar UI
    updateUI();

    // Inicializar módulo de Listas
    if (typeof Lists !== 'undefined') {
        Lists.init();
    }

    console.log('🚀 AnimeEngine v4 initialized!');
}

// --- NAVIGATION LOGIC ---
function switchPage(pageId) {
    // Hide all pages
    Object.values(elements.pages).forEach(el => {
        if(el) el.classList.add('hidden');
        if(el) el.classList.remove('active');
    });

    // Show target page
    if (elements.pages[pageId]) {
        elements.pages[pageId].classList.remove('hidden');
        elements.pages[pageId].classList.add('active');
    }

    // Update Nav Buttons
    document.querySelectorAll('.app-nav-item').forEach(btn => {
        if (btn.dataset.page === pageId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Refresh specific page data
    if (pageId === 'stats') {
        loadStats();
    }
}

// --- STATS LOGIC ---
function loadStats() {
    if (!appState) return;

    // 1. Total Time
    const totalMinutes = appState.achievements.totalMinutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    if(elements.bentoTotalHours) elements.bentoTotalHours.innerText = `${hours}h`;
    if(elements.bentoTotalMinutes) elements.bentoTotalMinutes.innerText = `${totalMinutes} minutes total`;

    // 2. Total Episodes
    if(elements.bentoTotalEps) elements.bentoTotalEps.innerText = appState.achievements.totalEpisodes || 0;

    // 3. Streak (Simplified Logic based on episodesToday or mocked for now)
    // In a real app we would track dates array. For now let's use episodesToday > 0 as "active today".
    const streak = appState.achievements.streak || 0;
    if(elements.bentoStreak) elements.bentoStreak.innerText = streak;

    // 4. Completed Anime
    const completedCount = appState.history.length; // Assumes history holds completed
    // Since history logic wasn't fully detailed in 'playlist' logic, let's count from playlist where progress = 100%
    const completedInStack = appState.playlist.filter(item => {
        // Need to calculate if item is fully watched. 
        // This is tricky with globalEp. Let's rely on stored history if available, or just count currently passed items.
        // Simplified: Count items completely behind 'globalEp'
        return false; // Dynamic calc below
    });
    
    // Better logic: Calculate how many animes are fully covered by globalEp
    let tempCount = 0;
    let completedCalc = 0;
    let lastAnimeWatched = "-";
    
    appState.playlist.forEach(item => {
        if (appState.globalEp >= tempCount + item.eps) {
            completedCalc++;
            lastAnimeWatched = item.title;
        }
        tempCount += item.eps;
    });
    if(elements.bentoCompletedCount) elements.bentoCompletedCount.innerText = completedCalc;
    if(elements.bentoLastAnime) elements.bentoLastAnime.innerText = lastAnimeWatched;
    if(elements.bentoLastDate) elements.bentoLastDate.innerText = appState.achievements.lastActiveDate || "Never";

    // 5. Genre Distribution
    renderGenreChart();
}

function renderGenreChart() {
    if (!elements.genreChart) return;
    elements.genreChart.innerHTML = '';

    const genreCounts = {};
    let totalGenres = 0;

    appState.playlist.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(g => {
                genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                totalGenres++;
            });
        }
    });

    if (totalGenres === 0) {
        elements.genreChart.innerHTML = '<div class="text-center text-gray-400 py-4 text-xs font-mono">No genre data available</div>';
        return;
    }

    // Sort and take top 5
    const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    sortedGenres.forEach(([name, count]) => {
        const percent = Math.round((count / totalGenres) * 100);
        const row = document.createElement('div');
        row.className = 'flex flex-col gap-1';
        row.innerHTML = `
            <div class="flex justify-between text-[10px] font-bold uppercase">
                <span>${name}</span>
                <span>${percent}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-neo-blue" style="width: ${percent}%"></div>
            </div>
        `;
        elements.genreChart.appendChild(row);
    });
}

// --- STORAGE INTEGRATION ---
function loadSavedData() {
    const savedData = Storage.load();
    
    appState = { ...appState, ...savedData };
    
    // Restaurar estado da UI com dados salvos
    if (elements.globalEpInput) {
        elements.globalEpInput.value = appState.globalEp;
    }
    if (elements.paceSlider) {
        elements.paceSlider.value = appState.settings.pace;
        elements.paceDisplay.innerText = appState.settings.pace;
    }
    if (elements.fillerToggle) {
        elements.fillerToggle.checked = appState.settings.skipFillers;
    }
    if (elements.opToggle) {
        elements.opToggle.checked = appState.settings.skipOP;
    }
}

// Debounce para não salvar a cada mudança mínima
let saveTimeout = null;
function saveData() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        Storage.save(appState);
    }, 500); // Salva após 500ms de inatividade
}

// --- SEARCH LOGIC ---
let debounceTimer;
function setupSearchListener() {
    if (!elements.searchInput) return;
    
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value;
        if (query.length < 3) {
            elements.searchResults.classList.add('hidden');
            return;
        }
        elements.loader.classList.remove('hidden');
        debounceTimer = setTimeout(() => fetchAnime(query), 600);
    });
}

async function fetchAnime(query) {
    try {
        const response = await fetch(`${API_BASE}/anime?q=${query}&order_by=members&sort=desc&limit=8`);
        const data = await response.json();
        renderResults(data.data);
    } catch (error) {
        console.error("API Error:", error);
    } finally {
        elements.loader.classList.add('hidden');
    }
}

function renderResults(animes) {
    elements.searchResults.innerHTML = '';
    if (!animes || animes.length === 0) {
        elements.searchResults.classList.add('hidden');
        return;
    }
    elements.searchResults.classList.remove('hidden');

    animes.forEach(anime => {
        const div = document.createElement('div');
        div.className = 'neo-btn bg-white p-2 flex gap-3 items-center hover:bg-yellow-100 mb-2';
        div.innerHTML = `
            <img src="${anime.images.jpg.small_image_url}" class="w-8 h-12 object-cover border-2 border-black">
            <div class="flex-1 min-w-0 text-left">
                <div class="font-bold text-xs truncate uppercase leading-tight">${anime.title}</div>
                <div class="text-[9px] font-mono">${anime.aired?.from?.substring(0,4) || '?'} • ${anime.episodes || '?'} EPS</div>
            </div>
            <i class="fas fa-plus bg-black text-white p-1.5 text-[10px]"></i>
        `;
        div.onclick = () => addToPlaylist(anime);
        elements.searchResults.appendChild(div);
    });
}

// --- PLAYLIST/STACK LOGIC ---
function addToPlaylist(anime) {
    let fillers = [];
    const commonName = Object.keys(FILLER_DB).find(key => anime.title.includes(key));
    if (commonName) fillers = FILLER_DB[commonName];

    let episodeCount = anime.episodes || 24;
    if (!anime.episodes && (anime.title.includes('One Piece') || anime.title.includes('ONE PIECE'))) {
        episodeCount = 1122;
    }

    appState.playlist.push({
        id: anime.mal_id,
        title: anime.title,
        status: anime.status,
        eps: episodeCount,
        image: anime.images.jpg.large_image_url,
        fillers: fillers,
        genres: anime.genres || [] // Save genres
    });

    elements.searchInput.value = '';
    elements.searchResults.classList.add('hidden');
    
    updateUI();
    saveData(); // 💾 Salvar após adicionar
}

function removeFromPlaylist(index) {
    appState.playlist.splice(index, 1);
    updateUI();
    saveData(); // 💾 Salvar após remover
}

// Expor para onclick no HTML
window.removeFromPlaylist = removeFromPlaylist;

function updateUI() {
    renderPlaylist();
    calculate();
}

function renderPlaylist() {
    if (!elements.playlistContainer) return;
    
    elements.playlistContainer.innerHTML = '';
    elements.playlistContainer.className = 'p-4 bento-grid overflow-y-auto max-h-[500px]';

    if (appState.playlist.length === 0) {
        elements.emptyState?.classList.remove('hidden');
        elements.activeOverlay?.classList.remove('hidden');
        if (elements.stackCount) elements.stackCount.innerText = '0';
        if (elements.globalTotal) elements.globalTotal.innerText = '0';
        resetActiveAnime();

        elements.playlistContainer.className = 'p-4 flex flex-col items-center justify-center text-center h-full';
        return;
    }

    elements.emptyState?.classList.add('hidden');
    elements.activeOverlay?.classList.add('hidden');
    if (elements.stackCount) elements.stackCount.innerText = appState.playlist.length;

    let cumulative = 0;
    appState.playlist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'bento-item relative border-2 border-black group cursor-pointer bg-white neo-shadow-hover';
        div.innerHTML = `
            <img src="${item.image}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
            
            <div class="absolute top-0 left-0 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 z-10">
                #${index + 1}
            </div>

            <button onclick="event.stopPropagation(); removeFromPlaylist(${index})" class="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600">
                <i class="fas fa-times text-xs"></i>
            </button>

            <div class="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black p-1">
                <div class="text-[9px] font-bold leading-tight truncate uppercase">${item.title}</div>
                <div class="text-[8px] font-mono text-gray-500">${item.eps} EPS</div>
            </div>
        `;
        elements.playlistContainer.appendChild(div);
        cumulative += item.eps;
    });

    if (elements.globalTotal) elements.globalTotal.innerText = cumulative;
}

// --- CALCULATOR & ACTIVE ANIME ---
function calculate() {
    if (appState.playlist.length === 0) return;

    let globalEp = parseInt(elements.globalEpInput?.value) || 0;
    const pace = parseInt(elements.paceDisplay?.innerText) || 3;
    const skipFillers = elements.fillerToggle?.checked || false;
    const minutesPerEp = elements.opToggle?.checked ? 20 : 24;

    const totalStackEps = appState.playlist.reduce((acc, item) => acc + item.eps, 0);

    if (globalEp > totalStackEps) {
        globalEp = totalStackEps;
        if (elements.globalEpInput) elements.globalEpInput.value = globalEp;
    }

    // Atualizar estado
    appState.globalEp = globalEp;
    appState.settings.pace = pace;
    appState.settings.skipFillers = skipFillers;
    appState.settings.skipOP = elements.opToggle?.checked || false;

    // Determinar anime ativo
    let tempCount = 0;
    let activeAnime = appState.playlist[appState.playlist.length - 1];
    let activeIndex = -1;

    for (let i = 0; i < appState.playlist.length; i++) {
        const season = appState.playlist[i];
        if (globalEp < (tempCount + season.eps)) {
            activeAnime = season;
            activeIndex = i;
            break;
        }
        tempCount += season.eps;
    }

    // Atualizar Dashboard
    if (activeAnime && elements.activeCover) {
        elements.activeCover.src = activeAnime.image;
        elements.activeTitle.innerText = activeAnime.title;
        elements.activeStatus.innerText = activeAnime.status === "Currently Airing" ? "AIRING" : "FINISHED";

        const localEp = globalEp - tempCount;
        elements.activeEps.innerHTML = `${Math.max(0, localEp)} / <span id="clickable-total" class="hover:text-neo-pink cursor-pointer underline decoration-dotted" title="Click to Edit Max Episodes">${activeAnime.eps}</span>`;

        const clickableTotal = document.getElementById('clickable-total');
        if (clickableTotal) {
            clickableTotal.onclick = () => {
                const newTotal = prompt(`Edit Total Episodes for ${activeAnime.title}:`, activeAnime.eps);
                if (newTotal && !isNaN(newTotal) && parseInt(newTotal) > 0) {
                    appState.playlist[activeIndex].eps = parseInt(newTotal);
                    updateUI();
                    saveData();
                }
            };
        }
    }

    // Calcular estatísticas
    let remaining = 0;
    let saved = 0;
    let absCounter = 0;

    appState.playlist.forEach(season => {
        const end = absCounter + season.eps;

        if (globalEp < end) {
            let localStart = Math.max(1, globalEp - absCounter + 1);

            for (let e = localStart; e <= season.eps; e++) {
                let isFiller = false;
                if (season.fillers && season.fillers.length > 0) {
                    isFiller = season.fillers.some(r => e >= r[0] && e <= r[1]);
                }

                if (skipFillers && isFiller) {
                    saved++;
                } else {
                    remaining++;
                }
            }
        }
        absCounter += season.eps;
    });

    // Tempo e datas
    const totalMinutes = remaining * minutesPerEp;
    const hours = (totalMinutes / 60).toFixed(1);
    const days = Math.ceil(remaining / pace);

    const date = new Date();
    date.setDate(date.getDate() + days);

    // Atualizar Stats UI
    if (elements.statRemaining) elements.statRemaining.innerText = remaining;
    if (elements.statHours) elements.statHours.innerText = hours;

    if (remaining === 0) {
        if (elements.statDate) elements.statDate.innerText = "DONE!";
        if (elements.statDaysLeft) {
            elements.statDaysLeft.innerText = "MISSION COMPLETE";
            elements.statDaysLeft.className = "text-xs font-bold text-green-500 mt-1 uppercase";
        }
    } else {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        if (elements.statDate) elements.statDate.innerText = date.toLocaleDateString('pt-BR', options).toUpperCase();
        if (elements.statDaysLeft) {
            elements.statDaysLeft.innerText = `${days} DAYS REMAINING`;
            elements.statDaysLeft.className = "text-xs font-bold text-neo-blue mt-1 uppercase";
        }
    }

    // Barra de progresso
    const percent = Math.min(100, Math.round((globalEp / totalStackEps) * 100));
    if (elements.progressBar) elements.progressBar.style.width = `${percent}%`;
    if (elements.progressPercent) elements.progressPercent.innerText = `${percent}%`;

    // Badge de fillers salvos
    if (saved > 0 && elements.statSaved) {
        const savedHrs = ((saved * minutesPerEp) / 60).toFixed(1);
        elements.statSaved.innerText = `SKIPPED ${saved} FILLERS (~${savedHrs}h)`;
        elements.statSaved.classList.remove('hidden');
    } else if (elements.statSaved) {
        elements.statSaved.classList.add('hidden');
    }

    // Salvar progresso
    saveData();
}

function resetActiveAnime() {
    if (elements.activeCover) elements.activeCover.src = "";
    if (elements.activeTitle) elements.activeTitle.innerText = "NO DATA";
}

// --- ACHIEVEMENTS INTEGRATION ---

// Rastrear episódios assistidos hoje
let lastEpisodeCount = 0;
let todayDateStr = new Date().toDateString();

function trackEpisodeProgress(newEpCount) {
    // Verificar se é um novo dia
    const currentDateStr = new Date().toDateString();
    if (currentDateStr !== todayDateStr) {
        todayDateStr = currentDateStr;
        appState.achievements.episodesToday = 0;
    }

    // Calcular episódios assistidos desde a última verificação
    const diff = newEpCount - lastEpisodeCount;
    if (diff > 0) {
        appState.achievements.totalEpisodes = (appState.achievements.totalEpisodes || 0) + diff;
        appState.achievements.totalMinutes = (appState.achievements.totalMinutes || 0) + (diff * 24);
        appState.achievements.episodesToday = (appState.achievements.episodesToday || 0) + diff;

        // Streak Logic
        const lastDate = appState.achievements.lastActiveDate;
        const today = new Date().toDateString();
        
        if (lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate === yesterday.toDateString()) {
                // Was active yesterday, increment streak
                appState.achievements.streak = (appState.achievements.streak || 0) + 1;
            } else {
                // Broken streak or first time
                appState.achievements.streak = 1;
            }
            appState.achievements.lastActiveDate = today;
            saveData();
        }

        // CHECK ANIMES COMPLETION LOGIC
        let accum = 0;
        
        appState.playlist.forEach((anime) => {
            const startEp = accum + 1;
            const endEp = accum + anime.eps;

            // Se o ep anterior estava antes do fim, e o atual é >= fim
            if (lastEpisodeCount < endEp && newEpCount >= endEp) {
                console.log(`🎉 Anime Completed: ${anime.title}`);
                // Trigger Rating Modal
                if (typeof Lists !== 'undefined') {
                    // Delay pequeno para UX
                    setTimeout(() => Lists.openRatingModal(anime, 'calculator'), 500);
                }
            }
            accum += anime.eps;
        });
    }
    lastEpisodeCount = newEpCount;
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    setupSearchListener();

    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');

    if (btnMinus) {
        btnMinus.addEventListener('click', () => {
            let val = parseInt(elements.globalEpInput?.value) || 0;
            if (val > 0) {
                elements.globalEpInput.value = val - 1;
                calculate();
            }
        });
    }

    if (btnPlus) {
        btnPlus.addEventListener('click', () => {
            let val = parseInt(elements.globalEpInput?.value) || 0;
            elements.globalEpInput.value = val + 1;
            calculate();
        });
    }

    if (elements.paceSlider) {
        elements.paceSlider.addEventListener('input', (e) => {
            elements.paceDisplay.innerText = e.target.value;
            calculate();
        });
    }

    if (elements.globalEpInput) {
        elements.globalEpInput.addEventListener('input', calculate);
    }

    if (elements.fillerToggle) {
        elements.fillerToggle.addEventListener('change', calculate);
    }

    if (elements.opToggle) {
        elements.opToggle.addEventListener('change', calculate);
    }

    // --- PROGRESS BAR DRAG ---
    setupProgressBarDrag();
}

/**
 * Configura a funcionalidade de arrastar na barra de progresso
 */
function setupProgressBarDrag() {
    const container = elements.progressContainer;
    if (!container) return;

    let isDragging = false;

    function updateProgressFromPosition(clientX) {
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        
        // Calcular o total de episódios
        const totalStackEps = appState.playlist.reduce((acc, item) => acc + item.eps, 0);
        if (totalStackEps === 0) return;
        
        // Converter porcentagem para episódio
        const newEp = Math.round((percent / 100) * totalStackEps);
        
        // Atualizar input e recalcular
        if (elements.globalEpInput) {
            elements.globalEpInput.value = newEp;
            calculate();
        }
    }

    // Mouse events
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateProgressFromPosition(e.clientX);
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateProgressFromPosition(e.clientX);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch events para mobile
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        if (e.touches.length > 0) {
            updateProgressFromPosition(e.touches[0].clientX);
        }
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) {
            updateProgressFromPosition(e.touches[0].clientX);
        }
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Click para pular para posição
    container.addEventListener('click', (e) => {
        updateProgressFromPosition(e.clientX);
    });
}
// --- STATS PAGE LOGIC ---
function updateStatsPage() {
    const statsPage = document.getElementById('page-stats');
    if (!statsPage || statsPage.classList.contains('hidden')) return;

    // 1. Total Time
    const totalMinutes = appState.achievements.totalMinutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const elTotalHours = document.getElementById('bento-total-hours');
    const elTotalMinutes = document.getElementById('bento-total-minutes');
    
    if (elTotalHours) elTotalHours.innerText = `${hours}h`;
    if (elTotalMinutes) elTotalMinutes.innerText = `${minutes}m / ${totalMinutes}m total`;

    // 2. Episodes Lifetime
    const elTotalEps = document.getElementById('bento-total-eps');
    if (elTotalEps) elTotalEps.innerText = appState.achievements.totalEpisodes || 0;

    // 3. Streak
    const elStreak = document.getElementById('bento-streak');
    if (elStreak) elStreak.innerText = appState.achievements.streak || 0;

    // 4. Completed Count
    const completedCount = appState.playlist.filter(anime => {
        // Simple logic: if eps watched >= total eps
        // Note: globalEp logic is simplified in stack, here we estimate based on status "Finished" in future
        // For now, let's use a placeholder or check if user finished active anime
        return false; // Placeholder logic
    }).length;
    
    // Better logic: Count how many times we reached end of stack? 
    // For v4 basic, let's use the 'history' array if populated, or 0.
    const elCompleted = document.getElementById('bento-completed-count');
    if (elCompleted) elCompleted.innerText = appState.history.length;

    // 5. Genre Distribution (Mockup for now)
    // In real implementation, we would parse genres from Jikan API response and store them
    
    // 6. Last Activity
    const elLastAnime = document.getElementById('bento-last-anime');
    const elLastDate = document.getElementById('bento-last-date');
    
    if (elLastAnime) {
        // Gets the last anime in playlist or "None"
        const lastAnime = appState.playlist.length > 0 ? appState.playlist[appState.playlist.length - 1] : null;
        elLastAnime.innerText = lastAnime ? lastAnime.title : '-';
    }
    
    if (elLastDate) {
        elLastDate.innerText = appState.achievements.lastActiveDate || '-';
    }
}

// Hook updateStatsPage into UI updates
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    updateStatsPage();
};

// --- NAVIGATION LOGIC ---
function setupNavigation() {
    const buttons = document.querySelectorAll('.app-nav-item');
    const pages = document.querySelectorAll('.page-container');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
             // Ignore disabled buttons
            if (btn.hasAttribute('disabled')) return;

            const targetId = btn.dataset.page;
            
            // Update buttons
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update pages
            pages.forEach(page => {
                if (page.id === `page-${targetId}`) {
                    page.classList.remove('hidden');
                    page.classList.add('active');
                } else {
                    page.classList.add('hidden');
                    page.classList.remove('active');
                }
            });

            // Trigger content update if needed
            if (targetId === 'stats') {
                updateStatsPage();
            }
            if (targetId === 'history' && typeof Lists !== 'undefined') {
                Lists.renderHistory();
            }
            if (targetId === 'favorites' && typeof Lists !== 'undefined') {
                Lists.renderFavorites();
            }
        });
    });
}

function checkAndUnlockAchievements() {
    if (typeof Achievements === 'undefined') return;

    const stats = Achievements.generateStats(appState);
    const currentUnlocked = appState.achievements.unlocked || [];
    const newUnlocks = Achievements.checkAchievements(stats, currentUnlocked);

    // Processar novos desbloqueios
    newUnlocks.forEach(badge => {
        appState.achievements.unlocked.push(badge.id);
        appState.achievements.xp = (appState.achievements.xp || 0) + badge.xp;
        Achievements.showUnlockNotification(badge);
    });

    // Atualizar UI do nível
    updateLevelBadge();

    if (newUnlocks.length > 0) {
        saveData();
    }
}

function updateLevelBadge() {
    if (typeof Achievements === 'undefined') return;
    Achievements.renderLevelBadge(appState.achievements.xp || 0);
}

// Modal functions (exposed to window)
function openAchievementsModal() {
    const modal = document.getElementById('achievements-modal');
    if (modal && typeof Achievements !== 'undefined') {
        Achievements.renderAchievementsModal(
            appState.achievements.unlocked || [],
            appState.achievements.xp || 0
        );
        modal.classList.add('open');
    }
}
window.openAchievementsModal = openAchievementsModal;

function closeAchievementsModal() {
    const modal = document.getElementById('achievements-modal');
    if (modal) {
        modal.classList.remove('open');
    }
}
window.closeAchievementsModal = closeAchievementsModal;

// Modificar a função calculate original para incluir tracking
const originalCalculate = calculate;
calculate = function() {
    originalCalculate();
    
    // Tracking de episódios
    const currentEp = parseInt(elements.globalEpInput?.value) || 0;
    trackEpisodeProgress(currentEp);
    
    // Verificar achievements
    checkAndUnlockAchievements();
};

// Inicializar achievements na carga
const originalInit = initializeApp;
initializeApp = function() {
    originalInit();
    
    // Carregar contador inicial
    lastEpisodeCount = appState.globalEp || 0;
    
    // Atualizar badge de nível
    updateLevelBadge();
    
    // Inicializar sistema de temas
    if (typeof Themes !== 'undefined') {
        Themes.init();
        console.log('🎨 Themes system loaded!');
    }
    
    // Inicializar Navegação
    setupNavigation();

    console.log('🏆 Achievements system loaded!');
};

// --- START APP ---
document.addEventListener('DOMContentLoaded', initializeApp);
