# Media Pulse Dashboard

Ein internes Audio-/Video-Best-Practice-Dashboard für digitale Medienprodukte.

## Lokaler Start

1. Node.js 20.9 oder neuer installieren.
2. `npm install` ausführen.
3. `.env.example` nach `.env.local` kopieren und mindestens `AUTH_SECRET` sowie `DASHBOARD_PASSWORD` setzen.
4. `npm run dev` ausführen und `http://localhost:3000` öffnen.

## Enthaltene V1-Oberfläche

- Filterbares Dashboard für Audio/Video, Publisher/andere Branchen und Quellen.
- Detailansicht mit übertragbarer Maßnahme und belastbaren KPI-Belegen.
- Gemeinsamer Passwortzugang mit signierter, 14 Tage gültiger HttpOnly-Session.
- Persönliche Merkliste (UI-Prototyp; Persistenzschnittstelle vorbereitet).
- Review-Queue und Quellenverwaltung.
- Öffentliche RSS-Importe von Nieman Lab, Digiday, Press Gazette, Podnews, Horizont und dem YouTube Official Blog; neue Treffer werden immer zuerst redaktionell geprüft.
- API: `GET /api/cases` und `GET /api/health`.

## Produktionsintegration

Die Demo-Daten liegen in `src/lib/cases.ts`. Für den Betrieb diese Schicht durch PostgreSQL ersetzen und `Source`, `IngestionRun`, `Case`, `PerformanceMetric`, `ReviewDecision` und `UserSavedCase` persistieren. Der tägliche Import wird über einen Cron-Trigger um 06:00 Europe/Berlin aufgerufen. Öffentliche RSS/API-Quellen sind gegenüber HTML-Abrufen vorzuziehen; Mitgliederinhalte dürfen nur als Link/Metadatum erfasst werden.

Der Zugang ist absichtlich passwortbasiert: Das Team teilt `DASHBOARD_PASSWORD` über 1Password. Passwort und `AUTH_SECRET` werden ausschließlich in `.env.local` bzw. den geschützten Umgebungsvariablen des Hosters gespeichert. Bei einem vollständigen Sitzungs-Reset `AUTH_SECRET` ändern.
