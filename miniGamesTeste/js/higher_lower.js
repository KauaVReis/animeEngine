/**
 * Higher or Lower: Anime Edition
 * Multiple modes: popularity, score, favorites, episodes
 */

const Game = {
    score: 0,
    highScore: 0,
    currLeft: null,
    currRight: null,
    nextPage: 1,
    cache: [],
    mode: 'popularity', // popularity, score, favorites, episodes

    modes: {
        popularity: { key: 'popularity', label: 'Membros', icon: '📊', format: (v) => v?.toLocaleString() || '?' },
        score: { key: 'meanScore', label: 'Nota', icon: '⭐', format: (v) => v ? v + '/100' : '?' },
        favorites: { key: 'favourites', label: 'Favoritos', icon: '❤️', format: (v) => v?.toLocaleString() || '?' },
        episodes: { key: 'episodes', label: 'Episódios', icon: '📺', format: (v) => v || '?' }
    },

    async init() {
        this.loadHighScores();
        this.updateModeUI();
        this.score = 0;
        this.updateScore();

        await this.loadMore();
        this.currLeft = this.cache.shift();
        this.currRight = this.cache.shift();
        this.render();
    },

    loadHighScores() {
        const saved = localStorage.getItem('hl_highscores');
        this.highScores = saved ? JSON.parse(saved) : {};
        this.highScore = this.highScores[this.mode] || 0;
        document.getElementById('high-score').textContent = this.highScore;
    },

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScores[this.mode] = this.highScore;
            localStorage.setItem('hl_highscores', JSON.stringify(this.highScores));
            document.getElementById('high-score').textContent = this.highScore;
        }
    },

    switchMode(mode) {
        if (this.mode === mode) return;
        this.mode = mode;
        this.updateModeUI();
        this.loadHighScores();
        this.cache = [];
        this.nextPage = 1;
        this.score = 0;
        this.updateScore();
        document.getElementById('game-over').style.display = 'none';
        this.init();
    },

    updateModeUI() {
        const m = this.modes[this.mode];
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.mode);
        });
        document.querySelectorAll('.label').forEach(el => el.textContent = m.label);
        document.getElementById('game-info-text').textContent =
            `Adivinha se o próximo anime tem MAIS ou MENOS ${m.label.toLowerCase()}. Quantos consegues acertar?`;
    },

    async loadMore() {
        if (this.nextPage === 1) this.nextPage = Math.floor(Math.random() * 5) + 1;
        const list = await API.getHigherLowerAnime(this.nextPage);
        if (list && list.length > 0) {
            // Filter valid data for current mode
            const key = this.modes[this.mode].key;
            const valid = list.filter(a => a[key] != null);
            valid.sort(() => Math.random() - 0.5);
            this.cache.push(...valid);
            this.nextPage++;
        }
    },

    render() {
        if (this.cache.length < 2) this.loadMore();
        const m = this.modes[this.mode];

        // Left Side
        const l = this.currLeft;
        document.getElementById('side-left').style.backgroundImage = `url('${l.coverImage.extraLarge}')`;
        document.getElementById('left-title').textContent = l.title.romaji;
        document.getElementById('left-pop').textContent = m.format(l[m.key]);

        // Right Side
        const r = this.currRight;
        document.getElementById('side-right').style.backgroundImage = `url('${r.coverImage.extraLarge}')`;
        document.getElementById('right-title').textContent = r.title.romaji;

        // Reset Right UI
        document.getElementById('buttons-area').style.display = 'block';
        document.getElementById('result-area').style.display = 'none';
        document.getElementById('right-pop').style.color = 'var(--secondary)';
    },

    async guess(choice) {
        document.getElementById('buttons-area').style.display = 'none';
        document.getElementById('result-area').style.display = 'block';

        const m = this.modes[this.mode];
        const rightVal = this.currRight[m.key] || 0;
        const leftVal = this.currLeft[m.key] || 0;

        const countEl = document.getElementById('right-pop');
        this.animateValue(countEl, 0, rightVal, 800, m.format);

        const isHigher = rightVal >= leftVal;
        let correct = (choice === 'higher' && isHigher) || (choice === 'lower' && !isHigher);

        await new Promise(r => setTimeout(r, 1200));

        if (correct) {
            this.score++;
            this.updateScore();
            countEl.style.color = 'var(--success)';
            await new Promise(r => setTimeout(r, 800));
            this.advance();
        } else {
            countEl.style.color = 'var(--error)';
            this.gameOver();
        }
    },

    advance() {
        this.currLeft = this.currRight;
        this.currRight = this.cache.shift();
        this.render();
    },

    gameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').style.display = 'flex';
        this.saveHighScore();
    },

    updateScore() {
        document.getElementById('current-score').textContent = this.score;
    },

    animateValue(obj, start, end, duration, formatter) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const val = Math.floor(progress * (end - start) + start);
            obj.innerHTML = formatter ? formatter(val) : val.toLocaleString();
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }
};

Game.init();
