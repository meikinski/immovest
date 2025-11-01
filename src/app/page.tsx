'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileBarChart,
  LineChart,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth, useUser, SignInButton, UserButton } from '@clerk/nextjs';

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const handleGetStarted = () => {
    router.push('/input-method');
  };

  const featureHighlights = [
    {
      icon: <LineChart className="w-6 h-6 text-[#E6AE63]" />,
      title: 'Kennzahlen auf einen Blick',
      description: 'Cashflow, Nettomietrendite, Eigenkapitalrendite und DSCR sofort parat.',
    },
    {
      icon: <MapPin className="w-6 h-6 text-[#264171]" />,
      title: 'Lage smart vergleichen',
      description: 'Miete €/m², Mikrolage-Daten und Marktvergleich per Klick verstehen.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#6C7F99]" />,
      title: 'Szenarien in Sekunden',
      description: 'Miete, Zins oder Haltedauer verschieben und direkt neue Zahlen sehen.',
    },
    {
      icon: <FileBarChart className="w-6 h-6 text-white" />,
      title: 'Bankfähiger Report',
      description: 'PDF mit Annahmen, Cashflow-Tabelle und Szenarien zum Teilen.',
      accent: true,
    },
  ];

  const steps = [
    {
      title: '1 · Objekt kurz beschreiben',
      description: 'Adresse, Kaufpreis und Miete eintragen oder Import nutzen.',
    },
    {
      title: '2 · Zahlen prüfen',
      description: 'Kennzahlen, Marktvergleich und Cashflow live bewerten.',
    },
    {
      title: '3 · Szenario sichern',
      description: 'PDF exportieren, mit Bank teilen oder als Favorit speichern.',
    },
  ];

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
      question: 'Was kostet ImVestr?',
      answer:
        'Der Einstieg ist kostenlos. Erweiterte Datenpakete und unbegrenzte Reports kannst du flexibel dazubuchen.',
    },
    {
      question: 'Unterstützt ihr bei der Bank?',
      answer:
        'Ja. Du bekommst ein bankfähiges PDF mit DSCR, Cashflow und Szenarien – ideal fürs Gespräch mit Finanzierungspartnern.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FF] text-[#0F172A]">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-[#264171]/5 via-[#E6AE63]/5 to-transparent backdrop-blur-lg"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E6AE63]/30 to-transparent"></div>

        <div className="relative max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#264171] to-[#E6AE63] rounded-lg flex items-center justify-center shadow-lg shadow-[#264171]/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#264171] to-[#E6AE63] bg-clip-text text-transparent">
              ImVestr
            </span>
          </button>

          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                  <button className="hidden sm:block text-sm font-medium text-gray-700 hover:text-[#264171] transition">
                    Anmelden
                  </button>
                </SignInButton>
                <button
                  onClick={handleGetStarted}
                  className="rounded-full bg-gradient-to-r from-[#264171] to-[#E6AE63] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#264171]/20 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Analyse starten
                </button>
              </>
            ) : (
              <UserButton afterSignOutUrl="/" />
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pt-36 pb-24">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F7F9FF] to-[#E6AE63]/10" />
            <div className="absolute left-1/2 top-0 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#264171]/10 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-6 text-center">
            {isSignedIn && user?.firstName && (
              <p className="mb-6 text-base text-[#6C7F99] font-medium">Hey {user.firstName}, lass uns die nächste Chance prüfen.</p>
            )}

            <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              <span className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                Immobilien-Investment.<br />
                Einfach. Datenbasiert.
              </span>
            </h1>

            <p className="mt-6 text-xl text-[#6C7F99] max-w-2xl mx-auto leading-relaxed">
              In Sekunden wissen, ob sich eine Immobilie lohnt
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={handleGetStarted}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#264171] to-[#E6AE63] px-10 py-4 text-base font-semibold text-white shadow-xl shadow-[#264171]/20 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5 sm:w-auto"
              >
                Jetzt Analyse starten
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {!isSignedIn && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[#6C7F99]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                  <span>Keine Kreditkarte</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                  <span>Sofort starten</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="features" className="px-6 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                Alles, was du brauchst.
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Von Kennzahlen über Lage-Analyse bis zum bankfähigen PDF – in einer Plattform.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {featureHighlights.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`group flex flex-col gap-4 rounded-3xl border p-10 transition-all duration-200 ${
                    feature.accent
                      ? 'bg-gradient-to-br from-[#264171] via-[#6C7F99] to-[#E6AE63] text-white border-transparent shadow-xl hover:shadow-2xl hover:-translate-y-1'
                      : 'bg-gradient-to-br from-white to-[#F7F9FF] border-[#264171]/8 hover:border-[#E6AE63]/30 hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
                      feature.accent ? 'bg-white/15 backdrop-blur-sm' : 'bg-gradient-to-br from-[#264171]/5 to-[#E6AE63]/5'
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className={`text-xl font-semibold ${feature.accent ? 'text-white' : 'text-[#0F172A]'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-base leading-relaxed ${feature.accent ? 'text-white/90' : 'text-[#6C7F99]'}`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F7F9FF] px-6 py-24" id="steps">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                So läuft deine Analyse
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Drei Schritte vom Objekt zum bankfähigen Report. Transparent und nachvollziehbar.
              </p>
            </div>

            <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
              <div className="flex-1 space-y-6">
                {steps.map((step, idx) => (
                  <div key={step.title} className="group rounded-3xl border border-[#264171]/8 bg-gradient-to-br from-white to-[#F7F9FF] p-8 transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#264171] via-[#6C7F99] to-[#E6AE63] text-xl font-semibold text-white shadow-md transition-transform group-hover:scale-110">
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

              <div className="flex-1 rounded-3xl border border-[#E6AE63]/20 bg-gradient-to-br from-white via-[#F7F9FF] to-[#E6AE63]/10 p-8 shadow-xl">
                <div className="mb-6">
                  <p className="text-sm font-medium text-[#6C7F99] uppercase tracking-wide">Beispiel-Output</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-md border border-[#264171]/5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#264171]/5">
                      <LineChart className="h-6 w-6 text-[#264171]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-[#0F172A]">Cashflow +327 €</p>
                      <p className="text-sm text-[#6C7F99]">nach Kaufnebenkosten</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-md border border-[#264171]/5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E6AE63]/10">
                      <Building2 className="h-6 w-6 text-[#E6AE63]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-[#0F172A]">Mikrolage · Top 15 %</p>
                      <p className="text-sm text-[#6C7F99]">im Stadtteil-Vergleich</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-md border border-[#264171]/5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6C7F99]/10">
                      <FileBarChart className="h-6 w-6 text-[#6C7F99]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-[#0F172A]">PDF in 12 Sekunden</p>
                      <p className="text-sm text-[#6C7F99]">Alle Szenarien & Annahmen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
                Für Einsteiger & Profis
              </h2>
              <p className="text-lg text-[#6C7F99] max-w-2xl mx-auto">
                Egal ob erste Immobilie oder zehntes Objekt – ImVestr liefert, was du brauchst.
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
              ].map((persona, idx) => (
                <div key={persona.name} className="group flex flex-col gap-4 rounded-3xl border border-[#264171]/8 bg-gradient-to-br from-white to-[#F7F9FF] p-6 transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-md ${
                        idx === 1 ? 'bg-gradient-to-br from-[#264171] to-[#E6AE63]' :
                        idx === 2 ? 'bg-[#6C7F99]' :
                        'bg-[#264171]'
                      }`}
                    >
                      {persona.name[0]}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#0F172A]">{persona.name}</p>
                      <p className="text-sm text-[#6C7F99]">{persona.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#4b5563] leading-relaxed italic">"{persona.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-6 py-24 bg-gradient-to-br from-[#F7F9FF] to-white">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
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

        <section className="px-6 py-24 bg-white">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#264171] via-[#6C7F99] to-[#E6AE63] p-12 md:p-16 text-center text-white shadow-2xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  In Sekunden zur Entscheidung
                </div>

                <h2 className="text-3xl md:text-5xl font-semibold mb-6">
                  Bereit für deine nächste<br className="hidden md:block" /> Immobilie?
                </h2>

                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Entscheide datenbasiert statt aus dem Bauch heraus. Starte jetzt deine erste Analyse.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleGetStarted}
                    className="group inline-flex items-center gap-2 rounded-full bg-white px-10 py-5 text-base font-semibold text-[#264171] shadow-xl transition-all duration-200 hover:bg-[#F7F9FF] hover:shadow-2xl hover:-translate-y-0.5"
                  >
                    Jetzt Analyse starten
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>

                  {!isSignedIn && (
                    <SignInButton mode="modal">
                      <button className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-transparent px-10 py-5 text-base font-semibold text-white transition-all duration-200 hover:bg-white/10">
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
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#264171] to-[#6C7F99] flex items-center justify-center shadow-lg shadow-[#264171]/20">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-[#264171]">ImVestr</span>
              </div>
              <p className="text-center md:text-left text-[#6C7F99] max-w-sm">
                Deine KI für Rendite, Cashflow und bankfähige Reports.<br />
                <span className="font-medium text-[#264171]">Transparent. Vertrauenswürdig. Schnell.</span>
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4 text-center md:text-right">
              <div className="rounded-xl border border-[#E6AE63]/20 bg-[#E6AE63]/5 px-4 py-3 max-w-md">
                <p className="text-xs font-medium text-[#264171] leading-relaxed">
                  <ShieldCheck className="inline h-4 w-4 mr-1 text-[#E6AE63]" />
                  Keine Anlageberatung. Ergebnisse sind Modell-Schätzungen und hängen von deinen Eingaben ab.
                </p>
              </div>
              <p className="text-xs">© {new Date().getFullYear()} ImVestr. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
