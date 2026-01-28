/**
 * Music Quiz Logic
 * Uses Daily Seed to ensure same challenge for everyone on the same day.
 * Implements Blob URL to mask video source (with fallback for CORS).
 */

const Game = {
    attempts: 0,
    maxAttempts: 5,
    todayAnime: null,
    isPlaying: false,
    blurLevel: 30,
    currentMode: 'OP', // 'OP' or 'ED'

    async init() {
        // Init UI based on Mode
        this.updateModeUI();

        // 1. Get Daily Seed
        // We use a modifier for the seed based on mode to ensure different visual/anime for OP vs ED
        const baseSeed = API.getDailySeed();
        const modeModifier = this.currentMode === 'OP' ? 0 : 9999;
        const seed = baseSeed + modeModifier;

        console.log(`Daily Seed (${this.currentMode}):`, seed);

        // Update Calendar Context
        if (window.CalendarSystem) {
            CalendarSystem.init(`music_quiz_${this.currentMode.toLowerCase()}`);
        }

        this.resetGameUI();

        // 2. Mock Pool (Expanded)
        const pool = [
            { type: 'OP', title: 'Naruto', file: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgJQPUpI.jpg' },
            { type: 'OP', title: 'One Piece', file: 'https://www.w3schools.com/html/mov_bbb.mp4', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg' },
            { type: 'ED', title: 'Bleach', file: 'https://media.w3.org/2010/05/sintel/trailer.mp4', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-K507sfd90bZ2.png' },
            { type: 'ED', title: 'Jujutsu Kaisen', file: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEfseh.jpg' },
            { type: 'OP', title: 'Demon Slayer', file: 'https://www.w3schools.com/html/mov_bbb.mp4', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTc93blC.jpg' }
        ];

        // 3. Filter by Mode
        const filteredPool = pool.filter(item => item.type === this.currentMode);

        if (filteredPool.length === 0) {
            console.error("No songs for this mode");
            return;
        }

        const index = seed % filteredPool.length;
        this.todayAnime = filteredPool[index];

        console.log("Target:", this.todayAnime.title);

        // 4. Secure Loading
        await this.setupSecurePlayer(this.todayAnime.file);

        // Setup Cover
        const cover = document.getElementById('quiz-cover');
        cover.src = this.todayAnime.cover;
        cover.style.display = 'none';

        document.getElementById('loading-spinner').style.display = 'none';

        // Setup Video CSS
        const player = document.getElementById('quiz-player');
        player.style.filter = `blur(${this.blurLevel}px)`;
        player.style.opacity = '1';

        // Input Listener
        if (!this.inputListenerAttached) {
            document.getElementById('guess-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.checkGuess();
            });
            this.inputListenerAttached = true;
        }
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
            btnOp.style.background = 'var(--primary)'; btnOp.style.opacity = '1';
            btnEd.style.background = 'var(--surface)'; btnEd.style.opacity = '0.6';
        } else {
            console.log('Switching UI to ED');
            btnOp.style.background = 'var(--surface)'; btnOp.style.opacity = '0.6';
            btnEd.style.background = 'var(--primary)'; btnEd.style.opacity = '1';
        }
    },

    resetGameUI() {
        this.attempts = 0;
        this.blurLevel = 30;
        this.isPlaying = false;

        document.getElementById('attempt-count').textContent = '1';
        document.getElementById('status-text').textContent = "Sorteando Anime...";
        document.getElementById('status-text').style.display = 'block';
        document.getElementById('loading-spinner').style.display = 'block';

        document.getElementById('guess-input').disabled = false;
        document.getElementById('guess-input').value = '';
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('give-up-btn').style.display = 'none';

        document.getElementById('quiz-player').src = '';
        document.getElementById('quiz-player').style.display = 'block';

        this.updateVisuals(false);
        const feedback = document.getElementById('feedback');
        feedback.textContent = '';
        feedback.className = 'feedback';

        const cover = document.getElementById('quiz-cover');
        cover.style.display = 'none';
    },

    async setupSecurePlayer(url) {
        const player = document.getElementById('quiz-player');
        const status = document.getElementById('status-text');

        status.textContent = "Baixando...";

        try {
            const req = await fetch(url);
            if (!req.ok) throw new Error("Fetch failed");

            const blob = await req.blob();
            const blobUrl = URL.createObjectURL(blob);

            player.src = blobUrl;
            status.textContent = ""; // Clear text when ready
            this.enableControls();

        } catch (e) {
            console.warn("CORS/Fetch error, falling back to direct URL", e);
            player.src = url;
            status.textContent = "";
            this.enableControls();
        }

        player.onended = () => {
            this.isPlaying = false;
            document.getElementById('play-btn').textContent = "▶️ Tocar Excerto";
            this.updateVisuals(false);
        };

        player.onplay = () => {
            this.isPlaying = true;
            document.getElementById('play-btn').textContent = "⏸️ Pausar";
            this.updateVisuals(true);
        };

        player.onpause = () => {
            this.isPlaying = false;
            document.getElementById('play-btn').textContent = "▶️ Tocar Excerto";
            this.updateVisuals(false);
        };

        player.volume = 0.5;
    },

    enableControls() {
        document.getElementById('play-btn').disabled = false;
        document.getElementById('play-btn').onclick = () => this.togglePlay();
    },

    async togglePlay() {
        const player = document.getElementById('quiz-player');
        try {
            if (player.paused) await player.play();
            else player.pause();
        } catch (err) { console.error("Playback error:", err); }
    },

    updateVisuals(playing) {
        const vinyl = document.getElementById('vinyl');
        const eq = document.getElementById('equalizer');

        if (playing) {
            vinyl.classList.add('spinning');
            eq.style.display = 'flex';
        } else {
            vinyl.classList.remove('spinning');
            eq.style.display = 'none';
        }
    },

    checkGuess() {
        if (this.attempts >= this.maxAttempts) return;

        const input = document.getElementById('guess-input');
        const guess = input.value.trim().toLowerCase();

        if (!guess) return;

        const correct = this.todayAnime.title.toLowerCase();
        const feedback = document.getElementById('feedback');
        const player = document.getElementById('quiz-player');

        this.attempts++;
        document.getElementById('attempt-count').textContent = this.attempts;

        // Show "Give Up" button if this is the last attempt (Current attempts = max - 1 before increment, now attempts count is updated)
        // If attempts became maxAttempts, user just used their last attempt? No.
        // User starts at 0. Tries 1. Count shows 1/5.
        // Tries 4. Count shows 4/5. Next try is 5 (The last one).
        // UI Request: "Quando for Tentativa 5/5 aparece desistir".
        // This means when we UPDATE the counter to 5.
        // Or if we failed the 4th attempt and are now staring at "5/5".

        // Logic: If attempts == maxAttempts - 1 (So we are at 4, next is 5). Wait, UI Update logic:
        // Here attempts is incremented. If attempts == 5 (We just made the 5th guess), it's game over if wrong.
        // So the button should appear BEFORE the 5th guess is made?
        // "Quando for Tentativa 5/5". The counter updates when?
        // Ah, typically: attempts starts 0. Display "1/5".
        // Guess 1 wrong -> attempts=1. Display "2/5".
        // Guess 4 wrong -> attempts=4. Display "5/5". -> show button NOW.

        if (this.attempts === this.maxAttempts - 1) {
            // We just finished attempt 4 (so index 3, but count is 4).
            // Next one is 5.
            // Wait, my attempts var is actually "number of guesses made".
            // So if attempts == 4, we have made 4 guesses. The user is about to make the 5th.
            // UI shows attempt-count = attempts + 1 usually? 
            // In my code: document.getElementById('attempt-count').textContent = this.attempts;
            // No, my code sets textContent = this.attempts which means "Guesses Made".
            // But usually UI says "Attempt X of 5". If 0 made, it says "1".
            // Let's fix the initial HTML to say "1" (static).
            // Code: this.attempts++; textContent = this.attempts + 1; ?
            // Current code: `this.attempts++; ... textContent = this.attempts;`
            // So if I guess once, it says "1/5". Correct.
            // If I guess 4 times, it says "4/5".
            // So when I AM AT 4 tries, I am ABOUT to do the 5th.
            // The user wants "When it is Attempt 5 do X".
            // So if attempts == 4 (meaning 4 faild), display is 4/5? No wait.
            // If I failed 4 times. Display shows 4/5. 
            // The *next* try is number 5.
            // I should update the display to explicitly show "current attempt number"? 
            // Currently it shows "past attempts count" effectively?
            // If I start, attempts=0. HTML static says "1".
            // Guess 1. attempts becomes 1. Text becomes "1". (Wait, that means "1 attempt used").
            // User likely sees "1/5" meaning "I used 1". The next is 2.
            // So "Tentativa 5/5" means "I have used 5 attempts". That is GAME OVER.

            // Let's assume standard game logic: "Tentativa X" means "Current Try".
            // Start: 1/5.
            // Fail 1: 2/5.
            // Fail 4: 5/5. (This is the last chance).
            // Logic needs fix: `document.getElementById('attempt-count').textContent = this.attempts + 1;`
            // And `this.attempts` handles "used attempts".
        }

        // Let's update checkGuess to update counter for NEXT attempt if wrong.

        if (guess === correct || (correct.length > 5 && guess.includes(correct))) {
            feedback.textContent = `🎉 Correto! O anime era ${this.todayAnime.title}.`;
            feedback.className = 'feedback success';
            this.revealVideo(true);
            this.endGame(true);
        } else {
            // WRONG GUESS
            this.blurLevel = Math.max(0, this.blurLevel - 6);
            player.style.filter = `blur(${this.blurLevel}px)`;

            if (this.attempts >= this.maxAttempts) {
                // Game Over
                feedback.textContent = `❌ Game Over. A resposta era ${this.todayAnime.title}.`;
                feedback.className = 'feedback error';
                this.revealVideo(true);
                this.endGame(false);
            } else {
                // Continue
                feedback.textContent = `❌ Incorreto. O vídeo ficou mais nítido.`;
                feedback.className = 'feedback error';

                // Update counter to show CURRENT attempt number (Next one)
                document.getElementById('attempt-count').textContent = this.attempts + 1;

                // Check if we are now at the last attempt
                if (this.attempts + 1 === this.maxAttempts) {
                    document.getElementById('give-up-btn').style.display = 'inline-block';
                }
            }
        }
        input.value = '';
    },

    giveUp() {
        const feedback = document.getElementById('feedback');
        feedback.textContent = `🏳️ Desististe. A resposta era ${this.todayAnime.title}.`;
        feedback.className = 'feedback error';
        this.revealVideo(true);
        this.endGame(false);
        document.getElementById('give-up-btn').style.display = 'none';
    },

    revealVideo(full) {
        const player = document.getElementById('quiz-player');
        const cover = document.getElementById('quiz-cover');
        const textArea = document.getElementById('status-text');
        const vinyl = document.getElementById('vinyl');
        const eq = document.getElementById('equalizer');

        // Hide Visual Elements
        vinyl.style.display = 'none';
        eq.style.display = 'none';

        player.style.filter = 'blur(0px)';
        player.style.width = '100%';
        player.style.height = 'auto';
        player.style.display = 'block';
        player.opacity = 1;
        player.controls = true;

        cover.style.display = 'block';
        cover.style.marginTop = '15px';
        cover.style.height = 'auto';

        textArea.style.display = 'none';
        document.getElementById('play-btn').style.display = 'none';
    },

    endGame(won) {
        document.getElementById('submit-btn').disabled = true;
        document.getElementById('guess-input').disabled = true;
        document.getElementById('give-up-btn').style.display = 'none';

        // Save Complete Status in Calendar
        if (window.CalendarSystem) {
            CalendarSystem.markComplete();
        }
    }
};

Game.init();
