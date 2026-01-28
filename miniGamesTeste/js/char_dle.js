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

            // Setup Image (Hidden)
            const img = document.getElementById('char-image');
            if (img) {
                img.src = this.target.image.large;
                img.style.filter = "brightness(0%)";
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

        if (isCorrect) {
            this.endGame(true);
            document.getElementById('char-image').style.filter = "brightness(100%)";
            document.getElementById('feedback').textContent = `🎉 PARABÉNS! Era ${this.target.name.full}`;
            document.getElementById('feedback').className = 'feedback success';
        } else {
            // Brighten image slightly
            const brightness = (this.attempts / this.maxAttempts) * 100;
            document.getElementById('char-image').style.filter = `brightness(${brightness}%)`;

            if (this.attempts >= this.maxAttempts) {
                this.endGame(false);
                document.getElementById('char-image').style.filter = "brightness(100%)";
                document.getElementById('feedback').textContent = `❌ Game Over: ${this.target.name.full}`;
                document.getElementById('feedback').className = 'feedback error';
            } else {
                // Update counter for NEXT turn
                document.getElementById('attempt-count').textContent = this.attempts + 1;

                // Check if next turn is LAST turn
                if (this.attempts + 1 === this.maxAttempts) {
                    document.getElementById('give-up-btn').style.display = 'inline-block';
                }
            }
        }
    },

    giveUp() {
        document.getElementById('char-image').style.filter = "brightness(100%)";
        document.getElementById('feedback').textContent = `🏳️ Desististe. Era ${this.target.name.full}`;
        document.getElementById('feedback').className = 'feedback error';
        this.endGame(false);
    },

    addComparisonRow(guess) {
        const container = document.getElementById('comparison-rows');
        const row = document.createElement('div');
        row.className = 'comp-row';

        const guessAnime = guess.media.nodes[0] || { title: { romaji: '?' }, seasonYear: '?' };
        const targetAnime = this.target.media.nodes[0] || { title: { romaji: '?' }, seasonYear: '?' };

        const columns = [
            { val: guess.name.full, match: guess.id === this.target.id },
            { val: guess.gender || '?', match: guess.gender === this.target.gender },
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
        if (won) btn.textContent = "VITORIA";
        else btn.textContent = "DERROTA";

        // Save to Calendar
        if (window.CalendarSystem && won) {
            CalendarSystem.markComplete();
        }

        // Add "Play Previous Day" Button
        const feedback = document.getElementById('feedback');

        // Calculate Previous Day
        const urlParams = new URLSearchParams(window.location.search);
        let currentStr = urlParams.get('date');
        let d = currentStr ? new Date(currentStr) : new Date();
        d.setDate(d.getDate() - 1);
        const prevDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = `<i class="fas fa-history"></i> Jogar Dia Anterior (${prevDateStr})`;
        prevBtn.className = 'btn-secondary'; // Revert to btn-secondary for style consistency with original layout
        prevBtn.style.marginTop = '10px';
        prevBtn.style.display = 'block';
        prevBtn.style.width = '100%';
        prevBtn.onclick = () => window.location.href = `?date=${prevDateStr}`;

        feedback.appendChild(prevBtn);
    }
};

Game.init();
