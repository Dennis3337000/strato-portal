#!/bin/bash
# ==============================================================================
# Couple App - Strato Server Deployment Script
# ==============================================================================
set -e

echo "=== [1/3] Aktualisiere Code von GitHub ==="
git pull origin main

echo "=== [2/3] Docker Container neu bauen & starten ==="
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "Verwende: $COMPOSE_CMD"
$COMPOSE_CMD down || true
$COMPOSE_CMD up -d --build

echo "=== [3/3] Erfolgreich bereitgestellt! ==="
echo "Die App laeuft jetzt auf Port 8000."
$COMPOSE_CMD ps
