# Stripe Price IDs finden und konfigurieren

## Problem: Payment Links vs. Price IDs

**Aktuelle Situation:**
- Du hast Payment Links von Stripe:
  - Monatsabo: `https://buy.stripe.com/test_6oUeVe5H038238bLfZc1wY02`
  - Jahresabo: `https://buy.stripe.com/test_3cIeVe2uO2HJajTfZc1wY03`

**Warum wir Price IDs brauchen:**
Payment Links sind statisch und erlauben keine Metadata (userId) hinzuzufügen. Deshalb verwenden wir unsere eigene Checkout-Session API mit Price IDs.

---

## Option 1: Price IDs aus bestehenden Payment Links extrahieren

### Schritt 1: Price IDs im Stripe Dashboard finden

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Wähle **Products** in der linken Seitenleiste
3. Du solltest deine Produkte sehen:
   - "ImmoVest Premium Monat" (oder ähnlicher Name)
   - "ImmoVest Premium Jahr"
4. Klicke auf ein Produkt
5. Unter **Pricing** siehst du die **Price ID** (beginnt mit `price_...`)
6. Kopiere beide Price IDs:
   ```
   Monatsabo: price_1234567890abcdefg (Beispiel)
   Jahresabo: price_0987654321zyxwvut (Beispiel)
   ```

### Schritt 2: Price IDs in .env.local eintragen

```bash
# .env.local
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1234567890abcdefg
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_0987654321zyxwvut
```

---

## Option 2: Neue Produkte mit Price IDs erstellen

Falls du die Price IDs nicht findest, erstelle neue Produkte:

### Schritt 1: Monatsabo erstellen

1. Gehe zu **Products** → **+ Add product**
2. Fülle aus:
   - **Name**: ImmoVest Premium Monatlich
   - **Description**: Unbegrenzte Markt- & Lageanalysen mit KI-Unterstützung
   - **Pricing model**: Recurring (Wiederkehrend)
   - **Price**: 13.99 EUR
   - **Billing period**: Monthly (Monatlich)
3. Klicke **Save product**
4. **Kopiere die Price ID** (z.B. `price_...`)

### Schritt 2: Jahresabo erstellen

1. Gehe zu **Products** → **+ Add product**
2. Fülle aus:
   - **Name**: ImmoVest Premium Jährlich
   - **Description**: Spare 59% mit dem Jahresabo
   - **Pricing model**: Recurring
   - **Price**: 69.00 EUR
   - **Billing period**: Yearly (Jährlich)
3. Klicke **Save product**
4. **Kopiere die Price ID** (z.B. `price_...`)

### Schritt 3: Price IDs in .env.local eintragen

```bash
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_deine_monthly_id
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_deine_yearly_id
```

---

## Testabo wird nicht erkannt - Troubleshooting

### Problem: Ich habe ein Testabo in Stripe erstellt, aber die App erkennt es nicht

**Mögliche Ursachen:**

### 1. Supabase ist nicht eingerichtet

**Prüfen:**
```bash
# Checke ob diese Variablen in .env.local gesetzt sind:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Lösung:**
1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein Projekt
3. Führe das SQL-Schema aus: `supabase-schema.sql`
4. Kopiere die Keys (siehe `DEPLOYMENT.md`)

### 2. Webhook funktioniert nicht

**Prüfen:**
- Lokale Entwicklung: Stripe CLI muss laufen
- Production: Webhook-Endpoint muss konfiguriert sein

**Lokale Entwicklung - Stripe CLI Setup:**

```bash
# Terminal 1: Deine App
npm run dev

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Kopiere den Webhook-Secret aus der Ausgabe
# Füge ihn in .env.local ein:
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Testen:**
```bash
# Trigger einen Test-Checkout Event
stripe trigger checkout.session.completed
```

### 3. Manuell ein Testabo in Supabase erstellen

Falls du sofort testen willst, ohne Stripe:

1. Gehe zu [supabase.com](https://supabase.com) → Dein Projekt
2. Klicke auf **Table Editor** → `user_premium_usage`
3. Klicke **Insert** → **Insert row**
4. Fülle aus:
   ```
   user_id: deine_clerk_user_id (findest du in Clerk Dashboard)
   is_premium: true
   premium_until: 2025-12-31T23:59:59+00:00
   usage_count: 0
   ```
5. Klicke **Save**

**Wie finde ich meine Clerk User ID?**
1. Gehe zu [dashboard.clerk.com](https://dashboard.clerk.com)
2. Wähle deine Application
3. Klicke **Users**
4. Finde deinen Test-User
5. Kopiere die **User ID** (beginnt mit `user_...`)

### 4. Database-Check: Ist das Abo gespeichert?

**In Supabase:**
1. Gehe zu **Table Editor** → `user_premium_usage`
2. Suche deine User ID
3. Prüfe:
   - `is_premium` = true?
   - `premium_until` = Datum in der Zukunft?
   - `stripe_customer_id` und `stripe_subscription_id` gesetzt?

**SQL Query:**
```sql
SELECT * FROM user_premium_usage WHERE user_id = 'deine_clerk_user_id';
```

**Expected Result:**
```
| user_id | is_premium | premium_until | stripe_customer_id | stripe_subscription_id |
|---------|------------|---------------|-------------------|------------------------|
| user_... | true | 2025-12-31... | cus_... | sub_... |
```

### 5. Webhook-Events überprüfen

**In Stripe Dashboard:**
1. Gehe zu **Developers** → **Webhooks**
2. Klicke auf deinen Endpoint (oder localhost wenn lokal)
3. Klicke **Events** Tab
4. Prüfe die letzten Events:
   - ✅ `checkout.session.completed` - Status 200
   - ✅ `customer.subscription.created` - Status 200
5. Bei Fehlern: Klicke auf Event → **Logs** für Details

**Häufige Webhook-Fehler:**
- **401 Unauthorized**: `STRIPE_WEBHOOK_SECRET` falsch
- **500 Internal Server Error**: Checke Vercel/Server Logs
- **404 Not Found**: Webhook URL falsch

### 6. Browser Console / Network Tab checken

1. Öffne DevTools (F12)
2. Gehe zu **Console** Tab
3. Prüfe auf Fehler
4. Gehe zu **Network** Tab
5. Lade die Seite neu
6. Suche nach:
   - `/api/premium/status` - Sollte 200 zurückgeben
   - Response sollte zeigen: `{"isPremium": true, ...}`

---

## Kompletter Test-Flow

### Schritt 1: Environment Variables setzen
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_...

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

OPENAI_API_KEY=sk-...
```

### Schritt 2: Stripe CLI starten
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Schritt 3: App starten
```bash
npm run dev
```

### Schritt 4: Test-Checkout durchführen

1. Öffne http://localhost:3000
2. Melde dich an (mit Clerk)
3. Gehe zu `/pricing`
4. Wähle ein Abo
5. Verwende Test-Kreditkarte: `4242 4242 4242 4242`
   - CVV: 123
   - Ablaufdatum: 12/34
   - PLZ: 12345
6. Klicke "Abonnieren"
7. Du wirst zu `/profile?success=true` weitergeleitet

### Schritt 5: Verifizieren

**In der App:**
- Gehe zu `/profile`
- Du solltest "Premium Mitglied" sehen
- Premium-Status sollte "Aktiv" sein

**In Stripe CLI:**
```
✔ Webhook received: checkout.session.completed
✔ Webhook received: customer.subscription.created
```

**In Supabase:**
1. Gehe zu **Table Editor** → `user_premium_usage`
2. Deine User ID sollte da sein mit:
   - `is_premium: true`
   - `premium_until: [Datum in 1 Monat]`
   - `stripe_customer_id: cus_...`
   - `stripe_subscription_id: sub_...`

---

## Production Deployment Checklist

Wenn alles lokal funktioniert:

- [ ] Price IDs in Vercel Environment Variables setzen
- [ ] Webhook in Stripe Dashboard erstellen (für Production URL)
- [ ] `STRIPE_WEBHOOK_SECRET` von Production Webhook in Vercel setzen
- [ ] Zu Live Mode in Stripe wechseln (neue Keys!)
- [ ] Erste Test-Zahlung mit echter Karte (€1) durchführen
- [ ] Webhook-Events in Stripe Dashboard prüfen
- [ ] Database in Supabase prüfen

---

## Hilfe & Support

Bei Problemen prüfe:
1. **Browser Console** - Fehler sichtbar?
2. **Vercel Logs** - Deployment Errors?
3. **Stripe Dashboard → Logs** - Webhook Errors?
4. **Supabase Table Editor** - Daten vorhanden?

**Häufigste Fehler:**
- ❌ Environment Variables nicht gesetzt → App neu starten
- ❌ Stripe CLI läuft nicht → Webhook kommt nicht an
- ❌ Falsche Price ID → Checkout schlägt fehl
- ❌ Supabase Schema nicht ausgeführt → DB Insert schlägt fehl
