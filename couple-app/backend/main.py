from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
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

# Datenbank in einem separaten Data-Ordner für Docker-Volumes
DB_DIR = "/app/data"
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
            description TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day TEXT NOT NULL UNIQUE,
            meal_name TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Modelle ---
class Event(BaseModel):
    title: str
    date: str
    description: Optional[str] = None

class Meal(BaseModel):
    day: str
    meal_name: str

class Note(BaseModel):
    content: str

# --- API Routen: Notes ---
@app.get("/api/notes")
def get_notes():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, content, created_at FROM notes ORDER BY id DESC")
    notes = [{"id": row[0], "content": row[1], "created_at": row[2]} for row in c.fetchall()]
    conn.close()
    return notes

@app.post("/api/notes")
def add_note(note: Note):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    from datetime import datetime
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    c.execute("INSERT INTO notes (content, created_at) VALUES (?, ?)", (note.content, now))
    conn.commit()
    note_id = c.lastrowid
    conn.close()
    return {"id": note_id, "content": note.content, "created_at": now}

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# --- API Routen ---
@app.get("/api/events")
def get_events():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, title, date, description FROM events")
    events = [{"id": row[0], "title": row[1], "date": row[2], "description": row[3]} for row in c.fetchall()]
    conn.close()
    return events

@app.post("/api/events")
def add_event(event: Event):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO events (title, date, description) VALUES (?, ?, ?)", 
              (event.title, event.date, event.description))
    conn.commit()
    event_id = c.lastrowid
    conn.close()
    return {"id": event_id, **event.dict()}

@app.get("/api/meals")
def get_meals():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, day, meal_name FROM meals")
    meals = [{"id": row[0], "day": row[1], "meal_name": row[2]} for row in c.fetchall()]
    conn.close()
    return meals

@app.post("/api/meals")
def set_meal(meal: Meal):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO meals (day, meal_name) VALUES (?, ?)", 
              (meal.day, meal.meal_name))
    conn.commit()
    conn.close()
    return meal

# --- Static Files & PWA Routing ---
# Wir servieren das Frontend direkt über FastAPI, das ist am einfachsten für Docker
app.mount("/static", StaticFiles(directory="/app/frontend"), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse("/app/frontend/index.html")

@app.get("/{file_path:path}")
def serve_frontend_files(file_path: str):
    file = f"/app/frontend/{file_path}"
    if os.path.exists(file):
        return FileResponse(file)
    return FileResponse("/app/frontend/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
