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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#264171]/5 bg-white/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#264171] to-[#6C7F99] flex items-center justify-center shadow-md shadow-[#264171]/15 transition-transform hover:scale-105">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#264171]">ImVestr</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[#6C7F99] hover:text-[#264171] transition-colors duration-200"
            >
              Vorteile
            </button>
            <button
              onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[#6C7F99] hover:text-[#264171] transition-colors duration-200"
            >
              So funktioniert's
            </button>
            <button
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[#6C7F99] hover:text-[#264171] transition-colors duration-200"
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                  <button className="hidden sm:block text-sm font-semibold text-[#6C7F99] hover:text-[#264171] transition-colors duration-200">
                    Anmelden
                  </button>
                </SignInButton>
                <button
                  onClick={handleGetStarted}
                  className="rounded-full bg-[#264171] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#264171]/20 transition-all duration-200 hover:bg-[#1f3460] hover:shadow-lg hover:-translate-y-0.5"
                >
                  Jetzt testen
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
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[#E6AE63]/30 bg-gradient-to-r from-white to-[#E6AE63]/5 px-5 py-2.5 text-sm font-medium text-[#264171] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#E6AE63]" />
              In Sekunden wissen, ob sich eine Immobilie lohnt
            </div>

            {isSignedIn && user?.firstName && (
              <p className="mb-6 text-base text-[#6C7F99] font-medium">Hey {user.firstName}, lass uns die nächste Chance prüfen.</p>
            )}

            <h1 className="text-5xl md:text-6xl font-semibold leading-[1.1] tracking-tight text-[#0F172A] mb-6">
              Immobilien-Investment.<br />Einfach. Datenbasiert.
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-[#6C7F99] font-normal max-w-3xl mx-auto leading-relaxed">
              Cashflow, Rendite und DSCR in unter 60 Sekunden.<br className="hidden md:block" />
              <span className="text-[#4b5563]">Bankfähiges PDF inklusive.</span>
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={handleGetStarted}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#264171] px-10 py-5 text-base font-semibold text-white shadow-xl shadow-[#264171]/20 transition-all duration-200 hover:bg-[#1f3460] hover:shadow-2xl hover:shadow-[#264171]/30 hover:-translate-y-0.5 sm:w-auto"
              >
                Jetzt Analyse starten
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#E6AE63] bg-white px-10 py-5 text-base font-semibold text-[#264171] transition-all duration-200 hover:bg-[#E6AE63]/5 hover:border-[#264171] sm:w-auto">
                    Kostenlos testen
                  </button>
                </SignInButton>
              ) : (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#6C7F99]/30 bg-white px-10 py-5 text-base font-semibold text-[#264171] transition-all duration-200 hover:border-[#264171] hover:bg-[#F7F9FF] sm:w-auto"
                >
                  Zum Dashboard
                </button>
              )}
            </div>

            {!isSignedIn && (
              <div className="mt-8 flex flex-col items-center gap-3 text-sm text-[#6C7F99]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                  <span className="font-medium">Keine Kreditkarte • Zwei Premium-Analysen gratis</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                  <span className="font-medium">Volle Transparenz • Alle Annahmen editierbar</span>
                </div>
              </div>
            )}
          </div>

          {/* Trust Indicators - Early Social Proof */}
          <div className="max-w-5xl mx-auto px-6 mt-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Analysen erstellt', value: '42.000+', icon: <BarChart3 className="h-5 w-5" /> },
                { label: 'Ø Dauer', value: '< 60s', icon: <Sparkles className="h-5 w-5" /> },
                { label: 'Nutzerbewertung', value: '4,9/5', icon: <CheckCircle2 className="h-5 w-5" /> },
                { label: 'Datenpartner', value: '15+', icon: <ShieldCheck className="h-5 w-5" /> },
              ].map((stat) => (
                <div key={stat.label} className="group rounded-2xl bg-white border border-[#264171]/8 p-6 text-center transition-all duration-200 hover:border-[#E6AE63]/40 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex justify-center mb-3 text-[#264171] group-hover:text-[#E6AE63] transition-colors">
                    {stat.icon}
                  </div>
                  <p className="text-2xl md:text-3xl font-semibold text-[#0F172A] mb-1">{stat.value}</p>
                  <p className="text-xs md:text-sm text-[#6C7F99] font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
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
                      ? 'bg-gradient-to-br from-[#264171] to-[#6C7F99] text-white border-transparent shadow-xl hover:shadow-2xl hover:-translate-y-1'
                      : 'bg-white border-[#264171]/8 hover:border-[#E6AE63]/30 hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
                      feature.accent ? 'bg-white/15 backdrop-blur-sm' : 'bg-[#F7F9FF]'
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
                  <div key={step.title} className="group rounded-3xl border border-[#264171]/8 bg-white p-8 transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#264171] to-[#6C7F99] text-xl font-semibold text-white shadow-md transition-transform group-hover:scale-110">
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
              ].map((persona) => (
                <div key={persona.name} className="group flex flex-col gap-4 rounded-3xl border border-[#264171]/8 bg-white p-6 transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-md"
                      style={{ backgroundColor: persona.color }}
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

        <section className="bg-gradient-to-br from-[#264171] via-[#264171] to-[#6C7F99] px-6 py-24 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:items-center">
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                  <ShieldCheck className="h-4 w-4" />
                  Vertrauenswürdig & Transparent
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4">
                  Geprüfte Daten.<br />Transparente Quellen.
                </h2>
                <p className="text-lg text-white/80 max-w-xl">
                  ImVestr kombiniert Marktpreise, Mietspiegel und Finanzierungskonditionen. Alle Annahmen sind transparent und editierbar – für Vertrauen bei dir und deiner Bank.
                </p>
                <button
                  onClick={handleGetStarted}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#264171] shadow-xl transition-all duration-200 hover:bg-[#F7F9FF] hover:shadow-2xl hover:-translate-y-0.5"
                >
                  Jetzt kostenlos testen
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                {[
                  { label: 'Datenpartner', value: '15+', icon: <Building2 className="h-5 w-5" /> },
                  { label: 'Analysen erstellt', value: '42.000+', icon: <BarChart3 className="h-5 w-5" /> },
                  { label: 'Ø Dauer', value: '< 60s', icon: <Sparkles className="h-5 w-5" /> },
                  { label: 'Bewertung', value: '4,9/5', icon: <CheckCircle2 className="h-5 w-5" /> },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur transition-all duration-200 hover:bg-white/15 hover:scale-105">
                    <div className="flex justify-center mb-2 text-white/80">
                      {stat.icon}
                    </div>
                    <p className="text-3xl font-semibold mb-1">{stat.value}</p>
                    <p className="text-sm text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="px-6 py-24 bg-[#F7F9FF]">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">Häufige Fragen</h2>
              <p className="text-lg text-[#6C7F99]">Alles, was du wissen musst – kurz und klar.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="group rounded-2xl border border-[#264171]/8 bg-white p-8 shadow-sm transition-all duration-200 hover:border-[#E6AE63]/30 hover:shadow-md">
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
                  Starte jetzt, sichere dir <strong className="text-white">zwei Premium-Analysen gratis</strong> und entscheide datenbasiert statt aus dem Bauch heraus.
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
