# Media Pulse Dashboard

Ein internes Audio-/Video-Best-Practice-Dashboard für digitale Medienprodukte.

## Lokaler Start

1. Node.js 20.9 oder neuer installieren.
2. `npm install` ausführen.
3. `.env.example` nach `.env.local` kopieren und die SSO-/Datenbankwerte ergänzen.
4. `npm run dev` ausführen und `http://localhost:3000` öffnen.

## Enthaltene V1-Oberfläche

- Filterbares Dashboard für Audio/Video, Publisher/andere Branchen und Quellen.
- Detailansicht mit übertragbarer Maßnahme und belastbaren KPI-Belegen.
- Persönliche Merkliste (UI-Prototyp; Persistenzschnittstelle vorbereitet).
- Review-Queue und Quellenverwaltung.
- API: `GET /api/cases` und `GET /api/health`.

## Produktionsintegration

Die Demo-Daten liegen in `src/lib/cases.ts`. Für den Betrieb diese Schicht durch PostgreSQL ersetzen und `Source`, `IngestionRun`, `Case`, `PerformanceMetric`, `ReviewDecision` und `UserSavedCase` persistieren. Der tägliche Import wird über einen Cron-Trigger um 06:00 Europe/Berlin aufgerufen. Öffentliche RSS/API-Quellen sind gegenüber HTML-Abrufen vorzuziehen; Mitgliederinhalte dürfen nur als Link/Metadatum erfasst werden.

Für SSO sind Google- oder Microsoft-Entra-OIDC-Anbieter vorgesehen. Die nach der Anmeldung geprüfte E-Mail-Domain muss aus `ALLOWED_EMAIL_DOMAINS` stammen.
