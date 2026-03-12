/**
 * Music Quiz Logic - Refactored for Neo-Brutalist Layout
 * Uses Daily Seed + Fixed Pool + Levels System
 */

const GAME_CONFIG = {
    maxLives: 5,
    levels: [
        { blur: 40, duration: 5 },  // Tentativa 1 (5 Vidas)
        { blur: 25, duration: 10 }, // Tentativa 2 (4 Vidas)
        { blur: 15, duration: 15 }, // Tentativa 3 (3 Vidas)
        { blur: 5, duration: 20 },  // Tentativa 4 (2 Vidas)
        { blur: 0, duration: 25 }   // Tentativa 5 (1 Vida)
    ]
};

const Game = {
    attempts: 0,
    currentLives: 5,
    todayAnime: null,
    isPlaying: false,
    currentMode: 'OP', // 'OP' or 'ED'
    maxDurationForLevel: 5,
    isRoundOver: false,

    async init() {
        this.updateModeUI();

        // 1. Get Daily Seed
        const baseSeed = API.getDailySeed();
        const modeModifier = this.currentMode === 'OP' ? 0 : 9999;
        const seed = baseSeed + modeModifier;
        console.log(`Daily Seed (${this.currentMode}):`, seed);

        if (window.CalendarSystem) {
            CalendarSystem.init(`music_quiz_${this.currentMode.toLowerCase()}`);
        }

        // 2. Real Pool (AnimeThemes)
        const pool = [
            { type: 'OP', title: 'Shingeki no Kyojin', file: 'https://animethemes.moe/video/ShingekiNoKyojin-OP1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-m5ZMNtFioc7j.jpg' },
            { type: 'OP', title: 'Naruto Shippuuden', file: 'https://animethemes.moe/video/NarutoShippuuden-OP1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1735-6lY3X0er9ZtA.jpg' },
            { type: 'OP', title: 'Death Note', file: 'https://animethemes.moe/video/DeathNote-OP1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCwhwk98z2.jpg' },
            { type: 'OP', title: 'One Punch Man', file: 'https://animethemes.moe/video/OnePunchMan-OP1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-2lgnxbRrRix7.jpg' },
            { type: 'OP', title: 'Sword Art Online', file: 'https://animethemes.moe/video/SwordArtOnline-OP1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11757-Q9P2jV7577ac.jpg' },
            { type: 'OP', title: 'Tokyo Ghoul', file: 'https://animethemes.moe/video/TokyoGhoul-OP1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-fmnHdQzyboSC.jpg' },
            { type: 'OP', title: 'No Game No Life', file: 'https://animethemes.moe/video/NoGameNoLife-OP1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19815-5Wk1XfA29i0M.jpg' },
            { type: 'OP', title: 'Noragami', file: 'https://animethemes.moe/video/Noragami-OP1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20447-oH8pU5ZJq762.jpg' },
            { type: 'ED', title: 'Jujutsu Kaisen', file: 'https://animethemes.moe/video/JujutsuKaisen-ED1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEfseh.jpg' },
            { type: 'ED', title: 'Chainsaw Man', file: 'https://animethemes.moe/video/ChainsawMan-ED1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-FloXw0zD16jX.jpg' },
            { type: 'ED', title: 'Spy x Family', file: 'https://animethemes.moe/video/SpyXFamily-ED1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Yl5M3AiLjmvr.jpg' },
            { type: 'ED', title: 'Kaguya-sama', file: 'https://animethemes.moe/video/KaguyaSama-ED2.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101921-VvdHhaZ8L4A9.jpg' },
            { type: 'ED', title: 'Hunter x Hunter (2011)', file: 'https://animethemes.moe/video/HunterHunter2011-ED1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png' },
            { type: 'ED', title: 'Toradora!', file: 'https://animethemes.moe/video/Toradora-ED1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx4224-3Bh0rm99N6ur.jpg' },
            { type: 'ED', title: 'Angel Beats!', file: 'https://animethemes.moe/video/AngelBeats-ED1.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx6547-3i79Cj1w8F1u.png' }
        ];

        // 3. Select Anime
        const filteredPool = pool.filter(item => item.type === this.currentMode);
        if (filteredPool.length === 0) return;

        const index = seed % filteredPool.length;
        this.todayAnime = filteredPool[index];
        console.log("Target:", this.todayAnime.title);

        this.resetGameUI();
        await this.setupSecurePlayer(this.todayAnime.file);

        // Setup Button Listeners
        const playBtn = document.getElementById('play-btn');
        playBtn.onclick = () => this.playSnippet();

        // Progress Bar Logic
        const video = document.getElementById('game-video');
        video.ontimeupdate = () => {
            if (!this.isPlaying) return;

            const currentTime = video.currentTime;
            const percentage = (currentTime / this.maxDurationForLevel) * 100;
            document.getElementById('progress-bar').style.width = `${Math.min(percentage, 100)}%`;

            if (currentTime >= this.maxDurationForLevel && !this.isRoundOver) {
                video.pause();
                this.isPlaying = false;
                playBtn.disabled = false;
            }
        };
    },

    switchMode(mode) {
        if (this.currentMode === mode) return;
        this.currentMode = mode;
        this.init();
    },

    updateModeUI() {
        const btnOp = document.getElementById('mode-op');
        const btnEd = document.getElementById('mode-ed');
        if (this.currentMode === 'OP') {
            btnOp.style.opacity = '1'; btnOp.classList.remove('secondary');
            btnEd.style.opacity = '0.6'; btnEd.classList.add('secondary');
        } else {
            btnOp.style.opacity = '0.6'; btnOp.classList.add('secondary');
            btnEd.style.opacity = '1'; btnEd.classList.remove('secondary');
        }
    },

    resetGameUI() {
        this.attempts = 0;
        this.currentLives = 5;
        this.isRoundOver = false;

        this.updateLivesUI();
        document.getElementById('round-display').textContent = "1/5";
        document.getElementById('guess-input').value = "";
        document.getElementById('guess-input').disabled = false;
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('give-up-btn').style.display = 'none';
        document.getElementById('feedback').textContent = '';
        document.getElementById('game-actions').innerHTML = '';

        // Overlays
        document.getElementById('loading-overlay').classList.remove('hidden');
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('result-overlay').classList.add('hidden');

        // Reset Video
        const video = document.getElementById('game-video');
        video.style.filter = `blur(${GAME_CONFIG.levels[0].blur}px)`;
        document.getElementById('progress-bar').style.width = '0%';
    },

    updateLivesUI() {
        let hearts = "";
        for (let i = 0; i < this.currentLives; i++) hearts += "❤️";
        for (let i = this.currentLives; i < 5; i++) hearts += "🖤";
        document.getElementById('lives-display').textContent = hearts;
    },

    updateLevelConfig() {
        const levelIndex = 5 - this.currentLives;
        if (levelIndex >= 5) return; // Should not happen

        const config = GAME_CONFIG.levels[levelIndex];
        this.maxDurationForLevel = config.duration;

        const video = document.getElementById('game-video');
        video.style.filter = `blur(${config.blur}px)`;

        // Update Overlay Text for Next Try
        document.getElementById('overlay-desc').textContent = `Blur: ${config.blur}px | Tempo: ${config.duration}s`;
    },

    async setupSecurePlayer(url) {
        const video = document.getElementById('game-video');
        const loadText = document.getElementById('loading-text');

        try {
            const req = await fetch(url);
            if (!req.ok) throw new Error("Fetch failed");
            const blob = await req.blob();
            const blobUrl = URL.createObjectURL(blob);
            video.src = blobUrl;
        } catch (e) {
            console.warn("Fallback to direct URL");
            video.src = url;
        }

        video.onloadedmetadata = () => {
            document.getElementById('loading-overlay').classList.add('hidden');
            this.showStartOverlay();
            this.updateLevelConfig();
        };

        video.onerror = () => {
            loadText.textContent = "Erro ao carregar vídeo.";
        };

        video.volume = 0.5;
    },

    showStartOverlay() {
        if (this.isRoundOver) return;
        document.getElementById('start-overlay').classList.remove('hidden');
        document.getElementById('overlay-title').textContent = this.currentLives === 5 ? "Começar" : "Tentar Novamente";
    },

    playSnippet() {
        const video = document.getElementById('game-video');
        document.getElementById('start-overlay').classList.add('hidden');

        video.currentTime = 0;
        video.play();
        this.isPlaying = true;
    },

    checkGuess() {
        if (this.isRoundOver) return;

        const input = document.getElementById('guess-input');
        const val = input.value.trim().toLowerCase();
        const correct = this.todayAnime.title.toLowerCase();

        if (!val) return;

        // Lenient check
        if (val === correct || (correct.length > 4 && (correct.includes(val) || val.includes(correct)))) {
            this.handleWin();
        } else {
            this.handleLoss();
        }
        input.value = "";
    },

    handleWin() {
        this.isRoundOver = true;
        const video = document.getElementById('game-video');
        video.style.filter = 'blur(0px)';
        this.maxDurationForLevel = 999;
        video.play(); // Play full video
        this.isPlaying = true; // Let it play

        const feedback = document.getElementById('feedback');
        feedback.textContent = "🎉 ACERTASTE!";
        feedback.className = "success";

        this.showResult(true);
        if (window.CalendarSystem) CalendarSystem.markComplete();
    },

    handleLoss() {
        this.currentLives--;
        this.attempts++;
        this.updateLivesUI();
        document.getElementById('round-display').textContent = `${this.attempts + 1}/5`;

        const feedback = document.getElementById('feedback');
        feedback.textContent = "❌ Incorreto!";
        feedback.className = "error";

        if (this.currentLives <= 0) {
            this.giveUp();
        } else {
            // Check if last attempt to show give up button
            if (this.currentLives === 1) {
                document.getElementById('give-up-btn').style.display = 'block';
            }

            setTimeout(() => {
                this.updateLevelConfig();
                this.showStartOverlay();
                feedback.textContent = "";
            }, 1000);
        }
    },

    giveUp() {
        this.isRoundOver = true;
        const video = document.getElementById('game-video');
        video.style.filter = 'blur(0px)';
        this.maxDurationForLevel = 999;
        video.play();

        const feedback = document.getElementById('feedback');
        feedback.textContent = "🏳️ Game Over.";
        feedback.className = "error";

        this.showResult(false);
    },

    showResult(won) {
        document.getElementById('result-overlay').classList.remove('hidden');
        document.getElementById('result-title').textContent = won ? "VITORIA!" : "DERROTA";
        document.getElementById('result-title').style.color = won ? "var(--secondary-accent)" : "var(--danger)";
        document.getElementById('result-anime').textContent = this.todayAnime.title;

        // Add Switch Mode Button
        const actions = document.getElementById('game-actions');
        const otherMode = this.currentMode === 'OP' ? 'ED' : 'OP';

        actions.innerHTML = `
            <button class="neo-btn secondary" onclick="Game.switchMode('${otherMode}')" style="width:100%; margin-top:10px;">
                Jogar ${otherMode}
            </button>
            <button class="neo-btn" onclick="location.reload()" style="width:100%; margin-top:10px;">
                Reiniciar
            </button>
        `;

        // Disable Inputs
        document.getElementById('guess-input').disabled = true;
        document.getElementById('submit-btn').disabled = true;
        document.getElementById('give-up-btn').style.display = 'none';
    }
};

Game.init();
