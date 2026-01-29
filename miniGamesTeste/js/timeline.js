/**
 * Timeline Infinito Logic
 * - Start with 1 card.
 * - Player clicks slots (+) to insert new card.
 * - Infinite progression until 3 lives lost.
 */

const Game = {
    // State
    pool: [],
    placedCards: [],
    currentCard: null,
    lives: 3,
    score: 0,
    isGameOver: false,

    async init() {
        this.renderHUD();
        document.getElementById('timeline-container').innerHTML = '<div style="margin:auto">A carregar anime...</div>';

        // Fetch a large pool of anime (Popular ones have better dates)
        try {
            // Fetch ~50 random popular anime
            const seed = Math.floor(Math.random() * 1000);
            // We use API.searchAnime but we actually need a generic "get popular" wrapper or use specific IDs?
            // Let's mistakenly assume getTimelineAnime exists or use a robust search.
            // Using API.getTimelineAnime as established in previous logic, but bumping count
            const list = await API.getTimelineAnime(seed);

            // Filter valid dates
            this.pool = list.filter(a => a.startDate && a.startDate.year).sort(() => 0.5 - Math.random());

            if (this.pool.length < 10) {
                // Fallback attempt if pool is small
                alert("Erro ao carregar pool. A tentar recarregar...");
                location.reload();
                return;
            }

            // Setup proper Dates (Year * 10000 + Month * 100 + Day) for simple integer comparison
            this.pool.forEach(a => {
                const y = a.startDate.year || 0;
                const m = a.startDate.month || 1;
                const d = a.startDate.day || 1;
                a.dateValue = (y * 10000) + (m * 100) + d;
                a.dateDisplay = `${y}`; // Just Year for display simplicity, or Month/Year
            });

            this.startGame();

        } catch (e) {
            console.error(e);
            document.getElementById('timeline-container').innerHTML = 'Erro na API. Atualiza a página.';
        }
    },

    startGame() {
        // Place first card
        this.placedCards = [this.pool.pop()];
        this.score = 0;
        this.lives = 3;
        this.isGameOver = false;

        this.nextTurn();
    },

    nextTurn() {
        if (this.pool.length === 0) {
            this.endGame(true); // Win by exhaustion (rare)
            return;
        }

        this.currentCard = this.pool.pop();
        this.render();
    },

    render() {
        this.renderHUD();
        if (this.isGameOver) return;

        // 1. Render Current Card (Stage)
        const stage = document.getElementById('current-card');
        stage.innerHTML = `
            <img src="${this.currentCard.coverImage.large}">
            <div class="t-info">
                <span class="card-title" style="display:block; font-weight:bold;">${this.currentCard.title.romaji}</span>
                <span class="t-date">????</span>
            </div>
        `;

        // 2. Render Timeline with Gaps
        const timeline = document.getElementById('timeline-container');
        timeline.innerHTML = '';

        // Add Start Gap (Index 0)
        this.createGap(timeline, 0);

        this.placedCards.forEach((card, index) => {
            // Card
            const cardEl = document.createElement('div');
            cardEl.className = 't-card';
            cardEl.innerHTML = `
                <img src="${card.coverImage.large}">
                <div class="t-info">
                    <span class="card-title" style="font-size:0.9rem; display:block; height:40px; overflow:hidden;">${card.title.romaji}</span>
                    <span class="t-date">${card.startDate.year}</span>
                </div>
            `;
            timeline.appendChild(cardEl);

            // Add Gap after card (Index index + 1)
            this.createGap(timeline, index + 1);
        });
    },

    createGap(container, index) {
        const btn = document.createElement('button');
        btn.className = 'gap-btn';
        btn.innerHTML = '<i class="fas fa-plus"></i>';
        btn.onclick = () => this.checkInsertion(index);
        container.appendChild(btn);
    },

    checkInsertion(index) {
        if (this.isGameOver) return;

        // Logic:
        // index 0 -> Before placedCards[0]
        // index N -> After placedCards[N-1]
        // index i -> Between placedCards[i-1] and placedCards[i]

        const prevCard = index > 0 ? this.placedCards[index - 1] : null;
        const nextCard = index < this.placedCards.length ? this.placedCards[index] : null;

        const targetDate = this.currentCard.dateValue;

        // Strict Check: prev <= target <= next
        // Note: We use loose comparison for equal years to be nice (allow both sides)
        let correct = true;

        if (prevCard && prevCard.dateValue > targetDate) correct = false;
        if (nextCard && nextCard.dateValue < targetDate) correct = false;

        if (correct) {
            this.handleSuccess(index);
        } else {
            this.handleFailure();
        }
    },

    handleSuccess(index) {
        // Feedback
        document.getElementById('feedback').innerHTML = '<span style="color:var(--success)">✅ Correto!</span>';

        // Insert
        this.placedCards.splice(index, 0, this.currentCard);
        this.score++;

        // Animate
        this.render();

        // Visual flair?
        setTimeout(() => {
            document.getElementById('feedback').innerHTML = '';
            this.nextTurn();
        }, 800);
    },

    handleFailure() {
        this.lives--;
        this.renderHUD();

        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `<span style="color:var(--danger)">❌ Errado! Era em ${this.currentCard.startDate.year}</span>`;

        // Shake animation on stage
        const stage = document.getElementById('current-card');
        stage.classList.add('shake');
        setTimeout(() => stage.classList.remove('shake'), 500);

        if (this.lives <= 0) {
            this.endGame(false);
        } else {
            // Discard current card and fetch new one? 
            // Yes, standard rules usually discard failed cards to not mess up the timeline if user has no clue.
            setTimeout(() => {
                feedback.innerHTML = '';
                this.nextTurn();
            }, 1500);
        }
    },

    renderHUD() {
        // Lives
        let hearts = '';
        for (let i = 0; i < 3; i++) hearts += i < this.lives ? '❤️' : '🖤';
        document.getElementById('lives-display').innerHTML = hearts;

        // Score
        document.getElementById('score-display').textContent = this.score;
    },

    endGame(win) {
        this.isGameOver = true;
        document.getElementById('stage-area').style.display = 'none';
        document.getElementById('feedback').innerHTML = '';

        const modal = document.getElementById('game-over-modal');
        modal.style.display = 'block';
        document.getElementById('final-score').textContent = this.score;
    }
};

Game.init();
