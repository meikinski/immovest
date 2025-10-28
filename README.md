# ImmoVest - KI-gestützte Immobilien-Investitionsanalyse

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
- **Stripe Integration**: Sichere Zahlungsabwicklung für Premium-Abos
- **Flexibles Abo**: 19,90 €/Monat, jederzeit kündbar

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

1. **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database Setup für Analysen-Speicherung
2. **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Payment Setup für Premium-Abos

### Minimale Konfiguration (.env.local)

```bash
# Clerk Authentication (erforderlich)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe (optional für Premium)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...

# Supabase (optional für Persistenz)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
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
