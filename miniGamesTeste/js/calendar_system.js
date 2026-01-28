/**
 * Calendar Progress System
 * Handles date tracking and calendar UI for games.
 */
const CalendarSystem = {
    currentGame: '', // 'music_quiz', 'char_dle', 'pixel_cover'

    init(gameName) {
        this.currentGame = gameName;
        this.injectModal();
        this.attachButtonListener();
    },

    /**
     * Mark today's game as complete in localStorage
     */
    markComplete() {
        const urlParams = new URLSearchParams(window.location.search);
        let dateStr = urlParams.get('date');

        if (!dateStr) {
            // If no date param, use today's date
            const d = new Date();
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        const key = `${this.currentGame}_completed`;
        let history = JSON.parse(localStorage.getItem(key) || '[]');

        if (!history.includes(dateStr)) {
            history.push(dateStr);
            localStorage.setItem(key, JSON.stringify(history));
            console.log(`Marked ${dateStr} as complete for ${this.currentGame}`);
        }
    },

    /**
     * Inject Modal HTML into the body
     */
    injectModal() {
        if (document.getElementById('calendar-modal')) return;

        const modalHtml = `
        <div id="calendar-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:2000; align-items:center; justify-content:center;">
            <div style="background:var(--surface); border:3px solid var(--primary); padding:20px; max-width:400px; width:90%; position:relative; box-shadow:var(--shadow-neo);">
                <button onclick="document.getElementById('calendar-modal').style.display='none'" style="position:absolute; top:10px; right:10px; background:transparent; border:none; color:var(--text); font-size:1.5rem; cursor:pointer;">&times;</button>
                <h2 style="color:var(--primary); margin-top:0;">📅 Arquivo</h2>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <button id="cal-prev" style="padding:5px 10px;">&lt;</button>
                    <span id="cal-month-year" style="font-weight:bold; font-size:1.2rem;"></span>
                    <button id="cal-next" style="padding:5px 10px;">&gt;</button>
                </div>
                
                <div id="calendar-grid" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:5px; text-align:center;"></div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Listeners for Navigation
        let displayDate = new Date();

        const render = () => this.renderCalendar(displayDate.getFullYear(), displayDate.getMonth());

        document.getElementById('cal-prev').onclick = () => {
            displayDate.setMonth(displayDate.getMonth() - 1);
            render();
        };

        document.getElementById('cal-next').onclick = () => {
            displayDate.setMonth(displayDate.getMonth() + 1);
            render();
        };

        // Initial Render
        render();
    },

    /**
     * Render the grid days
     */
    renderCalendar(year, month) {
        const grid = document.getElementById('calendar-grid');
        const label = document.getElementById('cal-month-year');
        grid.innerHTML = '';

        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        label.textContent = `${months[month]} ${year}`;

        // Header Days
        const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        days.forEach(d => {
            grid.innerHTML += `<div style="font-weight:bold; color:var(--text-sec); padding:5px;">${d}</div>`;
        });

        // Logic for days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get completed history
        const key = `${this.currentGame}_completed`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            grid.innerHTML += `<div></div>`;
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isCompleted = history.includes(dateStr);
            const isToday = (new Date().toDateString() === new Date(year, month, d).toDateString());

            const bg = isCompleted ? 'var(--success)' : 'var(--bg)';
            const border = isToday ? '2px solid var(--secondary)' : '1px solid var(--border-color)';
            const color = isCompleted ? '#000' : 'var(--text)';

            const cell = document.createElement('div');
            cell.style.cssText = `background:${bg}; border:${border}; color:${color}; padding:8px; cursor:pointer; font-weight:bold;`;
            cell.textContent = d;
            cell.onclick = () => {
                window.location.href = `?date=${dateStr}`;
            };
            grid.appendChild(cell);
        }
    },

    attachButtonListener() {
        // Logic to open modal using a dedicated button in header
        const btn = document.getElementById('open-calendar-btn');
        if (btn) {
            btn.onclick = () => {
                document.getElementById('calendar-modal').style.display = 'flex';
                // Re-render to ensure current month
                this.renderCalendar(new Date().getFullYear(), new Date().getMonth());
            };
        }
    }
};

window.CalendarSystem = CalendarSystem;
