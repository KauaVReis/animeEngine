/**
 * Higher or Lower: Anime Edition
 * Logic: Fetch popular anime, compare popularity count.
 */

const Game = {
    score: 0,
    highScore: localStorage.getItem('higher_lower_highscore') || 0,
    currLeft: null,
    currRight: null,
    nextPage: 1,
    cache: [],

    async init() {
        document.getElementById('high-score').textContent = this.highScore;
        this.score = 0;
        this.updateScore();

        // Initial Fetch
        await this.loadMore();

        // Set Initial Left/Right
        this.currLeft = this.cache.shift();
        this.currRight = this.cache.shift();

        this.render();
    },

    async loadMore() {
        // Randomize page start a bit to vary content
        if (this.nextPage === 1) this.nextPage = Math.floor(Math.random() * 5) + 1;

        const list = await API.getHigherLowerAnime(this.nextPage);
        if (list && list.length > 0) {
            // Shuffle list
            list.sort(() => Math.random() - 0.5);
            this.cache.push(...list);
            this.nextPage++;
        }
    },

    render() {
        // Preload next image if possible
        if (this.cache.length < 2) this.loadMore();

        // Left Side
        const l = this.currLeft;
        const leftEl = document.getElementById('side-left');
        leftEl.style.backgroundImage = `url('${l.coverImage.extraLarge}')`;
        document.getElementById('left-title').textContent = l.title.romaji;
        document.getElementById('left-pop').textContent = l.popularity.toLocaleString();

        // Right Side
        const r = this.currRight;
        const rightEl = document.getElementById('side-right');
        rightEl.style.backgroundImage = `url('${r.coverImage.extraLarge}')`;
        document.getElementById('right-title').textContent = r.title.romaji;

        // Reset Right UI
        document.getElementById('buttons-area').style.display = 'block';
        document.getElementById('result-area').style.display = 'none';

        // Reset Animations
        leftEl.classList.remove('slide-out');
    },

    async guess(choice) {
        // Lock input
        document.getElementById('buttons-area').style.display = 'none';
        document.getElementById('result-area').style.display = 'block';

        // Show number
        const rightPop = this.currRight.popularity;
        const countEl = document.getElementById('right-pop');
        this.animateValue(countEl, 0, rightPop, 1000);

        // Determine Win/Loss
        const leftPop = this.currLeft.popularity;
        const isHigher = rightPop >= leftPop;

        let correct = false;
        if (choice === 'higher' && isHigher) correct = true;
        else if (choice === 'lower' && !isHigher) correct = true;
        // Tie counts as correct for player simplicity? Yes.

        await new Promise(r => setTimeout(r, 1500)); // Wait for animation

        if (correct) {
            // Correct!
            this.score++;
            this.updateScore();
            document.getElementById('right-pop').style.color = 'var(--success)';

            await new Promise(r => setTimeout(r, 1000));

            // Advance
            this.advance();
        } else {
            // Game Over
            document.getElementById('right-pop').style.color = 'var(--error)';
            this.gameOver();
        }
    },

    advance() {
        // Move Right to Left
        this.currLeft = this.currRight;
        this.currRight = this.cache.shift();

        // Animate
        // Complex transition? Simplified: Just re-render.
        this.render();
    },

    gameOver() {
        const overlay = document.getElementById('game-over');
        document.getElementById('final-score').textContent = this.score;
        overlay.style.display = 'flex';

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('higher_lower_highscore', this.highScore);
            document.getElementById('high-score').textContent = this.highScore;
        }
    },

    updateScore() {
        document.getElementById('current-score').textContent = this.score;
    },

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
};

Game.init();
