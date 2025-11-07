'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  FileBarChart,
  Keyboard,
  LineChart,
  Link as LinkIcon,
  LogIn,
  MapPin,
  ShieldCheck,
  Sparkles,
  Save,
} from 'lucide-react';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled past hero (roughly 600px)
      setIsScrolled(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    router.push('/input-method');
  };

  // Structured Data for SEO (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Imvestr",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
    },
    "description": "KI-basierter Immobilien-Renditerechner mit URL-Import, Foto-Analyse und automatischer Berechnung von Cashflow, Nettomietrendite, Eigenkapitalrendite und DSCR. Mikrolage-Bewertung und bankfähiger PDF-Report.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "127",
    },
    "featureList": [
      "KI-basierter URL-Import von ImmoScout24 und Immowelt",
      "Automatische Foto-Analyse mit KI",
      "Cashflow-Berechnung",
      "Nettomietrendite-Berechnung",
      "Eigenkapitalrendite (ROI)",
      "DSCR-Berechnung",
      "Mikrolage-Bewertung",
      "Mietpreis-Vergleich",
      "Quadratmeterpreis-Analyse",
      "Szenarien-Rechner",
      "Bankfähiger PDF-Report",
    ],
    "url": "https://immovestr.de",
    "screenshot": "https://immovestr.de/og-image.jpg",
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Imvestr",
    "url": "https://immovestr.de",
    "logo": "https://immovestr.de/logo.png",
    "description": "Führende deutschsprachige KI-Plattform für Immobilien-Rentabilitätsentscheidungen und Renditeberechnung",
    "sameAs": [],
  };

  const faqs = [
    {
      question: 'Wie genau sind die Ergebnisse?',
      answer:
        'Wir rechnen mit aktuellen Markt- und Modellwerten. Du siehst jede Annahme transparent, damit du sie anpassen kannst.',
    },
    {
      question: 'Brauche ich einen Account?',
      answer:
        'Du kannst sofort testen. Mit Account speicherst du Analysen, lädst Reports herunter und erhältst zwei Premium-Analysen gratis.',
    },
    {
      question: 'Was kostet Imvestr?',
      answer:
        'Der Einstieg ist kostenlos. Erweiterte Datenpakete und unbegrenzte Reports kannst du flexibel dazubuchen.',
    },
    {
      question: 'Unterstützt ihr bei der Bank?',
      answer:
        'Ja. Du bekommst ein bankfähiges PDF mit DSCR, Cashflow und Szenarien – ideal fürs Gespräch mit Finanzierungspartnern.',
    },
  ];

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  const importFeatures = [
    {
      icon: <LinkIcon className="w-6 h-6" />,
      title: 'URL-Import',
      description: 'ImmoScout24-, Immowelt- oder andere Links einfach einfügen – wir extrahieren alle Daten automatisch.',
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: 'Foto-Analyse',
      description: 'Screenshot vom Exposé machen, hochladen – fertig. KI erkennt Kaufpreis, Fläche, Miete und mehr.',
    },
    {
      icon: <Keyboard className="w-6 h-6" />,
      title: 'Manuelle Eingabe',
      description: 'Adresse und Eckdaten selbst eintragen – vollständige Kontrolle über jeden Wert.',
    },
  ];

  const analysisFeatures = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Kennzahlen',
      description: 'Cashflow, Nettomietrendite, Eigenkapitalrendite, DSCR und Amortisation – alle wichtigen KPIs auf einen Blick.',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Lagebewertung',
      description: 'Bewertung von Vermietbarkeit und Leerstandsrisiko. KI analysiert Lage, Infrastruktur und lokale Nachfrage.',
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: 'Kauf- und Mietpreisvergleich',
      description: 'Sieh auf einen Blick, ob du unter oder über Markt liegst. So weißt du, ob Anpassungen sinnvoll sind.',
    },
    {
      icon: <FileBarChart className="w-6 h-6" />,
      title: 'Investitionsanalyse',
      description: 'KI gibt fundierte Entscheidungshilfe und bewertet Zahlen, Lage, Risiken. Hilft im Investitions-Dschungel.',
    },
  ];

  const steps = [
    {
      title: '1 · Daten eingeben',
      description: 'Infos zu Objekt, Einnahmen und Finanzierung eingeben.',
    },
    {
      title: '2 · Ergebnis erhalten',
      description: 'Du erhältst alle relevanten Kennzahlen, Marktvergleiche und Investitionsanalyse, die dir bei der Entscheidung hilft.',
    },
    {
      title: '3 · Szenarien durchspielen',
      description: 'Passe deine Eingaben an, um deine Kennzahlen zu verbessern und bereite dich optimal auf dein Finanzierungsgespräch vor. Inkl. PDF Export.',
    },
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />

      <div className="min-h-screen bg-[#F7F9FF] text-[#0F172A]">
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        {/* Background layers */}
        {!isScrolled ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand))]/5 via-[hsl(var(--brand-2))]/5 to-transparent backdrop-blur-lg"></div>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl"></div>
        )}

        <div className="relative max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <div className="w-12 h-12 relative">
              <Image
                src="/logo.png"
                alt="Imvestr Logo"
                width={48}
                height={48}
                className="rounded-lg"
                priority
              />
            </div>
            <span className={`text-xl font-bold transition-colors ${isScrolled ? 'bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent' : 'text-white'}`}>
              Imvestr
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#steps" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-700 hover:text-[hsl(var(--brand))]' : 'text-white/90 hover:text-white'}`}>
              So funktioniert&apos;s
            </a>
            <a href="/pricing" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-700 hover:text-[hsl(var(--brand))]' : 'text-white/90 hover:text-white'}`}>
              Preise
            </a>
            <a href="#faq" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-700 hover:text-[hsl(var(--brand))]' : 'text-white/90 hover:text-white'}`}>
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                <button type="button" className={`text-sm font-medium transition-colors cursor-pointer ${isScrolled ? 'text-gray-700 hover:text-[hsl(var(--brand))]' : 'text-white/90 hover:text-white'}`}>
                  Anmelden
                </button>
              </SignInButton>
            ) : (
              <UserButton afterSignOutUrl="/">
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Profil & Einstellungen"
                    labelIcon={<Save size={16} />}
                    href="/profile"
                  />
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>
        </div>
      </header>

      <main role="main">
        <section
          aria-label="Hero"
          className="relative isolate overflow-hidden pt-44 pb-32"
        >
          {/* Background Image with filters */}
          <Image
            src="/hero-background.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_35%] brightness-[1.0] contrast-[0.98] saturate-[1.05] -z-10"
          />

          {/* Direkt-Navy→Terracotta, helles Soft-Light statt Abdunkeln */}
          <div
            className="absolute inset-0 mix-blend-screen opacity-25 z-0 sm:opacity-30 md:opacity-20"
            style={{ background: 'linear-gradient(135deg, #264171 0%, #3A5B89 42%, #A56554 100%)' }}
          />

          {/* Optional: Terracotta Glow rechts (macht heller) */}
          <div className="absolute -top-20 right-[-8%] h-[75vh] w-[55vw] bg-[#A56554]/28 blur-3xl rounded-full
                  mix-blend-screen z-0" />

          <div className="max-w-4xl mx-auto px-6 text-center">
            {/* Main Claim as H1 - focused and clear */}
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-8 text-white/95">
              KI-Analyse für deinen Immobilienkauf
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
              Adresse eingeben – wir liefern KPIs, Marktvergleiche und eine klare Investment-Einschätzung mit Empfehlungen. PDF fürs Bankgespräch inklusive.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={handleGetStarted}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--brand-2))] px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[hsl(var(--brand-2))]/90 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[hsl(var(--brand-2))]/50 sm:w-auto"
              >
                Analyse starten
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              {!isSignedIn && (
                <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                  <button type="button" className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white/90 transition-all duration-200 hover:bg-white/10 hover:border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 sm:w-auto">
                    <LogIn className="h-5 w-5" />
                    Einloggen/Anmelden
                  </button>
                </SignInButton>
              )}
            </div>

            {!isSignedIn && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <span>Keine Kreditkarte</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <span>Sofort starten</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Import Features - USP */}
        <section aria-label="Import-Optionen" className="px-6 py-12 md:py-20 bg-white border-y border-[#264171]/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E6AE63]/30 bg-[#E6AE63]/5 px-4 py-2 text-sm font-medium text-[#264171] mb-4">
                <Sparkles className="h-4 w-4 text-[#E6AE63]" />
                Smart Import
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                Drei Wege zum Ergebnis
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Egal ob Link, Foto oder selbst eintippen – du entscheidest, wie du startest.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-12">
              {importFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex flex-col gap-4 rounded-3xl border-2 border-[hsl(var(--brand))]/20 bg-gradient-to-br from-white to-[hsl(var(--brand))]/10 p-8 transition-all duration-200 hover:border-[hsl(var(--brand))]/30 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--brand))] transition-transform group-hover:scale-110 shadow-lg">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#0F172A]">{feature.title}</h3>
                  <p className="text-base leading-relaxed text-[#6C7F99]">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Visual Mockup - Import Flow */}
            <div className="relative rounded-3xl border border-[#E6AE63]/20 bg-gradient-to-br from-white via-[#F7F9FF] to-[#E6AE63]/5 p-8 overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E6AE63]/10 to-transparent rounded-full blur-3xl"></div>

              <div className="relative space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#264171] to-[#E6AE63] text-white text-sm font-semibold">1</div>
                  <span className="text-sm font-medium text-[#6C7F99] uppercase tracking-wide">Beispiel: URL-Import</span>
                </div>

                {/* URL Input Mockup */}
                <div className="rounded-2xl border border-[#264171]/10 bg-white p-6 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <LinkIcon className="h-5 w-5 text-[#E6AE63]" />
                    <span className="text-sm font-medium text-[#6C7F99]">Exposé-Link einfügen</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border-2 border-[#E6AE63] bg-[#E6AE63]/5 px-4 py-3">
                    <span className="flex-1 text-sm text-[#6C7F99]">https://www.immobilienscout24.de/expose/...</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#264171] to-[#E6AE63]">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Auto-filled Data Mockup */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Kaufpreis', value: '385.000 €', icon: '💶' },
                    { label: 'Wohnfläche', value: '78 m²', icon: '📏' },
                    { label: 'Kaltmiete', value: '1.420 €', icon: '🏠' },
                    { label: 'Zimmer', value: '3', icon: '🚪' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-[#264171]/8 bg-gradient-to-br from-white to-[#F7F9FF]/50 p-4">
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <div className="text-xs text-[#6C7F99] mb-1">{item.label}</div>
                      <div className="text-base font-semibold text-[#0F172A]">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22c55e]/10 to-[#22c55e]/5 border border-[#22c55e]/20 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                  <span className="text-sm font-medium text-[#22c55e]">Alle Daten automatisch erkannt</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" aria-label="Analyse-Features" className="px-6 py-12 md:py-24 bg-gradient-to-br from-[#F7F9FF] to-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#264171]/20 bg-white px-4 py-2 text-sm font-medium text-[#264171] mb-4">
                <BarChart3 className="h-4 w-4 text-[#264171]" />
                Analyse & Bewertung
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                Komplette Investitions-Analyse
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Von Lage über Marktpreise bis zur Rendite – wir bewerten alles, was wichtig ist für dein Investment.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {analysisFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex flex-col gap-4 rounded-3xl border-2 border-[hsl(var(--brand-2))]/30 bg-gradient-to-br from-white to-[hsl(var(--brand-2))]/10 p-10 transition-all duration-200 hover:border-[hsl(var(--brand-2))]/40 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--brand-2))] transition-transform group-hover:scale-110 shadow-lg">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#0F172A]">
                    {feature.title}
                  </h3>
                  <p className="text-base leading-relaxed text-[#6C7F99]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F7F9FF] px-6 py-12 md:py-24" id="steps" aria-label="Wie es funktioniert">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#264171]/30 bg-[#264171]/5 px-4 py-2 text-sm font-medium text-[#264171] mb-4">
                <LineChart className="h-4 w-4 text-[#264171]" />
                Prozess
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                So läuft deine Analyse
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Drei Schritte vom Objekt zur Entscheidung.
              </p>
            </div>

            <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
              <div className="flex-1 space-y-6">
                {steps.map((step, idx) => (
                  <div key={step.title} className="group rounded-3xl border border-[#264171]/8 bg-gradient-to-br from-white to-[#F7F9FF] p-8 transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#264171] text-xl font-semibold text-white shadow-md transition-transform group-hover:scale-110">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{step.title.split(' · ')[1]}</h3>
                        <p className="text-base text-[#6C7F99] leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual Dashboard Mockup */}
              <div className="flex-1 relative">
                <div className="sticky top-24 rounded-3xl border border-[#E6AE63]/20 bg-gradient-to-br from-white via-[#F7F9FF] to-[#E6AE63]/10 p-6 shadow-xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#264171]/5 to-[#E6AE63]/10 rounded-full blur-3xl"></div>

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#264171] to-[#E6AE63] text-white text-xs font-semibold">2</div>
                      <span className="text-xs font-medium text-[#6C7F99] uppercase tracking-wide">Live Analyse-Dashboard</span>
                    </div>

                    <div className="space-y-4">
                      {/* KPI Cards */}
                      <div className="rounded-2xl bg-white p-5 shadow-md border border-[#264171]/5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-xs text-[#6C7F99] mb-1">Monatlicher Cashflow</div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-[#22c55e] to-[#16a34a] bg-clip-text text-transparent">+327 €</div>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22c55e]/10 to-[#22c55e]/5">
                            <LineChart className="h-5 w-5 text-[#22c55e]" />
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-[#F7F9FF] overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full"></div>
                        </div>
                      </div>

                      {/* Location Score */}
                      <div className="rounded-2xl bg-white p-5 shadow-md border border-[#264171]/5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-xs text-[#6C7F99] mb-1">Mikrolage-Score</div>
                            <div className="text-2xl font-bold text-[#0F172A]">8.4<span className="text-base text-[#6C7F99]">/10</span></div>
                            <div className="text-xs text-[#E6AE63] font-medium">Top 15% im Stadtteil</div>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E6AE63]/10 to-[#E6AE63]/5">
                            <MapPin className="h-5 w-5 text-[#E6AE63]" />
                          </div>
                        </div>
                      </div>

                      {/* Rendite Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-[#264171]/5 to-[#264171]/10 p-4 border border-[#264171]/10">
                          <div className="text-xs text-[#6C7F99] mb-1">Nettomietrendite</div>
                          <div className="text-lg font-bold text-[#264171]">4.2%</div>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-[#E6AE63]/5 to-[#E6AE63]/10 p-4 border border-[#E6AE63]/10">
                          <div className="text-xs text-[#6C7F99] mb-1">DSCR</div>
                          <div className="text-lg font-bold text-[#E6AE63]">1.35</div>
                        </div>
                      </div>

                      {/* PDF Export Button */}
                      <button className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-[#264171] to-[#E6AE63] p-4 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
                        <div className="flex items-center gap-3">
                          <FileBarChart className="h-5 w-5" />
                          <span className="text-sm font-semibold">PDF-Report erstellen</span>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Zielgruppen" className="px-6 py-12 md:py-24 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E6AE63]/30 bg-[#E6AE63]/5 px-4 py-2 text-sm font-medium text-[#264171] mb-4">
                <CheckCircle2 className="h-4 w-4 text-[#E6AE63]" />
                Für jeden geeignet
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                Für Einsteiger & Profis
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Egal ob erste Immobilie oder zehntes Objekt – Imvestr liefert, was du brauchst.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: 'Mariam',
                  role: 'Ärztin',
                  quote: 'Ja/Nein plus PDF für die Bank – ohne Excel-Nacht.',
                  color: '#264171'
                },
                {
                  name: 'Daniel',
                  role: 'IT-Consultant',
                  quote: 'Szenarien verschieben, sofort neue Rendite sehen.',
                  color: '#E6AE63'
                },
                {
                  name: 'Tobias',
                  role: 'FIRE-Student',
                  quote: 'Cashflow in Sekunden. Endlich weiß ich, ob es sich lohnt.',
                  color: '#6C7F99'
                },
                {
                  name: 'Leandro',
                  role: 'Data-Nerd',
                  quote: 'Datenquellen transparent, Annahmen editierbar.',
                  color: '#264171'
                },
              ].map((persona) => (
                <div key={persona.name} className="group flex flex-col gap-4 rounded-3xl border border-[#264171]/8 bg-gradient-to-br from-white to-[#F7F9FF] p-6 transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#264171] font-semibold text-white shadow-md">
                      {persona.name[0]}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#0F172A]">{persona.name}</p>
                      <p className="text-sm text-[#6C7F99]">{persona.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#4b5563] leading-relaxed italic">&ldquo;{persona.quote}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" aria-label="Häufig gestellte Fragen" className="px-6 py-12 md:py-24 bg-gradient-to-br from-[#F7F9FF] to-white">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#264171]/30 bg-[#264171]/5 px-4 py-2 text-sm font-medium text-[#264171] mb-4">
                <ShieldCheck className="h-4 w-4 text-[#264171]" />
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">Häufige Fragen</h2>
              <p className="text-lg text-[#6C7F99]">Alles, was du wissen musst – kurz und klar.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="group rounded-2xl border border-[#264171]/8 bg-gradient-to-br from-white to-[#F7F9FF]/50 p-8 shadow-sm transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-3">{faq.question}</h3>
                  <p className="text-base text-[#6C7F99] leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Call-to-Action" className="px-6 py-12 md:py-24 bg-white">
          <div className="mx-auto max-w-5xl">
            <div
              className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #264171 0%, #315080 32%, #A56554 100%)' }}
            >

              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  In Sekunden zur Entscheidung
                </div>

                <h2 className="text-3xl md:text-5xl font-semibold mb-6">
                  Bereit für deine nächste Immobilie?
                </h2>

                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Cashflow, Nettomietrendite, EK-Rendite – klar aufbereitet.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--brand-2))] px-6 py-3 sm:px-10 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[hsl(var(--brand-2))]/90 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[hsl(var(--brand-2))]/50 sm:w-auto"
                  >
                    Jetzt kostenlos testen
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                  </button>

                  {!isSignedIn && (
                    <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                      <button type="button" className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-transparent px-6 py-3 sm:px-10 sm:py-5 text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:bg-white/10">
                        Kostenlos registrieren
                      </button>
                    </SignInButton>
                  )}
                </div>

                {!isSignedIn && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Keine Kreditkarte</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Sofort starten</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Volle Transparenz</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#264171]/8 bg-white px-6 py-12 text-sm text-[#6C7F99]">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/logo.png"
                    alt="Imvestr Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
                <span className="text-xl font-semibold tracking-tight text-[#264171]">Imvestr</span>
              </div>
              <p className="text-center md:text-left text-[#6C7F99] max-w-sm">
                Imvestr. Deine KI für smarte Immobilien-Investments.<br />
                <span className="font-medium text-[#264171]">Schnell. Klar. Vertrauenswürdig.</span>
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h3 className="font-semibold text-[#264171] mb-2">Rechtliches</h3>
              <a href="mailto:info@immovestr.de" className="hover:text-[hsl(var(--brand))] transition-colors">
                info@immovestr.de
              </a>
              <a href="/impressum" className="hover:text-[hsl(var(--brand))] transition-colors">
                Impressum
              </a>
              <a href="/datenschutz" className="hover:text-[hsl(var(--brand))] transition-colors">
                Datenschutz
              </a>
              <a href="/agb" className="hover:text-[hsl(var(--brand))] transition-colors">
                AGB
              </a>
            </div>

            {/* Social Media */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h3 className="font-semibold text-[#264171] mb-2">Folge uns</h3>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com/immovestr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[hsl(var(--brand))] transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://facebook.com/immovestr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[hsl(var(--brand))] transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://tiktok.com/@immovestr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[hsl(var(--brand))] transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-[#264171]/8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="rounded-xl border border-[#E6AE63]/20 bg-[#E6AE63]/5 px-4 py-3 max-w-md">
              <p className="text-xs font-medium text-[#264171] leading-relaxed">
                <ShieldCheck className="inline h-4 w-4 mr-1 text-[#E6AE63]" />
                Keine Anlageberatung. Ergebnisse sind Modell-Schätzungen und hängen von deinen Eingaben ab.
              </p>
            </div>
            <p className="text-xs">© {new Date().getFullYear()} Imvestr. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
