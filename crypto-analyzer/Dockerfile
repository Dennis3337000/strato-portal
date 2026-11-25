FROM python:3.11-slim
WORKDIR /app

# Python-Dependencies installieren
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir fastapi uvicorn pydantic

# Backend & vorkompiliertes Frontend kopieren
COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/

WORKDIR /app/backend
ENV PYTHONPATH=/app/backend

EXPOSE 80

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
