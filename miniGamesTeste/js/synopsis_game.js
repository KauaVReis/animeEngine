/**
 * Synopsis Game: Read redacted description -> Guess Anime
 */

const Game = {
    score: 0,
    currentAnime: null,
    hiddenGenres: [],

    async init() {
        this.score = 500; // Start with points to spend? Or start 0 and lose potential points?
        // Let's do: Start at 0. Each correct answer +1000. Hints cost score from potential reward?
        // Simpler: Accumulate Score. Hints cost accumulated score.
        // If score < cost, cannot buy.
        // Actually, improved logic:
        // You get +1000 for completing.
        // Buying hint reduces REWARD. 
        // Current: Start Score 0.
        // Reward for Round: 500.
        // Hint costs 50. Max reward drops to 450.

        this.updateUI();
        await this.nextRound();

        // Input Enter Key
        document.getElementById('guess-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkGuess();
        });
    },

    async nextRound() {
        // Reset UI
        document.getElementById('synopsis-text').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading random synopsis...';
        document.getElementById('genres-area').innerHTML = '';
        document.getElementById('guess-input').value = '';
        document.getElementById('guess-input').disabled = false;
        document.getElementById('feedback').className = 'feedback';
        document.getElementById('feedback').textContent = '';
        document.getElementById('cover-reveal').style.display = 'none';
        document.getElementById('next-btn').style.display = 'none';

        this.currentReward = 500;

        // Fetch
        const seed = Math.floor(Math.random() * 1000);
        const list = await API.getSynopsisAnime(seed % 50 + 1);

        if (!list || list.length === 0) return this.nextRound();

        // Pick random one with description
        const candidates = list.filter(a => a.description && a.description.length > 50);
        if (candidates.length === 0) return this.nextRound();

        this.currentAnime = candidates[Math.floor(Math.random() * candidates.length)];

        console.log("Answer:", this.currentAnime.title.romaji);

        this.renderSynopsis();
        this.renderGenres();
    },

    renderSynopsis() {
        let text = this.currentAnime.description;

        // Redact Logic
        const titles = [
            this.currentAnime.title.romaji,
            this.currentAnime.title.english,
            this.currentAnime.title.native
        ].filter(t => t);

        // Prepare simple sanitizer
        // 1. Split titles into words if they are long? No, redact full phrases usually better or main keywords.
        // Let's regex replace the exact titles first (case insensitive).

        titles.forEach(t => {
            if (!t) return;
            // Escape regex
            const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'gi');
            text = text.replace(regex, '<span class="redacted">████</span>');
        });

        // Also redact common keywords that give it away if strictly needed?
        // Names of characters are NOT in the API response for 'media' usually.
        // So we only redact the Title.

        document.getElementById('synopsis-text').innerHTML = text;
    },

    renderGenres() {
        const area = document.getElementById('genres-area');
        this.hiddenGenres = this.currentAnime.genres;

        this.hiddenGenres.forEach((g, i) => {
            const tag = document.createElement('span');
            tag.className = 'genre-tag';
            tag.id = `genre-${i}`;
            tag.textContent = g;
            area.appendChild(tag);
        });
    },

    buyHint() {
        if (this.score < 50) {
            alert("Sem pontos suficientes (50) para dica!");
            return;
        }

        // Find unrevealed
        const tags = document.querySelectorAll('.genre-tag:not(.revealed)');
        if (tags.length === 0) {
            alert("Sem mais gêneros!");
            return;
        }

        // Reveal One
        const randomTag = tags[Math.floor(Math.random() * tags.length)];
        randomTag.classList.add('revealed');

        // Cost
        this.score -= 50;
        this.updateUI();
    },

    checkGuess() {
        const input = document.getElementById('guess-input');
        const guess = input.value.trim().toLowerCase();
        if (!guess) return;

        const titles = [
            this.currentAnime.title.romaji,
            this.currentAnime.title.english,
            this.currentAnime.title.native
        ].filter(t => t).map(t => t.toLowerCase());

        const isCorrect = titles.some(t => t === guess || (t.length > 4 && guess.includes(t)));

        const feedback = document.getElementById('feedback');

        if (isCorrect) {
            // Win
            this.score += this.currentReward; // Add reward
            feedback.textContent = `🎉 Correto! Ganhaste ${this.currentReward} pts.`;
            feedback.className = 'feedback success';
            this.endRound(true);
        } else {
            // Wrong
            feedback.textContent = `❌ Errado!`;
            feedback.className = 'feedback error';
        }
        this.updateUI();
    },

    endRound(won) {
        document.getElementById('guess-input').disabled = true;
        document.getElementById('next-btn').style.display = 'block';

        const cover = document.getElementById('cover-reveal');
        cover.src = this.currentAnime.coverImage.large;
        cover.style.display = 'block';

        // Reveal all genres
        document.querySelectorAll('.genre-tag').forEach(t => t.classList.add('revealed'));
    },

    updateUI() {
        document.getElementById('score').textContent = this.score;
    }
};

Game.init();
