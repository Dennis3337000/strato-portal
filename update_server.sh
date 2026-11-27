#!/bin/bash
set -e

# Sicherstellen, dass wir im strato-portal Verzeichnis sind
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== 1. Ermittle Docker Compose Befehl ==="
if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi
echo "Verwende: $COMPOSE"

# Altes Standalone CryptoAnalyzer nur anfassen, wenn das Verzeichnis wirklich existiert
if [ -d "/root/CryptoAnalyzer" ] && [ "$SCRIPT_DIR" != "/root/CryptoAnalyzer" ]; then
    echo "=== 2. Stoppe altes Standalone CryptoAnalyzer ==="
    (cd /root/CryptoAnalyzer && $COMPOSE down || true)
fi

echo "=== 3. Lade Strato-Portal neu ==="
git checkout update_server.sh 2>/dev/null || true
git pull

# Automatische Erstellung der .env aus .env.example falls noch nicht vorhanden
if [ ! -f "crypto-analyzer/backend/.env" ] && [ -f "crypto-analyzer/backend/.env.example" ]; then
    cp crypto-analyzer/backend/.env.example crypto-analyzer/backend/.env
    echo "backend/.env wurde automatisch aus .env.example erstellt."
fi

# Loesche versehentlich erzeugte CRLF-Dateien falls vorhanden
rm -f "docker-compose.yml"*$'\r'* 2>/dev/null || true

echo "=== 4. Baue und starte alle Container neu ==="
$COMPOSE down || true
$COMPOSE up -d --build

echo "=== FERTIG! Dein Strato-Portal laeuft jetzt auf dem neuesten Stand. ==="
