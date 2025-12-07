# Stripe Live Webhook Konfiguration

## Wichtig: Diese Anleitung nur für Production/Live-Umgebung!

Nach dem Deployment deiner App musst du den Stripe Live Webhook konfigurieren, damit Zahlungen korrekt verarbeitet werden.

## Schritt 1: Deine Production URL ermitteln

Deine Webhook-URL wird sein:
```
https://DEINE-DOMAIN.de/api/stripe/webhook
```

Beispiel:
- Vercel: `https://immovest.vercel.app/api/stripe/webhook`
- Eigene Domain: `https://immovest.de/api/stripe/webhook`

## Schritt 2: Webhook in Stripe Dashboard erstellen

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com)
2. **Stelle sicher, dass du im LIVE-Modus bist** (nicht Test-Modus)
3. Navigiere zu **Entwickler** → **Webhooks**
4. Klicke auf **+ Endpunkt hinzufügen**

## Schritt 3: Webhook konfigurieren

### Endpunkt-URL:
```
https://DEINE-DOMAIN.de/api/stripe/webhook
```

### Zu sendende Events:
Wähle folgende Events aus:

- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### API-Version:
- Wähle **Letzte API-Version** oder `2025-10-29` (passend zum Code)

## Schritt 4: Webhook Secret kopieren

1. Nach dem Erstellen des Webhooks, klicke auf den Endpunkt
2. Im Bereich **Signing secret** klicke auf **Einblenden**
3. Kopiere den Webhook-Secret (beginnt mit `whsec_...`)

## Schritt 5: Environment Variable aktualisieren

Aktualisiere deine `.env.local` Datei:

```bash
STRIPE_WEBHOOK_SECRET=whsec_IHR_WEBHOOK_SECRET_HIER
```

**WICHTIG für Production Deployment:**
- **Vercel**: Füge `STRIPE_WEBHOOK_SECRET` in den Vercel Environment Variables hinzu
- **Andere Plattformen**: Füge die Variable in deiner Deployment-Plattform hinzu

## Schritt 6: Deployment neu starten

Nach dem Hinzufügen der Environment Variable:
- **Vercel**: Triggere ein neues Deployment (oder es deployed automatisch)
- **Andere**: Starte deine App neu

## Schritt 7: Webhook testen

### Test-Zahlung durchführen:

1. Öffne deine Live-App
2. Gehe zu den Pricing-Seiten
3. Wähle ein Abo aus
4. Verwende eine **echte** Kreditkarte (oder Test-Karte, wenn noch im Test-Modus)
5. Schließe den Checkout ab

### Test-Kreditkarten (nur im Test-Modus):
```
Nummer: 4242 4242 4242 4242
CVV: 123
Ablaufdatum: 12/34
PLZ: 10115
```

### Webhook-Events überprüfen:

1. Gehe zu **Stripe Dashboard** → **Entwickler** → **Webhooks**
2. Klicke auf deinen Endpunkt
3. Prüfe den Tab **Neueste Ereignisse**
4. Erfolgreiche Events haben einen grünen Haken ✅
5. Fehlgeschlagene Events haben ein rotes X ❌

## Häufige Probleme

### Problem: "Webhook signature verification failed"

**Lösung:**
- Checke, ob `STRIPE_WEBHOOK_SECRET` korrekt in den Environment Variables gesetzt ist
- Stelle sicher, dass du den Secret vom LIVE Webhook kopiert hast (nicht Test)
- Deployment neu starten nach Änderung der Environment Variable

### Problem: "404 Not Found" beim Webhook

**Lösung:**
- Prüfe, ob die Webhook-URL korrekt ist
- Stelle sicher, dass `/api/stripe/webhook` in deiner deployed App erreichbar ist
- Teste die URL manuell: `curl https://DEINE-DOMAIN.de/api/stripe/webhook`

### Problem: "Premium nicht aktiviert nach Zahlung"

**Lösung:**
1. Checke Webhook-Logs in Stripe Dashboard
2. Prüfe Server-Logs für Fehler
3. Stelle sicher, dass Supabase korrekt konfiguriert ist
4. Manuell in Supabase checken:
   ```sql
   SELECT * FROM user_premium_usage WHERE user_id = 'user_xxx';
   ```

### Problem: "Timeout" oder "No response"

**Lösung:**
- Webhook-Handler läuft zu lange (>30 Sekunden)
- Prüfe, ob Supabase-Verbindung funktioniert
- Checke Server-Logs für Performance-Probleme

## Monitoring

### Regelmäßig checken:

1. **Stripe Dashboard** → **Entwickler** → **Webhooks** → Dein Endpunkt
   - Erfolgsrate sollte >99% sein
   - Fehlgeschlagene Events analysieren

2. **Stripe Dashboard** → **Logs**
   - API-Fehler überwachen
   - Checkout-Session Fehler checken

3. **Application Logs** (Vercel/Server)
   - Webhook-Verarbeitungs-Fehler
   - Supabase-Verbindungsfehler

## Rollback (Falls etwas schiefgeht)

### Zurück zu Test-Modus:

1. Ändere Environment Variables zurück zu Test-Keys:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

2. Deployment neu starten

3. Checke, dass alle Features im Test-Modus funktionieren

## Sicherheit-Checkliste

- ✅ Webhook-Signatur wird im Code verifiziert (bereits implementiert)
- ✅ HTTPS wird für Webhook-URL verwendet (Production)
- ✅ Secret Keys sind NICHT im Code hardcoded
- ✅ `.env.local` ist in `.gitignore` (bereits konfiguriert)
- ✅ Environment Variables sind in Production-Plattform gesetzt
- ✅ User-ID wird bei jeder API-Anfrage überprüft (bereits implementiert)

## Support & Debugging

### Stripe CLI für lokales Debugging:

```bash
# Login
stripe login

# Forward webhooks zu localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

### Nützliche Stripe Dashboard URLs:

- Webhooks: https://dashboard.stripe.com/webhooks
- Logs: https://dashboard.stripe.com/logs
- Events: https://dashboard.stripe.com/events
- Customers: https://dashboard.stripe.com/customers
- Subscriptions: https://dashboard.stripe.com/subscriptions

## Nächste Schritte nach Webhook-Setup

- [ ] Webhook in Stripe Dashboard erstellt
- [ ] Webhook Secret kopiert
- [ ] Environment Variable hinzugefügt (Production)
- [ ] Deployment neu gestartet
- [ ] Test-Zahlung durchgeführt
- [ ] Webhook-Events erfolgreich empfangen
- [ ] Premium-Status in Supabase aktiviert
- [ ] Monitoring eingerichtet

## Bei Fragen

Stripe Support ist exzellent und hilft bei Problemen:
- https://support.stripe.com
- Live Chat im Stripe Dashboard
