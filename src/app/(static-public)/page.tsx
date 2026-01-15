'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileBarChart,
  MapPin,
  Zap,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { StickyBottomCTA } from '@/components/StickyBottomCTA';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function LandingPage() {
  const router = useRouter();
  const { trackCTA } = useAnalytics();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
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
        'Der erste Check ist komplett kostenlos. Premium-Features wie Deep Market Analysis und PDF-Export sind ab 9,90€ pro Analyse verfügbar.',
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
              <div className="w-10 h-10 bg-[#001d3d] rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold italic text-lg">i</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tighter">imvestr</span>
            </button>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
              <a href="#features" className="hover:text-black transition-colors">Features</a>
              <a href="#workflow" className="hover:text-black transition-colors">Ablauf</a>
              <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-sm font-bold text-gray-600 hidden sm:block hover:text-black transition-colors">
                Login
              </Link>
              <button
                onClick={() => handleGetStarted('header')}
                className="bg-[#001d3d] text-white px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg"
              >
                Jetzt kostenlos prüfen
              </button>
            </div>
          </div>
        </header>

        <main>
          {/* 1. Hero Sektion */}
          <section className="pt-40 pb-20 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-2 bg-orange-50 text-[#ff6b00] font-bold text-xs uppercase tracking-widest rounded-full mb-6 shadow-sm">
                  Dein persönlicher Investment-Copilot
                </span>
                <h1 className="text-5xl md:text-8xl font-extrabold mb-8 text-[#1d1d1f] leading-none tracking-tight">
                  Prüf den Deal, <br /><span className="text-[#ff6b00]">bevor du kaufst.</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed mb-12">
                  Immobilien-Analyse für Einsteiger. Link kopieren, Foto machen oder manuell eingeben – wir prüfen deinen Deal gegen echte Marktdaten.
                </p>

                {/* Haupt-Interaktion: 3 Wege */}
                <div className="max-w-4xl mx-auto bg-white p-3 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col md:flex-row gap-3">
                  <div className="flex-1 flex items-center px-6 py-4 bg-gray-50 rounded-full border border-gray-200 focus-within:border-[#ff6b00] transition-colors">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Link von ImmoScout24 einfügen..."
                      className="bg-transparent w-full outline-none text-lg"
                    />
                  </div>
                  <button
                    onClick={() => handleGetStarted('hero_input')}
                    className="bg-[#ff6b00] text-white px-10 py-5 rounded-full font-bold text-lg hover:shadow-xl hover:bg-[#ff6b00]/90 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Check starten</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-6 mt-8">
                  <button
                    onClick={() => handleGetStarted('hero_photo')}
                    className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#001d3d] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Exposé fotografieren
                  </button>
                  <button
                    onClick={() => handleGetStarted('hero_manual')}
                    className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#001d3d] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Manuell eingeben
                  </button>
                </div>
              </div>

              {/* 2. Trust Bar / Social Proof */}
              <div className="pt-10 border-t border-gray-100">
                <p className="text-center text-sm font-medium text-gray-400 mb-6">
                  Bereits über 1.200+ Immobilien-Checks durchgeführt
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale">
                  <span className="font-bold text-xl tracking-tighter italic">ImmoScout24</span>
                  <span className="font-bold text-xl tracking-tighter italic">Immowelt</span>
                  <span className="font-bold text-xl tracking-tighter italic">Ebay Kleinanzeigen</span>
                  <span className="font-bold text-xl tracking-tighter italic">Immonet</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Das Problem (The Gap) */}
          <section className="py-32 px-6 bg-[#f5f5f7]">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Warum die meisten beim ersten Kauf draufzahlen.
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                  Die häufigsten Fehler, die dich tausende Euro kosten können – und wie imvestr dich davor schützt.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Problem 1 */}
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-[32px] p-8 border-l-4 border-[#ff6b00] shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-[#ff6b00]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Versteckte Kosten übersehen</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Makler rechnen oft ohne Instandhaltungsrücklage, Nebenkosten oder realistische Mietausfälle. Das Ergebnis: Negativer Cashflow.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-orange-200">
                    <p className="text-sm font-semibold text-[#001d3d] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                      imvestr berechnet alle versteckten Kosten automatisch
                    </p>
                  </div>
                </div>

                {/* Problem 2 */}
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-[32px] p-8 border-l-4 border-[#ff6b00] shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-[#ff6b00]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Zu teuer gekauft</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Ohne Marktvergleich zahlst du schnell 10-20% über Wert. Das schmälert deine Rendite für Jahre.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-orange-200">
                    <p className="text-sm font-semibold text-[#001d3d] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                      Live-Marktdaten zeigen dir den echten Wert
                    </p>
                  </div>
                </div>

                {/* Problem 3 */}
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-[32px] p-8 border-l-4 border-[#ff6b00] shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-[#ff6b00]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Schlechte Lage</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Die Wohnung sieht toll aus, aber die Lage? Ohne lokale Nachfrage-Analyse riskierst du Leerstand.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-orange-200">
                    <p className="text-sm font-semibold text-[#001d3d] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                      KI-Lagebewertung mit Nachfrage-Screening
                    </p>
                  </div>
                </div>

                {/* Problem 4 */}
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-[32px] p-8 border-l-4 border-[#ff6b00] shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-6 h-6 text-[#ff6b00]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Miete überschätzt</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Makler zeigen optimistische Mietpreise. In Realität liegen sie oft 10-15% darunter. Das killt deine Rendite.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-orange-200">
                    <p className="text-sm font-semibold text-[#001d3d] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                      Mietpreis-Vergleich mit echten Portal-Daten
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Die Lösung (imvestr Workflow) */}
          <section id="workflow" className="py-32 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">So funktioniert imvestr.</h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                  In 3 einfachen Schritten von der Exposé-URL zum vollständigen Investment-Report.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Schritt 1: Import */}
                <div className="bg-[#f5f5f7] rounded-[40px] p-10 hover:bg-[#ededf0] transition-all hover:shadow-2xl group">
                  <div className="w-16 h-16 rounded-2xl bg-[#001d3d] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-[#ff6b00] text-sm font-bold mb-3">SCHRITT 1</div>
                  <h3 className="text-2xl font-bold mb-4">Import</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Kopiere den Link von ImmoScout24, fotografiere das Exposé oder gib die Daten manuell ein. Unsere KI extrahiert alle Informationen.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">URL-Import</span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">Foto-Scan</span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">Manuelle Eingabe</span>
                  </div>
                  <div className="absolute bottom-0 right-4 text-[120px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">01</div>
                </div>

                {/* Schritt 2: Deep Market Analysis */}
                <div className="bg-[#f5f5f7] rounded-[40px] p-10 hover:bg-[#ededf0] transition-all hover:shadow-2xl group relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-[#001d3d] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-8 h-8 text-[#ff6b00]" />
                  </div>
                  <div className="text-[#ff6b00] text-sm font-bold mb-3">SCHRITT 2</div>
                  <h3 className="text-2xl font-bold mb-4">Deep Market Analysis</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Wir screenen echte Angebots- und Nachfragedaten vor Ort. Keine Schätzwerte, sondern Live-Vergleiche mit dem lokalen Markt.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">Kauf-Vergleich</span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">Miet-Vergleich</span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">Lage-Rating</span>
                  </div>
                  <div className="absolute bottom-0 right-4 text-[120px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">02</div>
                </div>

                {/* Schritt 3: Simulation & Report */}
                <div className="bg-[#f5f5f7] rounded-[40px] p-10 hover:bg-[#ededf0] transition-all hover:shadow-2xl group relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-[#001d3d] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <FileBarChart className="w-8 h-8 text-[#ff6b00]" />
                  </div>
                  <div className="text-[#ff6b00] text-sm font-bold mb-3">SCHRITT 3</div>
                  <h3 className="text-2xl font-bold mb-4">Simulation & Report</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Teste verschiedene Szenarien (Eigenkapital, Zins, Miete) und erhalte einen bankfähigen PDF-Report mit allen KPIs.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">Szenarien</span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">Steuer-Effekt</span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">PDF-Export</span>
                  </div>
                  <div className="absolute bottom-0 right-4 text-[120px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">03</div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Key Features (Detail-Karten) */}
          <section id="features" className="py-32 px-6 bg-[#f5f5f7]">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Wie wir dich schützen.</h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                  imvestr ist mehr als ein Rechner. Wir nutzen Live-Marktdaten, um dir die Wahrheit über dein Investment zu sagen.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#f5f5f7] rounded-[32px] p-10 relative overflow-hidden group hover:-translate-y-2 transition-all hover:bg-[#ededf0]">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#001d3d] transition-colors">
                    <BarChart3 className="w-7 h-7 text-[#ff6b00] group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Deep Market Analysis</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Wir screenen das echte Angebot und die Nachfrage vor Ort. Keine Schätzwerte, sondern reale Portaldaten-Vergleiche.
                  </p>
                  <div className="absolute bottom-[-20px] right-[20px] text-[120px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">01</div>
                </div>

                <div className="bg-[#f5f5f7] rounded-[32px] p-10 relative overflow-hidden group hover:-translate-y-2 transition-all hover:bg-[#ededf0]">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#001d3d] transition-colors">
                    <Zap className="w-7 h-7 text-[#ff6b00] group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Szenario-Planung</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Was passiert bei 20% mehr Eigenkapital? Was bei einer Zinsänderung? Simuliere deine Zukunft mit einem Klick.
                  </p>
                  <div className="absolute bottom-[-20px] right-[20px] text-[120px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">02</div>
                </div>

                <div className="bg-[#f5f5f7] rounded-[32px] p-10 relative overflow-hidden group hover:-translate-y-2 transition-all hover:bg-[#ededf0]">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#001d3d] transition-colors">
                    <FileBarChart className="w-7 h-7 text-[#ff6b00] group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Bank-Ready Export</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Erhalte ein professionelles PDF-Exposé mit allen KPIs und Marktdaten für dein Finanzierungsgespräch.
                  </p>
                  <div className="absolute bottom-[-20px] right-[20px] text-[120px] font-extrabold text-[#001d3d] opacity-[0.03] leading-none">03</div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Zielgruppen Sektion (The Trio) */}
          <section className="py-32 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                  Was ist dein <br />
                  <span className="text-[#ff6b00]">Investment-Ziel?</span>
                </h2>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                  Wir passen unsere Analyse-Tiefe an deine Lebenssituation an.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Karte 1: Steuern */}
                <div className="bg-[#001d3d] rounded-[40px] p-10 text-white group cursor-pointer hover:bg-[#002d5d] transition-all shadow-xl">
                  <div className="text-[#ff6b00] font-bold mb-10 text-4xl">01</div>
                  <h3 className="text-3xl font-bold mb-4">Steuern sparen</h3>
                  <p className="text-slate-300 mb-12">
                    Wandle deine Steuerlast in privates Vermögen um. Wir berechnen den Netto-Effekt nach AfA und Zinsen.
                  </p>
                  <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all">
                    <span>Details ansehen</span>
                    <span>→</span>
                  </div>
                </div>

                {/* Karte 2: Vorsorge */}
                <div className="bg-[#f5f5f7] rounded-[40px] p-10 group cursor-pointer hover:bg-[#ededf0] transition-all shadow-xl">
                  <div className="text-[#001d3d] font-bold mb-10 text-4xl opacity-20">02</div>
                  <h3 className="text-3xl font-bold mb-4">Altersvorsorge</h3>
                  <p className="text-gray-500 mb-12">
                    Baue dir ein Portfolio auf, das im Alter für dich sorgt. Wir prüfen die Langzeit-Rendite und Sicherheit.
                  </p>
                  <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all">
                    <span>Details ansehen</span>
                    <span>→</span>
                  </div>
                </div>

                {/* Karte 3: Cashflow */}
                <div className="bg-[#f5f5f7] rounded-[40px] p-10 group cursor-pointer hover:bg-[#ededf0] transition-all shadow-xl">
                  <div className="text-[#001d3d] font-bold mb-10 text-4xl opacity-20">03</div>
                  <h3 className="text-3xl font-bold mb-4">Passives Einkommen</h3>
                  <p className="text-gray-500 mb-12">
                    Maximiere deinen monatlichen Cashflow. Wir finden die &quot;Haken&quot; in den Mietkalkulationen der Makler.
                  </p>
                  <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all">
                    <span>Details ansehen</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Output-Highlight: "Bank-Ready in 60 Sekunden" */}
          <section className="py-32 px-6 bg-[#001d3d] text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b00] opacity-10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ff6b00] opacity-5 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Links: Text */}
                <div>
                  <div className="inline-block px-4 py-2 bg-orange-500/20 rounded-full text-[#ff6b00] text-sm font-bold mb-6">
                    BANK-READY PDF
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Von der Analyse zum <span className="text-[#ff6b00]">Bankgespräch</span> in 60 Sekunden.
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

          {/* 8. FAQ */}
          <section id="faq" className="py-32 px-6 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Häufig gestellte Fragen</h2>
                <p className="text-gray-500 text-lg">Alles, was du über imvestr wissen musst.</p>
              </div>

              <div className="space-y-6">
                {faqs.map((faq, idx) => {
                  const isOpen = activeFaqIndex === idx;
                  return (
                    <div
                      key={faq.question}
                      className="bg-[#f5f5f7] rounded-3xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => {
                          handleFaqToggle(faq.question, !isOpen);
                          setActiveFaqIndex(isOpen ? null : idx);
                        }}
                        className="w-full flex items-start justify-between p-8 text-left hover:bg-[#ededf0] transition-colors"
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

          {/* 9. Final CTA */}
          <section className="py-32 px-6 bg-gradient-to-br from-[#001d3d] via-[#002d5d] to-[#001d3d] text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff6b00] opacity-20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff6b00] opacity-10 rounded-full blur-3xl" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                Bereit für deinen <span className="text-[#ff6b00]">ersten Check?</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto">
                Starte jetzt kostenlos und erhalte in Minuten eine vollständige Analyse deines Immobilien-Deals.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
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
                  Live-Demo ansehen
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/20">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#ff6b00] mb-2">1.200+</div>
                  <div className="text-sm text-slate-400">Analysierte Immobilien</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#ff6b00] mb-2">4.9/5</div>
                  <div className="text-sm text-slate-400">Durchschnittliche Bewertung</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#ff6b00] mb-2">60 Sek.</div>
                  <div className="text-sm text-slate-400">Bis zum ersten Ergebnis</div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-[#001d3d] text-white py-24 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 bg-[#ff6b00] rounded flex items-center justify-center">
                  <span className="text-white font-bold italic text-sm">i</span>
                </div>
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
                  <a href="#features" className="hover:text-white transition-colors">
                    Marktanalyse
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    Szenario-Planer
                  </a>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Preise
                  </Link>
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
