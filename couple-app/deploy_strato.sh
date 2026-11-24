#!/bin/bash
# ==============================================================================
# Couple App - Strato Server Deployment Script
# ==============================================================================
set -e

echo "=== [1/3] Aktualisiere Code von GitHub ==="
git pull origin main

echo "=== [2/3] Docker Container neu bauen & starten ==="
docker-compose down
docker-compose up -d --build

echo "=== [3/3] Erfolgreich bereitgestellt! ==="
echo "Die App laeuft jetzt auf Port 8000."
docker-compose ps
