# Stripe Setup Anleitung

Diese Anleitung führt dich durch die vollständige Einrichtung von Stripe für das Premium-Abo-System.

## 1. Stripe Account erstellen

1. Gehe zu [stripe.com](https://stripe.com/de)
2. Erstelle einen Account (oder logge dich ein)
3. Aktiviere Test-Modus für Entwicklung
4. Später: Aktiviere Live-Modus für Production

## 2. Produkt und Preis erstellen

### Im Stripe Dashboard:

1. Navigiere zu **Produkte** → **+ Produkt hinzufügen**
2. Gebe Produktinformationen ein:
   - Name: `ImmoVest Premium`
   - Beschreibung: `Unbegrenzte Markt- & Lageanalysen mit KI-Unterstützung`
3. Wähle **Wiederkehrend** (Subscription)
4. Preis einrichten:
   - Preis: `19,90 €`
   - Abrechnungsintervall: `Monatlich`
   - Währung: `EUR`
5. Klicke auf **Produkt erstellen**
6. **Wichtig**: Kopiere die **Price ID** (beginnt mit `price_...`)

## 3. API Keys kopieren

### Im Stripe Dashboard → **Entwickler** → **API-Schlüssel**:

**Test-Modus Keys:**
```
Publishable key: pk_test_...
Secret key: sk_test_...
```

**Live-Modus Keys** (später):
```
Publishable key: pk_live_...
Secret key: sk_live_...
```

⚠️ **WICHTIG**: Secret Keys niemals im Code oder Git einchecken!

## 4. Webhook einrichten

### Webhook für Localhost (Entwicklung):

1. Installiere Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
   tar -xvf stripe_linux_x86_64.tar.gz
   ```

2. Authentifiziere die CLI:
   ```bash
   stripe login
   ```

3. Starte Webhook Forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Kopiere den **Webhook Secret** (beginnt mit `whsec_...`)

### Webhook für Production:

1. Gehe zu **Entwickler** → **Webhooks** → **+ Endpunkt hinzufügen**
2. URL: `https://deine-domain.de/api/stripe/webhook`
3. Wähle folgende Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Klicke auf **Endpunkt hinzufügen**
5. Kopiere den **Webhook-Signing-Secret** (beginnt mit `whsec_...`)

## 5. Environment Variables setzen

Aktualisiere deine `.env.local` Datei:

```bash
# Clerk (bereits vorhanden)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe (NEU)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Supabase (falls noch nicht aktiviert)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 6. App neu starten

```bash
# Server stoppen (Ctrl+C)
# Dann neu starten:
npm run dev
```

## 7. Testen (Test-Modus)

### Test-Kreditkarten:

| Karte                | Nummer              | Ergebnis          |
|----------------------|---------------------|-------------------|
| Erfolg               | 4242 4242 4242 4242 | Zahlung erfolgreich |
| Ablehnung (Insufficient Funds) | 4000 0000 0000 9995 | Zahlung abgelehnt |
| SEPA-Lastschrift     | DE89370400440532013000 | SEPA erfolgreich |

**CVV**: Beliebig (z.B. 123)
**Ablaufdatum**: Beliebiges zukünftiges Datum (z.B. 12/34)
**PLZ**: Beliebig (z.B. 10115)

### Test-Ablauf:

1. Erstelle eine Analyse in der App
2. Klicke auf "Markt" Tab (Premium-Feature)
3. Modal erscheint: Klicke "Jetzt Premium werden"
4. Wirst zu Stripe Checkout weitergeleitet
5. Verwende Test-Kreditkarte: `4242 4242 4242 4242`
6. Fülle Formular aus und bestätige
7. Wirst zurück zu `/dashboard?success=true` geleitet
8. Premium sollte aktiviert sein

### Webhook-Events prüfen:

In separatem Terminal (wenn Stripe CLI läuft):
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Du solltest folgende Events sehen:
```
✔ Webhook received: checkout.session.completed
✔ Webhook received: customer.subscription.created
```

### In Supabase prüfen:

```sql
SELECT * FROM user_premium_usage WHERE user_id = 'your_user_id';
```

Sollte zeigen:
```
is_premium: true
premium_until: [Datum in 1 Monat]
stripe_customer_id: cus_...
stripe_subscription_id: sub_...
```

## 8. Customer Portal (optional aber empfohlen)

### Im Stripe Dashboard:

1. Gehe zu **Einstellungen** → **Abrechnungsportal**
2. Aktiviere das Customer Portal
3. Konfiguriere erlaubte Aktionen:
   - ✅ Abonnement kündigen
   - ✅ Zahlungsmethode aktualisieren
   - ✅ Rechnungen anzeigen
   - ❌ Abonnement pausieren (optional)
4. Speichern

### Customer Portal integrieren:

Aktualisiere `/src/app/profile/page.tsx`:

```typescript
const handleManageSubscription = async () => {
  const response = await fetch('/api/stripe/portal', {
    method: 'POST',
  });
  const { url } = await response.json();
  window.location.href = url;
};
```

Erstelle `/src/app/api/stripe/portal/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get customer ID from Supabase
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('user_premium_usage')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!data?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${req.headers.get('origin')}/profile`,
  });

  return NextResponse.json({ url: session.url });
}
```

## 9. Production Deployment

### Vor dem Live-Schalten:

1. **Aktiviere Supabase** (siehe `SUPABASE_SETUP.md`)
2. **Teste alles im Test-Modus** gründlich
3. **Wechsel zu Live-Modus** in Stripe Dashboard
4. **Aktualisiere Environment Variables** mit Live Keys:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PRICE_ID=price_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```
5. **Erstelle Production Webhook** (siehe Schritt 4)
6. **Teste Checkout-Flow** mit echter Kreditkarte (klein starten!)
7. **Monitoring aktivieren**: Stripe Dashboard → Logs

## 10. Troubleshooting

### "No publishable key provided"
- Checke ob `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local` gesetzt ist
- Server neu starten nach Änderung

### "Webhook signature verification failed"
- Checke ob `STRIPE_WEBHOOK_SECRET` korrekt ist
- Bei Localhost: Stripe CLI muss laufen
- Bei Production: Webhook-URL muss HTTPS sein

### "Premium nicht aktiviert nach Zahlung"
- Checke Webhook-Logs in Stripe Dashboard
- Checke Server-Logs für Fehler
- Prüfe ob Supabase korrekt konfiguriert ist
- Manuell in Supabase checken: `SELECT * FROM user_premium_usage`

### "Checkout-Session erstellen fehlgeschlagen"
- Checke `STRIPE_PRICE_ID` ist korrekt
- Checke `STRIPE_SECRET_KEY` ist gesetzt
- Checke Server-Logs

## 11. Best Practices

### Sicherheit:
- ✅ Verwende Environment Variables für alle Keys
- ✅ Niemals Secret Keys im Frontend-Code
- ✅ Verifiziere Webhook-Signaturen
- ✅ Nutze HTTPS in Production
- ✅ Checke User-ID bei jeder API-Anfrage

### Testing:
- ✅ Teste alle Webhook-Events
- ✅ Teste Subscription Renewal
- ✅ Teste Subscription Cancellation
- ✅ Teste Failed Payments
- ✅ Teste mit verschiedenen Zahlungsmethoden

### Monitoring:
- ✅ Stripe Dashboard → Logs regelmäßig checken
- ✅ Failed Payments beobachten
- ✅ Webhook-Events tracken
- ✅ Error-Monitoring einrichten (z.B. Sentry)

## Support

Bei Problemen:
1. Stripe Dashboard → Logs checken
2. Browser Console checken
3. Server-Logs checken
4. Stripe CLI verwenden für Debugging
5. Stripe Support kontaktieren (exzellent!)

## Nächste Schritte

- [ ] Stripe Account erstellt
- [ ] Produkt und Preis konfiguriert
- [ ] API Keys kopiert
- [ ] Webhook eingerichtet
- [ ] Environment Variables gesetzt
- [ ] Test-Zahlung durchgeführt
- [ ] Webhook-Events verifiziert
- [ ] Premium-Status aktiviert
- [ ] Customer Portal eingerichtet
- [ ] Production-Webhook konfiguriert
