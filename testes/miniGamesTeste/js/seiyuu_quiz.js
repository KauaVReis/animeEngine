/**
 * Seiyuu Quiz: Find the Impostor
 * Logic: Get Voice Actor -> Get their roles -> Add 1 random role -> User picks wrong one.
 */

const Game = {
    lives: 3,
    score: 0,
    currentSeiyuu: null,

    async init() {
        this.lives = 3;
        this.score = 0;
        this.updateLives();
        await this.nextRound();
    },

    async nextRound() {
        // Clear Grid
        document.getElementById('char-grid').innerHTML = '<div style="text-align:center;width:100%;">Loading...</div>';

        try {
            // 1. Get Seiyuu & Their Characters
            // API handles random seed internal to wrapper for now or we can pass one.
            // Let's rely on wrapper random logic.
            const staff = await API.getStaffDetails();
            if (!staff || !staff.characters || staff.characters.nodes.length < 3) {
                console.warn("Staff has too few roles, retrying...");
                return this.nextRound();
            }

            this.currentSeiyuu = staff;

            // 2. Setup Header
            document.getElementById('seiyuu-name').textContent = staff.name.full;
            document.getElementById('seiyuu-img').src = staff.image.large;

            // 3. Select 3 Correct Characters
            const correctChars = staff.characters.nodes
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            // 4. Get 1 Impostor (Random Character from API)
            // Just use searchCharacter with a common letter to find someone random
            const letters = "abcdefghijklmnopqrstuvwxyz";
            const randomChar = letters[Math.floor(Math.random() * letters.length)];
            const impostor = await API.searchCharacter(randomChar);

            // Ensure impostor is distinct (unlikely collision but good practice)
            if (correctChars.some(c => c.id === impostor.id)) {
                return this.nextRound(); // Retry
            }

            // 5. Mix & Render
            const options = [...correctChars, { ...impostor, isImpostor: true }];
            options.sort(() => 0.5 - Math.random());

            this.renderGrid(options);

        } catch (e) {
            console.error(e);
            setTimeout(() => this.nextRound(), 1000);
        }
    },

    renderGrid(options) {
        const grid = document.getElementById('char-grid');
        grid.innerHTML = '';

        options.forEach(char => {
            const card = document.createElement('div');
            card.className = 'char-card';

            const animeTitle = char.media && char.media.nodes[0] ? char.media.nodes[0].title.romaji : 'Unknown Anime';

            card.innerHTML = `
                <img src="${char.image.large}" alt="${char.name.full}">
                <div class="char-info">
                    <span class="char-name">${char.name.full}</span>
                    <span class="anime-name">${animeTitle}</span>
                </div>
                <div class="feedback-overlay">
                    <i class="fas ${char.isImpostor ? 'fa-check' : 'fa-times'}"></i>
                </div>
            `;

            card.onclick = () => this.handleGuess(char, card, options);
            grid.appendChild(card);
        });
    },

    handleGuess(char, card, allOptions) {
        if (card.classList.contains('clicked')) return;

        // Mark all as clicked to prevent multi-guesses
        document.querySelectorAll('.char-card').forEach(c => c.classList.add('clicked'));

        if (char.isImpostor) {
            // Correct!
            card.classList.add('correct');
            this.score++;
            setTimeout(() => this.nextRound(), 1500);
        } else {
            // Wrong!
            card.classList.add('wrong');
            this.lives--;
            this.updateLives();

            // Reveal the actual impostor
            const cards = document.querySelectorAll('.char-card');
            // Logic to find which DOM element corresponds to impostor?
            // Re-looping logic or index matching.
            // The card order matches options order (handled by forEach).
            // But we don't have index here.

            // Simple: Loop DOM and check inner text or maintain ref.
            // Better: We know logic.

            if (this.lives <= 0) {
                setTimeout(() => this.gameOver(), 1500);
            } else {
                setTimeout(() => this.nextRound(), 1500);
            }
        }
    },

    updateLives() {
        const container = document.getElementById('lives-container');
        container.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('i');
            heart.className = i < this.lives ? 'fas fa-heart' : 'far fa-heart';
            if (i >= this.lives) heart.style.color = '#555';
            container.appendChild(heart);
        }
    },

    gameOver() {
        document.getElementById('char-grid').style.display = 'none';
        document.getElementById('game-actions').style.display = 'block';
        document.getElementById('result-text').innerHTML = `Game Over!<br>Score: ${this.score}`;
    }
};

Game.init();
