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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#264171] to-[#6C7F99] flex items-center justify-center shadow-lg shadow-[#264171]/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#264171]">ImVestr</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6C7F99]">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#264171] transition">
              Vorteile
            </button>
            <button onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#264171] transition">
              So funktioniert es
            </button>
            <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#264171] transition">
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                <button className="text-sm font-semibold text-[#264171] hover:text-[#E6AE63] transition">Anmelden</button>
              </SignInButton>
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
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#264171]/20 bg-white/80 px-4 py-2 text-sm font-medium text-[#264171]">
              <Sparkles className="h-4 w-4" />
              In Sekunden wissen, ob sich eine Immobilie lohnt.
            </div>

            {isSignedIn && user?.firstName && (
              <p className="mb-4 text-base text-[#6C7F99]">Hey {user.firstName}, lass uns die nächste Chance prüfen.</p>
            )}

            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-[#0F172A]">
              Deine KI für Rendite, Cashflow und bankfähige Reports.
            </h1>
            <p className="mt-5 text-lg text-[#4b5563]">
              Füttere ImVestr mit Adresse und Eckdaten. Du erhältst Cashflow, Nettomietrendite, DSCR und Szenarien in unter 60 Sekunden.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={handleGetStarted}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#264171] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-[#264171]/20 transition hover:bg-[#1f3460] sm:w-auto"
              >
                Jetzt Analyse starten
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E6AE63] bg-white px-8 py-4 text-sm font-semibold text-[#E6AE63] transition hover:bg-[#E6AE63]/10 sm:w-auto">
                    Kostenlos testen
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </SignInButton>
              ) : (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#6C7F99]/40 bg-white px-8 py-4 text-sm font-semibold text-[#264171] transition hover:border-[#264171] sm:w-auto"
                >
                  Zum Dashboard
                </button>
              )}
            </div>

            {!isSignedIn && (
              <div className="mt-6 flex flex-col items-center gap-2 text-sm text-[#6C7F99]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                  <span>Ohne Kreditkarte. Zwei Premium-Analysen inklusive.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                  <span>Alle Annahmen editierbar. Volle Transparenz.</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="features" className="px-6 pb-24">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {featureHighlights.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex flex-col gap-3 rounded-3xl border border-[#264171]/10 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  feature.accent ? 'bg-gradient-to-br from-[#264171] to-[#6C7F99] text-white' : 'bg-white'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    feature.accent ? 'bg-white/20' : 'bg-[#F7F9FF]'
                  }`}
                >
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-semibold ${feature.accent ? 'text-white' : 'text-[#0F172A]'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed ${feature.accent ? 'text-white/90' : 'text-[#4b5563]'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white px-6 py-24" id="steps">
          <div className="mx-auto flex max-w-5xl flex-col gap-16 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-4">
              <h2 className="text-3xl font-semibold text-[#0F172A]">So läuft deine Analyse.</h2>
              <p className="text-base text-[#4b5563]">
                ImVestr führt dich in drei klaren Schritten vom Objekt zum bankfähigen Report. Jedes Feld erklärt, jede Annahme editierbar.
              </p>
              <div className="grid gap-4">
                {steps.map((step) => (
                  <div key={step.title} className="rounded-2xl border border-[#264171]/10 bg-[#F7F9FF] p-5">
                    <h3 className="text-base font-semibold text-[#264171]">{step.title}</h3>
                    <p className="mt-2 text-sm text-[#4b5563]">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-3xl border border-dashed border-[#E6AE63]/50 bg-gradient-to-br from-[#F7F9FF] via-white to-[#E6AE63]/20 p-8 shadow-inner">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow">
                  <LineChart className="h-8 w-8 text-[#264171]" />
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Cashflow +327 €</p>
                    <p className="text-xs text-[#6C7F99]">nach Kaufnebenkosten</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow">
                  <Building2 className="h-8 w-8 text-[#E6AE63]" />
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Mikrolage · Top 15 %</p>
                    <p className="text-xs text-[#6C7F99]">Mietpreisvergleich in deinem Stadtteil</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow">
                  <FileBarChart className="h-8 w-8 text-[#6C7F99]" />
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">PDF bereit in 12 Sekunden</p>
                    <p className="text-xs text-[#6C7F99]">Alle Annahmen und Szenarien zum Download</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 rounded-3xl bg-white p-10 shadow-xl">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-3xl font-semibold text-[#0F172A]">Wem ImVestr hilft.</h2>
              <p className="text-base text-[#4b5563]">
                Von Mariam mit wenig Zeit bis Leandro dem Data-Nerd – alle prüfen Investitionen sicher, schnell und transparent.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  name: 'Mariam · Ärztin',
                  quote: 'Ich bekomme ein Ja/Nein plus PDF für die Bank – ohne Excel-Nacht.',
                },
                {
                  name: 'Daniel · IT-Consultant',
                  quote: 'Szenarien verschieben, sofort neue Rendite sehen. Spart mir Stunden.',
                },
                {
                  name: 'Tobias · FIRE-Student',
                  quote: 'Cashflow in Sekunden. Endlich weiß ich, ob sich das Listing lohnt.',
                },
                {
                  name: 'Leandro · Data-Nerd',
                  quote: 'Jede Datenquelle angegeben, Annahmen editierbar. So vertraue ich dem Modell.',
                },
              ].map((persona) => (
                <div key={persona.name} className="flex flex-col gap-3 rounded-2xl border border-[#264171]/10 bg-[#F7F9FF] p-6">
                  <p className="text-sm text-[#0F172A]">“{persona.quote}”</p>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6C7F99]">{persona.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#264171] px-6 py-24 text-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-10">
            <div className="flex flex-col gap-3 text-center">
              <h2 className="text-3xl font-semibold">Vertraue auf geprüfte Daten.</h2>
              <p className="text-base text-white/80">
                ImVestr kombiniert Marktpreise, Mietspiegel, Finanzierungskonditionen und deine Annahmen in einem Modell.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { label: 'Datenpartner', value: '15+' },
                { label: 'Analysen erstellt', value: '42.000+' },
                { label: 'Durchschnittliche Dauer', value: '< 60 s' },
                { label: 'Nutzerbewertungen', value: '4,9 / 5' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-white/10 p-6 text-sm backdrop-blur md:flex-row">
              <div className="flex items-center gap-3 text-left">
                <ShieldCheck className="h-10 w-10 text-white" />
                <p className="max-w-lg text-white/80">
                  Transparente Datenquellen, nachvollziehbare Annahmen und sichere Infrastruktur sorgen für Vertrauen bei Banken und Partnern.
                </p>
              </div>
              <button
                onClick={handleGetStarted}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#264171] transition hover:bg-[#F7F9FF]"
              >
                Jetzt Zahlen prüfen
              </button>
            </div>
          </div>
        </section>

        <section id="faq" className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold text-[#0F172A]">Häufige Fragen.</h2>
            <div className="mt-8 space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-[#264171]/10 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-[#0F172A]">{faq.question}</h3>
                  <p className="mt-2 text-sm text-[#4b5563]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-[#264171] via-[#6C7F99] to-[#E6AE63] p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl font-semibold">Bereit für deine nächste Immobilie?</h2>
            <p className="mt-4 text-base text-white/85">
              Starte jetzt, sichere dir zwei Premium-Analysen gratis und entscheide datenbasiert statt aus dem Bauch heraus.
            </p>
            <button
              onClick={handleGetStarted}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-[#264171] transition hover:bg-[#F7F9FF]"
            >
              Analyse öffnen
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#264171]/10 bg-white px-6 py-10 text-sm text-[#6C7F99]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <p>© {new Date().getFullYear()} ImVestr. Transparent. Vertrauenswürdig. Schnell.</p>
          <p className="text-xs text-[#6C7F99]">
            Keine Anlageberatung. Ergebnisse sind Modell-Schätzungen und hängen von deinen Eingaben ab.
          </p>
        </div>
      </footer>
    </div>
  );
}
