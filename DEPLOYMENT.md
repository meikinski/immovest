# ImmoVest Deployment Guide

Diese Anleitung führt dich Schritt für Schritt durch das Deployment von ImmoVest auf Vercel mit Supabase als Datenbank und Stripe für Zahlungen.

## Voraussetzungen

- [ ] GitHub Repository mit ImmoVest Code
- [ ] Vercel Account (kostenlos bei [vercel.com](https://vercel.com))
- [ ] Supabase Account (kostenlos bei [supabase.com](https://supabase.com))
- [ ] Stripe Account (bei [stripe.com](https://stripe.com))
- [ ] Clerk Account für Authentication (bei [clerk.com](https://clerk.com))
- [ ] OpenAI API Key (bei [platform.openai.com](https://platform.openai.com))

---

## Teil 1: Supabase Datenbank einrichten

### 1.1 Neues Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und melde dich an
2. Klicke auf **"New project"**
3. Wähle deine Organisation (oder erstelle eine neue)
4. Projekteinstellungen:
   - **Name**: `immovest-production` (oder ein anderer Name)
   - **Database Password**: Erstelle ein sicheres Passwort (speichere es sicher!)
   - **Region**: Wähle `Europe (Frankfurt)` für deutsche Nutzer
   - **Pricing Plan**: Kostenloser Plan ist für den Start ausreichend
5. Klicke auf **"Create new project"**
6. Warte 2-3 Minuten, bis das Projekt bereit ist

### 1.2 Datenbank Schema erstellen

1. Im Supabase Dashboard: Gehe zu **SQL Editor** (linke Seitenleiste)
2. Klicke auf **"New query"**
3. Kopiere den kompletten Inhalt aus der Datei `supabase-schema.sql` aus dem Repository
4. Füge den Inhalt in den SQL Editor ein
5. Klicke auf **"Run"** (oder drücke `Ctrl/Cmd + Enter`)
6. Du solltest die Meldung sehen: ✅ "Success. No rows returned"

### 1.3 Supabase API Keys kopieren

1. Gehe zu **Settings** → **API** (linke Seitenleiste)
2. Kopiere folgende Werte (benötigst du später):

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (geheim!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **WICHTIG**: Der `service_role` Key hat volle Datenbankrechte und darf **niemals** im Frontend-Code verwendet werden!

### 1.4 Row Level Security (RLS) überprüfen

Die Policies sind bereits im Schema enthalten. Überprüfe sie:

1. Gehe zu **Authentication** → **Policies**
2. Du solltest Policies für beide Tabellen sehen:
   - `analyses` - 4 Policies
   - `user_premium_usage` - 3 Policies

---

## Teil 2: Stripe einrichten

### 2.1 Stripe Account vorbereiten

1. Melde dich bei [stripe.com](https://stripe.com) an
2. Aktiviere **Test Mode** (Schalter oben rechts) für die Entwicklung
3. Du kannst später auf **Live Mode** wechseln

### 2.2 Stripe API Keys kopieren

1. Gehe zu **Developers** → **API keys**
2. Kopiere beide Keys:

```bash
# Publishable key (öffentlich)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Secret key (geheim!)
STRIPE_SECRET_KEY=sk_test_...
```

### 2.3 Stripe Billing Portal aktivieren

1. Gehe zu **Settings** → **Billing** → **Customer portal**
2. Klicke auf **"Activate test link"**
3. Konfiguriere erlaubte Aktionen:
   - ✅ Abonnement kündigen
   - ✅ Zahlungsmethode aktualisieren
   - ✅ Rechnungen anzeigen
4. Klicke auf **"Save changes"**

### 2.4 Payment Links verwenden

Die Payment Links sind bereits im Code hinterlegt:

```bash
# Monatsabo (13,99 €/Monat)
NEXT_PUBLIC_STRIPE_MONTHLY_PAYMENT_LINK=https://buy.stripe.com/test_6oUeVe5H038238bLfZc1wY02

# Jahresabo (69 €/Jahr)
NEXT_PUBLIC_STRIPE_YEARLY_PAYMENT_LINK=https://buy.stripe.com/test_3cIeVe2uO2HJajTfZc1wY03
```

**Für Production:** Erstelle eigene Payment Links:
1. Gehe zu **Products** → **+ Add product**
2. Erstelle zwei Produkte:
   - **ImmoVest Premium Monat**: 13,99 €/Monat
   - **ImmoVest Premium Jahr**: 69 €/Jahr
3. Für jedes Produkt: Klicke auf **"Create payment link"**
4. Konfiguration:
   - Sprache: Deutsch
   - Zahlungsmethoden: Kreditkarte, SEPA-Lastschrift
   - Nach Zahlung: Redirect zu `https://deine-domain.de/profile?success=true`
5. Kopiere die Payment Link URLs

### 2.5 Webhook einrichten (Production)

Webhooks sind notwendig, damit Stripe deinen Server über Zahlungen informieren kann.

1. Gehe zu **Developers** → **Webhooks** → **+ Add endpoint**
2. Endpoint URL: `https://deine-domain.de/api/stripe/webhook`
3. Beschreibung: `ImmoVest Production Webhook`
4. Events to send: Wähle folgende Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Klicke auf **"Add endpoint"**
6. Kopiere den **Webhook signing secret**: `whsec_...`

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

⚠️ **Hinweis für lokale Entwicklung**: Verwende Stripe CLI für lokales Webhook-Testing (siehe `STRIPE_SETUP.md`)

---

## Teil 3: Vercel Deployment

### 3.1 Repository mit Vercel verbinden

1. Gehe zu [vercel.com](https://vercel.com) und melde dich an
2. Klicke auf **"Add New..."** → **"Project"**
3. **Import Git Repository**: Wähle dein GitHub Repository `immovest`
4. Klicke auf **"Import"**

### 3.2 Projekteinstellungen

**Framework Preset**: Next.js (wird automatisch erkannt)

**Build Settings**:
- Build Command: `npm run build` (Standard)
- Output Directory: `.next` (Standard)
- Install Command: `npm install` (Standard)

### 3.3 Environment Variables setzen

Klicke auf **"Environment Variables"** und füge alle folgenden Variablen hinzu:

#### Clerk (Authentication)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

#### Stripe (Zahlungen)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_MONTHLY_PAYMENT_LINK=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_YEARLY_PAYMENT_LINK=https://buy.stripe.com/...
```

#### Supabase (Datenbank)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### OpenAI
```bash
OPENAI_API_KEY=sk-...
```

**Umgebung**: Setze alle Variablen für **Production**, **Preview** und **Development**

### 3.4 Deployment starten

1. Klicke auf **"Deploy"**
2. Warte 2-5 Minuten, bis das Deployment abgeschlossen ist
3. Du erhältst eine URL wie: `https://immovest-xxx.vercel.app`

### 3.5 Eigene Domain verbinden (optional)

1. In Vercel: Gehe zu **Settings** → **Domains**
2. Klicke auf **"Add"**
3. Gib deine Domain ein: `immovest.de`
4. Folge den Anweisungen, um DNS Records zu setzen:
   - **A Record**: `76.76.21.21`
   - **CNAME Record**: `cname.vercel-dns.com`
5. Warte auf DNS-Propagierung (kann 24h dauern)

---

## Teil 4: Post-Deployment Konfiguration

### 4.1 Clerk Redirect URLs aktualisieren

1. Gehe zu [clerk.com](https://clerk.com) Dashboard
2. Wähle deine Application
3. Gehe zu **Settings** → **URLs**
4. Füge deine Vercel-URLs hinzu:
   - **Home URL**: `https://immovest-xxx.vercel.app`
   - **Sign-in URL**: `https://immovest-xxx.vercel.app/sign-in`
   - **Sign-up URL**: `https://immovest-xxx.vercel.app/sign-up`
   - **After sign-in URL**: `https://immovest-xxx.vercel.app/input-method`
   - **After sign-up URL**: `https://immovest-xxx.vercel.app/input-method`

### 4.2 Stripe Webhook URL aktualisieren

Bereits in Teil 2.5 erledigt, aber prüfe:

1. Gehe zu Stripe Dashboard → **Developers** → **Webhooks**
2. Prüfe, ob die Endpoint URL korrekt ist: `https://deine-domain.de/api/stripe/webhook`
3. Teste den Webhook: Klicke auf **"Send test webhook"**

### 4.3 Testen

Teste alle Funktionen:

1. **Authentication**:
   - Registrierung
   - Anmeldung
   - Abmeldung

2. **Analysen**:
   - Neue Analyse erstellen
   - Analyse speichern
   - Gespeicherte Analysen laden

3. **Premium Features**:
   - Gehe zu `/pricing`
   - Wähle Monatsabo (Testmodus)
   - Verwende Test-Kreditkarte: `4242 4242 4242 4242`
   - Nach Zahlung: Prüfe ob Premium aktiviert ist
   - Teste Customer Portal (Abo verwalten)

4. **Webhooks**:
   - In Stripe Dashboard → **Developers** → **Webhooks** → Klicke auf deinen Endpoint
   - Prüfe **"Events"** Tab: Es sollten Events ankommen
   - Status sollte **2xx** sein (erfolgreiche Zustellung)

---

## Teil 5: Von Test zu Production wechseln

### 5.1 Stripe auf Live Mode umstellen

1. Stripe Dashboard: Schalte auf **Live Mode** (oben rechts)
2. Erstelle neue Payment Links (siehe Teil 2.4)
3. Kopiere Live Mode API Keys (siehe Teil 2.2)
4. Erstelle Live Mode Webhook (siehe Teil 2.5)
5. Aktualisiere Environment Variables in Vercel mit Live Keys

### 5.2 Clerk auf Production umstellen

1. Stelle sicher, dass du Clerk Production Keys verwendest (`pk_live_...`)

### 5.3 Final Checklist

- [ ] Alle Environment Variables auf Production gesetzt
- [ ] Stripe auf Live Mode
- [ ] Webhook funktioniert (teste mit echter Zahlung - klein anfangen!)
- [ ] Eigene Domain verbunden
- [ ] SSL-Zertifikat aktiv (automatisch durch Vercel)
- [ ] Privacy Policy und Terms of Service erstellt und verlinkt
- [ ] Impressum hinzugefügt (Pflicht in Deutschland!)

---

## Troubleshooting

### Build-Fehler auf Vercel

**Fehler**: `Error: Cannot find module...`

**Lösung**:
```bash
# Lokal testen
npm run build

# Wenn es lokal funktioniert, prüfe package.json und package-lock.json
# Commit und push diese Dateien
```

### Webhook-Fehler

**Symptom**: Payment funktioniert, aber Premium wird nicht aktiviert

**Lösung**:
1. Prüfe Vercel Logs: Gehe zu Vercel → **Deployments** → **Functions** → `/api/stripe/webhook`
2. Prüfe Stripe Dashboard → **Developers** → **Webhooks** → **Events**
3. Prüfe STRIPE_WEBHOOK_SECRET in Vercel Environment Variables

### Supabase Connection Error

**Fehler**: `Error: Invalid API key`

**Lösung**:
1. Prüfe ob alle 3 Supabase Environment Variables gesetzt sind
2. Prüfe ob keine Leerzeichen am Anfang/Ende der Keys sind
3. Generiere ggf. neue Keys in Supabase Dashboard

### Premium Status wird nicht angezeigt

**Lösung**:
1. Prüfe Supabase: Gehe zu **Table Editor** → `user_premium_usage`
2. Suche nach deiner User ID (von Clerk)
3. Prüfe `is_premium` und `premium_until` Felder
4. Falls leer: Webhook funktioniert nicht (siehe oben)

---

## Monitoring & Maintenance

### 1. Vercel Analytics

Aktiviere in Vercel Dashboard → **Analytics** für Traffic-Überwachung

### 2. Stripe Dashboard überwachen

- Tägliche Prüfung von fehlgeschlagenen Zahlungen
- Wöchentliche Prüfung von Webhook-Events
- Monatliche Prüfung von Churn-Rate

### 3. Supabase Monitoring

- Prüfe Database Health: **Settings** → **Database**
- Überwache Storage Usage
- Prüfe API Usage (Free Tier: 50k Requests/Monat)

### 4. Error Tracking

Empfohlen: Integriere [Sentry](https://sentry.io) für Error-Tracking

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Kosten-Übersicht (ca. Werte)

| Service | Free Tier | Paid Plan |
|---------|-----------|-----------|
| Vercel | 100 GB Traffic, Unlimited Sites | Pro: $20/Monat |
| Supabase | 500 MB DB, 50k API Requests | Pro: $25/Monat |
| Clerk | 10k MAU | Pro: $25/Monat |
| Stripe | 2,9% + 0,30€ pro Transaktion | Gleich |
| OpenAI | Pay-as-you-go | - |

**Geschätzte Kosten für Start**: $0-10/Monat (abhängig von Traffic)

---

## Support & Ressourcen

- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Clerk Docs](https://clerk.com/docs)

---

## Nächste Schritte nach Deployment

1. **Analytics einrichten**: Google Analytics, Plausible oder Vercel Analytics
2. **SEO optimieren**: Meta Tags, OpenGraph, Sitemap
3. **Blog/Content**: Für organisches Wachstum
4. **Marketing**: Social Media, SEO, Paid Ads
5. **Feedback sammeln**: User Interviews, Surveys
6. **Features priorisieren**: Basierend auf User Feedback

---

Viel Erfolg mit deinem ImmoVest Deployment! 🚀

Bei Fragen: Prüfe zuerst die Logs in Vercel und Stripe Dashboard.
