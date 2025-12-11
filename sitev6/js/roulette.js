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

        Common.showNotification('🎲 Sorteando...', 'info');

        // Animation effect simulation
        setTimeout(() => {
            const random = list[Math.floor(Math.random() * list.length)];
            
            // Show result modal
            const content = `
                <div class="roulette-result">
                    <h2>Você deve assistir:</h2>
                    <div class="roulette-card">
                        <img src="${random.image}" alt="${random.title}" style="max-width: 200px; border-radius: 10px; margin: 15px 0;">
                        <h3>${random.title}</h3>
                        <p>${random.total_episodes || '?'} episódios</p>
                        <button class="btn btn-primary" onclick="window.location.href='detalhes.html?id=${random.id}'">
                            Ver Detalhes
                        </button>
                    </div>
                    <button class="btn btn-outline" style="margin-top: 10px;" onclick="Roulette.spin()">
                        Sortear Outro
                    </button>
                </div>
            `;
            
            Common.openModal(content, { title: '🎰 Sorteio' });
        }, 1500);
    }
};

window.Roulette = Roulette;
