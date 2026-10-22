/**
 * AnimeEngine v8 — AnimdlePage Controller (Music Quiz)
 * 
 * Mecânicas preservadas e aprimoradas do protótipo:
 *  - Desafio diário determinístico por data (?date=YYYY-MM-DD) + modo livre (Treino)
 *  - Alternância entre OPENING (OP) e ENDING (ED)
 *  - 5 tentativas com desfoque progressivo da capa (40px -> 25px -> 15px -> 5px -> 0px)
 *  - Duração progressiva do snippet (5s -> 10s -> 15s -> 20s -> 25s)
 *  - Carregamento em Blob (anti-cheat) com fallback direto para o stream WebM/Ogg
 *  - Isolamento estrito da Rádio: emite 'engine:requestAudioExclusive' ao tocar snippet
 *    e limpa recursos automaticamente no evento 'spa:beforeNavigate'
 */

const AnimdlePage = {
    mode: 'OP', // 'OP' | 'ED'
    isPractice: false,
    currentDateStr: '',
    archiveYear: new Date().getFullYear(),
    archiveMonth: new Date().getMonth(),

    targetAnime: null,
    targetTrack: null,

    lives: 5,
    maxLives: 5,
    attempt: 0,
    gameOver: false,
    blurLevels: [40, 25, 15, 5, 0],
    durations: [5, 10, 15, 20, 25],

    audioEl: null,
    blobUrl: null,
    isPlaying: false,
    progressInterval: null,
    debounceTimer: null,
    boundLeaveHandler: null,
    boundOstPlayHandler: null,

    async init() {
        console.log('🎵 Initializing AnimdlePage...');
        this.cleanupAudio();

        const params = new URLSearchParams(window.location.search);
        const dateParam = params.get('date');
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            this.currentDateStr = dateParam;
            this.isPractice = false;
        } else {
            const d = new Date();
            this.currentDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            this.isPractice = false;
        }

        this.bindLifecycleEvents();
        this.setupAutocomplete();
        await this.loadChallenge();
    },

    bindLifecycleEvents() {
        if (this.boundLeaveHandler) {
            window.removeEventListener('spa:beforeNavigate', this.boundLeaveHandler);
            window.removeEventListener('ost:beforePlay', this.boundOstPlayHandler);
        }

        // Ao sair da rota ?page=animdle na SPA, pausar imediatamente o snippet
        this.boundLeaveHandler = () => {
            this.cleanupAudio();
        };
        // Se o usuário der play no OSTPlayer inferior, pausar o snippet do Animdle
        this.boundOstPlayHandler = () => {
            this.stopSnippet();
        };

        window.addEventListener('spa:beforeNavigate', this.boundLeaveHandler);
        window.addEventListener('ost:beforePlay', this.boundOstPlayHandler);
    },

    cleanupAudio() {
        this.stopSnippet();
        if (this.audioEl) {
            try {
                this.audioEl.onloadedmetadata = null;
                this.audioEl.oncanplay = null;
                this.audioEl.onerror = null;
                this.audioEl.pause();
                this.audioEl.removeAttribute('src');
            } catch (e) { }
            this.audioEl = null;
        }
        if (this.blobUrl) {
            try { URL.revokeObjectURL(this.blobUrl); } catch (e) { }
            this.blobUrl = null;
        }
    },

    async switchMode(newMode) {
        if (this.mode === newMode && !this.isPractice) return;
        this.mode = newMode === 'ED' ? 'ED' : 'OP';
        document.getElementById('animdle-mode-op')?.classList.toggle('active', this.mode === 'OP');
        document.getElementById('animdle-mode-ed')?.classList.toggle('active', this.mode === 'ED');
        await this.loadChallenge();
    },

    async startPracticeRound() {
        this.isPractice = true;
        await this.loadChallenge();
    },

    getSeed() {
        if (this.isPractice) {
            return Math.floor(Math.random() * 900000) + 100000;
        }
        return parseInt(this.currentDateStr.replace(/-/g, ''), 10) + (this.mode === 'ED' ? 500 : 0);
    },

    async loadChallenge() {
        this.cleanupAudio();
        this.lives = 5;
        this.attempt = 0;
        this.gameOver = false;
        this.targetAnime = null;
        this.targetTrack = null;

        this.resetUIForNewRound();

        const seed = this.getSeed();
        const page = (seed % 5) + 1;
        let index = seed % 20;

        try {
            this.setStatusMessage('Sorteando anime do desafio no AniList...');
            const query = `
                query ($page: Int) {
                    Page(page: $page, perPage: 25) {
                        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                            id
                            title { romaji english }
                            coverImage { extraLarge large }
                            seasonYear
                        }
                    }
                }
            `;

            let list = [];
            try {
                const res = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, variables: { page } })
                });

                if (res.ok) {
                    const json = await res.json();
                    list = json.data?.Page?.media || [];
                }
            } catch (anilistErr) {
                console.warn('[AnimdlePage] AniList indisponível ou rate-limited, usando catálogo AnimeThemes direto:', anilistErr);
            }

            // Buscar tema válido (OP ou ED conforme modo) em lote para resposta rápida
            let foundAnime = null;
            let foundTrack = null;

            if (list.length > 0 && typeof MusicService !== 'undefined') {
                const orderedCandidates = Array.from({ length: Math.min(8, list.length) }, (_, i) => list[(index + i) % list.length]).filter(Boolean);
                const idsParam = orderedCandidates.map(c => c.id).join(',');
                try {
                    const batchUrl = `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${idsParam}&include=animethemes.animethemeentries.videos,animethemes.song.artists,resources,images&page[size]=15`;
                    const atRes = await fetch(batchUrl);
                    if (atRes.ok) {
                        const atData = await atRes.json();
                        const atAnimes = atData.anime || [];
                        for (const cand of orderedCandidates) {
                            const matchedAt = atAnimes.find(a =>
                                (a.resources || []).some(r => Number(r.external_id) === Number(cand.id))
                            );
                            if (!matchedAt) continue;
                            const meta = {
                                id: cand.id,
                                title: cand.title.romaji || cand.title.english,
                                image: cand.coverImage.extraLarge || cand.coverImage.large,
                                cover: cand.coverImage.extraLarge || cand.coverImage.large,
                                year: cand.seasonYear
                            };
                            const normalized = (matchedAt.animethemes || [])
                                .map(th => MusicService.normalizeAnimeTheme(th, matchedAt, meta))
                                .filter(Boolean);
                            const matching = normalized.filter(t => t.themeType === this.mode && t.mediaUrl);
                            if (matching.length > 0) {
                                foundAnime = meta;
                                foundTrack = matching[0];
                                break;
                            }
                        }
                    }
                } catch (batchErr) {
                    console.warn('[AnimdlePage] Erro na consulta em lote:', batchErr);
                }
            }

            // 2ª Tentativa: se AniList falhou/rate-limited, buscar diretamente da AnimeThemes via MusicService
            if (!foundTrack && typeof MusicService !== 'undefined') {
                try {
                    const discTracks = await MusicService.getDiscoveryTracks({ type: this.mode, count: 10 });
                    if (discTracks && discTracks.length > 0) {
                        const pick = discTracks[seed % discTracks.length];
                        foundTrack = pick;
                        foundAnime = {
                            id: pick.animeId,
                            title: pick.animeTitle,
                            image: pick.cover,
                            year: pick.animeYear
                        };
                    }
                } catch (discErr) { }
            }

            // 3ª Tentativa: Fallback de emergência caso a API esteja offline
            if (!foundTrack && typeof MusicService !== 'undefined') {
                const fallbackPool = MusicService.getEmergencyFallbackPool('ALL');
                const pick = fallbackPool[seed % fallbackPool.length];
                foundTrack = pick;
                foundAnime = {
                    id: pick.animeId,
                    title: pick.animeTitle,
                    image: pick.cover,
                    year: pick.animeYear
                };
            }

            if (!foundTrack || !foundAnime) {
                throw new Error('Não foi possível encontrar tema musical disponível.');
            }

            this.targetAnime = foundAnime;
            this.targetTrack = foundTrack;

            // Configurar imagem borrada inicial (40px)
            const coverImg = document.getElementById('animdle-cover-img');
            if (coverImg) {
                coverImg.src = foundAnime.image;
                coverImg.style.filter = `blur(${this.blurLevels[0]}px)`;
                coverImg.style.transform = 'scale(1.12)';
            }

            await this.prepareIsolatedAudio(foundTrack.audioUrl || foundTrack.mediaUrl, foundTrack.mediaUrl);
        } catch (err) {
            console.error('[AnimdlePage] Erro ao carregar desafio:', err);
            this.setStatusMessage('⚠️ Erro ao carregar áudio. Clique em "Modo Treino" para tentar outra faixa.');
        }
    },

    async prepareIsolatedAudio(primaryUrl, fallbackVideoUrl = null) {
        this.setStatusMessage('Sintonizando faixa do desafio...');
        const el = new Audio();
        el.preload = 'metadata';
        this.audioEl = el;

        let controlsEnabled = false;
        let usedFallback = false;
        const enableControls = () => {
            if (controlsEnabled || this.audioEl !== el) return;
            controlsEnabled = true;
            const playBtn = document.getElementById('animdle-play-btn');
            const guessInput = document.getElementById('animdle-guess-input');
            const skipBtn = document.getElementById('animdle-skip-btn');

            if (playBtn) {
                playBtn.disabled = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
            if (guessInput) guessInput.disabled = false;
            if (skipBtn) skipBtn.disabled = false;

            const dur = this.durations[this.attempt] || 5;
            this.setStatusMessage(`Pronto! Ouça os primeiros ${dur}s da ${this.mode === 'OP' ? 'Opening' : 'Ending'}.`);
        };

        el.onloadedmetadata = enableControls;
        el.oncanplay = enableControls;
        el.onerror = () => {
            if (this.audioEl !== el) return;
            if (!usedFallback && fallbackVideoUrl && fallbackVideoUrl !== primaryUrl) {
                usedFallback = true;
                el.src = fallbackVideoUrl;
                el.load();
                return;
            }
            enableControls();
        };

        el.src = primaryUrl;
        el.load();

        setTimeout(enableControls, 600);
    },

    toggleSnippetPlay() {
        if (!this.audioEl) return;
        if (this.isPlaying) {
            this.stopSnippet();
        } else {
            this.playSnippet();
        }
    },

    playSnippet() {
        if (!this.audioEl) return;

        // Solicitar exclusividade de áudio no barramento (pausa o OSTPlayer global automaticamente)
        window.dispatchEvent(new CustomEvent('engine:requestAudioExclusive', {
            detail: { source: 'animdle' }
        }));

        const maxDuration = this.gameOver ? 25 : this.durations[this.attempt];
        this.audioEl.currentTime = 0;

        this.audioEl.play().then(() => {
            this.isPlaying = true;
            const playBtn = document.getElementById('animdle-play-btn');
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-stop"></i>';
            document.getElementById('animdle-visualizer')?.classList.add('playing');
            this.setStatusMessage(`Tocando trecho (${maxDuration}s)...`);

            clearInterval(this.progressInterval);
            this.progressInterval = setInterval(() => {
                if (!this.audioEl) return;
                const cur = this.audioEl.currentTime || 0;
                const pct = Math.min(100, (cur / 25) * 100);

                const fillEl = document.getElementById('animdle-progress-fill');
                const timeCurEl = document.getElementById('animdle-time-cur');
                if (fillEl) fillEl.style.width = `${pct}%`;
                if (timeCurEl) timeCurEl.textContent = `${cur.toFixed(1)}s`;

                if (cur >= maxDuration) {
                    this.stopSnippet();
                }
            }, 50);
        }).catch(err => {
            console.warn('[AnimdlePage] Erro ao tocar snippet:', err);
            this.setStatusMessage('Clique novamente no botão Play para iniciar o áudio.');
        });
    },

    stopSnippet() {
        if (this.audioEl) {
            try {
                this.audioEl.pause();
                this.audioEl.currentTime = 0;
            } catch (e) { }
        }
        this.isPlaying = false;
        clearInterval(this.progressInterval);

        const playBtn = document.getElementById('animdle-play-btn');
        if (playBtn && !playBtn.disabled) {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        document.getElementById('animdle-visualizer')?.classList.remove('playing');

        const fillEl = document.getElementById('animdle-progress-fill');
        const timeCurEl = document.getElementById('animdle-time-cur');
        if (fillEl) fillEl.style.width = '0%';
        if (timeCurEl) timeCurEl.textContent = '0.0s';
    },

    setupAutocomplete() {
        const input = document.getElementById('animdle-guess-input');
        const box = document.getElementById('animdle-suggestions');
        if (!input || !box) return;

        input.oninput = (e) => {
            clearTimeout(this.debounceTimer);
            const val = e.target.value.trim();
            if (val.length < 2) {
                box.innerHTML = '';
                box.style.display = 'none';
                return;
            }
            this.debounceTimer = setTimeout(async () => {
                const query = `
                    query ($search: String) {
                        Page(page: 1, perPage: 6) {
                            media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                                id
                                title { romaji english }
                                coverImage { medium }
                                seasonYear
                            }
                        }
                    }
                `;
                let results = [];
                try {
                    const res = await fetch('https://graphql.anilist.co', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query, variables: { search: val } })
                    });
                    if (res.ok) {
                        const json = await res.json();
                        results = (json.data?.Page?.media || []).map(anime => ({
                            id: anime.id,
                            title: anime.title.romaji || anime.title.english,
                            cover: anime.coverImage?.medium || '',
                            year: anime.seasonYear || ''
                        }));
                    }
                } catch (err) {
                    console.warn('[AnimdlePage] AniList autocomplete indisponível, usando fallback AnimeThemes:', err);
                }

                if (results.length === 0 && typeof MusicService !== 'undefined') {
                    try {
                        const tracks = await MusicService.searchTracks(val, 'ALL');
                        const seen = new Set();
                        for (const t of tracks) {
                            if (!seen.has(t.animeTitle)) {
                                seen.add(t.animeTitle);
                                results.push({
                                    id: t.animeId || 0,
                                    title: t.animeTitle,
                                    cover: t.cover || 'https://via.placeholder.com/72x96/111/fff?text=AE',
                                    year: t.animeYear || ''
                                });
                            }
                            if (results.length >= 6) break;
                        }
                    } catch (e) { }
                }

                if (results.length === 0) {
                    box.style.display = 'none';
                    return;
                }
                box.innerHTML = results.map(anime => `
                    <div class="animdle-suggestion-item" data-id="${anime.id || 0}" data-title="${this.escapeHtml(anime.title)}">
                        <img src="${anime.cover}" alt="${this.escapeHtml(anime.title)}" onerror="this.src='img/default-cover.jpg'">
                        <div>
                            <div class="sug-title">${this.escapeHtml(anime.title)}</div>
                            <div class="sug-year">${anime.year || ''}</div>
                        </div>
                    </div>
                `).join('');
                box.style.display = 'block';

                box.querySelectorAll('.animdle-suggestion-item').forEach(item => {
                    item.onclick = () => {
                        const guessedId = Number(item.dataset.id);
                        const guessedTitle = item.dataset.title;
                        box.style.display = 'none';
                        input.value = '';
                        this.submitGuess(guessedId, guessedTitle);
                    };
                });
            }, 260);
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const firstSug = box.querySelector('.animdle-suggestion-item');
                if (firstSug && box.style.display !== 'none') {
                    firstSug.click();
                } else if (input.value.trim().length >= 2) {
                    const typed = input.value.trim();
                    box.style.display = 'none';
                    input.value = '';
                    this.submitGuess(0, typed);
                }
            }
        };
    },

    submitGuess(guessedId, guessedTitle) {
        if (this.gameOver || !this.targetAnime) return;
        this.stopSnippet();

        const isCorrect = (Number(guessedId) > 0 && Number(guessedId) === Number(this.targetAnime.id)) ||
            guessedTitle.toLowerCase() === this.targetAnime.title.toLowerCase();

        this.addAttemptRow(guessedTitle, isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            this.endGame(true);
        } else {
            this.advanceAttempt();
        }
    },

    skipAttempt() {
        if (this.gameOver || !this.targetAnime) return;
        this.stopSnippet();
        this.addAttemptRow('⏭️ Pulou (+5s)', 'skipped');
        this.advanceAttempt();
    },

    advanceAttempt() {
        this.lives--;
        this.attempt++;
        this.updateLivesAndUnlockUI();

        if (this.lives <= 0) {
            this.endGame(false);
        } else {
            const blur = this.blurLevels[Math.min(this.attempt, this.blurLevels.length - 1)];
            const coverImg = document.getElementById('animdle-cover-img');
            if (coverImg) {
                coverImg.style.filter = `blur(${blur}px)`;
            }
            const nextDur = this.durations[Math.min(this.attempt, this.durations.length - 1)];
            this.setStatusMessage(`Desbloqueado: ${nextDur} segundos de música!`);
        }
    },

    addAttemptRow(label, status) {
        const list = document.getElementById('animdle-attempts-list');
        if (!list) return;
        const icon = status === 'correct' ? '✅' : (status === 'skipped' ? '⏭️' : '❌');
        const row = document.createElement('div');
        row.className = `animdle-attempt-item status-${status}`;
        row.innerHTML = `
            <span class="attempt-num">#${this.attempt + 1}</span>
            <span class="attempt-name">${this.escapeHtml(label)}</span>
            <span class="attempt-icon">${icon}</span>
        `;
        list.appendChild(row);
    },

    endGame(won) {
        this.gameOver = true;
        this.stopSnippet();

        const coverImg = document.getElementById('animdle-cover-img');
        const overlay = document.getElementById('animdle-cover-overlay');
        const controls = document.getElementById('animdle-controls-area');
        const resultCard = document.getElementById('animdle-result-card');

        if (coverImg) {
            coverImg.style.filter = 'blur(0px)';
            coverImg.style.transform = 'scale(1)';
        }
        if (overlay) overlay.style.display = 'none';
        if (controls) controls.style.display = 'none';

        if (won) {
            if (!this.isPractice) {
                this.markDateComplete(this.currentDateStr);
            }
            if (typeof Storage !== 'undefined' && Storage.addXP) {
                try { Storage.addXP(25); } catch (e) { }
            }
        }

        if (resultCard && this.targetAnime && this.targetTrack) {
            resultCard.style.display = 'block';
            resultCard.className = `animdle-result-card ${won ? 'result-win' : 'result-loss'}`;
            resultCard.innerHTML = `
                <h2 class="result-heading">${won ? '🎉 VOCÊ ACERTOU! (+25 XP)' : '💀 FIM DE JOGO!'}</h2>
                <p class="result-anime-name">${this.escapeHtml(this.targetAnime.title)}</p>
                <p class="result-song-info">
                    <span class="np-theme-pill">${this.escapeHtml(this.targetTrack.themeSlug || this.mode)}</span>
                    <strong>${this.escapeHtml(this.targetTrack.songTitle)}</strong> — ${this.escapeHtml(this.targetTrack.artist)}
                </p>
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="AnimdlePage.playFullInRadio()">
                        <i class="fas fa-Compact-disc"></i> Ouvir Completa no Player
                    </button>
                    <button class="btn btn-secondary" onclick="AnimdlePage.startPracticeRound()">
                        <i class="fas fa-redo"></i> Jogar Outra (Modo Treino)
                    </button>
                    ${this.targetAnime.id ? `
                        <button class="btn btn-secondary" onclick="Common.navigate('?page=detalhes&id=${this.targetAnime.id}')">
                            <i class="fas fa-info-circle"></i> Ver Anime
                        </button>
                    ` : ''}
                </div>
            `;
        }
    },

    async playFullInRadio() {
        this.cleanupAudio();
        if (this.targetTrack && typeof OSTPlayer !== 'undefined') {
            await OSTPlayer.playTrack(this.targetTrack, true);
        }
    },

    resetUIForNewRound() {
        const dateBadge = document.getElementById('animdle-date-badge');
        if (dateBadge) {
            dateBadge.textContent = this.isPractice
                ? `MODO TREINO LIVRE • ${this.mode}`
                : `DESAFIO DIÁRIO • ${this.currentDateStr} (${this.mode})`;
        }

        const overlay = document.getElementById('animdle-cover-overlay');
        const controls = document.getElementById('animdle-controls-area');
        const resultCard = document.getElementById('animdle-result-card');
        const attemptsList = document.getElementById('animdle-attempts-list');
        const playBtn = document.getElementById('animdle-play-btn');
        const guessInput = document.getElementById('animdle-guess-input');
        const skipBtn = document.getElementById('animdle-skip-btn');

        if (overlay) overlay.style.display = 'flex';
        if (controls) controls.style.display = 'block';
        if (resultCard) resultCard.style.display = 'none';
        if (attemptsList) attemptsList.innerHTML = '';
        if (playBtn) {
            playBtn.disabled = true;
            playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        if (guessInput) {
            guessInput.value = '';
            guessInput.disabled = true;
        }
        if (skipBtn) skipBtn.disabled = true;

        this.updateLivesAndUnlockUI();
    },

    updateLivesAndUnlockUI() {
        const heartsEl = document.getElementById('animdle-lives-display');
        const durBadge = document.getElementById('animdle-duration-badge');
        const maxLabel = document.getElementById('animdle-time-max');
        const unlockedBar = document.getElementById('animdle-progress-unlocked');

        if (heartsEl) {
            heartsEl.textContent = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, this.maxLives - this.lives));
        }

        const curDur = this.durations[Math.min(this.attempt, this.durations.length - 1)];
        if (durBadge) durBadge.textContent = `${curDur}s / 25s`;
        if (maxLabel) maxLabel.textContent = `Máx: ${curDur}s (de 25s)`;
        if (unlockedBar) unlockedBar.style.width = `${(curDur / 25) * 100}%`;
    },

    setStatusMessage(msg) {
        const el = document.getElementById('animdle-status-msg');
        if (el) el.textContent = msg;
        const btn = document.getElementById('animdle-play-btn');
        if (btn) btn.title = msg;
    },

    // =========================================================
    // CALENDÁRIO DE ARQUIVO DIÁRIO
    // =========================================================
    markDateComplete(dateStr) {
        try {
            const key = 'music_quiz_completed';
            const history = JSON.parse(localStorage.getItem(key) || '[]');
            if (!history.includes(dateStr)) {
                history.push(dateStr);
                localStorage.setItem(key, JSON.stringify(history));
            }
        } catch (e) { }
    },

    openArchiveCalendar() {
        const modal = document.getElementById('animdle-calendar-modal');
        if (!modal) return;
        modal.style.display = 'flex';
        this.renderArchiveCalendar();
    },

    closeArchiveCalendar() {
        const modal = document.getElementById('animdle-calendar-modal');
        if (modal) modal.style.display = 'none';
    },

    changeArchiveMonth(delta) {
        const d = new Date(this.archiveYear, this.archiveMonth + delta, 1);
        this.archiveYear = d.getFullYear();
        this.archiveMonth = d.getMonth();
        this.renderArchiveCalendar();
    },

    renderArchiveCalendar() {
        const grid = document.getElementById('animdle-calendar-grid');
        const label = document.getElementById('animdle-cal-label');
        if (!grid || !label) return;

        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        label.textContent = `${months[this.archiveMonth]} ${this.archiveYear}`;

        const daysHeader = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        let html = daysHeader.map(d => `<div class="cal-day-head">${d}</div>`).join('');

        const firstDay = new Date(this.archiveYear, this.archiveMonth, 1).getDay();
        const daysInMonth = new Date(this.archiveYear, this.archiveMonth + 1, 0).getDate();
        const completed = JSON.parse(localStorage.getItem('music_quiz_completed') || '[]');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDay; i++) {
            html += `<div></div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${this.archiveYear}-${String(this.archiveMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const checkDate = new Date(this.archiveYear, this.archiveMonth, d);
            const isFuture = checkDate > today;
            const isDone = completed.includes(dateStr);
            const isSelected = dateStr === this.currentDateStr && !this.isPractice;

            const classes = [
                'cal-day-cell',
                isFuture ? 'future' : '',
                isDone ? 'completed' : '',
                isSelected ? 'selected' : ''
            ].filter(Boolean).join(' ');

            html += `<button class="${classes}" ${isFuture ? 'disabled' : `onclick="AnimdlePage.selectArchiveDate('${dateStr}')"`}>${d}</button>`;
        }

        grid.innerHTML = html;
    },

    async selectArchiveDate(dateStr) {
        this.closeArchiveCalendar();
        this.currentDateStr = dateStr;
        this.isPractice = false;
        await this.loadChallenge();
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
};

window.AnimdlePage = AnimdlePage;
if (!window.__SPA_MANAGED_LOAD__) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        AnimdlePage.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => AnimdlePage.init());
    }
}
