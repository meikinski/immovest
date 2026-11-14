# Fehlerüberwachung (Sentry)

Anlass: Das Speichern von Analysen ist in Produktion mit HTTP 500 fehlgeschlagen, ohne dass es jemand gemerkt hat.
Seitdem meldet die App Fehler an Sentry und Sentry schickt E-Mails.

## Warum Sentry

| | Sentry (Developer, kostenlos) | Vercel Observability | Better Stack / Logtail |
|---|---|---|---|
| Fehler gruppiert, „neuer Fehler" erkannt | ja | nein (nur Logs/Metriken) | nein (Log-Suche) |
| Browser **und** Server (Node + Edge) | ja, offizielles Next.js-SDK | nur Server | über Log-Drain, Browser extra |
| E-Mail-Alarm bei neuem Fehler / Schwelle pro Stunde | ja | Alarme erst im Pro-Plan | ja |
| EU-Datenhaltung | ja (Region Frankfurt) | USA | ja |
| Kosten | 0 € (1 Nutzer, ca. 5.000 Fehler/Monat) | Pro-Plan nötig | 0 € mit Grenzen |

Sentry ist das Einzige davon, das „neuer Fehler" erkennt und gleichartige Fehler bündelt. Genau das hat beim Speicher-Fehler gefehlt.
Es läuft auf Vercel ohne eigenen Server, und das kostenlose Kontingent reicht für imvestr bei Weitem.

## Was gemeldet wird

- **Browser:** unbehandelte Fehler und Promise-Rejections (`src/instrumentation-client.ts`), Fehler in React-Fehlergrenzen (`app/error.tsx`, `app/global-error.tsx`).
- **Server:** unbehandelte Fehler in Seiten, Route-Handlern und Middleware (`onRequestError` in `src/instrumentation.ts`).
- **Jede 5xx-Antwort aus `/api`**: Alle Route-Handler sind mit `mitMonitoring('POST /api/analysis', …)` umhüllt (`src/lib/monitoring/apiRoute.ts`).
  - Geworfener Fehler → Exception mit Stacktrace (normale Gruppierung → Alarm „neuer Fehler").
  - Jede 5xx-Antwort → zusätzlich eine Meldung „POST /api/analysis antwortet mit HTTP 500" mit Tags `route`, `method`, `status`, `typ=api_5xx` und Fingerprint je Route. Alle 5xx einer Route landen dadurch in **einem** Issue; darauf greift der Alarm „mehr als 5 pro Stunde".
  - `POST /api/analysis` meldet beim Speicher-Fehler zusätzlich den Datenbank-Fehlercode (z. B. `22001`) als Ursache.

## Datenschutz

Gefiltert in `src/lib/monitoring/datenschutz.ts` (`beforeSend`/`beforeBreadcrumb`, getestet in `src/lib/__tests__/monitoring-datenschutz.test.ts`):

- Nutzer nur als **Hash**: SHA-256 über Salz + Clerk-ID, 32 Hex-Zeichen. Keine E-Mail, kein Name, keine IP (`sendDefaultPii: false`).
- Requests ohne Body, Header, Cookies und Query; URLs nur mit Pfad (z. B. `/api/geocode` statt `/api/geocode?q=<Adresse>`).
- Adressen (Straße + Hausnummer, PLZ + Ort), E-Mail-Adressen, Telefonnummern und Clerk-IDs werden in Fehlertexten durch `[adresse]`, `[plz-ort]` usw. ersetzt.
- Felder wie `adresse`, `email`, `city`, `lat/lng`, `token` werden aus Zusatzdaten entfernt.
- Konsolen-Breadcrumbs werden verworfen (die App loggt dort teils Eingaben).
- Kein Session-Replay, kein Performance-Tracing.
- Browser-Berichte gehen über `/monitoring` an Sentry (eigene Domain, Werbeblocker greifen nicht). Der Tunnel (`src/app/sentry-tunnel/route.ts`) leitet nur den Bericht weiter, keine Cookies oder Header.

## Einrichtung (einmalig, ca. 15 Minuten)

### 1. Sentry-Konto und Projekt

1. Auf sentry.io registrieren (Plan **Developer**, kostenlos). Beim Anlegen der Organisation als Datenregion **EU (Frankfurt)** wählen.
2. Projekt anlegen: Plattform **Next.js**, Name z. B. `imvestr-web`. Den angezeigten **DSN** kopieren (`https://…@o….ingest.de.sentry.io/…`). Den Installationsassistenten überspringen, der Code ist schon da.
3. Projekt → *Settings → Security & Privacy*:
   - **Prevent Storing of IP Addresses** einschalten
   - **Data Scrubber** und **Use Default Scrubbers** eingeschaltet lassen
4. Optional für lesbare Stacktraces: *Settings → Auth Tokens* → Organisations-Token erstellen (Scope reicht: Sourcemaps hochladen).

### 2. Variablen in Vercel

Vercel → Projekt → *Settings → Environment Variables* (Environment **Production**, für Previews optional):

| Variable | Pflicht | Wert |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | ja | DSN aus Schritt 1.2 |
| `NEXT_PUBLIC_MONITORING_HASH_SALT` | empfohlen | beliebige Zeichenkette, z. B. 32 Zufallszeichen; später nicht mehr ändern |
| `SENTRY_AUTH_TOKEN` | optional | Token aus Schritt 1.4 (Sourcemaps) |
| `SENTRY_ORG` | mit Token | Organisations-Slug aus der Sentry-URL |
| `SENTRY_PROJECT` | mit Token | `imvestr-web` |

Alternativ setzt die **Sentry-Integration im Vercel-Marketplace** DSN, Token, Org und Projekt automatisch. Das Salz bleibt trotzdem von Hand.

Danach neu deployen. Ohne `NEXT_PUBLIC_SENTRY_DSN` ist die Überwachung aus (lokal, Previews).

### 3. E-Mail-Alarme

Sentry → *Alerts → Create Alert → Issues* (die Bezeichnungen können je nach Sentry-Version leicht abweichen):

**Alarm 1: „Neuer Fehler"**
- Environment: `production`
- WHEN: *A new issue is created*, zusätzlich *The issue changes state from resolved to unresolved*
- THEN: *Send a notification to* → *Member* → du selbst (E-Mail)
- Action interval: 5 Minuten

**Alarm 2: „API-Route über 5 Fehler pro Stunde"**
- Environment: `production`
- WHEN: *Number of events in an issue is more than* **5** *in* **one hour**
- IF: *The event's tags match* `typ` *equals* `api_5xx`
- THEN: E-Mail an dich
- Action interval: 60 Minuten

Weil jede Route ihr eigenes 5xx-Issue hat, gilt Alarm 2 pro Route.
Unter *User Settings → Notifications → Issue Alerts* muss E-Mail eingeschaltet sein (Standard).

### 4. Testen

- Im Alarm jeweils *Send Test Notification* drücken → E-Mail kommt an.
- Browser-Fehler: auf imvestr.de in der Konsole `setTimeout(() => { throw new Error('Sentry-Test') })` ausführen → erscheint in Sentry unter *Issues*, Alarm 1 schickt eine E-Mail. Das Issue danach auf *Resolved* setzen.

## Lokal prüfen, was gesendet würde

```bash
node -e "require('http').createServer((q,s)=>{let b='';q.on('data',d=>b+=d);q.on('end',()=>{console.log(b);s.end('{}')})}).listen(3399)"
NEXT_PUBLIC_SENTRY_DSN=http://key@localhost:3399/1 npm run dev
```

Jede Fehler-Meldung erscheint dann im ersten Terminal, genau so, wie sie an Sentry ginge.
