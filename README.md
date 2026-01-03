# ImVestr - KI-gestützte Immobilien-Investitionsanalyse

Deine intelligente Plattform für Immobilien-Investment-Analysen mit KI-Unterstützung.

## Features

### Analyse & Berechnung
- **Multi-Step Analyse-Workflow**: Objektdaten → Einnahmen & Kosten → Finanzierung → Analyse
- **KI-gestützte Marktanalyse**: Automatische Lage- und Preisprognosen via OpenAI
- **URL-Import**: Automatischer Import von ImmobilienScout24, Immowelt
- **Szenario-Rechner**: Teste verschiedene Parameter und vergleiche Szenarien
- **Smart Tab Navigation**: Verhindert unnötige API-Reloads bei unveränderter Eingabe
- **PDF-Export**: Professionelle PDF-Berichte mit allen KPIs

### Speichern & Verwalten
- **Gespeicherte Analysen**: Speichere und verwalte deine Analysen im Dashboard
- **User Authentication**: Sichere Anmeldung mit Clerk
- **Profil-Seite**: Verwalte dein Konto und Premium-Status

### Premium & Paywall
- **Premium Features**: Erweiterte Marktanalysen (Markt & Lage Tab)
- **2 Kostenlose Premium-Zugriffe**: Teste Premium-Features kostenlos
- **Stripe Payment Links**: Sichere Zahlungsabwicklung für Premium-Abos
- **Flexible Abos**:
  - Monatsabo: 13,99 €/Monat (jederzeit kündbar)
  - Jahresabo: 69 €/Jahr (spare 59%)
- **Customer Portal**: Verwalte dein Abo, Zahlungsmethoden und Rechnungen

### Design & UX
- **Responsive Design**: Funktioniert perfekt auf Desktop und Mobile
- **Fortschrittsanzeige**: Visuelles Feedback bei laufenden Analysen
- **Welcome Page**: Ansprechende Landing Page mit Login/Guest-Option

## Getting Started

### Installation

```bash
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

### Setup Guides

1. **[CLERK_PRODUCTION_SETUP.md](./CLERK_PRODUCTION_SETUP.md)** - Clerk Production Setup (Test → Live)
2. **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database Setup für Analysen-Speicherung
3. **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Payment Setup für Premium-Abos
4. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Komplette Anleitung für Vercel Deployment

### Minimale Konfiguration (.env.local)

Kopiere `.env.local.example` zu `.env.local` und fülle die Werte aus:

```bash
# Clerk Authentication (erforderlich)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe Payment (optional für Premium)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_MONTHLY_PAYMENT_LINK=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_YEARLY_PAYMENT_LINK=https://buy.stripe.com/...

# Supabase Database (optional für Persistenz)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI (für KI-Features)
OPENAI_API_KEY=sk-...
```

## Architektur

### Tech Stack
- **Framework**: Next.js 15.3 (App Router)
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4.1
- **State Management**: Zustand 5.0
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **AI**: OpenAI GPT-4 + Agents

### Projektstruktur
```
/src
  /app
    /api              # API Routes (Stripe, Premium, Analysis)
    /dashboard        # User Dashboard
    /profile          # User Profile & Settings
    /step/[step]      # Multi-Step Analyse Workflow
    page.tsx          # Landing Page
  /components         # React Components
  /contexts           # Context Providers (Paywall)
  /lib                # Utilities (calculations, storage, supabase)
  /store              # Zustand Stores
```
