const API_BASE = "/api";
const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

// --- Hilfsfunktionen ---
function getMealEmoji(name) {
    const l = name.toLowerCase();
    if(l.includes('pizza')) return '🍕';
    if(l.includes('burger')) return '🍔';
    if(l.includes('nudel') || l.includes('pasta')) return '🍝';
    if(l.includes('sushi')) return '🍣';
    if(l.includes('salat')) return '🥗';
    if(l.includes('fleisch') || l.includes('steak')) return '🥩';
    if(l.includes('fisch')) return '🐟';
    if(l.includes('suppe')) return '🥣';
    if(l.includes('döner') || l.includes('kebab')) return '🥙';
    return '🍽️';
}

function fireConfetti() {
    // Ein einfaches CSS-Konfetti ohne externe Bibliothek (ausgelöst über ein Element)
    const confetti = document.createElement('div');
    confetti.innerHTML = '🎉';
    confetti.style.position = 'fixed';
    confetti.style.top = '50%';
    confetti.style.left = '50%';
    confetti.style.transform = 'translate(-50%, -50%)';
    confetti.style.fontSize = '5rem';
    confetti.style.zIndex = '9999';
    confetti.style.animation = 'fadeOutUp 1s ease forwards';
    document.body.appendChild(confetti);
    
    // Keyframe für die Animation hinzufügen
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.innerHTML = `@keyframes fadeOutUp { 0% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -100px) scale(1.5); } }`;
        document.head.appendChild(style);
    }
    
    setTimeout(() => confetti.remove(), 1000);
}

// --- Navigation ---
function switchTab(tabId) {
    // Buttons aktualisieren
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Views aktualisieren
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`view-${tabId}`).classList.add('active');

    // Titel aktualisieren
    let title = 'Unser Kalender';
    if(tabId === 'meals') title = 'Essensplan';
    if(tabId === 'notes') title = 'Pinnwand';
    document.getElementById('header-title').innerText = title;

    if(tabId === 'calendar') loadEvents();
    if(tabId === 'meals') loadMeals();
    if(tabId === 'notes') loadNotes();
}

// --- Kalender Funktionen ---
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        const events = await response.json();
        
        const container = document.getElementById('events-list');
        container.innerHTML = ''; // Clear

        if(events.length === 0) {
            container.innerHTML = '<div class="placeholder" style="text-align:center; color: #94a3b8; margin-top: 2rem;">Noch keine Dates geplant 🥺</div>';
            return;
        }

        // Sort by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        events.forEach(event => {
            const dateObj = new Date(event.date);
            const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
            
            container.innerHTML += `
                <div class="card event-card">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">📅 ${dateStr}</div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Fehler beim Laden der Events:", e);
    }
}

function openEventModal() {
    document.getElementById('event-modal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = '';
}

async function saveEvent() {
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;

    if(!title || !date) return alert("Bitte Titel und Datum eingeben!");

    try {
        await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, date })
        });
        fireConfetti();
        closeEventModal();
        loadEvents();
    } catch (e) {
        console.error("Fehler beim Speichern:", e);
    }
}

// --- Essensplan Funktionen ---
async function loadMeals() {
    try {
        const response = await fetch(`${API_BASE}/meals`);
        const mealsData = await response.json();
        
        // Convert array to dict for easier lookup
        const mealsDict = {};
        mealsData.forEach(m => mealsDict[m.day] = m.meal_name);

        const container = document.getElementById('meal-grid');
        container.innerHTML = '';

        DAYS.forEach(day => {
            const mealName = mealsDict[day] || "Noch nichts geplant";
            const emoji = mealsDict[day] ? getMealEmoji(mealsDict[day]) : "🍽️";
            const colorClass = mealsDict[day] ? "color: var(--text-main)" : "color: var(--text-muted)";
            
            container.innerHTML += `
                <div class="card meal-card" onclick="openMealModal('${day}', '${mealsDict[day] || ''}')">
                    <div class="meal-day">${day}</div>
                    <div class="meal-name" style="${colorClass}">${emoji} ${mealName}</div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Fehler beim Laden des Essensplans:", e);
    }
}

function openMealModal(day, currentMeal) {
    document.getElementById('meal-modal-title').innerText = `Essen für ${day}`;
    document.getElementById('meal-day').value = day;
    document.getElementById('meal-name').value = currentMeal;
    document.getElementById('meal-modal').classList.add('active');
}

function closeMealModal() {
    document.getElementById('meal-modal').classList.remove('active');
}

async function saveMeal() {
    const day = document.getElementById('meal-day').value;
    const meal_name = document.getElementById('meal-name').value;

    if(!meal_name) return; // Optional: Erlaube leere Felder zum löschen

    try {
        await fetch(`${API_BASE}/meals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day, meal_name })
        });
        closeMealModal();
        loadMeals();
    } catch (e) {
        console.error("Fehler beim Speichern des Essens:", e);
    }
}

// --- Pinnwand Funktionen ---
async function loadNotes() {
    try {
        const response = await fetch(`${API_BASE}/notes`);
        const notes = await response.json();
        
        const container = document.getElementById('notes-list');
        container.innerHTML = '';

        if(notes.length === 0) {
            container.innerHTML = '<div class="placeholder" style="text-align:center; color: #94a3b8;">Noch keine Nachrichten 💌</div>';
            return;
        }

        notes.forEach(note => {
            container.innerHTML += `
                <div class="note-card">
                    <button class="delete-note" onclick="deleteNote(${note.id})">&times;</button>
                    <div class="note-content">${note.content}</div>
                    <div class="note-date">${note.created_at}</div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Fehler beim Laden der Notizen:", e);
    }
}

async function saveNote() {
    const input = document.getElementById('new-note-input');
    const content = input.value.trim();
    if(!content) return;

    try {
        await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        input.value = '';
        loadNotes();
    } catch (e) {
        console.error("Fehler beim Speichern der Notiz:", e);
    }
}

async function deleteNote(id) {
    if(!confirm("Nachricht wirklich löschen?")) return;
    try {
        await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
        loadNotes();
    } catch (e) {
        console.error("Fehler beim Löschen:", e);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});