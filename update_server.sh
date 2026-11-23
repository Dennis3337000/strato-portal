#!/bin/bash
echo "=== 1. Erstelle gemeinsames Netzwerk ==="
docker network create shared-strato-network || true

echo "=== 2. Passe CryptoAnalyzer an ==="
cd /root/CryptoAnalyzer || cd ~/CryptoAnalyzer
docker-compose down

# Ersetze Ports in der compose Datei (Port 80 blockieren)
sed -i 's/ports:/#ports:/g' docker-compose.yml
sed -i 's/- "80:80"/#- "80:80"/g' docker-compose.yml
sed -i "s/- '80:80'/#- '80:80'/g" docker-compose.yml

# Hänge das Netzwerk ans Ende der Datei an, falls es noch nicht da ist
grep -q "shared-strato-network" docker-compose.yml || echo '
networks:
  shared-strato-network:
    external: true' >> docker-compose.yml

# Füge das Netzwerk zum Service hinzu (unter restart oder image, je nachdem was da ist)
grep -q "\- shared-strato-network" docker-compose.yml || sed -i '/restart: always/a\    networks:\n      - shared-strato-network' docker-compose.yml

# Service umbenennen zu 'cryptoanalyzer', damit Nginx ihn findet
sed -i 's/services:/services:\n  cryptoanalyzer:\n    extends:\n      service: app/' docker-compose.yml

docker-compose up -d

echo "=== 3. Lade Strato-Portal neu ==="
cd /root/strato-portal || cd ~/strato-portal
git pull
docker-compose down
docker-compose up -d --build

echo "=== FERTIG! Dein Portal sollte jetzt online sein. ==="
