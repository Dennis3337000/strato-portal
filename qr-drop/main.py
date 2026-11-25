import os
import time
import json
import uuid
import shutil
import threading
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="QR-Drop - Private Highspeed QuickShare")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.getenv("DATA_DIR", "/app/uploads" if os.path.exists("/app") else os.path.join(os.path.dirname(__file__), "uploads"))
FILES_DIR = os.path.join(DATA_DIR, "files")
META_FILE = os.path.join(DATA_DIR, "meta.json")

os.makedirs(FILES_DIR, exist_ok=True)
FILE_LOCK = threading.RLock()

def load_meta() -> Dict[str, Dict[str, Any]]:
    if not os.path.exists(META_FILE):
        return {}
    with FILE_LOCK:
        try:
            with open(META_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

def save_meta(data: Dict[str, Dict[str, Any]]):
    with FILE_LOCK:
        try:
            tmp = f"{META_FILE}.tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp, META_FILE)
        except Exception:
            with open(META_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

def purge_expired_files():
    """Loescht abgelaufene Dateien zuverlaessig von der Festplatte."""
    now = time.time()
    meta = load_meta()
    changed = False

    for token, item in list(meta.items()):
        expires_at = item.get("expires_at", 0)
        # Wenn Ablaufzeit ueberschritten
        if expires_at and now > expires_at:
            file_path = os.path.join(FILES_DIR, item.get("saved_name", ""))
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass
            meta.pop(token, None)
            changed = True

    if changed:
        save_meta(meta)

# Background-Worker fuer stuendliche Bereinigung
def background_cleanup_loop():
    while True:
        try:
            purge_expired_files()
        except Exception:
            pass
        time.sleep(300) # alle 5 Minuten pruefen

threading.Thread(target=background_cleanup_loop, daemon=True).start()

def format_size(bytes_num: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_num < 1024.0:
            return f"{bytes_num:.1f} {unit}"
        bytes_num /= 1024.0
    return f"{bytes_num:.1f} TB"

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    expiry: str = Form("24h"),
    burn_after_read: str = Form("false")
):
    purge_expired_files()

    token = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    saved_name = f"{token}{ext}"
    target_path = os.path.join(FILES_DIR, saved_name)

    # Datei streamend speichern (schont Arbeitsspeicher)
    size = 0
    with open(target_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024): # 1MB Chunks
            size += len(chunk)
            buffer.write(chunk)

    now = time.time()
    ttl_map = {
        "1h": 3600,
        "6h": 21600,
        "24h": 86400,
        "3d": 259200,
        "7d": 604800
    }
    ttl_seconds = ttl_map.get(expiry, 86400)
    expires_at = now + ttl_seconds
    is_burn = (burn_after_read.lower() == "true")

    meta = load_meta()
    meta[token] = {
        "original_name": file.filename or "file",
        "saved_name": saved_name,
        "size": size,
        "size_formatted": format_size(size),
        "content_type": file.content_type or "application/octet-stream",
        "uploaded_at": int(now),
        "expires_at": int(expires_at),
        "burn_after_read": is_burn,
        "downloads_count": 0
    }
    save_meta(meta)

    return {
        "success": True,
        "token": token,
        "filename": file.filename,
        "size": format_size(size),
        "expires_at": int(expires_at),
        "burn_after_read": is_burn
    }

@app.get("/api/file/{token}")
def get_file_info(token: str):
    purge_expired_files()
    meta = load_meta()
    if token not in meta:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden oder bereits abgelaufen.")
    
    item = meta[token]
    return {
        "success": True,
        "token": token,
        "filename": item["original_name"],
        "size": item["size_formatted"],
        "content_type": item["content_type"],
        "uploaded_at": item["uploaded_at"],
        "expires_at": item["expires_at"],
        "burn_after_read": item.get("burn_after_read", False),
        "downloads_count": item.get("downloads_count", 0)
    }

@app.get("/api/download/{token}")
def download_file(token: str, background_tasks: BackgroundTasks):
    purge_expired_files()
    meta = load_meta()
    if token not in meta:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden oder abgelaufen.")

    item = meta[token]
    file_path = os.path.join(FILES_DIR, item["saved_name"])
    if not os.path.exists(file_path):
        meta.pop(token, None)
        save_meta(meta)
        raise HTTPException(status_code=404, detail="Datei existiert nicht mehr.")

    # Download-Zaehler erhoehen
    item["downloads_count"] = item.get("downloads_count", 0) + 1
    is_burn = item.get("burn_after_read", False)

    if is_burn:
        def _burn():
            time.sleep(5)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                m = load_meta()
                m.pop(token, None)
                save_meta(m)
            except Exception:
                pass
        background_tasks.add_task(_burn)
    else:
        save_meta(meta)

    return FileResponse(
        file_path,
        filename=item["original_name"],
        media_type=item["content_type"]
    )

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"status": "QR-Drop API online"}

@app.get("/d/{token}")
def serve_download_page(token: str):
    dl_file = os.path.join(STATIC_DIR, "download.html")
    if os.path.exists(dl_file):
        return FileResponse(dl_file)
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
