/**
 * AnimeEngine v6 - OST Player
 * Mini floating player for anime openings
 */

const OSTPlayer = {
    isOpen: false,
    currentAnime: null,
    player: null,
    
    /**
     * Open the OST player with a YouTube video
     */
    play(videoId, animeTitle) {
        if (!videoId) {
            Common.showNotification('Opening não disponível', 'error');
            return;
        }
        
        this.currentAnime = animeTitle;
        
        // Create or update player
        if (!this.player) {
            this.createPlayer();
        }
        
        const iframe = this.player.querySelector('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
        
        const title = this.player.querySelector('.ost-title');
        title.textContent = animeTitle || 'Now Playing';
        
        this.show();
    },
    
    createPlayer() {
        this.player = document.createElement('div');
        this.player.className = 'ost-player';
        this.player.innerHTML = `
            <div class="ost-player-header">
                <span class="ost-icon">🎵</span>
                <span class="ost-title">Now Playing</span>
                <div class="ost-controls">
                    <button class="ost-btn ost-minimize" onclick="OSTPlayer.toggleMinimize()">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="ost-btn ost-close" onclick="OSTPlayer.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="ost-player-body">
                <iframe 
                    src="" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
        
        document.body.appendChild(this.player);
        this.makeDraggable();
    },
    
    show() {
        if (this.player) {
            this.player.classList.add('show');
            this.player.classList.remove('minimized');
            this.isOpen = true;
        }
    },
    
    close() {
        if (this.player) {
            const iframe = this.player.querySelector('iframe');
            iframe.src = '';
            this.player.classList.remove('show');
            this.isOpen = false;
        }
    },
    
    toggleMinimize() {
        if (this.player) {
            this.player.classList.toggle('minimized');
        }
    },
    
    makeDraggable() {
        const header = this.player.querySelector('.ost-player-header');
        let isDragging = false;
        let offsetX, offsetY;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ost-btn')) return;
            isDragging = true;
            offsetX = e.clientX - this.player.offsetLeft;
            offsetY = e.clientY - this.player.offsetTop;
            this.player.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            this.player.style.left = (e.clientX - offsetX) + 'px';
            this.player.style.top = (e.clientY - offsetY) + 'px';
            this.player.style.right = 'auto';
            this.player.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.player.style.transition = '';
        });
    },
    
    /**
     * Search for an opening on YouTube (returns search URL)
     */
    getSearchUrl(animeTitle) {
        const query = encodeURIComponent(`${animeTitle} opening full`);
        return `https://www.youtube.com/results?search_query=${query}`;
    }
};

window.OSTPlayer = OSTPlayer;

