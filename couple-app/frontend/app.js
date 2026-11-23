// Dynamisch ermitteln, ob die App unter /couple/ oder / laeuft
const isSubpath = window.location.pathname.startsWith('/couple');
const API_BASE = isSubpath ? '/couple/api' : '/api';
const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

// Zentraler API-Request-Helper mit aussagekraeftiger Fehlerbehandlung
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, options);
    if (!res.ok) {
        let err = await res.text();
        try {
            const j = JSON.parse(err);
            if (j.detail) err = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
        } catch (_) {}
        throw new Error(`HTTP ${res.status}: ${err}`);
    }
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await res.json();
    }
    return null;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) activeView.classList.add('active');

    let title = 'Unser Kalender';
    let subtitle = 'Macht euch schöne Pläne!';

    if(tabId === 'meals') {
        title = 'Essensplan';
        subtitle = 'Was essen wir diese Woche? 😋';
    }
    if(tabId === 'notes') {
        title = 'Pinnwand';
        subtitle = 'Kleine Notizen & Liebesbriefe 💌';
    }
    if(tabId === 'shopping') {
        title = 'Einkaufsliste';
        subtitle = 'Was fehlt im Kühlschrank? 🛒';
    }
    if(tabId === 'bucket') {
        title = 'Unsere Träume';
        subtitle = 'Was wir noch erleben wollen ✨';
    }

    document.getElementById('header-title').innerText = title;
    document.getElementById('header-subtitle').innerText = subtitle;

    if(tabId === 'calendar') { loadEvents(); loadCountdown(); }
    if(tabId === 'meals') loadMeals();
    if(tabId === 'notes') loadNotes();
    if(tabId === 'shopping') loadShopping();
    if(tabId === 'bucket') loadBucket();
}

// --- Kalender Funktionen ---
async function loadEvents() {
    try {
        const events = await apiRequest('/events');
        const container = document.getElementById('events-list');
        container.innerHTML = '';

        if(!events || events.length === 0) {
            container.innerHTML = '<div class="placeholder" style="text-align:center; color: #94a3b8; margin-top: 2rem;">Noch keine Dates geplant 🥺</div>';
            return;
        }

        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        events.forEach(event => {
            const dateObj = new Date(event.date);
            const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });

            container.innerHTML += `
                <div class="card event-card">
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <div class="event-date">📅 ${dateStr}</div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Fehler beim Laden der Events:", e);
        const container = document.getElementById('events-list');
        if (container) container.innerHTML = `<div class="placeholder" style="color: #ef4444; text-align: center;">Ladefehler: ${escapeHtml(e.message)}</div>`;
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
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;

    if(!title || !date) return alert("Bitte Titel und Datum eingeben!");

    try {
        await apiRequest('/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, date })
        });
        fireConfetti();
        closeEventModal();
        await loadEvents();
    } catch (e) {
        console.error("Fehler beim Speichern:", e);
        alert("Speichern fehlgeschlagen: " + e.message);
    }
}

// --- Essensplan Funktionen ---
async function loadMeals() {
    try {
        const mealsData = await apiRequest('/meals');
        const mealsDict = {};
        if (Array.isArray(mealsData)) {
            mealsData.forEach(m => mealsDict[m.day] = m.meal_name);
        }

        const container = document.getElementById('meal-grid');
        container.innerHTML = '';

        DAYS.forEach(day => {
            const mealName = mealsDict[day] || "Noch nichts geplant";
            const emoji = mealsDict[day] ? getMealEmoji(mealsDict[day]) : "🍽️";
            const colorClass = mealsDict[day] ? "color: var(--text-main)" : "color: var(--text-muted)";

            container.innerHTML += `
                <div class="card meal-card" onclick="openMealModal('${day}', '${escapeHtml(mealsDict[day] || '')}')">
                    <div class="meal-day">${day}</div>
                    <div class="meal-name" style="${colorClass}">${emoji} ${escapeHtml(mealName)}</div>
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
    const meal_name = document.getElementById('meal-name').value.trim();

    if(!meal_name) return;

    try {
        await apiRequest('/meals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day, meal_name })
        });
        closeMealModal();
        await loadMeals();
    } catch (e) {
        console.error("Fehler beim Speichern des Essens:", e);
        alert("Speichern fehlgeschlagen: " + e.message);
    }
}

// --- Pinnwand Funktionen ---
async function loadNotes() {
    try {
        const notes = await apiRequest('/notes');
        const container = document.getElementById('notes-list');
        container.innerHTML = '';

        if(!notes || notes.length === 0) {
            container.innerHTML = '<div class="placeholder" style="text-align:center; color: #94a3b8;">Noch keine Nachrichten 💌</div>';
            return;
        }

        notes.forEach(note => {
            container.innerHTML += `
                <div class="note-card">
                    <button class="delete-note" onclick="deleteNote(${note.id})">&times;</button>
                    <div class="note-content">${escapeHtml(note.content)}</div>
                    <div class="note-date">${escapeHtml(note.created_at)}</div>
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
        await apiRequest('/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        input.value = '';
        await loadNotes();
    } catch (e) {
        console.error("Fehler beim Speichern der Notiz:", e);
        alert("Speichern fehlgeschlagen: " + e.message);
    }
}

async function deleteNote(id) {
    if(!confirm("Nachricht wirklich löschen?")) return;
    try {
        await apiRequest(`/notes/${id}`, { method: 'DELETE' });
        await loadNotes();
    } catch (e) {
        console.error("Fehler beim Löschen:", e);
        alert("Löschen fehlgeschlagen: " + e.message);
    }
}

// --- Shopping List Funktionen ---
async function loadShopping() {
    try {
        const items = await apiRequest('/shopping');
        const container = document.getElementById('shopping-list');
        container.innerHTML = '';
        if(!items || items.length === 0) {
            container.innerHTML = '<div class="placeholder" style="text-align:center; color: #94a3b8;">Alles erledigt! 🛒</div>';
            return;
        }
        items.forEach(item => {
            const checked = item.is_bought ? 'checked' : '';
            const textStyle = item.is_bought ? 'text-decoration: line-through; color: #cbd5e1;' : '';
            container.innerHTML += `
                <div class="note-card" style="display: flex; align-items: center; gap: 1rem;">
                    <input type="checkbox" ${checked} onchange="toggleShopping(${item.id}, this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
                    <div class="note-content" style="flex: 1; margin: 0; ${textStyle}">${escapeHtml(item.item)}</div>
                    <button class="delete-note" style="position: relative; top: 0; right: 0;" onclick="deleteShopping(${item.id})">&times;</button>
                </div>
            `;
        });
    } catch(e) {
        console.error(e);
    }
}

async function saveShoppingItem() {
    const input = document.getElementById('new-shopping-input');
    const item = input.value.trim();
    if(!item) return;
    try {
        await apiRequest('/shopping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item })
        });
        input.value = '';
        await loadShopping();
    } catch(e) {
        console.error(e);
        alert("Speichern fehlgeschlagen: " + e.message);
    }
}

async function toggleShopping(id, is_bought) {
    try {
        await apiRequest(`/shopping/${id}?is_bought=${is_bought}`, { method: 'PUT' });
        await loadShopping();
    } catch(e) {
        console.error(e);
        alert("Statusaktualisierung fehlgeschlagen: " + e.message);
    }
}

async function deleteShopping(id) {
    try {
        await apiRequest(`/shopping/${id}`, { method: 'DELETE' });
        await loadShopping();
    } catch(e) {
        console.error(e);
        alert("Löschen fehlgeschlagen: " + e.message);
    }
}

// --- Bucket List Funktionen ---
async function loadBucket() {
    try {
        const items = await apiRequest('/bucket');
        const container = document.getElementById('bucket-list');
        container.innerHTML = '';
        if(!items || items.length === 0) {
            container.innerHTML = '<div class="placeholder" style="text-align:center; color: #94a3b8;">Zeit für neue Träume! ✨</div>';
            return;
        }
        items.forEach(item => {
            const checked = item.is_done ? 'checked' : '';
            const textStyle = item.is_done ? 'text-decoration: line-through; color: #cbd5e1;' : '';
            container.innerHTML += `
                <div class="note-card" style="display: flex; align-items: center; gap: 1rem;">
                    <input type="checkbox" ${checked} onchange="toggleBucket(${item.id}, this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
                    <div class="note-content" style="flex: 1; margin: 0; ${textStyle}">${escapeHtml(item.title)}</div>
                    <button class="delete-note" style="position: relative; top: 0; right: 0;" onclick="deleteBucket(${item.id})">&times;</button>
                </div>
            `;
        });
    } catch(e) {
        console.error(e);
    }
}

async function saveBucketItem() {
    const input = document.getElementById('new-bucket-input');
    const title = input.value.trim();
    if(!title) return;
    try {
        await apiRequest('/bucket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        input.value = '';
        fireConfetti();
        await loadBucket();
    } catch(e) {
        console.error(e);
        alert("Speichern fehlgeschlagen: " + e.message);
    }
}

async function toggleBucket(id, is_done) {
    try {
        await apiRequest(`/bucket/${id}?is_done=${is_done}`, { method: 'PUT' });
        if(is_done) fireConfetti();
        await loadBucket();
    } catch(e) {
        console.error(e);
        alert("Statusaktualisierung fehlgeschlagen: " + e.message);
    }
}

async function deleteBucket(id) {
    try {
        await apiRequest(`/bucket/${id}`, { method: 'DELETE' });
        await loadBucket();
    } catch(e) {
        console.error(e);
        alert("Löschen fehlgeschlagen: " + e.message);
    }
}

// --- Countdown Funktionen ---
let cdInterval = null;
async function loadCountdown() {
    try {
        const cd = await apiRequest('/countdown');
        const titleEl = document.getElementById('cd-title');
        const timerEl = document.getElementById('cd-timer');
        if(cdInterval) clearInterval(cdInterval);

        if(!cd) {
            titleEl.innerText = "Worauf freuen wir uns?";
            timerEl.innerText = "Klick mich ⏳";
            return;
        }

        titleEl.innerText = cd.title;
        const targetDate = new Date(cd.target_date).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(cdInterval);
                timerEl.innerText = "🎉 Es ist soweit! 🎉";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            timerEl.innerText = `${days}t ${hours}h ${mins}m`;
        };

        updateTimer();
        cdInterval = setInterval(updateTimer, 60000);
    } catch(e) {
        console.error(e);
    }
}

function openCountdownModal() {
    document.getElementById('countdown-modal').classList.add('active');
}

function closeCountdownModal() {
    document.getElementById('countdown-modal').classList.remove('active');
}

async function saveCountdown() {
    const title = document.getElementById('cd-input-title').value.trim();
    const date = document.getElementById('cd-input-date').value;
    if(!title || !date) return alert("Bitte Titel und Datum auswählen!");

    try {
        await apiRequest('/countdown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, target_date: date })
        });
        closeCountdownModal();
        await loadCountdown();
    } catch(e) {
        console.error(e);
        alert("Speichern fehlgeschlagen: " + e.message);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    loadCountdown();
});
