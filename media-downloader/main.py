import os
import uuid
import time
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp

app = FastAPI(title="MediaGrab - Universal Video & Audio Downloader")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOADS_DIR = "/tmp/downloads" if os.path.exists("/tmp") else os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

class InfoRequest(BaseModel):
    url: str

def clean_old_files():
    """Loescht temporaere Downloads, die aelter als 15 Minuten sind."""
    now = time.time()
    try:
        for f in os.listdir(DOWNLOADS_DIR):
            fp = os.path.join(DOWNLOADS_DIR, f)
            if os.path.isfile(fp) and (now - os.path.getmtime(fp) > 900):
                try:
                    os.remove(fp)
                except Exception:
                    pass
    except Exception:
        pass

@app.post("/api/info")
def get_media_info(req: InfoRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Keine URL angegeben")

    ydl_opts = {
        'skip_download': True,
        'extract_flat': False,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'socket_timeout': 15,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            duration = info.get("duration", 0)
            mins = duration // 60
            secs = duration % 60
            dur_str = f"{mins}:{secs:02d}" if duration > 0 else "Unbekannt"

            return {
                "success": True,
                "title": info.get("title", "Video"),
                "uploader": info.get("uploader") or info.get("channel", "Unbekannt"),
                "thumbnail": info.get("thumbnail", ""),
                "duration": dur_str,
                "formats": [
                    {"id": "mp4_best", "label": "🎬 MP4 Video (Beste Qualitaet)", "type": "video"},
                    {"id": "mp3", "label": "🎵 MP3 Audio (Reine Tonspur)", "type": "audio"}
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fehler beim Abrufen der Video-Info: {str(e)}")

@app.get("/api/download")
def download_media(url: str, format_type: str = "mp4_best", background_tasks: BackgroundTasks = None):
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Keine URL angegeben")

    clean_old_files()

    file_id = str(uuid.uuid4())[:8]
    output_template = os.path.join(DOWNLOADS_DIR, f"{file_id}_%(title).100s.%(ext)s")

    if format_type == "mp3":
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
            'socket_timeout': 30,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }
    else:
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
            'socket_timeout': 30,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'merge_output_format': 'mp4',
        }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title", "download")
            
        generated_file = None
        for f in os.listdir(DOWNLOADS_DIR):
            if f.startswith(file_id):
                generated_file = os.path.join(DOWNLOADS_DIR, f)
                break

        if not generated_file or not os.path.exists(generated_file):
            raise HTTPException(status_code=500, detail="Datei konnte nach Download nicht gefunden werden.")

        ext = "mp3" if format_type == "mp3" else "mp4"
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '_', '-')).strip() or "media"
        filename = f"{safe_title}.{ext}"

        if background_tasks:
            def _remove():
                try:
                    time.sleep(30)
                    if os.path.exists(generated_file):
                        os.remove(generated_file)
                except Exception:
                    pass
            background_tasks.add_task(_remove)

        return FileResponse(
            generated_file,
            filename=filename,
            media_type="audio/mpeg" if format_type == "mp3" else "video/mp4"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download-Fehler: {str(e)}")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"status": "MediaGrab API running"}
