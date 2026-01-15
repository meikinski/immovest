'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  FileBarChart,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StickyBottomCTA } from '@/components/StickyBottomCTA';
import { TrustBadges } from '@/components/TrustBadges';
import { InputMethodShowcase } from '@/components/InputMethodShowcase';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function LandingPage() {
  const router = useRouter();
  const { trackCTA } = useAnalytics();
  const [activeFaqIndex, setActiveFaqIndex] = React.useState<number | null>(null);

  const handleGetStarted = (location: string = 'hero') => {
    trackCTA('start_analysis', location);
    router.push('/input-method');
  };

  const handleMethodSelect = (methodId: string) => {
    trackCTA('select_input_method', methodId);
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
    "url": "https://imvestr.de",
    "screenshot": "https://imvestr.de/og-image.png",
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "imvestr",
    "url": "https://imvestr.de",
    "logo": "https://imvestr.de/logo.png",
    "description": "Führende deutschsprachige KI-Plattform für Immobilien-Rentabilitätsentscheidungen und Renditeberechnung",
    "sameAs": [
      "https://www.instagram.com/imvestr.de",
      "https://www.tiktok.com/@imvestr.de",
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

    <div className="min-h-screen bg-white text-[#1d1d1f]">
        <header className="glass-header fixed top-0 w-full border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold italic">i</span>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tighter bg-navy text-white px-2 rounded">imvestr</span>
                </div>
                <nav className="hidden lg:flex gap-10 text-sm font-semibold text-gray-500">
                    <a href="#features" className="hover:text-black transition-colors">Features</a>
                    <a href="#workflow" className="hover:text-black transition-colors">Ablauf</a>
                    <a href="#pricing" className="hover:text-black transition-colors">Preise</a>
                </nav>
                <div className="flex items-center gap-4">
                    <button className="text-sm font-bold text-gray-600 hidden sm:block">Login</button>
                    <button
                        onClick={() => handleGetStarted('header')}
                        className="bg-navy text-white px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform"
                    >
                        Jetzt kostenlos prüfen
                    </button>
                </div>
            </div>
        </header>

    <main role="main">
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-8xl font-extrabold mb-8 text-slate-900 tracking-tighter leading-tight">
                        Prüf den Deal, <br /><span className="text-orange-500">bevor du kaufst.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed mb-12">
                        Immobilien-Analyse für Einsteiger. Link kopieren, Foto machen oder manuell eingeben.
                    </p>

                    {/* Interactive Input Method Showcase */}
                    <div className="max-w-4xl mx-auto">
                      <InputMethodShowcase onMethodSelect={handleMethodSelect} />
                    </div>
                     <p className="text-sm text-gray-400 mt-4">Bereits über 10.000 Immobilien-Checks durchgeführt</p>
                </div>

                {/* Trust Bar */}
                <TrustBadges />
            </div>
        </section>

        {/* The Problem (The Gap) */}
        <section className="py-32 px-6">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Warum die meisten beim ersten Kauf draufzahlen.</h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-12">
                    Makler-Exposés zeigen nur die halbe Wahrheit. Versteckte Kosten, unrealistische Mietprognosen und Sanierungsstau führen schnell zu teuren Fehlern. imvestr deckt die Risiken auf, bevor sie dein Geld verbrennen.
                </p>
                {/* Visualisierung: Simple Grafik oder Gegenüberstellung */}
                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                     <Image
                        src="/placeholder-gap.svg" // Platzhalter-Bild
                        alt="Vergleich von Makler-Exposé und imvestr-Analyse"
                        width={800}
                        height={400}
                        className="rounded-2xl"
                    />
                </div>
            </div>
        </section>

        {/* Die Lösung (imvestr Workflow) */}
        <section id="workflow" className="py-32 px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">So einfach geht’s zur sicheren Entscheidung.</h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">In drei Schritten zu einer fundierten Analyse, die dir Klarheit verschafft.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Step 1: Import */}
                    <div className="feature-card group">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-orange-500 mb-2">Schritt 1</h3>
                            <p className="text-2xl font-bold mb-4">Import</p>
                            <p className="text-gray-500 leading-relaxed">Füge einen Link ein, lade ein Foto hoch oder gib die Eckdaten manuell ein. Den Rest erledigt unsere KI.</p>
                        </div>
                        <div className="step-number">01</div>
                    </div>

                    {/* Step 2: Deep Market Analysis */}
                    <div className="feature-card group">
                         <div className="relative z-10">
                            <h3 className="text-lg font-bold text-orange-500 mb-2">Schritt 2</h3>
                            <p className="text-2xl font-bold mb-4">Deep Market Analysis</p>
                            <p className="text-gray-500 leading-relaxed">Wir gleichen deine Immobilie mit echten Angebots- und Nachfragedaten aus deiner Region ab.</p>
                        </div>
                        <div className="step-number">02</div>
                    </div>

                    {/* Step 3: Simulation */}
                    <div className="feature-card group">
                         <div className="relative z-10">
                             <h3 className="text-lg font-bold text-orange-500 mb-2">Schritt 3</h3>
                            <p className="text-2xl font-bold mb-4">Simulation</p>
                            <p className="text-gray-500 leading-relaxed">Spiele verschiedene Szenarien durch. Was passiert bei Zinsänderung oder mehr Eigenkapital?</p>
                        </div>
                        <div className="step-number">03</div>
                    </div>
                </div>
            </div>
        </section>

        {/* Key Features (Detail-Karten) */}
        <section id="features" className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                 <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Alles, was du für deine Entscheidung brauchst.</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Market Analysis */}
                    <div className="feature-card group p-8">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-navy transition-colors">
                            <BarChart3 className="w-7 h-7 text-orange-500 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Marktanalyse</h3>
                        <p className="text-gray-500 leading-relaxed">Wir screenen das echte Angebot und die Nachfrage vor Ort. Keine Schätzwerte, sondern reale Portaldaten-Vergleiche.</p>
                    </div>
                     {/* Cashflow-Rechner */}
                    <div className="feature-card group p-8">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-navy transition-colors">
                            <Zap className="w-7 h-7 text-orange-500 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Cashflow-Rechner</h3>
                        <p className="text-gray-500 leading-relaxed">Wir berechnen deinen Netto-Cashflow nach Steuern, Zinsen und allen Nebenkosten – ehrlich und transparent.</p>
                    </div>
                    {/* Risiko-Check */}
                    <div className="feature-card group p-8">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-navy transition-colors">
                            <ShieldCheck className="w-7 h-7 text-orange-500 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Risiko-Check</h3>
                        <p className="text-gray-500 leading-relaxed">Unsere KI bewertet Sanierungsstau, Lage-Entwicklung und Vermietbarkeit für eine 360°-Sicht.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Zielgruppen-Umschalter (The Trio) */}
        <section className="py-32 px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl text-left">
                        <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">Was ist dein <br/><span className="text-orange-500">Investment-Ziel?</span></h2>
                        <p className="text-xl text-gray-500">Wir passen unsere Analyse-Tiefe an deine Lebenssituation an.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1: Altersvorsorge */}
                    <div className="bg-gray-100 rounded-[40px] p-10 group cursor-pointer hover:bg-gray-200 transition-all">
                        <h3 className="text-3xl font-bold mb-4">Altersvorsorge</h3>
                        <p className="text-gray-500 mb-12">Baue dir ein Portfolio auf, das im Alter für dich sorgt. Wir prüfen die Langzeit-Rendite und Sicherheit.</p>
                        <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all">
                            <span>Details ansehen</span>
                            <span>→</span>
                        </div>
                    </div>
                    {/* Card 2: Steuern sparen */}
                    <div className="bg-navy rounded-[40px] p-10 text-white group cursor-pointer hover:bg-slate-900 transition-all">
                        <h3 className="text-3xl font-bold mb-4">Steuern sparen</h3>
                        <p className="text-slate-400 mb-12">Wandle deine Steuerlast in privates Vermögen um. Wir berechnen den Netto-Effekt nach AfA und Zinsen.</p>
                        <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all">
                            <span>Details ansehen</span>
                            <span>→</span>
                        </div>
                    </div>
                    {/* Card 3: Passives Einkommen */}
                    <div className="bg-gray-100 rounded-[40px] p-10 group cursor-pointer hover:bg-gray-200 transition-all">
                        <h3 className="text-3xl font-bold mb-4">Passives Einkommen</h3>
                        <p className="text-gray-500 mb-12">Maximiere deinen monatlichen Cashflow. Wir finden die &quot;Haken&quot; in den Mietkalkulationen der Makler.</p>
                        <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all">
                            <span>Details ansehen</span>
                            <span>→</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Output-Highlight */}
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto text-center">
                 <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/5 px-4 py-2 text-sm font-medium text-orange-500 mb-4">
                    <FileBarChart className="h-4 w-4" />
                    Dein Ergebnis
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">Bank-Ready in 60 Sekunden.</h2>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12">
                    Erhalte ein professionelles PDF-Exposé mit allen KPIs und Marktdaten, das deine Bank überzeugen wird.
                </p>
                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-2xl">
                     <Image
                        src="/placeholder-pdf.svg" // Platzhalter-Bild
                        alt="Vorschau des PDF-Exports für die Bank"
                        width={800}
                        height={500}
                        className="rounded-2xl"
                    />
                </div>
            </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-label="Häufig gestellte Fragen" className="px-6 py-24 bg-gray-50">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Häufige Fragen</h2>
            </div>
            <div className="space-y-4">
              {[
                  {
                      question: 'Woher kommen die Daten?',
                      answer: 'Wir nutzen eine Kombination aus Live-Daten von Immobilienportalen, amtlichen Kaufpreissammlungen und eigenen Algorithmen zur Bewertung von Angebot und Nachfrage.'
                  },
                  {
                      question: 'Ist das für Anfänger geeignet?',
                      answer: 'Absolut. imvestr wurde entwickelt, um komplexen Analysen die Komplexität zu nehmen. Wir führen dich durch den Prozess und erklären jede Kennzahl.'
                  },
                  {
                      question: 'Was kostet es?',
                      answer: 'Dein erster Immobilien-Check ist komplett kostenlos, ohne Einschränkungen. Danach bieten wir flexible Pakete für weitere Analysen an.'
                  }
              ].map((faq, idx) => {
                const isOpen = activeFaqIndex === idx;
                return (
                  <div
                    key={faq.question}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => {
                        handleFaqToggle(faq.question, !isOpen);
                        setActiveFaqIndex(isOpen ? null : idx);
                      }}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <h3 className="text-base font-semibold text-slate-800 pr-4">
                        {faq.question}
                      </h3>
                      <div className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-label="Call-to-Action" className="px-6 py-24 bg-white">
          <div className="mx-auto max-w-5xl">
            <div
              className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl bg-navy"
            >
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-semibold mb-6">
                  Prüfe jetzt deine erste Immobilie.
                </h2>
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Triff datenbasierte Entscheidungen und investiere mit Selbstvertrauen.
                </p>
                 <button
                    type="button"
                    onClick={() => handleGetStarted('footer_cta')}
                    data-cta="main"
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-10 py-5 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-orange-600 hover:shadow-xl sm:w-auto"
                >
                    Jetzt ersten Check kostenlos starten
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

    <footer className="bg-navy text-white py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                        <span className="text-white font-bold italic text-sm">i</span>
                    </div>
                    <span className="text-2xl font-bold tracking-tighter">imvestr</span>
                </div>
                <p className="text-slate-400 max-w-sm">Die intelligenteste Art, Immobilien zu bewerten und Investment-Entscheidungen auf Basis von echten Daten zu treffen.</p>
            </div>
            <div>
                <h4 className="font-bold mb-6">Produkt</h4>
                <ul className="space-y-4 text-slate-400">
                    <li><a href="#" className="hover:text-white transition-colors">Marktanalyse</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Szenario-Planer</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Bank-Export</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6">Rechtliches</h4>
                <ul className="space-y-4 text-slate-400">
                    <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
                    <li><a href="#" className_hover="text-white transition-colors">Datenschutz</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">AGB</a></li>
                </ul>
            </div>
        </div>
    </footer>

      {/* Sticky Bottom CTA - nur mobil */}
      <StickyBottomCTA />
      </div>
    </>
  );
}
