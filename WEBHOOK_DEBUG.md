# 🔧 WEBHOOK DEBUG GUIDE - Premium wird nicht aktiviert

## Problem
Nach Stripe Checkout wird der User nicht in Supabase gespeichert und Premium-Status wird nicht in der App angezeigt.

---

## ⚡ QUICK FIX - Die 5 häufigsten Probleme

### 1. Stripe CLI läuft nicht

**SYMPTOM:** Nach Checkout passiert nichts

**CHECK:**
```bash
# Läuft Stripe CLI in einem separaten Terminal?
# Du solltest das sehen:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**LÖSUNG:**
```bash
# Terminal 2 öffnen und starten:
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Du solltest sehen:
> Ready! Your webhook signing secret is whsec_abc123...
```

✅ **Kopiere den `whsec_...` Wert in `.env.local` bei `STRIPE_WEBHOOK_SECRET=`**

---

### 2. App wurde nach .env.local Änderung nicht neugestartet

**SYMPTOM:** Webhook Secret in .env.local geändert, aber App läuft noch mit altem Wert

**LÖSUNG:**
```bash
# Terminal 1 (wo npm run dev läuft):
# Drücke Strg+C (stoppt die App)

# Starte neu:
npm run dev
```

⚠️ **WICHTIG:** Nach JEDER Änderung in `.env.local` MUSS die App neugestartet werden!

---

### 3. Webhook Secret fehlt oder ist falsch

**CHECK:**
```bash
# Öffne .env.local
# Ist diese Zeile vorhanden UND ausgefüllt?
STRIPE_WEBHOOK_SECRET=whsec_...
```

**LÖSUNG:**
1. ✅ Terminal 2: Stripe CLI läuft? Siehst du `whsec_...`?
2. ✅ Kopiere den kompletten `whsec_...` Wert
3. ✅ Füge in `.env.local` ein: `STRIPE_WEBHOOK_SECRET=whsec_...`
4. ✅ App neustarten (Strg+C → `npm run dev`)

---

### 4. Supabase Environment Variables fehlen

**CHECK:**
```bash
# Öffne .env.local
# Sind ALLE 3 Supabase-Variablen gesetzt?
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**LÖSUNG:**
1. ✅ Gehe zu [supabase.com](https://supabase.com) → Dein Projekt
2. ✅ Settings → API
3. ✅ Kopiere alle 3 Werte
4. ✅ Füge in `.env.local` ein
5. ✅ App neustarten

---

### 5. Price IDs fehlen

**CHECK:**
```bash
# Öffne .env.local
# Sind die Price IDs gesetzt?
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_...
```

**LÖSUNG:**
1. ✅ Gehe zu [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. ✅ Klicke auf dein Produkt
3. ✅ Kopiere die Price ID (unter dem Preis)
4. ✅ Füge in `.env.local` ein
5. ✅ App neustarten

---

## 🔍 DETAILLIERTES DEBUGGING

### Schritt 1: Komplette .env.local prüfen

Deine `.env.local` MUSS alle diese Variablen haben:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-...
```

**Fehlende Variablen?** → Füge sie hinzu + App neustarten!

---

### Schritt 2: Setup verifizieren

**Terminal Setup:**

```bash
# Terminal 1 - Deine App
cd /home/user/immovest
npm run dev

# Terminal 2 - Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Beide müssen gleichzeitig laufen!**

---

### Schritt 3: Test-Checkout durchführen

1. ✅ Öffne Browser: `http://localhost:3000`
2. ✅ Melde dich an (mit Clerk)
3. ✅ Gehe zu: `http://localhost:3000/pricing`
4. ✅ Klicke "Jetzt starten" (egal welches Abo)
5. ✅ Stripe Checkout öffnet sich

**AUF STRIPE CHECKOUT SEITE:**

6. ✅ E-Mail: `test@example.com`
7. ✅ Kreditkarte: `4242 4242 4242 4242`
8. ✅ Ablaufdatum: `12/34`
9. ✅ CVC: `123`
10. ✅ Name: `Test User`
11. ✅ PLZ: `12345`
12. ✅ Klicke **"Abonnieren"**

**WAS JETZT PASSIEREN SOLLTE:**

**Terminal 2 (Stripe CLI):**
```
✔ Webhook received: checkout.session.completed [200]
✔ Webhook received: customer.subscription.created [200]
```

**Terminal 1 (npm run dev):**
```
Premium activated for user user_xxx until 2025-12-03...
```

---

### Schritt 4: Webhook-Events prüfen

**In Terminal 2 - Was siehst du?**

#### ✅ ERFOLG:
```
✔ Webhook received: checkout.session.completed [200]
✔ Webhook received: customer.subscription.created [200]
```

→ **PERFEKT!** Webhooks funktionieren!

#### ❌ FEHLER: [401]
```
✗ Webhook received: checkout.session.completed [401]
```

**PROBLEM:** Webhook Secret falsch

**LÖSUNG:**
1. Kopiere `whsec_...` aus Terminal 2 (oberste Zeile)
2. Füge in `.env.local` ein: `STRIPE_WEBHOOK_SECRET=whsec_...`
3. App neustarten (Strg+C → `npm run dev`)

#### ❌ FEHLER: [500]
```
✗ Webhook received: checkout.session.completed [500]
```

**PROBLEM:** Server-Fehler in deiner App

**LÖSUNG:**
1. Prüfe Terminal 1 (npm run dev) für Fehler
2. Häufigste Ursache: Supabase Connection fehlt
3. Prüfe ob alle 3 Supabase Environment Variables gesetzt sind

#### ❌ GAR NICHTS
```
# Terminal 2 zeigt nichts nach Checkout
```

**PROBLEM:** Stripe CLI läuft nicht richtig

**LÖSUNG:**
```bash
# Terminal 2: Strg+C
# Dann neu starten:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

### Schritt 5: Server-Logs prüfen

**In Terminal 1 (npm run dev) - Suche nach:**

#### ✅ ERFOLG:
```
Premium activated for user user_2abc123xyz until 2025-12-03T10:00:00.000Z
```

→ **SUPER!** User wurde in Supabase gespeichert!

#### ❌ FEHLER:
```
Error updating premium status: {...}
```

**PROBLEM:** Supabase Connection oder Schema-Problem

**LÖSUNG:**

1. **Supabase Connection prüfen:**
```bash
# Sind alle 3 Variablen gesetzt?
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

2. **Schema prüfen:**
   - Gehe zu Supabase → SQL Editor
   - Führe `supabase-schema.sql` nochmal aus
   - Prüfe ob Tabelle `user_premium_usage` existiert

---

### Schritt 6: Supabase-Datenbank prüfen

1. ✅ Gehe zu [supabase.com](https://supabase.com) → Dein Projekt
2. ✅ Klicke **"Table Editor"** (links)
3. ✅ Wähle Tabelle: **`user_premium_usage`**

**WAS SOLLTEST DU SEHEN:**

| user_id | is_premium | premium_until | stripe_customer_id | stripe_subscription_id |
|---------|------------|---------------|-------------------|------------------------|
| user_xxx | true | 2025-12-03... | cus_xxx | sub_xxx |

**NICHTS DA?** → Webhook hat nicht funktioniert, siehe Schritte oben!

---

### Schritt 7: App-Status prüfen

1. ✅ Gehe zu `http://localhost:3000/profile`
2. ✅ Oben sollte stehen: **"Premium Mitglied"**
3. ✅ Premium-Status: **"Aktiv"**
4. ✅ Aktiv bis: **Datum in der Zukunft**

**NICHT PREMIUM?**

→ Daten sind nicht in Supabase, siehe Schritte oben!

---

## 🧪 MANUELLER TEST - Ohne Stripe

Falls du sofort testen willst ob die App Premium richtig anzeigt:

### Manuellen Premium-User in Supabase erstellen:

1. ✅ Gehe zu Supabase → Table Editor → `user_premium_usage`
2. ✅ Klicke **"Insert"** → **"Insert row"**
3. ✅ Fülle aus:
   ```
   user_id: user_xxx (deine Clerk User ID, siehe unten)
   is_premium: true
   premium_until: 2025-12-31T23:59:59+00:00
   usage_count: 0
   stripe_customer_id: test_customer
   stripe_subscription_id: test_subscription
   ```
4. ✅ Klicke **"Save"**
5. ✅ Gehe zu `/profile` → Sollte jetzt "Premium Mitglied" zeigen!

**Deine Clerk User ID finden:**

1. Gehe zu [dashboard.clerk.com](https://dashboard.clerk.com)
2. Wähle deine Application
3. Klicke **"Users"**
4. Finde deinen Test-User
5. User ID beginnt mit `user_...`

---

## 🐛 HÄUFIGE FEHLER

### "Supabase not configured, premium status will be managed on client"

**URSACHE:** Supabase Environment Variables fehlen

**LÖSUNG:**
1. Prüfe `.env.local`
2. Alle 3 Supabase-Variablen gesetzt?
3. App neustarten

### "Invalid API key"

**URSACHE:** Supabase Keys falsch kopiert

**LÖSUNG:**
1. Gehe zu Supabase → Settings → API
2. Kopiere Keys KOMPLETT (kein Leerzeichen am Anfang/Ende)
3. Füge neu in `.env.local` ein
4. App neustarten

### "No userId found in checkout session"

**URSACHE:** User nicht eingeloggt beim Checkout

**LÖSUNG:**
1. Melde dich an BEVOR du zu `/pricing` gehst
2. Prüfe in Browser Console (F12) ob userId vorhanden

---

## 📋 KOMPLETTE CHECKLISTE

Gehe diese Punkte NACHEINANDER durch:

### Setup
- [ ] Terminal 1: `npm run dev` läuft
- [ ] Terminal 2: `stripe listen...` läuft
- [ ] `.env.local` hat ALLE Variablen
- [ ] App wurde neugestartet nach Änderungen

### Environment Variables
- [ ] `STRIPE_WEBHOOK_SECRET` gesetzt (von Terminal 2)
- [ ] `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` gesetzt
- [ ] `NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt
- [ ] `SUPABASE_SERVICE_ROLE_KEY` gesetzt

### Supabase
- [ ] Projekt erstellt
- [ ] SQL Schema ausgeführt
- [ ] Tabelle `user_premium_usage` existiert
- [ ] Tabelle `analyses` existiert

### Test-Flow
- [ ] Checkout durchgeführt
- [ ] Terminal 2: Webhook Events [200]
- [ ] Terminal 1: "Premium activated" Log
- [ ] Supabase: Eintrag in `user_premium_usage`
- [ ] App: Premium-Status in `/profile`

---

## 🆘 IMMER NOCH PROBLEME?

**Sammle folgende Infos und schicke sie mir:**

1. **Screenshot Terminal 1** (npm run dev) - Zeige mir die Logs
2. **Screenshot Terminal 2** (stripe listen) - Zeige mir die Webhook-Events
3. **Screenshot Supabase** - Table Editor `user_premium_usage`
4. **Screenshot Browser Console** (F12) - Eventuelle Fehler
5. **Deine `.env.local`** - SCHWÄRZE die Secrets! Zeig mir nur ob die Variablen gesetzt sind

**Format:**
```
STRIPE_WEBHOOK_SECRET=whsec_*** (26 Zeichen) ✅
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co ✅
...
```

---

## 💡 PRO-TIPPS

### Logs besser sehen

```bash
# Terminal 1 - Nur Webhook-Logs anzeigen:
npm run dev | grep -i "webhook\|premium\|stripe"
```

### Webhook-Events in Stripe Dashboard ansehen

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Klicke auf deinen Endpoint (oder "localhost" wenn CLI)
3. Tab **"Events"**
4. Siehst du die Events? Status 200?

### Supabase Logs ansehen

1. Gehe zu Supabase → Logs (links)
2. Wähle **"Postgres Logs"**
3. Siehst du INSERT Statements für `user_premium_usage`?

---

**Mit diesem Guide solltest du das Problem finden!** 🔍

Bei Fragen: Schick mir die Screenshots! 📸
