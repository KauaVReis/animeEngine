/**
 * Timeline Challenge: Drag cards to order anime by release date.
 */

const Game = {
    animes: [],
    correctOrder: [],

    async init() {
        await this.nextRound();
    },

    async nextRound() {
        document.getElementById('timeline').innerHTML = '<div style="color:white">Loading...</div>';
        document.getElementById('next-btn').style.display = 'none';

        // Fetch
        const seed = Math.floor(Math.random() * 50) + 1;
        const list = await API.getTimelineAnime(seed);

        // Filter with valid dates
        const valid = list.filter(a => a.startDate && a.startDate.year);
        if (valid.length < 5) return this.nextRound();

        // Pick 5 random
        valid.sort(() => 0.5 - Math.random());
        this.animes = valid.slice(0, 5);

        // Store correct order
        this.correctOrder = [...this.animes].sort((a, b) => {
            const dateA = a.startDate.year * 100 + (a.startDate.month || 0);
            const dateB = b.startDate.year * 100 + (b.startDate.month || 0);
            return dateA - dateB;
        });

        // Shuffle for display
        this.animes.sort(() => 0.5 - Math.random());

        this.render();
    },

    render() {
        const container = document.getElementById('timeline');
        container.innerHTML = '';

        this.animes.forEach((anime, i) => {
            const card = document.createElement('div');
            card.className = 'anime-card';
            card.draggable = true;
            card.dataset.id = anime.id;
            card.dataset.index = i;

            const dateStr = anime.startDate.year + (anime.startDate.month ? `/${anime.startDate.month}` : '');

            card.innerHTML = `
                <img class="card-img" src="${anime.coverImage.large}" alt="${anime.title.romaji}">
                <div class="card-info">
                    <span class="card-title">${anime.title.romaji}</span>
                    <span class="card-date">${dateStr}</span>
                </div>
            `;

            // Drag Events
            card.addEventListener('dragstart', (e) => this.onDragStart(e, card));
            card.addEventListener('dragend', () => this.onDragEnd(card));
            card.addEventListener('dragover', (e) => this.onDragOver(e));
            card.addEventListener('drop', (e) => this.onDrop(e, card));

            container.appendChild(card);
        });
    },

    onDragStart(e, card) {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.index);
    },

    onDragEnd(card) {
        card.classList.remove('dragging');
    },

    onDragOver(e) {
        e.preventDefault();
    },

    onDrop(e, targetCard) {
        e.preventDefault();
        const draggedIndex = e.dataTransfer.getData('text/plain');
        const targetIndex = targetCard.dataset.index;

        if (draggedIndex === targetIndex) return;

        // Swap in array
        const temp = this.animes[draggedIndex];
        this.animes[draggedIndex] = this.animes[targetIndex];
        this.animes[targetIndex] = temp;

        this.render();
    },

    checkOrder() {
        const cards = document.querySelectorAll('.anime-card');
        let allCorrect = true;

        cards.forEach((card, i) => {
            const animeId = parseInt(card.dataset.id);
            const correctId = this.correctOrder[i].id;

            card.classList.add('revealed');

            if (animeId === correctId) {
                card.classList.add('correct');
            } else {
                card.classList.add('wrong');
                allCorrect = false;
            }
        });

        document.getElementById('next-btn').style.display = 'inline-block';

        if (allCorrect) {
            document.getElementById('game-actions').innerHTML = '<div style="color:var(--success); font-size:1.5rem; font-weight:bold;">🎉 Perfeito!</div>';
        } else {
            document.getElementById('game-actions').innerHTML = '<div style="color:var(--error);">Alguns erros. Tenta de novo!</div>';
        }
    }
};

Game.init();
