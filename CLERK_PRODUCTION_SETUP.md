# Clerk Production Setup

Komplette Anleitung zur Umstellung von Clerk Test auf Production.

## Voraussetzungen

- ✅ Du hast bereits die Production-Instanz in Clerk geklont
- ✅ Du hast Zugriff auf das Clerk Dashboard

## 1. Production API Keys aus Clerk holen

### 1.1 Zum Production Dashboard wechseln

1. Gehe zu [clerk.com](https://clerk.com) und melde dich an
2. Oben links: Wähle deine **Production-Instanz** aus (nicht Test!)
3. Du erkennst die Production-Instanz daran, dass die Keys mit `pk_live_` beginnen

### 1.2 API Keys kopieren

1. Gehe zu **"Developers"** → **"API Keys"** im Clerk Dashboard
2. Kopiere beide Keys:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   ```

**WICHTIG**: Die Keys müssen mit `pk_live_` und `sk_live_` beginnen (NICHT `pk_test_` oder `sk_test_`)

## 2. Domain-Konfiguration in Clerk

### 2.1 Production Domain hinzufügen

1. In Clerk Dashboard: Gehe zu **"Domains"**
2. Klicke auf **"Add domain"**
3. Füge deine Production-Domain hinzu:
   - **Development**: `http://localhost:3000` (für lokales Testen mit Production-Keys)
   - **Production**: `https://deine-domain.vercel.app` oder `https://immovest.de`

### 2.2 Authorized Redirect URLs konfigurieren

In Clerk Dashboard unter **"Paths"** → **"Sign-in"** und **"Sign-up"**:

#### Sign-in URL
```
/sign-in
```

#### Sign-up URL
```
/sign-up
```

#### Redirect URLs nach Sign-in/Sign-up
```
/input-method
```

**Diese URLs sind bereits im Code konfiguriert** (siehe `src/app/(auth)/layout.tsx` und die Sign-In/Sign-Up Pages), du musst sie nur in Clerk bestätigen.

## 3. Environment Variables aktualisieren

### 3.1 Lokale Entwicklung (.env.local)

Aktualisiere deine `.env.local` Datei mit den neuen Production-Keys:

```bash
# Clerk Authentication (PRODUCTION)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[dein-publishable-key-hier]
CLERK_SECRET_KEY=sk_live_[dein-secret-key-hier]

# Alle anderen Variablen bleiben gleich...
```

**Testen**: Starte deinen lokalen Dev-Server und teste Sign-In/Sign-Up:
```bash
npm run dev
```

### 3.2 Vercel Production Environment

1. Gehe zu deinem Vercel Dashboard
2. Wähle dein Projekt aus
3. Gehe zu **"Settings"** → **"Environment Variables"**
4. **Aktualisiere** die beiden Clerk-Variablen:

| Variable | Wert | Umgebung |
|----------|------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Production, Preview, Development |
| `CLERK_SECRET_KEY` | `sk_live_...` | Production, Preview, Development |

**WICHTIG**:
- Lösche die alten Test-Keys
- Setze die neuen Production-Keys für ALLE Umgebungen (Production, Preview, Development)

### 3.3 Deployment neu starten

Nach dem Aktualisieren der Environment Variables:

1. In Vercel: Gehe zu **"Deployments"**
2. Wähle das letzte Deployment aus
3. Klicke auf **"..."** → **"Redeploy"**
4. Warte bis das Deployment abgeschlossen ist

## 4. OAuth-Provider konfigurieren (falls verwendet)

Falls du OAuth-Provider (Google, GitHub, etc.) nutzt:

### 4.1 In Clerk Dashboard

1. Gehe zu **"User & Authentication"** → **"Social Connections"**
2. Für jeden aktivierten Provider (z.B. Google):
   - Klicke auf **"Configure"**
   - **Authorized redirect URIs** sollte automatisch gesetzt sein auf:
     ```
     https://<clerk-subdomain>.clerk.accounts.dev/v1/oauth_callback
     ```

### 4.2 OAuth-Apps aktualisieren

Falls du eigene OAuth-Apps hast (z.B. Google Cloud Console):

1. Gehe zur jeweiligen Developer Console (Google, GitHub, etc.)
2. Aktualisiere die **Authorized redirect URIs**:
   ```
   https://<deine-production-clerk-subdomain>.clerk.accounts.dev/v1/oauth_callback
   https://deine-domain.vercel.app
   https://immovest.de
   ```

## 5. Webhooks aktualisieren (falls vorhanden)

Falls du Clerk Webhooks nutzt:

1. In Clerk Dashboard: Gehe zu **"Webhooks"**
2. Aktualisiere die Endpoint-URL:
   ```
   https://deine-domain.vercel.app/api/webhooks/clerk
   ```
3. Kopiere den **Signing Secret** und aktualisiere in Vercel:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

## 6. Testen der Production-Konfiguration

### 6.1 Lokales Testen

1. Stelle sicher, dass `.env.local` die Production-Keys enthält
2. Starte den Dev-Server:
   ```bash
   npm run dev
   ```
3. Teste folgende Flows:
   - ✅ Sign-Up mit neuer Email
   - ✅ Sign-In mit existierendem User
   - ✅ Sign-Out
   - ✅ Redirect nach Sign-In funktioniert (`/input-method`)
   - ✅ Protected Routes funktionieren (z.B. `/dashboard`)

### 6.2 Production-Testen

1. Gehe zu deiner Production-URL: `https://deine-domain.vercel.app`
2. Teste dieselben Flows wie oben
3. Prüfe, dass keine Fehler in der Browser-Console erscheinen

### 6.3 Vercel Logs prüfen

1. In Vercel: Gehe zu **"Logs"**
2. Prüfe auf Clerk-bezogene Fehler
3. Achte besonders auf:
   - `Invalid publishable key`
   - `Clerk authentication failed`
   - `Redirect errors`

## 7. Rollback (falls nötig)

Falls etwas schiefgeht und du zurück zu Test-Keys willst:

1. In Vercel: Aktualisiere Environment Variables zurück zu:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
2. Redeploy durchführen

## Checkliste

Bevor du die Umstellung abschließt, stelle sicher:

- [ ] Production API Keys aus Clerk kopiert (`pk_live_` und `sk_live_`)
- [ ] Production-Domain in Clerk hinzugefügt
- [ ] Redirect URLs in Clerk konfiguriert (`/sign-in`, `/sign-up`, `/input-method`)
- [ ] Environment Variables in Vercel aktualisiert
- [ ] Vercel Deployment neugestartet
- [ ] OAuth-Provider konfiguriert (falls verwendet)
- [ ] Webhooks aktualisiert (falls vorhanden)
- [ ] Sign-Up funktioniert in Production
- [ ] Sign-In funktioniert in Production
- [ ] Protected Routes funktionieren
- [ ] Keine Fehler in Vercel Logs

## Wichtige Hinweise

### Unterschied Test vs. Production

| Eigenschaft | Test (`pk_test_`) | Production (`pk_live_`) |
|-------------|-------------------|-------------------------|
| **Benutzer** | Test-User, werden nicht gespeichert | Echte User, bleiben dauerhaft |
| **Emails** | Keine echten Emails | Echte Emails werden versendet |
| **Limits** | Niedrige Limits | Höhere Limits (je nach Plan) |
| **Billing** | Kostenlos | Nach Plan |

### Sicherheit

- **NIEMALS** committen: Setze Production-Keys NUR in Vercel Environment Variables und `.env.local` (nicht `.env.local.example`)
- `.env.local` ist bereits in `.gitignore` → sichere Entwicklung
- Production Secret Key (`sk_live_`) niemals im Frontend-Code verwenden

### Monitoring

Nach der Umstellung solltest du beobachten:

1. **Clerk Dashboard** → **"Users"**: Neue Sign-Ups sollten erscheinen
2. **Vercel Logs**: Keine Authentication-Errors
3. **Analytics**: User-Aktivität tracken

## Support

Falls Probleme auftreten:

1. **Clerk Docs**: [https://clerk.com/docs](https://clerk.com/docs)
2. **Clerk Support**: support@clerk.com
3. **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)

## Nächste Schritte

Nach erfolgreicher Umstellung:

1. ✅ Stripe ebenfalls auf Production umstellen (siehe `STRIPE_SETUP.md`)
2. ✅ Monitoring & Analytics einrichten
3. ✅ Backup-Strategie für User-Daten planen
4. ✅ Email-Templates in Clerk anpassen (optional)
