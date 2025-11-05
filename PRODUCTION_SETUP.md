# ImmoVest - Production Setup Checkliste

Dieser Guide führt dich Schritt für Schritt durch die Vorbereitung für den Production-Launch.

## ⏰ Wann sollte ich diesen Guide verwenden?

**NICHT JETZT!** Nutze diesen Guide erst, wenn:
- ✅ Die App zu 95%+ fertig ist
- ✅ Alle Kern-Features funktionieren
- ✅ Du bereit bist für echte User
- ✅ 1-2 Wochen vor dem offiziellen Launch

**Aktuell:** Entwickle weiter im Test-Mode! Das ist kostenlos und perfekt für Development.

---

## 📋 PHASE 1: Stripe Production Setup

### Schritt 1.1: Live-Keys kopieren

1. Gehe zu **Stripe Dashboard**: https://dashboard.stripe.com
2. **Schalte oben rechts von "Testmodus" auf "Live-Modus" um**
3. Navigiere zu: **Developers → API keys**
4. Kopiere und speichere sicher:
   - [ ] `Publishable key` (beginnt mit `pk_live_...`)
   - [ ] `Secret key` (beginnt mit `sk_live_...`) ⚠️ **NUR EINMAL SICHTBAR!**

### Schritt 1.2: Live Products & Prices erstellen

1. Gehe zu: **Products → Add product**
2. Erstelle zwei Produkte:

#### Produkt 1: Monatsabo
- Name: `ImmoVest Premium - Monatlich`
- Preis: `13,99 €`
- Billing: `Recurring` → `Monthly`
- [ ] **Kopiere die Price ID** (beginnt mit `price_...`)
- Notiere hier: `_______________________________`

#### Produkt 2: Jahresabo
- Name: `ImmoVest Premium - Jährlich`
- Preis: `69,00 €`
- Billing: `Recurring` → `Yearly`
- [ ] **Kopiere die Price ID** (beginnt mit `price_...`)
- Notiere hier: `_______________________________`

### Schritt 1.3: Production Webhook erstellen

1. Gehe zu: **Developers → Webhooks → Add endpoint**
2. **Endpoint URL eingeben:**
   ```
   https://DEINE-PRODUCTION-DOMAIN.com/api/stripe/webhook
   ```
   Beispiel: `https://immovest.vercel.app/api/stripe/webhook`

3. **Events auswählen:**
   - [ ] `checkout.session.completed`
   - [ ] `customer.subscription.updated`
   - [ ] `customer.subscription.deleted`
   - [ ] `invoice.payment_succeeded`
   - [ ] `invoice.payment_failed`

4. [ ] **Klicke auf "Add endpoint"**
5. [ ] **Webhook Secret kopieren:** Klicke auf "Reveal" → Kopiere das Secret (beginnt mit `whsec_...`)
   - Notiere hier: `_______________________________`

---

## 📋 PHASE 2: Clerk Production Setup

### Schritt 2.1: Production Instance konfigurieren

1. Gehe zu **Clerk Dashboard**: https://dashboard.clerk.com
2. Wähle deine Production Instance (oder erstelle eine neue)
3. Navigiere zu: **API Keys**
4. Kopiere:
   - [ ] `Publishable Key` (beginnt mit `pk_live_...`)
   - [ ] `Secret Key` (beginnt mit `sk_live_...`)

### Schritt 2.2: Domains konfigurieren

1. Gehe zu: **Domains**
2. [ ] Füge deine Production-Domain hinzu (z.B. `immovest.com`)
3. [ ] Konfiguriere Redirect URLs

---

## 📋 PHASE 3: Supabase Production Setup

### Schritt 3.1: Entscheide dich

**Option A: Gleiche Supabase-Datenbank (einfacher)**
- Nutze die gleiche Supabase-Instanz für Dev und Production
- ⚠️ Nachteil: Test-Daten und echte Daten in einer DB
- [ ] Wähle diese Option

**Option B: Separate Production-Datenbank (EMPFOHLEN)**
- Erstelle neues Supabase-Projekt für Production
- Führe das SQL-Schema erneut aus
- Sauber getrennte Umgebungen
- [ ] Wähle diese Option

### Schritt 3.2: Keys kopieren (wenn Option B)

1. Gehe zu **Supabase Dashboard** → Dein Production-Projekt
2. Navigiere zu: **Settings → API**
3. Kopiere:
   - [ ] `Project URL` (z.B. `https://xyz.supabase.co`)
   - [ ] `anon/public key` (sehr lang, beginnt mit `eyJ...`)
   - [ ] `service_role key` (sehr lang, beginnt mit `eyJ...`) ⚠️ **GEHEIM HALTEN!**

### Schritt 3.3: Datenbank-Schema einrichten (wenn Option B)

1. [ ] Gehe zu **SQL Editor**
2. [ ] Öffne die Datei `supabase-schema.sql` aus dem Projekt
3. [ ] Kopiere den gesamten Inhalt
4. [ ] Füge ihn in den SQL Editor ein
5. [ ] Führe das Script aus (Run)
6. [ ] Prüfe, ob Tabellen erstellt wurden:
   - `analyses`
   - `user_premium_usage`

---

## 📋 PHASE 4: Environment Variables setzen

### Für Vercel (empfohlen)

1. Gehe zu **Vercel Dashboard** → Dein Projekt → **Settings → Environment Variables**
2. Füge folgende Variables hinzu (Environment: **Production**):

```bash
# Node Environment
NODE_ENV=production

# Clerk - LIVE Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Stripe - LIVE Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # <-- Von Production Webhook!

# Stripe - LIVE Price IDs
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxx  # <-- Monats-Abo Live Price
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_xxxxx   # <-- Jahres-Abo Live Price

# Supabase (Production DB)
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxx
```

Checkliste:
- [ ] Alle Variables eingegeben
- [ ] Auf Tippfehler geprüft
- [ ] Gespeichert

### Für andere Hosting-Plattformen

- [ ] Erstelle `.env.production` Datei (NIEMALS in Git committen!)
- [ ] Füge die gleichen Variables wie oben ein
- [ ] Konfiguriere deine Plattform, um diese zu nutzen

---

## 📋 PHASE 5: Livemode-Filter aktivieren (OPTIONAL)

Verhindert, dass Test-Payments in Production-Datenbank gespeichert werden.

### Schritt 5.1: Code anpassen

1. [ ] Öffne: `src/app/api/stripe/webhook/route.ts`
2. [ ] Suche nach Zeile ~44:
```typescript
/*
if (process.env.NODE_ENV === 'production' && !event.livemode) {
  console.log('⚠️ [WEBHOOK] Ignoring test event in production:', event.type);
  return NextResponse.json({ received: true, message: 'Test event ignored' });
}
*/
```
3. [ ] Entferne die Kommentare `/*` und `*/`:
```typescript
if (process.env.NODE_ENV === 'production' && !event.livemode) {
  console.log('⚠️ [WEBHOOK] Ignoring test event in production:', event.type);
  return NextResponse.json({ received: true, message: 'Test event ignored' });
}
```
4. [ ] Commit & Push die Änderung

---

## 📋 PHASE 6: Deployment & Testing

### Schritt 6.1: Nach Production deployen

```bash
# Stelle sicher, dass alle Änderungen committed sind
git status

# Merge in Main Branch (oder dein Production-Branch)
git checkout main
git merge dein-feature-branch

# Push nach Production
git push origin main
```

- [ ] Deployment erfolgreich
- [ ] Keine Build-Errors
- [ ] App ist erreichbar unter Production-URL

### Schritt 6.2: Webhook URL verifizieren

1. [ ] Gehe zu **Stripe → Webhooks** → Dein Production Webhook
2. [ ] Klicke auf "Send test webhook"
3. [ ] Wähle `checkout.session.completed`
4. [ ] Prüfe Status: Sollte `200 OK` sein
5. [ ] Falls Fehler: Prüfe Logs in Vercel/deiner Plattform

### Schritt 6.3: Test-Checkout durchführen

⚠️ **WICHTIG:** Nutze Stripe Test-Cards, um keine echten Kosten zu verursachen!

1. [ ] Gehe zu deiner Production-App
2. [ ] Starte einen Checkout-Flow
3. [ ] Nutze Test-Card: `4242 4242 4242 4242`
   - CVV: Beliebig (z.B. `123`)
   - Datum: Beliebiges Zukunftsdatum
   - PLZ: Beliebig
4. [ ] Checkout abschließen

### Schritt 6.4: Verifikation

Nach dem Test-Checkout prüfe:

**1. Stripe Dashboard:**
- [ ] Event `checkout.session.completed` wurde empfangen (Events Tab)
- [ ] Subscription wurde erstellt (Customers → Subscriptions)
- [ ] Webhook wurde erfolgreich aufgerufen (Status 200)

**2. Supabase:**
- [ ] Gehe zu **Table Editor → user_premium_usage**
- [ ] Dein Test-User sollte erscheinen mit:
  - `is_premium: true`
  - `premium_until: [Datum in der Zukunft]`
  - `stripe_customer_id` und `stripe_subscription_id` ausgefüllt

**3. In der App:**
- [ ] Logge dich mit dem Test-User ein
- [ ] Premium-Status wird korrekt angezeigt
- [ ] Premium-Features sind freigeschaltet

**4. Immobilien-Analyse speichern:**
- [ ] Erstelle eine neue Immobilien-Analyse
- [ ] Klicke auf "Ergebnis speichern"
- [ ] Gehe zu Supabase → Table Editor → `analyses`
- [ ] Die Analyse sollte dort erscheinen

---

## 📋 PRE-LAUNCH CHECKLIST

Gehe diese Liste durch, bevor du live gehst:

### Stripe
- [ ] Live API Keys sind gesetzt
- [ ] Production Webhook ist konfiguriert
- [ ] Webhook Secret ist gesetzt
- [ ] Live Price IDs sind gesetzt
- [ ] Test-Checkout funktioniert

### Clerk
- [ ] Live API Keys sind gesetzt
- [ ] Production-Domain ist konfiguriert
- [ ] Sign-up/Sign-in funktioniert

### Supabase
- [ ] Production Keys sind gesetzt
- [ ] Datenbank-Schema ist deployed
- [ ] RLS Policies sind aktiv
- [ ] Analysen werden gespeichert
- [ ] Premium-Status wird korrekt verfolgt

### Environment Variables
- [ ] Alle Production Environment Variables sind gesetzt
- [ ] Keine Test-Keys mehr in Production
- [ ] Secrets sind sicher gespeichert

### Testing
- [ ] Webhook funktioniert (200 OK)
- [ ] Test-Checkout erfolgreich
- [ ] Premium-Status wird korrekt aktualisiert
- [ ] Analysen werden in Supabase gespeichert
- [ ] App ist erreichbar und lädt korrekt

### Monitoring & Logging
- [ ] Vercel Logs sind aktiviert
- [ ] Stripe Events werden überwacht
- [ ] Error-Tracking ist eingerichtet (z.B. Sentry)

### Optional
- [ ] Livemode-Filter aktiviert
- [ ] Staging-Environment getestet
- [ ] Backup-Strategie definiert

---

## 🚨 Nach dem Launch

### Wichtige Links bookmarken:

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Production App:** https://deine-domain.com

### Regelmäßig prüfen:

1. **Stripe Events** (täglich in der ersten Woche)
   - Webhook Errors?
   - Failed Payments?

2. **Supabase Usage** (wöchentlich)
   - Datenbank-Größe
   - API-Calls
   - Storage

3. **Vercel Usage** (wöchentlich)
   - Function Invocations
   - Bandwidth
   - Build Minutes

### Im Notfall:

**Stripe Webhook funktioniert nicht:**
```bash
# Prüfe Vercel Logs:
vercel logs --prod

# Prüfe Stripe Events:
# Stripe Dashboard → Developers → Events → Filter by "failed"
```

**Premium-Status wird nicht aktualisiert:**
1. Prüfe Supabase Logs
2. Prüfe ob Service Role Key korrekt ist
3. Prüfe ob RLS Policies korrekt sind

**Datenbank-Probleme:**
1. Gehe zu Supabase → Database → Logs
2. Prüfe ob Queries erfolgreich sind
3. Prüfe Connection Pooling Settings

---

## 💰 Kosten-Übersicht (ungefähr)

### Free Tier (solange möglich):
- **Vercel:** Bis 100 GB Bandwidth / Monat
- **Supabase:** Bis 500 MB Datenbank / 2 GB Bandwidth
- **Clerk:** Bis 10.000 MAU (Monthly Active Users)
- **Stripe:** Keine monatlichen Kosten, nur Transaktionsgebühren

### Bezahlte Pläne (wenn Free Tier nicht reicht):
- **Vercel Pro:** $20/Monat
- **Supabase Pro:** $25/Monat
- **Clerk Pro:** Ab $25/Monat
- **Stripe:** 1,4% + 0,25€ pro Transaktion

---

## ✅ Geschafft!

Wenn du alle Schritte durchgeführt hast, ist deine App production-ready! 🎉

**Viel Erfolg mit dem Launch!** 🚀

---

## 📞 Support & Hilfe

- **Stripe Docs:** https://stripe.com/docs
- **Clerk Docs:** https://clerk.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

Bei Problemen: Prüfe zuerst die Logs, dann die Dokumentation, dann Support kontaktieren.
