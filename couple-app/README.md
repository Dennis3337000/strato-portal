# Couple Link ❤️ - Beziehungs-App MVP

Eine liebevoll gestaltete, mobile-first Web-App ("Cute & Clean" Ästhetik in sanften Pastelltönen), die Paare – auch in Fernbeziehungen – spielerisch und im Alltag miteinander verbindet.

---

## ✨ Features

- **🏠 Dashboard & Liebeszähler:** Gemeinsame Tage ("Seit X Tagen zusammen 💕"), Countdown-Banner, Live-Stimmungsradar und virtuelles Umarmungskonto.
- **📅 Interaktiver Kalender:** Dates und Reisen planen, Countdown zu wichtigen Jahrestagen, dynamische Tages-Badges (*Heute*, *Morgen*, *in X Tagen*).
- **🍲 Wöchentlicher Essensplan:** Montag bis Sonntag durchplanen, Koch-Zuweisung, Zufallsrezept-Würfel 🎲 und 1-Klick-Zutat auf die Einkaufsliste.
- **🔐 Paar-Quiz (Daily Question):** Antwort des Partners bleibt verpixelt und gesperrt, bis man selbst geantwortet hat! Inklusive Fragen-Deck zu Romantik, Erinnerungen & Zukunft.
- **📝 Gemeinsame Listen & Zettel:**
  - 🛒 **Einkaufsliste:** Posten abhaken (durchgestrichen) & Zähler-Badge in der Navigation.
  - 💖 **Bucket List:** Gemeinsame Lebensträume & Bucket-List-Ziele festhalten.
  - 💌 **Liebeszettel:** Bunte Haftnotizen mit Zeitstempel & Autorenname anpinnen.
- **📍 Distanz-Radar:** Echte Entfernungsberechnung (Haversine-Formel) zwischen Partner-Städten, ungefähre Reisezeiten (Bahn, Auto, Flug) und Fernbeziehungs-Umarmung.
- **⚙️ Multi-User Test:** Im Header oder Einstellungs-Menü mit 1 Klick zwischen *Partner A* und *Partner B* wechseln.

---

## 🚀 Schnellstart mit Docker (Empfohlen)

### 1. Starten
```bash
docker-compose up -d --build
```
Die App ist sofort unter `http://localhost:8000` im Browser erreichbar!

### 2. Beenden
```bash
docker-compose down
```

---

## 🛠️ Lokale Entwicklung

### Backend (FastAPI + SQLite)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

### Frontend (React 19 + Tailwind CSS V4 + Vite)
```bash
cd client
npm install
npm run dev
```

Frontend für die Produktion bauen (baut direkt nach `frontend/` für FastAPI):
```bash
npm run build
```

---

## 🌐 Deployment auf Strato vServer

1. Auf dem Strato-Server per SSH einloggen:
   ```bash
   git clone https://github.com/Dennis3337000/coupleapp.git
   cd coupleapp
   docker-compose up -d --build
   ```

2. Zukünftige Updates einspielen:
   ```bash
   ./deploy_strato.sh
   ```
