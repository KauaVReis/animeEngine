/**
 * CharacterDle Logic v3 (OnePieceDle Style)
 * - Guess Name -> Fetch Details -> Compare Attributes -> Color Feedback
 */
const Game = {
    target: null,
    attempts: 0,
    maxAttempts: 8,

    async init() {
        const feedback = document.getElementById('feedback');
        if (feedback) feedback.textContent = "Carregando personagem do dia...";

        try {
            const seed = API.getDailySeed();
            console.log('Daily Seed:', seed);

            const chars = await API.getDailyCharacters(seed);
            if (!chars || chars.length === 0) throw new Error("No data");

            // Pick specific character
            this.target = chars[seed % chars.length];
            console.log('Target:', this.target.name.full);

            // Setup Image (Blurred)
            const img = document.getElementById('char-image');
            if (img) {
                img.src = this.target.image.large;
                img.style.filter = "blur(20px)"; // Start heavily blurred
            }

            if (feedback) feedback.textContent = "";

            document.getElementById('guess-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.checkGuess();
            });

        } catch (e) {
            console.error(e);
            if (feedback) feedback.textContent = "Erro na API.";
        }
    },

    async checkGuess() {
        const input = document.getElementById('guess-input');
        const name = input.value.trim();
        if (!name) return;

        input.disabled = true;
        document.getElementById('submit-btn').disabled = true;

        try {
            const guessedChar = await API.searchCharacter(name);

            if (!guessedChar) {
                alert("Personagem não encontrado. Tente outro nome.");
                input.disabled = false;
                document.getElementById('submit-btn').disabled = false;
                return;
            }

            this.processAttempt(guessedChar);

        } catch (e) {
            console.error(e);
        }

        input.value = '';
        if (this.attempts < this.maxAttempts) {
            input.disabled = false;
            document.getElementById('submit-btn').disabled = false;
            input.focus();
        }
    },

    processAttempt(guess) {
        this.attempts++;
        const isCorrect = (guess.id === this.target.id);

        this.addComparisonRow(guess);

        // Hints Logic
        const hintsContainer = document.getElementById('hints-container');
        const targetEdge = this.target.media.edges[0];

        // Show Voice Actor at 3 attempts
        if (this.attempts === 3 && !isCorrect) {
            const va = targetEdge?.voiceActors?.[0]?.name?.full || 'N/A';
            const hint = document.createElement('div');
            hint.className = 'hint-box';
            hint.innerHTML = `🗣️ <strong>Dica (Voz):</strong> A voz japonesa é <em>${va}</em>`;
            hintsContainer.appendChild(hint);
        }

        // Show Studio at 5 attempts
        if (this.attempts === 5 && !isCorrect) {
            const studio = targetEdge?.node?.studios?.nodes?.[0]?.name || 'N/A';
            const hint = document.createElement('div');
            hint.className = 'hint-box';
            hint.innerHTML = `🎬 <strong>Dica (Estúdio):</strong> O estúdio principal é <em>${studio}</em>`;
            hintsContainer.appendChild(hint);
        }

        if (isCorrect) {
            this.endGame(true);
            document.getElementById('char-image').style.filter = "blur(0px)"; // Reveal
            document.getElementById('feedback').textContent = `🎉 PARABÉNS! Era ${this.target.name.full}`;
            document.getElementById('feedback').className = 'feedback success';
        } else {
            // Shake Input
            const inputWrapper = document.querySelector('.input-wrapper');
            inputWrapper.classList.add('shake');
            setTimeout(() => inputWrapper.classList.remove('shake'), 500);

            // Reduce blur progressively
            const maxBlur = 20;
            const blurAmount = Math.max(0, maxBlur - ((this.attempts / this.maxAttempts) * maxBlur));
            document.getElementById('char-image').style.filter = `blur(${blurAmount}px)`;

            if (this.attempts >= this.maxAttempts) {
                this.endGame(false);
                document.getElementById('char-image').style.filter = "blur(0px)";
                document.getElementById('feedback').textContent = `❌ Game Over: ${this.target.name.full}`;
                document.getElementById('feedback').className = 'feedback error';
            } else {
                document.getElementById('attempt-count').textContent = this.attempts + 1;
                if (this.attempts + 1 === this.maxAttempts) {
                    document.getElementById('give-up-btn').style.display = 'inline-block';
                }
            }
        }
    },

    giveUp() {
        document.getElementById('char-image').style.filter = "blur(0px)";
        document.getElementById('feedback').textContent = `🏳️ Desististe. Era ${this.target.name.full}`;
        document.getElementById('feedback').className = 'feedback error';
        this.endGame(false);
    },

    addComparisonRow(guess) {
        const container = document.getElementById('comparison-rows');
        const row = document.createElement('div');
        row.className = 'comp-row';

        const guessEdge = guess.media.edges[0];
        const targetEdge = this.target.media.edges[0];

        const guessAnime = guessEdge?.node || { title: { romaji: '?' }, seasonYear: '?' };
        const targetAnime = targetEdge?.node || { title: { romaji: '?' }, seasonYear: '?' };

        const guessRole = guessEdge?.characterRole || '?';
        const targetRole = targetEdge?.characterRole || '?';

        const columns = [
            { val: guess.name.full, match: guess.id === this.target.id },
            { val: guess.gender || '?', match: guess.gender === this.target.gender },
            { val: guessRole, match: guessRole === targetRole }, // Role Column
            { val: guessAnime.title.romaji, match: guessAnime.title.romaji === targetAnime.title.romaji },
            { val: guessAnime.seasonYear || '?', match: guessAnime.seasonYear === targetAnime.seasonYear },
            { val: guess.age || '?', match: guess.age === this.target.age }
        ];

        columns.forEach(col => {
            const cell = document.createElement('div');
            cell.className = `comp-cell ${col.match ? 'correct' : 'incorrect'}`;
            cell.textContent = col.val;
            row.appendChild(cell);
        });

        container.insertBefore(row, container.firstChild);
    },

    endGame(won) {
        const btn = document.getElementById('submit-btn');
        const input = document.getElementById('guess-input');
        btn.disabled = true;
        input.disabled = true;
        document.getElementById('give-up-btn').style.display = 'none';

        if (won) {
            btn.textContent = "VITORIA";
            document.getElementById('share-btn').style.display = 'inline-block'; // Show share button
        } else {
            btn.textContent = "DERROTA";
        }

        // Save to Calendar
        if (window.CalendarSystem && won) {
            CalendarSystem.markComplete();
        }

        // Previous Day Button
        // Previous Day Button
        const actions = document.getElementById('game-actions');
        const urlParams = new URLSearchParams(window.location.search);
        let currentStr = urlParams.get('date');
        let d = currentStr ? new Date(currentStr) : new Date();
        d.setDate(d.getDate() - 1);
        const prevDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // Check if button already exists to avoid duplicates
        if (!document.getElementById('prev-day-btn')) {
            const prevBtn = document.createElement('button');
            prevBtn.id = 'prev-day-btn';
            prevBtn.innerHTML = `<i class="fas fa-history"></i> Jogar Dia Anterior (${prevDateStr})`;
            prevBtn.className = 'btn-secondary'; // Assuming this class exists or similar style
            prevBtn.style.marginTop = '10px';
            prevBtn.style.display = 'block';
            prevBtn.style.width = '100%';
            prevBtn.style.background = '#4b5563'; // Specific grey for distinction
            prevBtn.onclick = () => window.location.href = `?date=${prevDateStr}`;

            actions.appendChild(prevBtn);
        }
    },

    shareResult() {
        // Generate Emoji Grid
        // 🟩 = Correct, 🟥 = Incorrect
        // We need to store guesses or reconstruct history.
        // Simplified: Just Share Attempts count
        const won = document.getElementById('submit-btn').textContent === "VITORIA";
        const count = won ? this.attempts : 'X';
        const text = `👤 CharacterDle ${count}/8\n\nJoguei no AnimeEngine Arcade!`;

        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('share-btn');
            const original = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-check"></i> Copiado!`;
            setTimeout(() => btn.innerHTML = original, 2000);
        });
    }
};

Game.init();
