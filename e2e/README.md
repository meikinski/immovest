# Ende-zu-Ende-Tests

Echte Seiten im Browser (Playwright), echte Clerk-Oberfläche, aber ohne Clerk-Konto, ohne Netz und ohne Kosten:

- `clerkMock.ts` beantwortet Clerks Frontend-API (Umgebung, Client, Anmeldung, Sitzung) und liefert clerk-js
  und `@clerk/ui` aus lokal entpackten npm-Paketen. Sitzungs-Tokens sind echte RS256-JWTs; der Next-Server
  prüft sie offline über `CLERK_JWT_KEY`.
- Inserat-Import, KI und Datenbank werden im Browser simuliert (`simuliereApis`).

## Ausführen

```bash
npm run e2e:setup   # einmalig: clerk-js und @clerk/ui nach e2e/.clerk-pakete (nicht im Git)
npm run e2e         # startet next dev auf Port 3210 und führt die Fälle aus
```

Variablen:

| Variable | Wirkung |
|---|---|
| `E2E_CHROMIUM_PATH` | Pfad zu einem vorinstallierten Chromium (sonst der von Playwright) |
| `E2E_PROD=1` | `next start` statt `next dev` (vorher `npm run build`, mit den Clerk-Variablen aus `server.ts`) |
| `E2E_BASE_URL` | Server läuft schon (mit denselben Clerk-Variablen), nicht selbst starten |
| `E2E_SERVER_LOG=1` | Ausgabe des Next-Servers anzeigen |
| `E2E_SENTRY_DSN` | Fehlerüberwachung im Test an einen lokalen Empfänger schicken |

## Fälle

`anmelde-rueckkehr.e2e.ts`: Gast importiert eine Wohnung → Ergebnis → Anmeldung → Wohnung ist noch da:

1. über „Anmelden" in der Kopfzeile der Ergebnis-Seite
2. über „Anmelden" auf `/pricing` (ohne Rücksprung)
3. mit Rücksprung auf `/input-method`, das die Eingaben zurücksetzt

`auth-screenshots.ts` (`npm run e2e:screenshots`): Fotos von `/sign-up` und `/sign-in` auf dem Handy nach `docs/pr-screenshots/`.
