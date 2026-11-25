import os
import time
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NetPulse - Highspeed Private Speedtest")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CHUNK_SIZE = 64 * 1024 # 64 KB
ZERO_CHUNK = b"\x00" * CHUNK_SIZE

@app.get("/api/ping")
def ping():
    return JSONResponse(
        content={"pong": True, "server_time": time.time()},
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache"
        }
    )

@app.get("/api/download")
def download_stream(bytes_count: int = 10 * 1024 * 1024): # Standard 10 MB
    # Begrenze max. Download-Chunk auf 50 MB pro Request
    total_bytes = max(1024 * 1024, min(50 * 1024 * 1024, bytes_count))

    def generate_chunks():
        sent = 0
        while sent < total_bytes:
            to_send = min(CHUNK_SIZE, total_bytes - sent)
            sent += to_send
            yield ZERO_CHUNK[:to_send]

    return StreamingResponse(
        generate_chunks(),
        media_type="application/octet-stream",
        headers={
            "Content-Length": str(total_bytes),
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Content-Disposition": "attachment; filename=speedtest.dat"
        }
    )

@app.post("/api/upload")
async def upload_stream(request: Request):
    total = 0
    start = time.time()
    async for chunk in request.stream():
        total += len(chunk)
    elapsed = max(0.001, time.time() - start)
    return JSONResponse(
        content={"received_bytes": total, "elapsed_seconds": round(elapsed, 4)},
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache"
        }
    )

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"status": "NetPulse Speedtest API online"}
