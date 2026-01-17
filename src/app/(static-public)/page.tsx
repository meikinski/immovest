'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  BarChart3,
  Calculator,
  CheckCircle2,
  FileBarChart,
  MapPin,
  Zap,
  TrendingDown,
  AlertCircle,
  Camera,
  Link as LinkIcon,
  Edit3,
  Sparkles,
  Search,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { StickyBottomCTA } from '@/components/StickyBottomCTA';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function LandingPage() {
  const router = useRouter();
  const { trackCTA } = useAnalytics();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = React.useState<number | null>(null);
  const [selectedImportMethod, setSelectedImportMethod] = React.useState<'url' | 'photo' | 'manual'>('url');
  const testimonialsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll testimonials to center card on mount
  React.useEffect(() => {
    if (testimonialsRef.current) {
      const container = testimonialsRef.current;
      const cardWidth = 160 + 12; // card width + gap
      const scrollPosition = cardWidth * 3; // Scroll to card 4 (index 3)
      container.scrollLeft = scrollPosition;
    }
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
    "description": "KI-basierter Immobilien-Renditerechner mit URL-Import, Foto-Analyse und automatischer Berechnung von Cashflow, Nettomietrendite, Eigenkapitalrendite und DSCR.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "127",
    },
  };

  const faqs = [
    {
      question: 'Woher kommen die Daten?',
      answer:
        'Wir nutzen Live-Daten von Immobilienportalen wie ImmoScout24 und Immowelt für Marktvergleiche. Die Mikrolage-Bewertung basiert auf KI-Analysen lokaler Infrastruktur und Nachfrage.',
    },
    {
      question: 'Ist das für Anfänger geeignet?',
      answer:
        'Absolut. imvestr wurde speziell für Einsteiger entwickelt. Du musst kein Immobilien-Experte sein – wir erklären jede Kennzahl und jeden Schritt.',
    },
    {
      question: 'Was kostet es?',
      answer:
        'Der erste Check ist komplett kostenlos. Premium-Features wie Markt- & Investitionsanalyse und PDF-Export sind ab 9,90€ pro Analyse verfügbar.',
    },
    {
      question: 'Kann ich den Report für die Bank nutzen?',
      answer:
        'Ja! Der PDF-Report enthält alle banküblichen KPIs (DSCR, Eigenkapitalrendite, Cashflow) sowie Marktvergleiche und Szenarien.',
    },
    {
      question: 'Welche Portale werden unterstützt?',
      answer:
        'Aktuell unterstützen wir ImmoScout24, Immowelt, Immonet und Ebay Kleinanzeigen für den URL-Import. Du kannst aber auch Exposés fotografieren oder Daten manuell eingeben.',
    },
    {
      question: 'Was ist der Unterschied zu anderen Rechnern?',
      answer:
        'Die meisten Rechner arbeiten nur mit deinen Eingaben. Wir gehen weiter: Live-Marktdaten, KI-Lagebewertung, versteckte Kosten-Analyse und Szenario-Planung.',
    },
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-white text-[#1d1d1f]">
        {/* Header - Glass Effect */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-2xl shadow-sm' : 'bg-white/60 backdrop-blur-lg'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 cursor-pointer"
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
              <span className="text-2xl font-extrabold tracking-tighter">imvestr</span>
            </button>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
              <a href="#features" className="hover:text-black transition-colors">Features</a>
              <a href="#workflow" className="hover:text-black transition-colors">Ablauf</a>
              <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="bg-[#001d3d] text-white px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                Login
              </Link>
            </div>
          </div>
        </header>

        <main className="overflow-x-hidden">
          {/* 1. Hero Sektion - Interaktiver Hero mit Floating UI */}
          <section className="min-h-screen flex items-center justify-center bg-white px-6 relative overflow-hidden pt-24">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              {/* Left: Content */}
              <div>
                <span className="bg-orange-100 text-[#ff6b00] px-4 py-1.5 rounded-full text-sm font-bold mb-6 inline-block">
                  Dein persönlicher Investment-Copilot
                </span>
                <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter leading-tight mb-8 text-[#001d3d]">
                  Investiere <br />
                  ohne <span className="text-[#ff6b00]">Blindflug.</span>
                </h1>
                <p className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed">
                  Egal ob URL-Import, Foto-Scan oder manuelle Eingabe – imvestr prüft deinen Deal gegen echte Marktdaten und berechnet deinen Cashflow in Sekunden.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleGetStarted('hero')}
                    className="bg-[#ff6b00] text-white px-10 py-5 rounded-full font-bold text-lg shadow-lg hover:shadow-[#ff6b00]/20 transition-all hover:scale-105"
                  >
                    Jetzt kostenlos starten
                  </button>
                  <button
                    onClick={() => router.push('/sign-in')}
                    className="bg-white border-2 border-[#001d3d] text-[#001d3d] px-10 py-5 rounded-full font-bold text-lg hover:bg-[#001d3d] hover:text-white transition-all"
                  >
                    Anmelden / Einloggen
                  </button>
                </div>
              </div>

              {/* Right: Floating Dashboard Cards */}
              <div className="relative h-[500px] hidden md:block">
                {/* Background Shape */}
                <div className="absolute top-0 right-0 w-full h-full bg-orange-50 rounded-[60px] -rotate-3"></div>

                {/* Cashflow Card - Animated */}
                <div className="absolute top-10 left-0 bg-white rounded-[32px] p-8 w-64 shadow-2xl z-20 border-2 border-gray-100 animate-[float_6s_ease-in-out_infinite]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Netto-Cashflow</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-black text-[#001d3d]">+ 342,50 €</div>
                  <div className="text-[10px] text-green-600 mt-2 font-bold uppercase tracking-wider">
                    Monatlich Überschuss
                  </div>
                </div>

                {/* Leerstandsrisiko Card - Animated */}
                <div className="absolute bottom-20 right-0 bg-white rounded-[32px] p-8 w-64 shadow-2xl z-10 border-2 border-gray-100 animate-[float_6s_ease-in-out_infinite_1.5s]">
                  <div className="text-xs font-bold text-[#001d3d] mb-2 uppercase tracking-wider">Leerstandsrisiko</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-green-600">Niedrig</div>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ArrowDown className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    Hohe Nachfrage in dieser Lage
                  </div>
                </div>

                {/* Rendite Card - Animated (delayed) */}
                <div className="absolute top-1/2 right-12 bg-white rounded-[24px] p-6 w-48 shadow-xl z-15 border-2 border-gray-100 animate-[float_6s_ease-in-out_infinite_3s] opacity-0 animate-[fadeIn_0.5s_ease-in_1s_forwards]">
                  <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Rendite</div>
                  <div className="text-2xl font-black text-[#ff6b00]">8,2%</div>
                  <div className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider">
                    EK-Rendite p.a.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Warum die meisten Immobilien-Investments scheitern */}
          <section className="py-32 px-6 bg-[#fbfbfd]">
            <div className="max-w-6xl mx-auto px-6">
              {/* Sektions-Header */}
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight px-4">
                  <span className="text-[#001d3d]">Warum die meisten</span> <br className="hidden md:block" />
                  <span className="text-[#ff6b00]">Immobilien-Investments scheitern.</span>
                </h2>
                <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
                  Die häufigsten Fehler, die dich tausende Euro kosten können – und wie imvestr dich davor schützt.
                </p>
              </div>

              {/* 2x2 Grid der Problem-Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">

                {/* Problem 1: Versteckte Kosten */}
                <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-[#001d3d] rounded-2xl flex items-center justify-center shadow-sm">
                      <AlertCircle className="w-7 h-7 text-[#ff6b00]" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-[#001d3d]">
                    Versteckte Kosten übersehen
                  </h3>

                  <p className="text-gray-500 leading-relaxed mb-8">
                    Makler rechnen oft ohne Instandhaltungsrücklage, Nebenkosten oder realistische Mietausfälle. Das Ergebnis: Negativer Cashflow.
                  </p>

                  <div className="mt-auto bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase w-24">Makler</span>
                        <div className="h-3 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-full" />
                        </div>
                        <span className="text-xs font-black text-emerald-600">+ 450€</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase w-24">Realität</span>
                        <div className="h-3 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#ff6b00] w-1/4" />
                        </div>
                        <span className="text-xs font-black text-[#ff6b00]">+ 120€</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Problem 2: Zu teuer gekauft */}
                <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-[#001d3d] rounded-2xl flex items-center justify-center shadow-sm">
                      <Search className="w-7 h-7 text-[#ff6b00]" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-[#001d3d]">
                    Zu teuer gekauft
                  </h3>

                  <p className="text-gray-500 leading-relaxed mb-8">
                    Ohne Marktvergleich zahlst du schnell 10-20% über Wert. Das schmälert deine Rendite für Jahre.
                  </p>

                  <div className="mt-auto bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-end justify-center gap-8 h-32">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 bg-gray-400 h-28 rounded-t-xl"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Portal</span>
                      </div>
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 bg-[#ff6b00] h-20 rounded-t-xl"></div>
                        <span className="text-[10px] font-bold text-[#ff6b00] uppercase">Fair</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Problem 3: Schlechte Lage */}
                <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-[#001d3d] rounded-2xl flex items-center justify-center shadow-sm">
                      <MapPin className="w-7 h-7 text-[#ff6b00]" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-[#001d3d]">
                    Schlechte Lage
                  </h3>

                  <p className="text-gray-500 leading-relaxed mb-8">
                    Die Wohnung sieht toll aus, aber die Lage? Ohne lokale Nachfrage-Analyse riskierst du Leerstand.
                  </p>

                  <div className="mt-auto bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">Nachfrage</span>
                        <span className="text-xs font-bold text-[#ff6b00] uppercase">Niedrig</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 via-orange-400 to-[#ff6b00] w-[35%]" />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase">
                        <span>A-Lage</span>
                        <span className="text-[#ff6b00]">← Risiko</span>
                        <span>C-Lage</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Problem 4: Miete überschätzt */}
                <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-[#001d3d] rounded-2xl flex items-center justify-center shadow-sm">
                      <TrendingDown className="w-7 h-7 text-[#ff6b00]" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-[#001d3d]">
                    Miete überschätzt
                  </h3>

                  <p className="text-gray-500 leading-relaxed mb-8">
                    Makler zeigen optimistische Mietpreise. In Realität liegen sie oft 10-15% darunter. Das killt deine Rendite.
                  </p>

                  <div className="mt-auto bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase w-24">Angebot</span>
                        <div className="h-3 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-400 w-full" />
                        </div>
                        <span className="text-xs font-black text-gray-600">1.200€</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase w-24">Markt</span>
                        <div className="h-3 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#ff6b00] w-[85%]" />
                        </div>
                        <span className="text-xs font-black text-[#ff6b00]">1.020€</span>
                      </div>
                      <div className="text-center pt-2">
                        <span className="text-lg font-black text-[#ff6b00]">-15%</span>
                        <span className="text-xs text-gray-400 ml-2">Rendite-Verlust</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* 3. Wie imvestr dir hilft */}
          <section id="features" className="py-32 px-6 bg-white overflow-visible">
            <div className="max-w-6xl mx-auto px-6">
              <div className="mb-20 overflow-visible">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight">
                  <span className="text-[#001d3d]">Wie imvestr</span> <span className="text-[#ff6b00]">dir hilft.</span>
                </h2>
                <p className="text-gray-500 text-xl max-w-2xl leading-relaxed">
                  imvestr ist mehr als ein Rechner. Wir nutzen Live-Marktdaten, um dir die Wahrheit über dein Investment zu sagen.
                </p>
              </div>

              {/* Bento Box Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Marktdaten-Check - Large Box */}
                <div className="md:col-span-8 bg-white rounded-[32px] p-10 flex flex-col md:flex-row items-center gap-8 min-h-[300px] shadow-lg border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  <div className="md:w-1/2">
                    <div className="w-14 h-14 bg-[#001d3d] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                      <BarChart3 className="w-7 h-7 text-[#ff6b00]" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-[#001d3d]">Marktdaten-Check</h3>
                    <p className="text-gray-500 leading-relaxed mb-4">
                      Wir prüfen Kauf- und Mietpreise am Standort und checken wie die Nachfrage ist.
                    </p>
                    <p className="text-sm text-[#ff6b00] font-semibold">
                      → Verhindert Fehlkäufe durch objektive Marktdaten
                    </p>
                  </div>
                  <div className="md:w-1/2 h-full bg-orange-50 rounded-2xl flex items-center justify-center p-12">
                    <BarChart3 className="w-32 h-32 text-orange-200" />
                  </div>
                </div>

                {/* KPI-Berechnung - Small Navy Box */}
                <div className="md:col-span-4 bg-[#001d3d] text-white rounded-[32px] p-10 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <Calculator className="w-7 h-7 text-[#ff6b00]" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">KPI-Berechnung</h3>
                  <p className="text-blue-100 text-sm opacity-80 leading-relaxed mb-4">
                    Wichtige KPIs inkl. Cashflow unter Berücksichtigung deines persönlichen Steuersatzes, AfA und kalkulatorischer Kosten.
                  </p>
                  <p className="text-sm text-[#ff6b00] font-semibold">
                    → Realistische Rendite statt Schönrechnung
                  </p>
                </div>

                {/* Investitionsanalyse - Small Box */}
                <div className="md:col-span-4 bg-white rounded-[32px] p-10 shadow-lg border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  <div className="w-14 h-14 bg-[#001d3d] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <Lightbulb className="w-7 h-7 text-[#ff6b00]" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-[#001d3d]">Investitionsanalyse</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Unsere KI gibt eine verständliche Erklärung über die Investition in einfachen Worten – auch für Einsteiger.
                  </p>
                  <p className="text-sm text-[#ff6b00] font-semibold">
                    → Verstehe jeden Aspekt deines Deals
                  </p>
                </div>

                {/* Szenarien - Small Box */}
                <div className="md:col-span-4 bg-white rounded-[32px] p-10 shadow-lg border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  <div className="w-14 h-14 bg-[#001d3d] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <Zap className="w-7 h-7 text-[#ff6b00]" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-[#001d3d]">Szenarien</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Was passiert bei 4,5% Zinsen? Ein Klick, sofortige Antwort.
                  </p>
                  <p className="text-sm text-[#ff6b00] font-semibold">
                    → Teste dein Investment gegen Risiken ab
                  </p>
                </div>

                {/* Bank-Ready PDF - Small Highlighted Box */}
                <div className="md:col-span-4 bg-white rounded-[32px] p-10 border-2 border-[#ff6b00] shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                    <FileBarChart className="w-7 h-7 text-[#ff6b00]" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-[#001d3d]">Bank-Ready PDF</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Exportiere deine Analyse als professionelles Exposé für deine Bankanfrage.
                  </p>
                  <p className="text-sm text-[#ff6b00] font-semibold">
                    → Überzeuge deine Bank mit Daten statt Bauchgefühl
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. So funktioniert imvestr */}
          <section id="workflow" className="py-32 px-6 bg-[#f5f5f7] overflow-visible">
            <div className="max-w-6xl mx-auto px-6">
              <div className="mb-20 overflow-visible text-right">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight">
                  <span className="text-[#001d3d]">So funktioniert</span> <span className="text-[#ff6b00]">imvestr.</span>
                </h2>
                <p className="text-gray-500 text-xl max-w-2xl ml-auto leading-relaxed">
                  In 3 einfachen Schritten von der Exposé-URL zum vollständigen Investment-Report.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Schritt 1 */}
                <div className="bg-white border-2 border-gray-100 rounded-[40px] p-10 hover:shadow-2xl hover:-translate-y-2 hover:border-[#ff6b00]/30 transition-all duration-300 group relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-[#001d3d] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg">
                    <svg className="w-8 h-8 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-[#ff6b00] text-xs font-semibold uppercase tracking-wider mb-3">Schritt 1</div>
                  <h3 className="text-2xl font-bold mb-4">Import</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Kopiere den Link, fotografiere das Exposé oder gib die Daten manuell ein. Unsere KI extrahiert alle Informationen.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">URL-Import</span>
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">Foto-Scan</span>
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">Manuelle Eingabe</span>
                  </div>
                  <div className="absolute bottom-0 right-4 text-[140px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">01</div>
                </div>

                {/* Schritt 2 */}
                <div className="bg-white border-2 border-gray-100 rounded-[40px] p-10 hover:shadow-2xl hover:-translate-y-2 hover:border-[#ff6b00]/30 transition-all duration-300 group relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-[#001d3d] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg">
                    <BarChart3 className="w-8 h-8 text-[#ff6b00]" />
                  </div>
                  <div className="text-[#ff6b00] text-xs font-semibold uppercase tracking-wider mb-3">Schritt 2</div>
                  <h3 className="text-2xl font-bold mb-4">Markt- & Investitionsanalyse</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Unsere KI analysiert Kaufpreis und Miete gegen echte Angebote in der Nachbarschaft. Du siehst sofort, ob die Zahlen im Exposé realistisch sind oder Wunschdenken. Keine vagen Bewertungen – nur harte Fakten und Marktvergleiche.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">Kauf-Vergleich</span>
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">Miet-Vergleich</span>
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">Investitionsanalyse</span>
                  </div>
                  <div className="absolute bottom-0 right-4 text-[140px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">02</div>
                </div>

                {/* Schritt 3 */}
                <div className="bg-white border-2 border-gray-100 rounded-[40px] p-10 hover:shadow-2xl hover:-translate-y-2 hover:border-[#ff6b00]/30 transition-all duration-300 group relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-[#001d3d] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg">
                    <FileBarChart className="w-8 h-8 text-[#ff6b00]" />
                  </div>
                  <div className="text-[#ff6b00] text-xs font-semibold uppercase tracking-wider mb-3">Schritt 3</div>
                  <h3 className="text-2xl font-bold mb-4">Simulation & Report</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Teste verschiedene Szenarien und erhalte einen bankfähigen PDF-Report mit allen KPIs.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">Szenarien</span>
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">Rendite-Effekte</span>
                    <span className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-medium">PDF-Export</span>
                  </div>
                  <div className="absolute bottom-0 right-4 text-[140px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">03</div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Wie funktioniert der Import? - Sticky Workflow */}
          <section className="py-32 bg-white px-6">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
                  <span className="text-[#001d3d]">Wie funktioniert</span> <span className="text-[#ff6b00]">der Import?</span>
                </h2>
                <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
                  Drei smarte Wege, um deine Immobilien-Daten in Sekunden zu erfassen.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-start gap-20">
                {/* Left: Sticky Text */}
                <div className="md:w-1/2">
                  <div className="sticky top-40 space-y-12">
                    {/* Step 1: URL-Import */}
                    <div
                      className={`border-l-4 pl-8 transition-all duration-300 cursor-pointer ${
                        selectedImportMethod === 'url'
                          ? 'border-[#ff6b00] opacity-100'
                          : 'border-gray-200 opacity-40 hover:opacity-100 hover:border-[#ff6b00]'
                      }`}
                      onClick={() => setSelectedImportMethod('url')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#001d3d] flex items-center justify-center shadow-lg">
                          <LinkIcon className="w-6 h-6 text-[#ff6b00]" />
                        </div>
                        <h4 className="text-3xl font-bold text-[#001d3d]">1. Link einfügen</h4>
                      </div>
                      <p className="text-gray-500 text-lg leading-relaxed">
                        Kopiere einfach den Link von ImmoScout24, Immowelt oder anderen Portalen. Unsere KI liest alle relevanten Daten automatisch aus.
                      </p>
                      <div className="mt-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                          <span>Alle Objektdaten in Sekunden erfasst</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                          <span>Unterstützt alle großen Portale</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Foto-Scan */}
                    <div
                      className={`border-l-4 pl-8 transition-all duration-300 cursor-pointer ${
                        selectedImportMethod === 'photo'
                          ? 'border-[#ff6b00] opacity-100'
                          : 'border-gray-200 opacity-40 hover:opacity-100 hover:border-[#ff6b00]'
                      }`}
                      onClick={() => setSelectedImportMethod('photo')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#001d3d] flex items-center justify-center shadow-lg">
                          <Camera className="w-6 h-6 text-[#ff6b00]" />
                        </div>
                        <h4 className="text-3xl font-bold text-[#001d3d]">2. Foto scannen</h4>
                      </div>
                      <p className="text-gray-500 text-lg leading-relaxed">
                        Fotografiere das Exposé mit deinem Smartphone. Unsere OCR-KI extrahiert alle wichtigen Zahlen automatisch.
                      </p>
                      <div className="mt-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                          <span>98% Genauigkeit durch OCR + GPT-4 Vision</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                          <span>Perfekt für Besichtigungen vor Ort</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Manuelle Eingabe */}
                    <div
                      className={`border-l-4 pl-8 transition-all duration-300 cursor-pointer ${
                        selectedImportMethod === 'manual'
                          ? 'border-[#ff6b00] opacity-100'
                          : 'border-gray-200 opacity-40 hover:opacity-100 hover:border-[#ff6b00]'
                      }`}
                      onClick={() => setSelectedImportMethod('manual')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#001d3d] flex items-center justify-center shadow-lg">
                          <Edit3 className="w-6 h-6 text-[#ff6b00]" />
                        </div>
                        <h4 className="text-3xl font-bold text-[#001d3d]">3. Manuell eingeben</h4>
                      </div>
                      <p className="text-gray-500 text-lg leading-relaxed">
                        Trage die Daten selbst ein mit intelligenten Vorschlägen und Auto-Vervollständigung.
                      </p>
                      <div className="mt-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                          <span>Smartes Formular mit Validierung</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                          <span>Volle Kontrolle über alle Details</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Visual Mockup */}
                <div className="md:w-1/2">
                  <div className="bg-[#001d3d] rounded-[48px] h-[600px] flex items-center justify-center p-12 shadow-2xl border-4 border-gray-100">
                    <div className="w-full max-w-md">
                      {/* URL Import Mockup */}
                      {selectedImportMethod === 'url' && (
                        <div className="animate-[fadeIn_0.3s_ease-in]">
                          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-10 h-10 rounded-xl bg-[#ff6b00] flex items-center justify-center">
                                <LinkIcon className="w-6 h-6 text-white" />
                              </div>
                              <div className="text-white font-bold text-lg">URL einfügen</div>
                            </div>

                            {/* Input Field Mockup */}
                            <div className="bg-white rounded-2xl p-4 mb-6 flex items-center gap-3">
                              <div className="w-5 h-5 text-gray-400">
                                <LinkIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 h-6 bg-gray-100 rounded animate-pulse"></div>
                            </div>

                            {/* Button Mockup */}
                            <div className="bg-[#ff6b00] rounded-full py-4 flex items-center justify-center gap-2">
                              <span className="text-white font-bold">Analyse starten</span>
                              <ArrowRight className="w-5 h-5 text-white" />
                            </div>

                            {/* Feature Pills */}
                            <div className="mt-8 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="h-3 bg-white/20 rounded flex-1"></div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="h-3 bg-white/20 rounded flex-1 w-3/4"></div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="h-3 bg-white/20 rounded flex-1 w-2/3"></div>
                              </div>
                            </div>
                          </div>

                          {/* KI Badge */}
                          <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-sm">
                            <Sparkles className="w-4 h-4 text-[#ff6b00]" />
                            <span>Powered by GPT-4 Vision + OCR</span>
                          </div>
                        </div>
                      )}

                      {/* Photo Scan Mockup */}
                      {selectedImportMethod === 'photo' && (
                        <div className="animate-[fadeIn_0.3s_ease-in]">
                          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-10 h-10 rounded-xl bg-[#ff6b00] flex items-center justify-center">
                                <Camera className="w-6 h-6 text-white" />
                              </div>
                              <div className="text-white font-bold text-lg">Foto scannen</div>
                            </div>

                            {/* Camera Preview Mockup */}
                            <div className="bg-white/5 rounded-2xl p-6 mb-6 aspect-[4/3] flex items-center justify-center border-2 border-dashed border-white/30">
                              <div className="text-center">
                                <Camera className="w-16 h-16 text-white/40 mx-auto mb-3" />
                                <div className="text-white/60 text-sm">Exposé fotografieren</div>
                              </div>
                            </div>

                            {/* Scan Button Mockup */}
                            <div className="bg-[#ff6b00] rounded-full py-4 flex items-center justify-center gap-2">
                              <span className="text-white font-bold">Foto aufnehmen</span>
                              <Camera className="w-5 h-5 text-white" />
                            </div>

                            {/* OCR Features */}
                            <div className="mt-8 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="text-white/60 text-sm">OCR-Texterkennung</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="text-white/60 text-sm">GPT-4 Vision Analyse</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="text-white/60 text-sm">98% Genauigkeit</div>
                              </div>
                            </div>
                          </div>

                          {/* KI Badge */}
                          <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-sm">
                            <Sparkles className="w-4 h-4 text-[#ff6b00]" />
                            <span>KI-gestützte Texterkennung</span>
                          </div>
                        </div>
                      )}

                      {/* Manual Entry Mockup */}
                      {selectedImportMethod === 'manual' && (
                        <div className="animate-[fadeIn_0.3s_ease-in]">
                          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-10 h-10 rounded-xl bg-[#ff6b00] flex items-center justify-center">
                                <Edit3 className="w-6 h-6 text-white" />
                              </div>
                              <div className="text-white font-bold text-lg">Manuelle Eingabe</div>
                            </div>

                            {/* Form Fields Mockup */}
                            <div className="space-y-4 mb-6">
                              <div>
                                <div className="text-white/60 text-xs mb-2">Kaufpreis</div>
                                <div className="bg-white rounded-xl p-3 flex items-center gap-2">
                                  <div className="h-5 bg-gray-100 rounded flex-1 w-1/2"></div>
                                  <div className="text-gray-400 text-sm">€</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-white/60 text-xs mb-2">Kaltmiete</div>
                                <div className="bg-white rounded-xl p-3 flex items-center gap-2">
                                  <div className="h-5 bg-gray-100 rounded flex-1 w-1/3"></div>
                                  <div className="text-gray-400 text-sm">€</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-white/60 text-xs mb-2">Wohnfläche</div>
                                <div className="bg-white rounded-xl p-3 flex items-center gap-2">
                                  <div className="h-5 bg-gray-100 rounded flex-1 w-1/4"></div>
                                  <div className="text-gray-400 text-sm">m²</div>
                                </div>
                              </div>
                            </div>

                            {/* Continue Button Mockup */}
                            <div className="bg-[#ff6b00] rounded-full py-4 flex items-center justify-center gap-2">
                              <span className="text-white font-bold">Weiter</span>
                              <ArrowRight className="w-5 h-5 text-white" />
                            </div>

                            {/* Smart Features */}
                            <div className="mt-8 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="text-white/60 text-sm">Auto-Vervollständigung</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="text-white/60 text-sm">Intelligente Validierung</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="text-white/60 text-sm">Smarte Vorschläge</div>
                              </div>
                            </div>
                          </div>

                          {/* KI Badge */}
                          <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-sm">
                            <Sparkles className="w-4 h-4 text-[#ff6b00]" />
                            <span>KI-gestützte Eingabehilfe</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Was ist dein Investment-Ziel? */}
          <section className="py-32 px-6 bg-[#f5f5f7]">
            <div className="max-w-6xl mx-auto px-6">
              <div className="mb-20 overflow-visible text-right">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight">
                  <span className="text-[#001d3d]">Was ist dein </span>
                  <span className="text-[#ff6b00]">Investment-Ziel?</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl ml-auto leading-relaxed">
                  Jeder Anlegertyp kann sich die für ihn wichtigen Infos rausholen.
                </p>
              </div>

              <div id="investment-goals-scroll" className="flex gap-4 overflow-x-auto pb-16 snap-x snap-mandatory scrollbar-hide pl-6 md:pl-32" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {/* Karte 1: Steuern */}
                <div className="bg-white rounded-[40px] p-5 min-w-[130px] md:min-w-[150px] h-auto snap-center border-2 border-gray-100 group cursor-pointer hover:bg-[#001d3d] hover:border-[#001d3d] hover:text-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 shadow-lg flex-shrink-0 flex flex-col">
                  <div className="text-[#ff6b00] font-bold mb-6 text-4xl">01</div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-white">Steuern sparen</h3>
                  <p className="text-gray-600 text-sm leading-relaxed group-hover:text-slate-300 mb-4">
                    Wandle deine Steuerlast in privates Vermögen um. Wir berechnen den Netto-Effekt nach AfA und Zinsen.
                  </p>
                  <ul className="space-y-2 text-xs text-gray-500 group-hover:text-slate-400">
                    <li>✓ AfA-Berechnung mit deinem Steuersatz</li>
                    <li>✓ Steuerersparnis durch Zinskosten</li>
                    <li>✓ Netto-Rendite nach Steuern</li>
                  </ul>
                </div>

                {/* Karte 2: Vorsorge */}
                <div className="bg-white rounded-[40px] p-5 min-w-[130px] md:min-w-[150px] h-auto snap-center border-2 border-gray-100 group cursor-pointer hover:bg-[#001d3d] hover:border-[#001d3d] hover:text-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 shadow-lg flex-shrink-0 flex flex-col">
                  <div className="text-[#ff6b00] font-bold mb-6 text-4xl">02</div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-white">Altersvorsorge</h3>
                  <p className="text-gray-600 text-sm leading-relaxed group-hover:text-slate-300 mb-4">
                    Baue dir ein Portfolio auf, das im Alter für dich sorgt. Wir prüfen die Langzeit-Rendite und Sicherheit.
                  </p>
                  <ul className="space-y-2 text-xs text-gray-500 group-hover:text-slate-400">
                    <li>✓ Langfristige Wertsteigerung</li>
                    <li>✓ Inflationsschutz durch Sachwerte</li>
                    <li>✓ Altersrente aus Mieteinnahmen</li>
                  </ul>
                </div>

                {/* Karte 3: Cashflow */}
                <div className="bg-white rounded-[40px] p-5 min-w-[130px] md:min-w-[150px] h-auto snap-center border-2 border-gray-100 group cursor-pointer hover:bg-[#001d3d] hover:border-[#001d3d] hover:text-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 shadow-lg flex-shrink-0 flex flex-col">
                  <div className="text-[#ff6b00] font-bold mb-6 text-4xl">03</div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-white">Passives Einkommen</h3>
                  <p className="text-gray-600 text-sm leading-relaxed group-hover:text-slate-300 mb-4">
                    Maximiere deinen monatlichen Cashflow. Wir finden die &quot;Haken&quot; in den Mietkalkulationen der Makler.
                  </p>
                  <ul className="space-y-2 text-xs text-gray-500 group-hover:text-slate-400">
                    <li>✓ Realistische Mieteinnahmen-Prognose</li>
                    <li>✓ Alle Nebenkosten berücksichtigt</li>
                    <li>✓ Monatlicher Netto-Cashflow</li>
                  </ul>
                </div>
              </div>

              {/* Scroll Indicators */}
              <div className="flex items-center justify-end gap-4 mt-8 pr-6">
                <button
                  onClick={() => {
                    const container = document.querySelector('#investment-goals-scroll');
                    if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                  }}
                  className="w-12 h-12 rounded-full bg-[#001d3d] text-white flex items-center justify-center hover:bg-[#ff6b00] transition-all shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    const container = document.querySelector('#investment-goals-scroll');
                    if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                  }}
                  className="w-12 h-12 rounded-full bg-[#001d3d] text-white flex items-center justify-center hover:bg-[#ff6b00] transition-all shadow-lg"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </section>

          {/* 7. Testimonials (SEPARATE SECTION) */}
          <section className="py-32 px-6 bg-white overflow-visible">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16 overflow-visible">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight">
                  <span className="text-[#001d3d]">Was unsere</span> <span className="text-[#ff6b00]">Nutzer sagen</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Echte Erfahrungen von Immobilien-Investoren, die imvestr erfolgreich nutzen.
                </p>
              </div>

              <div className="relative">
                <div ref={testimonialsRef} className="flex gap-3 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {/* Testimonial 1 - Glassmorphism */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-4 border-2 border-gray-200/50 min-w-[160px] max-w-[160px] snap-center flex-shrink-0 shadow-lg flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff8533] flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3">
                      L
                    </div>
                    <p className="font-bold text-[#001d3d] text-sm mb-1">Lisa</p>
                    <p className="text-xs text-gray-500 mb-4">Einsteigerin, 28</p>
                    <p className="text-gray-700 leading-snug italic text-xs">
                      &quot;Als Anfängerin war ich überfordert. imvestr erklärt mir alles in einfachen Worten.&quot;
                    </p>
                  </div>

                  {/* Testimonial 2 - Glassmorphism */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-4 border-2 border-gray-200/50 min-w-[160px] max-w-[160px] snap-center flex-shrink-0 shadow-lg flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#001d3d] to-[#003d7d] flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3">
                      M
                    </div>
                    <p className="font-bold text-[#001d3d] text-sm mb-1">Michael</p>
                    <p className="text-xs text-gray-500 mb-4">Ingenieur, 42</p>
                    <p className="text-gray-700 leading-snug italic text-xs">
                      &quot;Die Marktdaten-Checks geben mir die Sicherheit, die ich brauche.&quot;
                    </p>
                  </div>

                  {/* Testimonial 3 - Glassmorphism */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-4 border-2 border-gray-200/50 min-w-[160px] max-w-[160px] snap-center flex-shrink-0 shadow-lg flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff8533] flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3">
                      S
                    </div>
                    <p className="font-bold text-[#001d3d] text-sm mb-1">Sarah</p>
                    <p className="text-xs text-gray-500 mb-4">Lehrerin, 35</p>
                    <p className="text-gray-700 leading-snug italic text-xs">
                      &quot;Endlich sehe ich schwarz auf weiß, wie viel passives Einkommen wirklich bleibt.&quot;
                    </p>
                  </div>

                  {/* Testimonial 4 - Solid (Center Start) */}
                  <div className="bg-white rounded-[32px] p-4 border-2 border-gray-100 min-w-[160px] max-w-[160px] snap-center flex-shrink-0 shadow-lg flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#001d3d] to-[#003d7d] flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3">
                      T
                    </div>
                    <p className="font-bold text-[#001d3d] text-sm mb-1">Thomas</p>
                    <p className="text-xs text-gray-500 mb-4">Selbstständig, 39</p>
                    <p className="text-gray-700 leading-snug italic text-xs">
                      &quot;Die Steuer-Berechnung zeigt mir, wie viel ich wirklich spare.&quot;
                    </p>
                  </div>

                  {/* Testimonial 5 - Glassmorphism */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-4 border-2 border-gray-200/50 min-w-[160px] max-w-[160px] snap-center flex-shrink-0 shadow-lg flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff8533] flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3">
                      J
                    </div>
                    <p className="font-bold text-[#001d3d] text-sm mb-1">Julia</p>
                    <p className="text-xs text-gray-500 mb-4">Marketingmanagerin, 31</p>
                    <p className="text-gray-700 leading-snug italic text-xs">
                      &quot;Die KI-Analyse hat mir in 2 Minuten gezeigt, dass der Deal zu teuer ist.&quot;
                    </p>
                  </div>

                  {/* Testimonial 6 - Glassmorphism */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-4 border-2 border-gray-200/50 min-w-[160px] max-w-[160px] snap-center flex-shrink-0 shadow-lg flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#001d3d] to-[#003d7d] flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3">
                      D
                    </div>
                    <p className="font-bold text-[#001d3d] text-sm mb-1">Daniel</p>
                    <p className="text-xs text-gray-500 mb-4">Arzt, 45</p>
                    <p className="text-gray-700 leading-snug italic text-xs">
                      &quot;Perfekt für meine Steueroptimierung. Die AfA-Berechnung ist exakt.&quot;
                    </p>
                  </div>

                  {/* Testimonial 7 - Glassmorphism */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-4 border-2 border-gray-200/50 min-w-[160px] max-w-[160px] snap-center flex-shrink-0 shadow-lg flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff8533] flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3">
                      A
                    </div>
                    <p className="font-bold text-[#001d3d] text-sm mb-1">Anna</p>
                    <p className="text-xs text-gray-500 mb-4">IT-Beraterin, 29</p>
                    <p className="text-gray-700 leading-snug italic text-xs">
                      &quot;Der Foto-Scan ist genial! Spart so viel Zeit.&quot;
                    </p>
                  </div>

                  {/* Testimonial 8 - Glassmorphism */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-4 border-2 border-gray-200/50 min-w-[160px] max-w-[160px] snap-center flex-shrink-0 shadow-lg flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#001d3d] to-[#003d7d] flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3">
                      P
                    </div>
                    <p className="font-bold text-[#001d3d] text-sm mb-1">Peter</p>
                    <p className="text-xs text-gray-500 mb-4">Unternehmer, 38</p>
                    <p className="text-gray-700 leading-snug italic text-xs">
                      &quot;Die Szenarien-Funktion ist Gold wert.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 8. PDF Export - Bank-Ready */}
          <section className="py-32 px-6 bg-[#001d3d] text-white relative overflow-x-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b00] opacity-10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ff6b00] opacity-5 rounded-full blur-3xl" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Links: Text */}
                <div>
                  <div className="inline-block px-4 py-2 bg-orange-500/20 rounded-full text-[#ff6b00] text-xs font-semibold uppercase tracking-widest mb-6">
                    Bank-Ready PDF
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
                    <span className="text-white">Von der Analyse zum</span> <span className="text-[#ff6b00]">Bankgespräch</span> <span className="text-white">in 60 Sekunden.</span>
                  </h2>
                  <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                    Erhalte einen professionellen PDF-Report mit allen relevanten KPIs, Marktvergleichen und Szenarien – perfekt für dein Finanzierungsgespräch.
                  </p>

                  <div className="space-y-4 mb-12">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#ff6b00] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Alle KPIs auf einen Blick</h4>
                        <p className="text-slate-400 text-sm">Cashflow, Nettomietrendite, Eigenkapitalrendite, DSCR und mehr</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#ff6b00] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Marktdaten-Vergleiche</h4>
                        <p className="text-slate-400 text-sm">Kauf- und Mietpreisvergleich mit lokalen Angeboten</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#ff6b00] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Szenario-Übersicht</h4>
                        <p className="text-slate-400 text-sm">Mehrere Finanzierungsvarianten zum direkten Vergleich</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGetStarted('bank_ready')}
                    className="bg-[#ff6b00] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#ff6b00]/90 transition-all shadow-xl hover:shadow-2xl flex items-center gap-3"
                  >
                    <span>Jetzt Report erstellen</span>
                    <FileBarChart className="w-5 h-5" />
                  </button>
                </div>

                {/* Rechts: PDF Preview Mockup */}
                <div className="relative">
                  <div className="bg-white rounded-3xl shadow-2xl p-8 transform hover:rotate-0 transition-transform">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#001d3d] rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">i</span>
                          </div>
                          <span className="text-[#001d3d] font-bold">imvestr</span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">Investment-Report</span>
                      </div>

                      {/* Object Info */}
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="text-xs text-gray-500 mb-1">Objektadresse</div>
                        <div className="font-bold text-[#001d3d] text-sm">Musterstraße 123, 80331 München</div>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <div className="text-xs text-gray-400">Kaufpreis</div>
                            <div className="font-bold text-sm">450.000 €</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Wohnfläche</div>
                            <div className="font-bold text-sm">75 m²</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Baujahr</div>
                            <div className="font-bold text-sm">1995</div>
                          </div>
                        </div>
                      </div>

                      {/* KPIs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-orange-50 rounded-xl p-3">
                          <div className="text-xs text-[#ff6b00] font-semibold mb-1">Cashflow</div>
                          <div className="text-xl font-bold text-[#001d3d]">+185 €/Monat</div>
                        </div>
                        <div className="bg-[#001d3d]/5 rounded-xl p-3">
                          <div className="text-xs text-[#001d3d] font-semibold mb-1">Nettomietrendite</div>
                          <div className="text-xl font-bold text-[#001d3d]">4.2%</div>
                        </div>
                        <div className="bg-[#001d3d]/5 rounded-xl p-3">
                          <div className="text-xs text-[#001d3d] font-semibold mb-1">EK-Rendite</div>
                          <div className="text-xl font-bold text-[#001d3d]">8.5%</div>
                        </div>
                        <div className="bg-[#001d3d]/5 rounded-xl p-3">
                          <div className="text-xs text-[#001d3d] font-semibold mb-1">DSCR</div>
                          <div className="text-xl font-bold text-[#001d3d]">1.25</div>
                        </div>
                      </div>

                      {/* Chart Placeholder */}
                      <div className="bg-gradient-to-br from-[#001d3d]/10 to-[#ff6b00]/10 rounded-xl p-4 h-32 flex items-end justify-between gap-1">
                        <div className="bg-[#001d3d]/30 w-1/12 rounded" style={{ height: '40%' }} />
                        <div className="bg-[#001d3d]/40 w-1/12 rounded" style={{ height: '55%' }} />
                        <div className="bg-[#ff6b00]/50 w-1/12 rounded" style={{ height: '70%' }} />
                        <div className="bg-[#ff6b00]/60 w-1/12 rounded" style={{ height: '85%' }} />
                        <div className="bg-[#ff6b00]/70 w-1/12 rounded" style={{ height: '95%' }} />
                        <div className="bg-[#ff6b00] w-1/12 rounded" style={{ height: '100%' }} />
                        <div className="bg-[#ff6b00] w-1/12 rounded" style={{ height: '90%' }} />
                        <div className="bg-[#ff6b00]/80 w-1/12 rounded" style={{ height: '75%' }} />
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-400">Erstellt am: 15.01.2026</div>
                        <div className="text-xs text-gray-400">Seite 1 von 8</div>
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute -top-6 -right-6 bg-[#ff6b00] text-white rounded-2xl px-6 py-3 shadow-xl transform rotate-12">
                    <div className="text-xs font-bold">Bank-ready</div>
                    <div className="text-2xl font-bold">✓</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 9. FAQ */}
          <section id="faq" className="py-32 px-6 bg-white overflow-visible">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16 overflow-visible">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight px-4">
                  <span className="text-[#001d3d]">Häufig gestellte</span> <span className="text-[#ff6b00]">Fragen</span>
                </h2>
                <p className="text-gray-500 text-xl">Alles, was du über imvestr wissen musst.</p>
              </div>

              <div className="space-y-6 max-w-4xl mx-auto">
                {faqs.map((faq, idx) => {
                  const isOpen = activeFaqIndex === idx;
                  return (
                    <div
                      key={faq.question}
                      className="bg-white border-2 border-gray-100 rounded-[40px] overflow-hidden hover:border-[#ff6b00]/30 hover:shadow-lg transition-all duration-300"
                    >
                      <button
                        onClick={() => {
                          handleFaqToggle(faq.question, !isOpen);
                          setActiveFaqIndex(isOpen ? null : idx);
                        }}
                        className="w-full flex items-start justify-between p-8 text-left hover:bg-gray-50 transition-all duration-300"
                      >
                        <div className="flex gap-3 flex-1">
                          <span className="text-[#ff6b00] font-bold text-xl flex-shrink-0">Q:</span>
                          <h3 className="text-xl font-bold">{faq.question}</h3>
                        </div>
                        <div className={`flex-shrink-0 ml-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                          <svg className="w-6 h-6 text-[#001d3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-8 pb-8 pl-[4.5rem]">
                          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 10. Final CTA */}
          <section className="py-32 px-6 bg-[#001d3d] text-white">
            <div className="max-w-6xl mx-auto px-6 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight px-4">
                <span className="text-white">Bereit für deinen</span> <span className="text-[#ff6b00]">ersten Check?</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
                Starte jetzt kostenlos und erhalte in Minuten eine vollständige Analyse deines Immobilien-Deals.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={() => handleGetStarted('final_cta')}
                  className="bg-[#ff6b00] text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-[#ff6b00]/90 transition-all shadow-2xl hover:shadow-[#ff6b00]/50 hover:scale-105 flex items-center gap-3"
                >
                  <span>Jetzt kostenlos starten</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <Link
                  href="/sign-in"
                  className="border-2 border-white text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-white hover:text-[#001d3d] transition-all"
                >
                  Anmelden / Einloggen
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-[#001d3d] text-white py-24 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <Image
                  src="/logo.png"
                  alt="imvestr Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="text-2xl font-bold tracking-tighter">imvestr</span>
              </div>
              <p className="text-slate-400 max-w-sm mb-8">
                Die intelligenteste Art, Immobilien zu bewerten und Investment-Entscheidungen auf Basis von echten Daten zu treffen.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/imvestr.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#ff6b00] transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@imvestr.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#ff6b00] transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6">Produkt</h4>
              <ul className="space-y-4 text-slate-400">
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    So funktioniert&apos;s
                  </a>
                </li>
                <li>
                  <button onClick={() => handleGetStarted('footer')} className="hover:text-white transition-colors text-left">
                    Jetzt starten
                  </button>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Preise
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Rechtliches</h4>
              <ul className="space-y-4 text-slate-400">
                <li>
                  <Link href="/impressum" className="hover:text-white transition-colors">
                    Impressum
                  </Link>
                </li>
                <li>
                  <Link href="/datenschutz" className="hover:text-white transition-colors">
                    Datenschutz
                  </Link>
                </li>
                <li>
                  <Link href="/agb" className="hover:text-white transition-colors">
                    AGB
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-center text-slate-400 text-sm">
            <p>© 2026 imvestr. Alle Rechte vorbehalten. Keine Anlageberatung – alle Ergebnisse sind Modellrechnungen.</p>
          </div>
        </footer>

        {/* Sticky Bottom CTA - nur mobil */}
        <StickyBottomCTA />
      </div>
    </>
  );
}
