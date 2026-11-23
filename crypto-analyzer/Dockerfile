FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install fastapi uvicorn pydantic

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PYTHONPATH=/app/backend
# Der Frontend Code ist jetzt kompiliert, das Backend muss es als StaticFiles servieren (falls das Setup so war).
# Wenn das Backend nicht darauf vorbereitet ist, müssen wir FastAPI kurz patchen.

EXPOSE 80

# Annahme: das Backend startet per main.py oder uvicorn. 
# Wenn main.py den uvicorn Server startet (Port anpassen, falls nicht 80)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
