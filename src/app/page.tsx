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
  Zap,
} from 'lucide-react';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import { StickyBottomCTA } from '@/components/StickyBottomCTA';
import { PricingTeaser } from '@/components/PricingTeaser';
import { TrustBadges } from '@/components/TrustBadges';
import { InteractiveStepPreview } from '@/components/InteractiveStepPreview';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { trackCTA } = useAnalytics();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      // Check if scrolled past hero (roughly 600px)
      setIsScrolled(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = (location: string = 'hero') => {
    trackCTA('start_analysis', location);
    router.push('/input-method');
  };

  const handleFaqToggle = (faqQuestion: string, isOpening: boolean) => {
    if (isOpening) {
      trackCTA('faq_opened', 'faq_section');
    }
  };

  // Structured Data for SEO (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "imvestr",
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
    "screenshot": "https://immovestr.de/og-image.png",
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "imvestr",
    "url": "https://immovestr.de",
    "logo": "https://immovestr.de/logo.png",
    "description": "Führende deutschsprachige KI-Plattform für Immobilien-Rentabilitätsentscheidungen und Renditeberechnung",
    "sameAs": [
      // TODO: Add social media URLs here for better SEO, e.g.:
      // "https://www.instagram.com/imvestr",
      // "https://www.linkedin.com/company/imvestr",
      // "https://www.facebook.com/imvestr",
      // "https://www.youtube.com/@imvestr",
    ],
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
      question: 'Was kostet imvestr?',
      answer:
        'Der Einstieg ist kostenlos. Erweiterte Datenpakete und unbegrenzte Reports kannst du flexibel dazubuchen.',
    },
    {
      question: 'Unterstützt ihr bei der Bank?',
      answer:
        'Ja. Du bekommst ein bankfähiges PDF mit DSCR, Cashflow und Szenarien – ideal für das Gespräch mit Finanzierungspartnern.',
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
      title: 'KI-Einschätzung',
      description: 'Erste Einschätzung basierend auf deinen Kennzahlen. KI bewertet Zahlen und gibt dir eine initiale Orientierung.',
    },
  ];

  // processSteps removed - InteractiveStepPreview has its own steps defined
  /* const processSteps = [
    {
      number: 1,
      icon: <MapPin className="w-6 h-6" />,
      title: 'Objekt angeben',
      description: 'Adresse oder Eckdaten eintragen.',
      cta: 'Jetzt KPIs berechnen',
      color: '#264171',
    },
    {
      number: 2,
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'KPIs & KI-Einschätzung',
      description: 'Cashflow, Rendite, Marktvergleich.',
      cta: 'Analyse starten',
      color: '#E6AE63',
    },
    {
      number: 3,
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Szenarien testen',
      description: 'Miete, Zins, EK variieren – Effekt sehen.',
      cta: 'Miete/Zins anpassen',
      color: '#A56554',
    },
  ]; */

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
                alt="imvestr Logo"
                width={48}
                height={48}
                className="rounded-lg"
                priority
              />
            </div>
            <span className={`text-xl font-bold transition-colors ${isScrolled ? 'bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent' : 'text-white'}`}>
              imvestr
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
            {mounted && !isSignedIn && (
              <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                <button type="button" className={`text-sm font-medium transition-colors cursor-pointer ${isScrolled ? 'text-gray-700 hover:text-[hsl(var(--brand))]' : 'text-white/90 hover:text-white'}`}>
                  Anmelden
                </button>
              </SignInButton>
            )}
            {mounted && isSignedIn && (
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
            className="object-cover object-[50%_35%] brightness-[1.55] contrast-[0.98] saturate-[1.05] -z-10"
          />

          {/* Direkt-Navy→Terracotta, helles Soft-Light statt Abdunkeln */}
          <div
            className="absolute inset-0 mix-blend-screen opacity-25 z-0 sm:opacity-30 md:opacity-20"
            style={{ background: 'linear-gradient(135deg, #264171 0%, #3A5B89 42%, #A56554 100%)' }}
          />

          {/* Optional: Terracotta Glow rechts (macht heller) */}
          <div className="absolute -top-20 right-[-8%] h-[65vh] w-[45vw] bg-[#A56554]/28 blur-3xl rounded-full
                  mix-blend-screen z-0" />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            {/* Main Claim as H1 - focused and clear */}
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-8 text-white/95">
              KI-Analyse für deinen Immobilienkauf
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
              Adresse eingeben – wir liefern KPIs, Marktvergleiche und eine klare Investment-Einschätzung mit Empfehlungen. PDF für das Bankgespräch inklusive.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-6">
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleGetStarted('hero')}
                  data-cta="main"
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--brand-2))] px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[hsl(var(--brand-2))]/90 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[hsl(var(--brand-2))]/50 sm:w-auto"
                >
                  Analyse starten
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                {mounted && !isSignedIn && (
                  <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                    <button type="button" className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white/90 transition-all duration-200 hover:bg-white/10 hover:border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 sm:w-auto">
                      <LogIn className="h-5 w-5" />
                      Einloggen/Anmelden
                    </button>
                  </SignInButton>
                )}
              </div>

              {/* Trust Badges */}
              <TrustBadges />
            </div>
          </div>
        </section>

        {/* Import Features - USP */}
        <section aria-label="Import-Optionen" className="px-6 py-12 md:py-20 bg-white border-y border-[#264171]/5">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
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

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left: Import Features */}
              <div className="flex-1 space-y-6">
                {importFeatures.map((feature) => (
                  <div
                    key={feature.title}
                    className="group flex items-start gap-4 rounded-3xl border-2 border-[hsl(var(--brand))]/20 bg-gradient-to-br from-white to-[hsl(var(--brand))]/10 p-6 transition-all duration-200 hover:border-[hsl(var(--brand))]/30 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--brand))] transition-transform group-hover:scale-110 shadow-lg">
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#0F172A] mb-2">{feature.title}</h3>
                      <p className="text-base leading-relaxed text-[#6C7F99]">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Screenshot with Headline */}
              <div className="flex-1 space-y-6">
                {/* Screenshot Caption */}
                <div className="text-center lg:text-left">
                  <h3 className="text-xl md:text-2xl font-bold text-[#0F172A]">
                    So sieht&apos;s in der Praxis aus
                  </h3>
                  <p className="text-sm text-[#6C7F99] mt-2">
                    Einfach, intuitiv und schnell zu bedienen
                  </p>
                </div>

                {/* Input Method Screenshot */}
                <div
                  className="relative rounded-3xl border-2 border-gray-200 p-8 overflow-hidden shadow-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(38, 65, 113, 0.15) 0%, rgba(108, 127, 153, 0.12) 38%, rgba(230, 174, 99, 0.20) 70%, rgba(165, 101, 84, 0.15) 100%)',
                  }}
                >
                  <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200/50 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none z-10" />
                    <Image
                      src="/imvestr_inputmethod.png"
                      alt="Input-Methoden Auswahl"
                      width={1200}
                      height={800}
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </div>
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
                Kennzahlen & Einschätzung
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                Alle Kennzahlen auf einen Blick
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Von Lage über Marktpreise bis zur Rendite – plus eine erste KI-Einschätzung basierend auf deinen Zahlen.
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

        <section className="relative px-6 py-12 md:py-24 overflow-hidden bg-gradient-to-br from-[#264171]/[0.03] via-[#315080]/[0.02] to-white" id="steps" aria-label="Wie es funktioniert">
          {/* Subtle navy accent decorations */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#264171]/[0.06] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#315080]/[0.04] rounded-full blur-3xl"></div>

          {/* Decorative dots pattern */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#264171 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

          <div className="mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#264171]/20 bg-gradient-to-r from-[#264171]/10 to-[#315080]/10 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-[#264171] shadow-sm mb-4">
                <Zap className="h-4 w-4 text-[#264171]" />
                3-Schritte-Prozess
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                So läuft deine Analyse
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                In nur 3 einfachen Schritten zur vollständigen Immobilienanalyse – schnell, transparent und datenbasiert.
              </p>
            </div>

            {/* Interactive Step Preview with Tab Navigation on Mobile */}
            <InteractiveStepPreview onStartAnalysis={() => handleGetStarted('how_it_works')} />
          </div>
        </section>

        <section aria-label="Zielgruppen" className="relative px-6 py-12 md:py-24 overflow-hidden bg-gradient-to-br from-[#E6AE63]/[0.04] via-[#D4995A]/[0.03] to-white">
          {/* Subtle warm accent decorations */}
          <div className="absolute top-20 right-0 w-[550px] h-[550px] bg-[#E6AE63]/[0.08] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#C88850]/[0.06] rounded-full blur-3xl"></div>

          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#E6AE63 1px, transparent 1px), linear-gradient(90deg, #E6AE63 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          <div className="mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#E6AE63]/25 bg-gradient-to-r from-[#E6AE63]/15 to-[#D4995A]/10 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-[#264171] shadow-sm mb-4">
                <CheckCircle2 className="h-4 w-4 text-[#E6AE63]" />
                Für jeden geeignet
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                Für Einsteiger & Profis
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Egal ob erste Immobilie oder zehntes Objekt – imvestr liefert, was du brauchst.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: 'Mariam',
                  role: 'Ärztin',
                  quote: 'Hat mir die Bank-Unterlagen gerettet. PDF fertig in 2 Minuten.',
                  color: '#264171'
                },
                {
                  name: 'Daniel',
                  role: 'IT-Consultant',
                  quote: 'Szenarien verschieben, sofort neue Rendite sehen – genau mein Ding.',
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
                  quote: 'Datenquellen transparent, Annahmen editierbar – perfekt.',
                  color: '#264171'
                },
              ].map((persona) => (
                <div key={persona.name} className="group flex flex-col gap-5 rounded-3xl border-2 border-[#E6AE63]/15 bg-white/90 backdrop-blur-sm p-6 transition-all duration-300 hover:border-[#E6AE63]/35 hover:shadow-2xl hover:shadow-[#E6AE63]/10 hover:-translate-y-1 hover:bg-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E6AE63] to-[#D4995A] font-bold text-xl text-white shadow-lg shadow-[#E6AE63]/25 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#E6AE63]/35">
                      {persona.name[0]}
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#E6AE63]">{persona.name}</p>
                      <p className="text-sm font-medium text-[#6C7F99]">{persona.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#4b5563] leading-relaxed italic border-l-4 border-[#E6AE63]/30 pl-4">&ldquo;{persona.quote}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Teaser */}
        <PricingTeaser />

        <section id="faq" aria-label="Häufig gestellte Fragen" className="px-6 py-12 md:py-24 bg-gradient-to-br from-[#EEF2FF] via-[#F7F9FF] to-[#FDF8F3]">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#264171]/30 bg-[#264171]/5 px-4 py-2 text-sm font-medium text-[#264171] mb-4">
                <ShieldCheck className="h-4 w-4 text-[#264171]" />
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">Häufige Fragen</h2>
              <p className="text-lg text-[#6C7F99]">Alles, was du wissen musst – kurz und klar.</p>
            </div>
            {/* Desktop - Always open */}
            <div className="hidden md:block space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="group rounded-2xl border border-[#264171]/8 bg-gradient-to-br from-white to-[#F7F9FF]/50 p-8 shadow-sm transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-3">{faq.question}</h3>
                  <p className="text-base text-[#6C7F99] leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            {/* Mobile - Accordion */}
            <div className="md:hidden space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaqIndex === idx;
                return (
                  <div
                    key={faq.question}
                    className="rounded-2xl border border-[#264171]/8 bg-gradient-to-br from-white to-[#F7F9FF]/50 shadow-sm overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => {
                        handleFaqToggle(faq.question, !isOpen);
                        setActiveFaqIndex(isOpen ? null : idx);
                      }}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <h3 className="text-base font-semibold text-[#0F172A] pr-4">
                        {faq.question}
                      </h3>
                      <div className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#264171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-6 pb-6">
                        <p className="text-sm text-[#6C7F99] leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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

                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleGetStarted('footer_cta')}
                      data-cta="main"
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--brand-2))] px-6 py-3 sm:px-10 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[hsl(var(--brand-2))]/90 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[hsl(var(--brand-2))]/50 sm:w-auto"
                    >
                      Jetzt kostenlos testen
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                    </button>

                    {mounted && !isSignedIn && (
                      <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                        <button type="button" className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-transparent px-6 py-3 sm:px-10 sm:py-5 text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:bg-white/10">
                          Kostenlos registrieren
                        </button>
                      </SignInButton>
                    )}
                  </div>
                </div>
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
              <div className="flex items-center gap-1">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/logo.png"
                    alt="imvestr Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
                <span className="text-xl font-semibold tracking-tight text-[#264171]">imvestr</span>
              </div>
              <p className="text-center md:text-left text-[#6C7F99] max-w-sm">
                imvestr. Deine KI für smarte Immobilien-Investments.<br />
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
            <p className="text-xs">© {new Date().getFullYear()} imvestr. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom CTA - nur mobil */}
      <StickyBottomCTA />
      </div>
    </>
  );
}
