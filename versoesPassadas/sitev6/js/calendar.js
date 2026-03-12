/**
 * AnimeEngine v6 - Calendar Feature
 */

const Calendar = {
    async init() {
        const container = document.getElementById('calendar-container');
        if (!container) return;

        container.innerHTML = '<div class="loader"></div>';

        // Calculate start/end of current week
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const startUnix = Math.floor(startOfWeek.getTime() / 1000);
        const endUnix = Math.floor(endOfWeek.getTime() / 1000);

        try {
            const schedules = await API.getAiringSchedule(startUnix, endUnix);
            this.render(schedules);
        } catch (error) {
            container.innerHTML = `<p class="error">Erro ao carregar calendário: ${error.message}</p>`;
        }
    },

    render(schedules) {
        const container = document.getElementById('calendar-container');
        container.innerHTML = '';
        container.className = 'calendar-grid';

        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        // Group by day
        const grouped = {};
        days.forEach((d, i) => grouped[i] = []);

        schedules.forEach(item => {
            const date = new Date(item.airingAt * 1000);
            const dayIndex = date.getDay();
            grouped[dayIndex].push(item);
        });

        // Render columns
        days.forEach((dayName, index) => {
            const dayCol = document.createElement('div');
            dayCol.className = 'calendar-day';
            
            dayCol.innerHTML = `<h3 class="calendar-day-title">${dayName}</h3>`;
            
            const list = document.createElement('div');
            list.className = 'calendar-list';

            if (grouped[index].length === 0) {
                list.innerHTML = '<span class="empty-day">-</span>';
            } else {
                grouped[index].forEach(item => {
                    const time = new Date(item.airingAt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const isAired = item.airingAt * 1000 < Date.now();
                    
                    const card = document.createElement('div');
                    card.className = `calendar-card ${isAired ? 'aired' : ''}`;
                    card.innerHTML = `
                        <img src="${item.media.coverImage.medium}" alt="${item.media.title.romaji}">
                        <div class="calendar-card-info">
                            <div class="calendar-time">${time}</div>
                            <div class="calendar-title">${item.media.title.romaji}</div>
                            <div class="calendar-ep">Ep. ${item.episode}</div>
                        </div>
                    `;
                    card.onclick = () => window.location.href = `detalhes.html?id=${item.media.id}`;
                    list.appendChild(card);
                });
            }

            dayCol.appendChild(list);
            container.appendChild(dayCol);
        });
    }
};

// Auto-init if page has container
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calendar-container')) {
        Calendar.init();
    }
});
