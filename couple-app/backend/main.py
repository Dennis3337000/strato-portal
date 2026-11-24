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

# Cache deaktivieren Middleware
@app.middleware("http")
async def add_cache_control_header(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
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
    c.execute('''
        CREATE TABLE IF NOT EXISTS shopping_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL,
            is_bought BOOLEAN DEFAULT 0
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS bucket_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            is_done BOOLEAN DEFAULT 0
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS countdown (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            target_date TEXT NOT NULL
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

class ShoppingItem(BaseModel):
    item: str
    is_bought: bool = False

class BucketItem(BaseModel):
    title: str
    is_done: bool = False

class Countdown(BaseModel):
    title: str
    target_date: str

# --- API Routen: Shopping List ---
@app.get("/api/shopping")
def get_shopping_list():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, item, is_bought FROM shopping_list ORDER BY is_bought ASC, id DESC")
    items = [{"id": row[0], "item": row[1], "is_bought": bool(row[2])} for row in c.fetchall()]
    conn.close()
    return items

@app.post("/api/shopping")
def add_shopping_item(item: ShoppingItem):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO shopping_list (item, is_bought) VALUES (?, ?)", (item.item, item.is_bought))
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
    c.execute("SELECT id, title, is_done FROM bucket_list ORDER BY is_done ASC, id DESC")
    items = [{"id": row[0], "title": row[1], "is_done": bool(row[2])} for row in c.fetchall()]
    conn.close()
    return items

@app.post("/api/bucket")
def add_bucket_item(item: BucketItem):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO bucket_list (title, is_done) VALUES (?, ?)", (item.title, 1 if item.is_done else 0))
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

@app.delete("/api/events/{event_id}")
def delete_event(event_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()
    return {"success": True}

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
    clean_name = meal.meal_name.strip()
    if not clean_name:
        c.execute("DELETE FROM meals WHERE day = ?", (meal.day,))
    else:
        c.execute("INSERT OR REPLACE INTO meals (day, meal_name) VALUES (?, ?)",
                  (meal.day, clean_name))
    conn.commit()
    conn.close()
    return meal

# --- Static Files & PWA Routing ---
FRONTEND_DIR = os.getenv("FRONTEND_DIR", "/app/frontend" if os.path.exists("/app/frontend") else os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend")))

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def serve_frontend():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
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
        return FileResponse(index_file)
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
