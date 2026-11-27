#!/bin/bash
echo "=== 1. Erstelle gemeinsames Netzwerk ==="
docker network create shared-strato-network || true

# Ermittle modernen Docker Compose Befehl
if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi
echo "Verwende Compose Befehl: $COMPOSE"

echo "=== 2. Passe CryptoAnalyzer an ==="
cd /root/CryptoAnalyzer || cd ~/CryptoAnalyzer
$COMPOSE down || true

# Ersetze Ports in der compose Datei (Port 80 blockieren)
sed -i 's/ports:/#ports:/g' docker-compose.yml
sed -i 's/- "80:80"/#- "80:80"/g' docker-compose.yml
sed -i "s/- '80:80'/#- '80:80'/g" docker-compose.yml

# Hänge das Netzwerk ans Ende der Datei an, falls es noch nicht da ist
grep -q "shared-strato-network" docker-compose.yml || echo '
networks:
  shared-strato-network:
    external: true' >> docker-compose.yml

grep -q "\- shared-strato-network" docker-compose.yml || sed -i '/restart: always/a\    networks:\n      - shared-strato-network' docker-compose.yml

sed -i 's/services:/services:\n  cryptoanalyzer:\n    extends:\n      service: app/' docker-compose.yml

$COMPOSE up -d

echo "=== 3. Lade Strato-Portal neu ==="
cd /root/strato-portal || cd ~/strato-portal
git pull

# Automatische Erstellung der .env aus .env.example falls noch nicht vorhanden
if [ ! -f "crypto-analyzer/backend/.env" ] && [ -f "crypto-analyzer/backend/.env.example" ]; then
    cp crypto-analyzer/backend/.env.example crypto-analyzer/backend/.env
fi

$COMPOSE down || true
$COMPOSE up -d --build

echo "=== FERTIG! Dein Portal sollte jetzt online sein. ==="
