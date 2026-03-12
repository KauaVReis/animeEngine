/**
 * AnimeEngine v6 - Roulette Feature
 */

const Roulette = {
    init() {
        // Find existing roulette button or create it
        // Usually called from Common or specific page
    },

    spin() {
        const list = Storage.getList('planToWatch');
        
        if (!list || list.length === 0) {
            Common.showNotification('Sua lista "Quero Ver" está vazia!', 'error');
            return;
        }

        // Add spinning class to button
        const fabBtn = document.querySelector('.fab-btn');
        if (fabBtn) fabBtn.classList.add('spinning');
        
        Common.showNotification('🎲 Sorteando...', 'info');

        // Animation effect simulation
        setTimeout(() => {
            if (fabBtn) fabBtn.classList.remove('spinning');
            
            const random = list[Math.floor(Math.random() * list.length)];
            
            // Validate data
            const title = random.title || 'Sem Título';
            const image = random.image || 'img/placeholder.jpg';
            const eps = random.total_episodes || random.episodes || '?';
            
            // Show confetti
            this.showConfetti();
            
            // Show result modal
            const content = `
                <div class="roulette-result">
                    <h2>🎉 Você deve assistir:</h2>
                    <div class="roulette-card">
                        <img src="${image}" alt="${title}">
                        <h3>${title}</h3>
                        <p>${eps} episódios</p>
                        <button class="btn btn-primary" onclick="window.location.href='detalhes.php?id=${random.id}'">
                            <i class="fas fa-play"></i> Ver Detalhes
                        </button>
                    </div>
                    <button class="btn btn-secondary" style="margin-top: 15px;" onclick="Common.closeModal(); Roulette.spin();">
                        <i class="fas fa-dice"></i> Sortear Outro
                    </button>
                </div>
            `;
            
            Common.openModal(content, { title: '🎰 Sorteio' });
        }, 1500);
    },
    
    showConfetti() {
        const colors = ['#ff3366', '#ffd700', '#33cc66', '#3366ff', '#9966ff'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => confetti.remove(), 4000);
        }
    }
};

window.Roulette = Roulette;


