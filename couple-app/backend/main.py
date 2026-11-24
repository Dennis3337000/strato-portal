from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import sqlite3
import os

app = FastAPI(title="Couple App API")

# CORS zulassen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache deaktivieren Middleware fuer API und HTML
@app.middleware("http")
async def add_cache_control_header(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/api/") or path == "/" or path.endswith(".html") or "." not in path:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Datenbank in einem separaten Data-Ordner fuer Docker-Volumes
DB_DIR = os.getenv("DATA_DIR", "/app/data" if os.path.exists("/app") else os.path.join(os.path.dirname(__file__), "data"))
os.makedirs(DB_DIR, exist_ok=True)
DB_FILE = os.path.join(DB_DIR, "couple_data.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'Date'
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day TEXT NOT NULL UNIQUE,
            meal_name TEXT NOT NULL,
            cook TEXT DEFAULT '',
            notes TEXT DEFAULT ''
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            author TEXT DEFAULT '',
            color TEXT DEFAULT '#fef3c7'
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS shopping_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL,
            is_bought BOOLEAN DEFAULT 0,
            category TEXT DEFAULT 'Allgemein'
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS bucket_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            is_done BOOLEAN DEFAULT 0,
            category TEXT DEFAULT 'Abenteuer'
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS countdown (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            target_date TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS moods (
            partner TEXT PRIMARY KEY,
            emoji TEXT NOT NULL,
            text TEXT,
            updated_at TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS quiz_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id TEXT NOT NULL,
            question_text TEXT NOT NULL,
            partner TEXT NOT NULL,
            answer TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            UNIQUE(question_id, partner)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS profile (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS locations (
            partner TEXT PRIMARY KEY,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            accuracy REAL,
            speed REAL,
            heading REAL,
            battery_level INTEGER,
            is_charging BOOLEAN,
            updated_at TEXT NOT NULL
        )
    ''')

    # Spalten-Migrationen falls Tabellen bereits ohne neue Spalten existierten
    for table, col, col_type in [
        ('events', 'category', "TEXT DEFAULT 'Date'"),
        ('meals', 'cook', "TEXT DEFAULT ''"),
        ('meals', 'notes', "TEXT DEFAULT ''"),
        ('notes', 'author', "TEXT DEFAULT ''"),
        ('notes', 'color', "TEXT DEFAULT '#fef3c7'"),
        ('shopping_list', 'category', "TEXT DEFAULT 'Allgemein'"),
        ('bucket_list', 'category', "TEXT DEFAULT 'Abenteuer'")
    ]:
        try:
            c.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            pass # Spalte existiert bereits

    # Initialwerte für Profil setzen falls leer
    default_profile = {
        "partner_a_name": "Partner A",
        "partner_b_name": "Partner B",
        "start_date": "2023-05-12",
        "partner_a_city": "Berlin",
        "partner_b_city": "München",
        "hugs_count": "12"
    }
    for k, v in default_profile.items():
        c.execute("INSERT OR IGNORE INTO profile (key, value) VALUES (?, ?)", (k, v))

    # Standard Moods setzen falls leer
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    c.execute("INSERT OR IGNORE INTO moods (partner, emoji, text, updated_at) VALUES (?, ?, ?, ?)",
              ("Partner A", "😊", "Glücklich & dankbar", now))
    c.execute("INSERT OR IGNORE INTO moods (partner, emoji, text, updated_at) VALUES (?, ?, ?, ?)",
              ("Partner B", "🥰", "Vermisse dich!", now))

    # Standard Standorte setzen falls leer
    c.execute("INSERT OR IGNORE INTO locations (partner, latitude, longitude, accuracy, speed, heading, battery_level, is_charging, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              ("Partner A", 52.5200, 13.4050, 15.0, 0.0, 0.0, 85, 0, now))
    c.execute("INSERT OR IGNORE INTO locations (partner, latitude, longitude, accuracy, speed, heading, battery_level, is_charging, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              ("Partner B", 48.1351, 11.5820, 20.0, 28.5, 180.0, 72, 1, now))

    conn.commit()
    conn.close()

init_db()

# --- Modelle ---
class Event(BaseModel):
    title: str
    date: str
    description: Optional[str] = None
    category: Optional[str] = "Date"

class Meal(BaseModel):
    day: str
    meal_name: str
    cook: Optional[str] = ""
    notes: Optional[str] = ""

class Note(BaseModel):
    content: str
    author: Optional[str] = ""
    color: Optional[str] = "#fef3c7"

class ShoppingItem(BaseModel):
    item: str
    is_bought: bool = False
    category: Optional[str] = "Allgemein"

class BucketItem(BaseModel):
    title: str
    is_done: bool = False
    category: Optional[str] = "Abenteuer"

class Countdown(BaseModel):
    title: str
    target_date: str

class MoodEntry(BaseModel):
    partner: str
    emoji: str
    text: Optional[str] = ""

class QuizAnswerSubmission(BaseModel):
    question_id: str
    question_text: str
    partner: str
    answer: str

class ProfileUpdate(BaseModel):
    key: str
    value: str

class LocationUpdate(BaseModel):
    partner: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None
    battery_level: Optional[int] = None
    is_charging: Optional[bool] = None

# --- API Routen: Shopping List ---
@app.get("/api/shopping")
def get_shopping_list():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, item, is_bought, category FROM shopping_list ORDER BY is_bought ASC, id DESC")
    items = [{"id": row[0], "item": row[1], "is_bought": bool(row[2]), "category": row[3] or "Allgemein"} for row in c.fetchall()]
    conn.close()
    return items

@app.post("/api/shopping")
def add_shopping_item(item: ShoppingItem):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO shopping_list (item, is_bought, category) VALUES (?, ?, ?)",
              (item.item, 1 if item.is_bought else 0, item.category or "Allgemein"))
    conn.commit()
    item_id = c.lastrowid
    conn.close()
    return {"id": item_id, **item.dict()}

@app.put("/api/shopping/{item_id}")
def toggle_shopping_item(item_id: int, is_bought: bool):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE shopping_list SET is_bought = ? WHERE id = ?", (1 if is_bought else 0, item_id))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/shopping/{item_id}")
def delete_shopping_item(item_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM shopping_list WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# --- API Routen: Bucket List ---
@app.get("/api/bucket")
def get_bucket_list():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, title, is_done, category FROM bucket_list ORDER BY is_done ASC, id DESC")
    items = [{"id": row[0], "title": row[1], "is_done": bool(row[2]), "category": row[3] or "Abenteuer"} for row in c.fetchall()]
    conn.close()
    return items

@app.post("/api/bucket")
def add_bucket_item(item: BucketItem):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO bucket_list (title, is_done, category) VALUES (?, ?, ?)",
              (item.title, 1 if item.is_done else 0, item.category or "Abenteuer"))
    conn.commit()
    item_id = c.lastrowid
    conn.close()
    return {"id": item_id, **item.dict()}

@app.put("/api/bucket/{item_id}")
def toggle_bucket_item(item_id: int, is_done: bool):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE bucket_list SET is_done = ? WHERE id = ?", (1 if is_done else 0, item_id))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/bucket/{item_id}")
def delete_bucket_item(item_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM bucket_list WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# --- API Routen: Countdown ---
@app.get("/api/countdown")
def get_countdown():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, title, target_date FROM countdown ORDER BY id DESC LIMIT 1")
    row = c.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "title": row[1], "target_date": row[2]}
    return None

@app.post("/api/countdown")
def set_countdown(cd: Countdown):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM countdown") # Nur einen Countdown behalten
    c.execute("INSERT INTO countdown (title, target_date) VALUES (?, ?)", (cd.title, cd.target_date))
    conn.commit()
    cd_id = c.lastrowid
    conn.close()
    return {"id": cd_id, **cd.dict()}

# --- API Routen: Notes ---
@app.get("/api/notes")
def get_notes():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, content, created_at, author, color FROM notes ORDER BY id DESC")
    notes = [{
        "id": row[0],
        "content": row[1],
        "created_at": row[2],
        "author": row[3] or "",
        "color": row[4] or "#fef3c7"
    } for row in c.fetchall()]
    conn.close()
    return notes

@app.post("/api/notes")
def add_note(note: Note):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    c.execute("INSERT INTO notes (content, created_at, author, color) VALUES (?, ?, ?, ?)",
              (note.content, now, note.author or "", note.color or "#fef3c7"))
    conn.commit()
    note_id = c.lastrowid
    conn.close()
    return {"id": note_id, "content": note.content, "created_at": now, "author": note.author or "", "color": note.color or "#fef3c7"}

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# --- API Routen: Events / Kalender ---
@app.get("/api/events")
def get_events():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, title, date, description, category FROM events ORDER BY date ASC")
    events = [{
        "id": row[0],
        "title": row[1],
        "date": row[2],
        "description": row[3],
        "category": row[4] or "Date"
    } for row in c.fetchall()]
    conn.close()
    return events

@app.post("/api/events")
def add_event(event: Event):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO events (title, date, description, category) VALUES (?, ?, ?, ?)",
              (event.title, event.date, event.description, event.category or "Date"))
    conn.commit()
    event_id = c.lastrowid
    conn.close()
    return {"id": event_id, **event.dict()}

@app.delete("/api/events/{event_id}")
def delete_event(event_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# --- API Routen: Meals / Essensplan ---
@app.get("/api/meals")
def get_meals():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, day, meal_name, cook, notes FROM meals")
    meals = [{
        "id": row[0],
        "day": row[1],
        "meal_name": row[2],
        "cook": row[3] or "",
        "notes": row[4] or ""
    } for row in c.fetchall()]
    conn.close()
    return meals

@app.post("/api/meals")
def set_meal(meal: Meal):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    clean_name = meal.meal_name.strip()
    if not clean_name:
        c.execute("DELETE FROM meals WHERE day = ?", (meal.day,))
    else:
        c.execute('''
            INSERT INTO meals (day, meal_name, cook, notes)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(day) DO UPDATE SET
                meal_name=excluded.meal_name,
                cook=excluded.cook,
                notes=excluded.notes
        ''', (meal.day, clean_name, meal.cook or "", meal.notes or ""))
    conn.commit()
    conn.close()
    return meal

# --- API Routen: Mood Sharing ---
@app.get("/api/mood")
def get_moods():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT partner, emoji, text, updated_at FROM moods")
    rows = c.fetchall()
    conn.close()
    result = {}
    for r in rows:
        result[r[0]] = {"emoji": r[1], "text": r[2] or "", "updated_at": r[3]}
    return result

@app.post("/api/mood")
def update_mood(m: MoodEntry):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    c.execute('''
        INSERT INTO moods (partner, emoji, text, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(partner) DO UPDATE SET
            emoji=excluded.emoji,
            text=excluded.text,
            updated_at=excluded.updated_at
    ''', (m.partner, m.emoji, m.text or "", now))
    conn.commit()
    conn.close()
    return {"partner": m.partner, "emoji": m.emoji, "text": m.text, "updated_at": now}

# --- API Routen: Quiz / Paarfragen ---
@app.get("/api/quiz")
def get_quiz_answers():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT question_id, question_text, partner, answer, submitted_at FROM quiz_answers")
    rows = c.fetchall()
    conn.close()
    # Strukturiere nach question_id
    questions = {}
    for r in rows:
        qid = r[0]
        if qid not in questions:
            questions[qid] = {
                "question_id": qid,
                "question_text": r[1],
                "answers": {}
            }
        questions[qid]["answers"][r[2]] = {
            "answer": r[3],
            "submitted_at": r[4]
        }
    return list(questions.values())

@app.post("/api/quiz/answer")
def submit_quiz_answer(entry: QuizAnswerSubmission):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    c.execute('''
        INSERT INTO quiz_answers (question_id, question_text, partner, answer, submitted_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(question_id, partner) DO UPDATE SET
            answer=excluded.answer,
            submitted_at=excluded.submitted_at
    ''', (entry.question_id, entry.question_text, entry.partner, entry.answer, now))
    conn.commit()
    conn.close()
    return {"success": True, "submitted_at": now}

# --- API Routen: Profile & Hugs ---
@app.get("/api/profile")
def get_profile():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT key, value FROM profile")
    data = {row[0]: row[1] for row in c.fetchall()}
    conn.close()
    return data

@app.post("/api/profile")
def update_profile(item: ProfileUpdate):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)", (item.key, item.value))
    conn.commit()
    conn.close()
    return {"success": True, item.key: item.value}

@app.post("/api/hugs")
def send_hug():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT value FROM profile WHERE key = 'hugs_count'")
    row = c.fetchone()
    count = int(row[0]) if row and row[0].isdigit() else 0
    count += 1
    c.execute("INSERT OR REPLACE INTO profile (key, value) VALUES ('hugs_count', ?)", (str(count),))
    conn.commit()
    conn.close()
    return {"hugs_count": count}

# --- API Routen: Live Location & GPS Tracking ---
@app.get("/api/location")
def get_locations():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT partner, latitude, longitude, accuracy, speed, heading, battery_level, is_charging, updated_at FROM locations")
    rows = c.fetchall()
    conn.close()
    result = {}
    for r in rows:
        result[r[0]] = {
            "partner": r[0],
            "latitude": r[1],
            "longitude": r[2],
            "accuracy": r[3],
            "speed": r[4],
            "heading": r[5],
            "battery_level": r[6],
            "is_charging": bool(r[7]) if r[7] is not None else None,
            "updated_at": r[8]
        }
    return result

@app.post("/api/location")
def update_location(loc: LocationUpdate):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    now = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    c.execute('''
        INSERT INTO locations (partner, latitude, longitude, accuracy, speed, heading, battery_level, is_charging, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(partner) DO UPDATE SET
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            accuracy=excluded.accuracy,
            speed=excluded.speed,
            heading=excluded.heading,
            battery_level=excluded.battery_level,
            is_charging=excluded.is_charging,
            updated_at=excluded.updated_at
    ''', (
        loc.partner,
        loc.latitude,
        loc.longitude,
        loc.accuracy,
        loc.speed,
        loc.heading,
        loc.battery_level,
        1 if loc.is_charging else 0 if loc.is_charging is not None else None,
        now
    ))
    conn.commit()
    conn.close()
    return {"success": True, "updated_at": now, "partner": loc.partner}

# --- Static Files & PWA Routing ---
FRONTEND_DIR = os.getenv("FRONTEND_DIR", "/app/frontend" if os.path.exists("/app/frontend") else os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend")))

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def serve_frontend():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
    return {"message": "Couple App API online"}

@app.get("/{file_path:path}")
def serve_frontend_files(file_path: str):
    if file_path.startswith("api/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="API endpoint not found")
    file = os.path.join(FRONTEND_DIR, file_path)
    if os.path.exists(file) and os.path.isfile(file):
        return FileResponse(file)
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
