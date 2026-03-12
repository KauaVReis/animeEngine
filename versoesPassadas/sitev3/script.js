
// --- CONFIG & STATE ---
const API_BASE = "https://api.jikan.moe/v4";
let playlist = []; // The Stack
const FILLER_DB = {
    'One Piece': [[54,61], [98,99], [131,143], [196,206], [220,225], [279,283], [326,336], [382,384], [406,407], [426,429], [457,458], [575,578], [626,628], [747,750], [780,782], [895,896], [1029,1030]],
    'Naruto': [[26,26], [97,97], [101,106], [136,140], [143,219]],
    'Naruto: Shippuuden': [[28,28], [57,71], [90,112], [144,151], [170,171], [176,196], [223,242], [257,260], [271,271], [279,281], [284,289], [290,295], [303,320], [347,361], [376,377], [388,390], [394,413], [416,416], [422,423], [427,450], [464,469], [480,483]],
    'Bleach': [[33,33], [50,50], [64,109], [128,137], [168,189], [204,205], [213,214], [227,266], [287,287], [298,299], [303,305], [311,342], [355,355]]
};

// --- DOM ELEMENTS ---
const elements = {
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results'),
    loader: document.getElementById('loader'),
    playlistContainer: document.getElementById('playlist-container'),
    emptyState: document.getElementById('empty-state'),
    stackCount: document.getElementById('stack-count'),
    globalTotal: document.getElementById('global-total-display'),
    
    // Dashboard / Active Anime
    activeCover: document.getElementById('active-cover'),
    activeTitle: document.getElementById('active-title'),
    activeStatus: document.getElementById('active-status'),
    activeEps: document.getElementById('active-eps'),
    activeOverlay: document.getElementById('active-overlay'), // "Add Anime to Start"

    // Inputs
    globalEpInput: document.getElementById('global-ep-input'),
    paceSlider: document.getElementById('pace-slider'),
    paceDisplay: document.getElementById('pace-display'),
    fillerToggle: document.getElementById('filler-toggle'),
    opToggle: document.getElementById('op-toggle'),
    
    // Stats
    statRemaining: document.getElementById('stat-remaining'),
    statHours: document.getElementById('stat-hours'),
    statDate: document.getElementById('stat-date'),
    statDaysLeft: document.getElementById('stat-days-left'),
    statSaved: document.getElementById('stat-saved'),
    progressBar: document.getElementById('progress-bar'),
    progressContainer: document.getElementById('progress-container'),
    progressPercent: document.getElementById('progress-percent'),
};

// --- SEARCH LOGIC ---
let debounceTimer;
elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value;
    if(query.length < 3) {
        elements.searchResults.classList.add('hidden');
        return;
    }
    elements.loader.classList.remove('hidden');
    debounceTimer = setTimeout(() => fetchAnime(query), 600);
});

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
    if(!animes || animes.length === 0) {
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

// --- STACK LOGIC ---
function addToPlaylist(anime) {
    let fillers = [];
    // Simple filler check using string inclusion
    const commonName = Object.keys(FILLER_DB).find(key => anime.title.includes(key));
    if(commonName) fillers = FILLER_DB[commonName];

    // Specific fix for One Piece or unknown episode counts
    let episodeCount = anime.episodes || 24; // Default to 24 for standard seasonal
    if(!anime.episodes && (anime.title.includes('One Piece') || anime.title.includes('ONE PIECE'))) {
        episodeCount = 1122; // Hardcoded current count for One Piece
    }

    playlist.push({
        id: anime.mal_id,
        title: anime.title,
        status: anime.status,
        eps: episodeCount,
        image: anime.images.jpg.large_image_url,
        fillers: fillers
    });

    // Reset UI
    elements.searchInput.value = '';
    elements.searchResults.classList.add('hidden');
    updateUI();
}

function removeFromPlaylist(index) {
    playlist.splice(index, 1);
    updateUI();
}

function updateUI() {
    renderPlaylist();
    calculate();
}

function renderPlaylist() {
    elements.playlistContainer.innerHTML = '';
    
    // Switch to Bento Grid Container
    elements.playlistContainer.className = 'p-4 bento-grid overflow-y-auto max-h-[500px]';

    if(playlist.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.activeOverlay.classList.remove('hidden');
        elements.stackCount.innerText = '0';
        elements.globalTotal.innerText = '0';
        resetActiveAnime();
        
        // Restore default layout for empty state
        elements.playlistContainer.className = 'p-4 flex flex-col items-center justify-center text-center h-full';
        return;
    }

    elements.emptyState.classList.add('hidden');
    elements.activeOverlay.classList.add('hidden');
    elements.stackCount.innerText = playlist.length;

    let cumulative = 0;
    playlist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'bento-item relative border-2 border-black group cursor-pointer bg-white neo-shadow-hover';
        div.innerHTML = `
            <img src="${item.image}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
            
            <!-- Number Badge -->
            <div class="absolute top-0 left-0 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 z-10">
                #${index + 1}
            </div>

            <!-- Remove Button (Hover) -->
            <button onclick="event.stopPropagation(); removeFromPlaylist(${index})" class="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600">
                <i class="fas fa-times text-xs"></i>
            </button>

            <!-- Bottom Info -->
            <div class="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black p-1">
                <div class="text-[9px] font-bold leading-tight truncate uppercase">${item.title}</div>
                <div class="text-[8px] font-mono text-gray-500">${item.eps} EPS</div>
            </div>
        `;
        // Scroll to active logic could go here
        elements.playlistContainer.appendChild(div);
        cumulative += item.eps;
    });
    
    elements.globalTotal.innerText = cumulative;
}

// --- CORE CALCULATOR & ACTIVE ANIME ---
function calculate() {
    if(playlist.length === 0) return;

    let globalEp = parseInt(elements.globalEpInput.value) || 0;
    const pace = parseInt(elements.paceDisplay.innerText);
    const skipFillers = elements.fillerToggle.checked;
    const minutesPerEp = elements.opToggle.checked ? 20 : 24;

    const totalStackEps = playlist.reduce((acc, item) => acc + item.eps, 0);

    // Clamp
    if(globalEp > totalStackEps) {
        globalEp = totalStackEps;
        elements.globalEpInput.value = globalEp;
    }

    // --- 1. Determine ACTIVE Anime in Stack ---
    let tempCount = 0;
    let activeAnime = playlist[playlist.length - 1]; // Default to last if completed
    let activeIndex = -1;

    for (let i = 0; i < playlist.length; i++) {
        const season = playlist[i];
        if (globalEp < (tempCount + season.eps)) {
            activeAnime = season;
            activeIndex = i;
            break;
        }
        tempCount += season.eps;
    }

    // Update Dashboard Visuals
    if (activeAnime) {
        elements.activeCover.src = activeAnime.image;
        elements.activeTitle.innerText = activeAnime.title;
        elements.activeStatus.innerText = activeAnime.status === "Currently Airing" ? "AIRING" : "FINISHED";
        
        // Calculate local progress for this specific anime
        const localEp = globalEp - tempCount; // e.g. if global is 30, and S1 had 25, local is 5
        elements.activeEps.innerHTML = `${Math.max(0, localEp)} / <span id="clickable-total" class="hover:text-neo-pink cursor-pointer underline decoration-dotted" title="Click to Edit Max Episodes">${activeAnime.eps}</span>`;
        
        // Attach click handler dynamically
        document.getElementById('clickable-total').onclick = () => {
            const newTotal = prompt(`Edit Total Episodes for ${activeAnime.title}:`, activeAnime.eps);
            if(newTotal && !isNaN(newTotal) && parseInt(newTotal) > 0) {
                playlist[activeIndex].eps = parseInt(newTotal);
                updateUI(); // Re-render everything
            }
        };
    }

    // --- 2. Calculate Stats ---
    let remaining = 0;
    let saved = 0;
    let absCounter = 0;

    playlist.forEach(season => {
        const start = absCounter + 1;
        const end = absCounter + season.eps;
        
        // Only calc logic for episodes in the future
        if (globalEp < end) {
            // Find where to start in this season
            let localStart = Math.max(1, globalEp - absCounter + 1);
            
            for(let e = localStart; e <= season.eps; e++) {
                // Check Filler
                let isFiller = false;
                if(season.fillers && season.fillers.length > 0) {
                    isFiller = season.fillers.some(r => e >= r[0] && e <= r[1]);
                }

                if(skipFillers && isFiller) {
                    saved++;
                } else {
                    remaining++;
                }
            }
        }
        absCounter += season.eps;
    });


    // Time & Dates
    const totalMinutes = remaining * minutesPerEp;
    const hours = (totalMinutes / 60).toFixed(1);
    const days = Math.ceil(remaining / pace);
    
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    // Update Stats UI
    elements.statRemaining.innerText = remaining;
    elements.statHours.innerText = hours;
    
    if(remaining === 0) {
        elements.statDate.innerText = "DONE!";
        elements.statDaysLeft.innerText = "MISSION COMPLETE";
        elements.statDaysLeft.className = "text-xs font-bold text-green-500 mt-1 uppercase";
    } else {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        elements.statDate.innerText = date.toLocaleDateString('pt-BR', options).toUpperCase();
        elements.statDaysLeft.innerText = `${days} DAYS REMAINING`;
        elements.statDaysLeft.className = "text-xs font-bold text-neo-blue mt-1 uppercase";
    }

    // Progress Bar
    const percent = Math.min(100, Math.round((globalEp / totalStackEps) * 100));
    elements.progressBar.style.width = `${percent}%`;
    elements.progressPercent.innerText = `${percent}%`;

    // Saved Badge
    if(saved > 0) {
        const savedHrs = ((saved * minutesPerEp) / 60).toFixed(1);
        elements.statSaved.innerText = `SKIPPED ${saved} FILLERS (~${savedHrs}h)`;
        elements.statSaved.classList.remove('hidden');
    } else {
        elements.statSaved.classList.add('hidden');
    }
}

function resetActiveAnime() {
    elements.activeCover.src = "";
    elements.activeTitle.innerText = "NO DATA";
}

// --- EVENT LISTENERS ---
document.getElementById('btn-minus').addEventListener('click', () => {
    let val = parseInt(elements.globalEpInput.value) || 0;
    if(val > 0) {
        elements.globalEpInput.value = val - 1;
        calculate();
    }
});

document.getElementById('btn-plus').addEventListener('click', () => {
    let val = parseInt(elements.globalEpInput.value) || 0;
    elements.globalEpInput.value = val + 1;
    calculate();
});

elements.paceSlider.addEventListener('input', (e) => {
    elements.paceDisplay.innerText = e.target.value;
    calculate();
});
elements.globalEpInput.addEventListener('input', calculate);
elements.fillerToggle.addEventListener('change', calculate);
elements.opToggle.addEventListener('change', calculate);

// --- DRAG LOGIC ---
let isDragging = false;

function updateProgressFromEvent(e) {
    const rect = elements.progressContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, x / width));
    
    // Calculate episode based on total stack size
    const totalStackEps = playlist.reduce((acc, item) => acc + item.eps, 0);
    if (totalStackEps === 0) return;

    const targetEp = Math.round(percent * totalStackEps);
    elements.globalEpInput.value = targetEp;
    calculate();
}

elements.progressContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateProgressFromEvent(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        e.preventDefault(); // Prevent text selection
        updateProgressFromEvent(e);
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
    }
});

