# 🚀 SCHNELLSTART GUIDE - ImVestr Setup

Diese Anleitung führt dich in 30 Minuten durch das komplette Setup von Supabase, Stripe und Deployment.

---

## Teil 1: Supabase einrichten (10 Min)

### Schritt 1: Projekt erstellen

1. ✅ Gehe zu [supabase.com](https://supabase.com)
2. ✅ Klicke **"New project"**
3. ✅ Wähle deine Organisation
4. ✅ Projektname: `immovest-production`
5. ✅ Passwort: **Erstelle ein sicheres Passwort und SPEICHERE ES!**
6. ✅ Region: **Europe (Frankfurt)** - für deutsche Nutzer
7. ✅ Plan: **Free** (reicht zum Starten)
8. ✅ Klicke **"Create new project"**

⏳ **Warte 2-3 Minuten** bis das Projekt erstellt ist

---

### Schritt 2: Datenbank-Schema erstellen

1. ✅ In Supabase: Klicke links auf **"SQL Editor"**
2. ✅ Klicke **"New query"**
3. ✅ Öffne die Datei `supabase-schema.sql` aus deinem ImVestr Projekt
4. ✅ Kopiere den **KOMPLETTEN INHALT** (Strg+A, Strg+C)
5. ✅ Füge ihn in den SQL Editor ein (Strg+V)
6. ✅ Klicke **"Run"** (oder drücke F5)

**✅ Erfolg:** Du solltest sehen: "Success. No rows returned"

**❌ Fehler?** Kopiere die Fehlermeldung und schicke sie mir.

---

### Schritt 3: API Keys kopieren

1. ✅ In Supabase: Klicke links auf **"Settings"** (Zahnrad-Icon)
2. ✅ Klicke **"API"**
3. ✅ Kopiere folgende Werte:

```bash
# Project URL (oben)
https://xxxxxxxxxxxxx.supabase.co

# anon / public key (unter "Project API keys")
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (unter "Project API keys") - SCROLLEN!
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**💾 SPEICHERE DIESE 3 WERTE** - du brauchst sie gleich!

---

### Schritt 4: Environment Variables setzen

1. ✅ Öffne dein Projekt in VS Code
2. ✅ Erstelle eine Datei `.env.local` (falls nicht vorhanden)
3. ✅ Füge ein:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. ✅ **WICHTIG:** Ersetze die Werte mit deinen echten Keys von Schritt 3!

---

### ✅ TEST: Ist Supabase richtig eingerichtet?

1. ✅ Terminal öffnen
2. ✅ `npm run dev`
3. ✅ Öffne `http://localhost:3000`
4. ✅ Melde dich an (mit Clerk)
5. ✅ Erstelle eine Analyse (Input-Method → Manual → Gib ein paar Daten ein → Weiter)

**PRÜFEN IN SUPABASE:**

1. ✅ Gehe zu Supabase → **"Table Editor"**
2. ✅ Wähle Tabelle: **`analyses`**
3. ✅ **Siehst du deine Analyse?** ✅ SUPER! Supabase funktioniert!
4. ✅ **Nichts da?** → Siehe Troubleshooting unten

---

## Teil 2: Stripe einrichten (15 Min)

### Schritt 1: Produkte in Stripe erstellen

1. ✅ Gehe zu [dashboard.stripe.com](https://dashboard.stripe.com/test/products)
2. ✅ **WICHTIG:** Stelle sicher, dass **"Test Mode"** aktiviert ist (Schalter oben rechts)

**Produkt 1: Monatsabo**

1. ✅ Klicke **"+ Add product"**
2. ✅ Fülle aus:
   - **Name:** ImVestr Premium Monat
   - **Description:** Unbegrenzte Markt- & Lageanalysen
   - **Pricing model:** Recurring (wiederkehrend)
   - **Price:** 13.99 EUR
   - **Billing period:** Monthly
3. ✅ Klicke **"Save product"**
4. ✅ **KOPIERE DIE PRICE ID** (steht unter dem Preis, beginnt mit `price_...`)

   Beispiel: `price_1234567890abcdefg`

**Produkt 2: Jahresabo**

1. ✅ Klicke **"+ Add product"**
2. ✅ Fülle aus:
   - **Name:** ImVestr Premium Jahr
   - **Description:** Spare 59% mit dem Jahresabo
   - **Pricing model:** Recurring
   - **Price:** 69.00 EUR
   - **Billing period:** Yearly
3. ✅ Klicke **"Save product"**
4. ✅ **KOPIERE DIE PRICE ID**

   Beispiel: `price_0987654321zyxwvut`

---

### Schritt 2: Stripe Keys holen

1. ✅ Gehe zu **"Developers"** → **"API keys"** (links in der Seitenleiste)
2. ✅ **WICHTIG:** Test Mode muss aktiv sein!
3. ✅ Kopiere:

```bash
# Publishable key (sichtbar)
pk_test_...

# Secret key (musst du aufdecken - "Reveal test key")
sk_test_...
```

---

### Schritt 3: Webhook erstellen (für localhost)

Für **LOKALE ENTWICKLUNG** brauchst du die Stripe CLI:

#### Mac:
```bash
brew install stripe/stripe-cli/stripe
```

#### Windows:
Lade herunter von: https://github.com/stripe/stripe-cli/releases/latest

#### Nach Installation:

1. ✅ Terminal öffnen
2. ✅ `stripe login` eingeben
3. ✅ Drücke Enter (Browser öffnet sich)
4. ✅ Klicke "Allow access"
5. ✅ **Stripe CLI ist jetzt verbunden!**

---

### Schritt 4: Environment Variables ergänzen

Öffne `.env.local` und füge hinzu:

```bash
# Clerk (bereits vorhanden)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe (NEU)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Price IDs (DEINE kopierten Price IDs von Schritt 1)
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1234567890abcdefg
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_0987654321zyxwvut

# Webhook Secret (kommt gleich von Stripe CLI)
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (bereits vorhanden)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...
```

---

### ✅ TEST: Kompletter Checkout-Flow

**Vorbereitung:**

1. ✅ Terminal 1: `npm run dev`
2. ✅ Terminal 2: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**AUS TERMINAL 2 KOPIEREN:**
```
> Ready! Your webhook signing secret is whsec_abc123xyz456...
```

3. ✅ Kopiere den `whsec_...` Wert
4. ✅ Füge ihn in `.env.local` bei `STRIPE_WEBHOOK_SECRET=` ein
5. ✅ **STOPPE** `npm run dev` (Strg+C)
6. ✅ **STARTE NEU:** `npm run dev`

**Jetzt testen:**

1. ✅ Öffne `http://localhost:3000`
2. ✅ Melde dich an
3. ✅ Gehe zu **`/pricing`** (URL-Leiste: `localhost:3000/pricing`)
4. ✅ Klicke auf **"Jetzt starten"** (Jahresabo)
5. ✅ Du wirst zu Stripe Checkout weitergeleitet

**Auf Stripe Checkout Seite:**

6. ✅ E-Mail: `test@example.com`
7. ✅ Kreditkarte: `4242 4242 4242 4242`
8. ✅ Ablaufdatum: `12/34` (beliebig in Zukunft)
9. ✅ CVC: `123` (beliebig)
10. ✅ Name: `Test User`
11. ✅ Land: Deutschland
12. ✅ PLZ: `12345`
13. ✅ Klicke **"Abonnieren"**

**Was jetzt passiert:**

1. ✅ Du wirst zurück zu `/profile?success=true` geleitet
2. ✅ In **Terminal 2** solltest du sehen:
   ```
   ✔ Webhook received: checkout.session.completed
   ✔ Webhook received: customer.subscription.created
   ```

**PRÜFEN IN SUPABASE:**

1. ✅ Gehe zu Supabase → **"Table Editor"**
2. ✅ Wähle Tabelle: **`user_premium_usage`**
3. ✅ Du solltest EINEN EINTRAG sehen:

| user_id | is_premium | premium_until | stripe_customer_id | stripe_subscription_id |
|---------|------------|---------------|-------------------|------------------------|
| user_xxx | ✅ true | 2025-12-03... | cus_xxx | sub_xxx |

4. ✅ **Siehst du den Eintrag?** → ✅ **PERFEKT! Alles funktioniert!**

**PRÜFEN IN DER APP:**

1. ✅ Gehe zu `/profile`
2. ✅ Du solltest sehen: **"Premium Mitglied"**
3. ✅ Premium-Status: **"Aktiv"**
4. ✅ Aktiv bis: **Datum in der Zukunft**

---

## Teil 3: Deployment (5 Min)

### Schritt 1: Vercel Account

1. ✅ Gehe zu [vercel.com](https://vercel.com)
2. ✅ Klicke **"Sign up"** (oder Login falls Account vorhanden)
3. ✅ Verbinde mit GitHub

---

### Schritt 2: Projekt deployen

1. ✅ Klicke **"Add New..."** → **"Project"**
2. ✅ Wähle dein GitHub Repository **"immovest"**
3. ✅ Klicke **"Import"**

**Framework Settings:**
- ✅ Framework Preset: **Next.js** (automatisch erkannt)
- ✅ Build Command: `npm run build` (Standard)
- ✅ Output Directory: `.next` (Standard)

---

### Schritt 3: Environment Variables in Vercel setzen

**WICHTIG:** Du musst ALLE Environment Variables aus `.env.local` in Vercel eintragen!

1. ✅ Klicke auf **"Environment Variables"** (vor dem Deploy!)
2. ✅ Füge ALLE Variablen einzeln hinzu:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
CLERK_SECRET_KEY = sk_test_...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_... (kommt gleich von Stripe)

NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID = price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID = price_...

NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...

OPENAI_API_KEY = sk-...
```

3. ✅ Bei **"Environment"** wähle: **Production, Preview, Development** (alle 3!)
4. ✅ Klicke **"Deploy"**

⏳ **Warte 2-3 Minuten** bis Deployment fertig ist

---

### Schritt 4: Production Webhook in Stripe

**NACHDEM** dein Vercel Deployment fertig ist:

1. ✅ Kopiere deine Vercel-URL (z.B. `https://immovest-xxx.vercel.app`)
2. ✅ Gehe zu Stripe Dashboard → **"Developers"** → **"Webhooks"**
3. ✅ Klicke **"+ Add endpoint"**
4. ✅ Endpoint URL: `https://immovest-xxx.vercel.app/api/stripe/webhook`
5. ✅ Description: `ImVestr Production Webhook`
6. ✅ **Events to send:** Klicke "Select events"
   - ✅ Suche und wähle: `checkout.session.completed`
   - ✅ Suche und wähle: `customer.subscription.updated`
   - ✅ Suche und wähle: `customer.subscription.deleted`
   - ✅ Suche und wähle: `invoice.payment_succeeded`
   - ✅ Suche und wähle: `invoice.payment_failed`
7. ✅ Klicke **"Add endpoint"**
8. ✅ **KOPIERE DEN WEBHOOK SECRET** (beginnt mit `whsec_...`)

---

### Schritt 5: Webhook Secret in Vercel aktualisieren

1. ✅ Gehe zu Vercel Dashboard → Dein Projekt → **"Settings"** → **"Environment Variables"**
2. ✅ Suche `STRIPE_WEBHOOK_SECRET`
3. ✅ Klicke **"Edit"**
4. ✅ Ersetze den Wert mit dem **neuen Webhook Secret** von Schritt 4
5. ✅ Klicke **"Save"**
6. ✅ Gehe zu **"Deployments"** → Klicke **"Redeploy"**

---

### Schritt 6: Clerk URLs aktualisieren

1. ✅ Gehe zu [dashboard.clerk.com](https://dashboard.clerk.com)
2. ✅ Wähle deine Application
3. ✅ Gehe zu **"Settings"** → **"URLs"**
4. ✅ Füge hinzu:
   - **Home URL:** `https://immovest-xxx.vercel.app`
   - **After sign-in URL:** `https://immovest-xxx.vercel.app/input-method`
   - **After sign-up URL:** `https://immovest-xxx.vercel.app/input-method`

---

### ✅ TEST: Production Checkout

1. ✅ Öffne `https://immovest-xxx.vercel.app`
2. ✅ Melde dich an
3. ✅ Gehe zu `/pricing`
4. ✅ Starte Checkout (Test-Kreditkarte funktioniert auch in Production!)
5. ✅ Prüfe in Supabase → `user_premium_usage` Tabelle
6. ✅ Prüfe in Stripe Dashboard → **"Developers"** → **"Webhooks"** → Events

**✅ ALLES GRÜN?** → **HERZLICHEN GLÜCKWUNSCH! Du bist LIVE!** 🎉

---

## 🆘 TROUBLESHOOTING

### ❌ "Keine Analysen in Supabase"

**Mögliche Ursachen:**

1. ✅ Environment Variables falsch?
   - Prüfe `.env.local`
   - Sind alle 3 Supabase-Variablen gesetzt?
   - **App neu starten:** Strg+C → `npm run dev`

2. ✅ Supabase Schema nicht ausgeführt?
   - Gehe zu Supabase → SQL Editor
   - Führe `supabase-schema.sql` nochmal aus

3. ✅ `SUPABASE_SERVICE_ROLE_KEY` fehlt oder ist falsch?
   - Die App schreibt nur serverseitig mit dem Service-Role-Key. Dieser umgeht RLS.
   - RLS ist aktiviert und es gibt **absichtlich keine Policies**. Das ist korrekt und blockiert die App nicht.
   - Fehlt der Key (lokal in `.env.local` oder in Vercel), wird nichts gespeichert.

⚠️ **RLS niemals deaktivieren und keine Policies mit `USING (true)` anlegen** (auch nicht "nur zum Testen").
Der Anon-Key ist öffentlich im Browser sichtbar. Ohne RLS oder mit offenen Policies kann jeder damit die Daten
aller Nutzer lesen, ändern und löschen. Prüfen lässt sich der Zustand im SQL Editor:
```sql
-- Erwartet: 0 Zeilen
SELECT * FROM pg_policies WHERE tablename IN ('analyses','scenarios','user_premium_usage');
-- Erwartet: rowsecurity = true für alle drei
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('analyses','scenarios','user_premium_usage');
```
Falls dort Policies stehen oder RLS aus ist: `supabase/migrations/2026-11-14_drop_open_rls_policies.sql` ausführen.

---

### ❌ "Premium wird nach Zahlung nicht aktiviert"

**Checkliste:**

1. ✅ Stripe CLI läuft? (`stripe listen...`)
2. ✅ Webhook Secret in `.env.local` korrekt?
3. ✅ App neu gestartet nach Änderung?
4. ✅ In Terminal 2: Siehst du Webhook-Events?

**Webhook-Events prüfen:**

Terminal 2 sollte zeigen:
```
✔ Webhook received: checkout.session.completed [200]
✔ Webhook received: customer.subscription.created [200]
```

**Siehst du [401] oder [500]?**
- [401] → `STRIPE_WEBHOOK_SECRET` falsch
- [500] → Server-Fehler, prüfe Logs

**Logs prüfen:**
- Terminal 1 (wo `npm run dev` läuft)
- Suche nach Fehlermeldungen

---

### ❌ "Payment funktioniert nicht"

**Prüfe:**

1. ✅ Price IDs richtig in `.env.local`?
2. ✅ Stripe Publishable Key korrekt?
3. ✅ Test Mode aktiv in Stripe?

**Browser Console öffnen:**
- F12 drücken
- Tab "Console"
- Fehler sichtbar?

---

### ❌ "Vercel Deployment fehlgeschlagen"

**Häufigste Fehler:**

1. ✅ Environment Variables vergessen?
   - ALLE Variablen müssen in Vercel sein!

2. ✅ Build-Fehler?
   - Prüfe Vercel Logs
   - Teste lokal: `npm run build`

---

## 📞 HILFE

Wenn etwas nicht funktioniert:

1. ✅ Prüfe DIESE Anleitung nochmal Schritt für Schritt
2. ✅ Prüfe Browser Console (F12)
3. ✅ Prüfe Server Logs (Terminal)
4. ✅ Prüfe Stripe Webhook Events
5. ✅ Schicke mir:
   - Was hast du gemacht?
   - Was ist das Problem?
   - Fehlermeldungen (Screenshots)

---

## ✅ CHECKLISTE

### Supabase Setup
- [ ] Projekt erstellt
- [ ] SQL Schema ausgeführt
- [ ] API Keys kopiert
- [ ] Environment Variables gesetzt
- [ ] Test-Analyse erstellt
- [ ] Analyse in Supabase sichtbar

### Stripe Setup
- [ ] 2 Produkte erstellt (Monat + Jahr)
- [ ] Price IDs kopiert
- [ ] Stripe Keys kopiert
- [ ] Stripe CLI installiert
- [ ] Stripe CLI verbunden
- [ ] Webhook läuft lokal
- [ ] Environment Variables gesetzt
- [ ] Test-Checkout durchgeführt
- [ ] Premium in Supabase sichtbar

### Deployment
- [ ] Vercel Account erstellt
- [ ] Projekt importiert
- [ ] Environment Variables in Vercel
- [ ] Erfolgreich deployed
- [ ] Production Webhook erstellt
- [ ] Webhook Secret in Vercel
- [ ] Clerk URLs aktualisiert
- [ ] Production Checkout getestet

---

**Du hast es geschafft!** 🚀

Bei Fragen: Frag einfach! 💬
