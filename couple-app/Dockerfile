FROM python:3.11-slim

WORKDIR /app

# Installiere Abhängigkeiten
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere das Backend
COPY backend/ ./backend/

# Kopiere das Frontend
COPY frontend/ ./frontend/

# Setze den PYTHONPATH, falls nötig
ENV PYTHONPATH=/app

# Expose Port 8000
EXPOSE 8000

# Starte die App
CMD ["python", "backend/main.py"]
