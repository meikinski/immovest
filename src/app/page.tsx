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
  Camera,
  MapPin,
  ShieldCheck,
  Sparkles,
  Link as LinkIcon,
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
      icon: <Sparkles className="w-6 h-6 text-[#E6AE63]" />,
      title: 'Importiere dein Exposé',
      description: 'Screenshot hochladen, Inserat verlinken oder Werte manuell übernehmen – Sekunden statt Stunden.',
    },
    {
      icon: <LineChart className="w-6 h-6 text-[#264171]" />,
      title: 'Kennzahlen auf einen Blick',
      description: 'Cashflow, Nettomietrendite, Eigenkapitalrendite und DSCR sofort parat.',
    },
    {
      icon: <MapPin className="w-6 h-6 text-[#6C7F99]" />,
      title: 'Lage smart vergleichen',
      description: 'KI bewertet Mikrolage, Vergleichsmiete und Preisentwicklung mit Karten-Insights.',
    },
    {
      icon: <FileBarChart className="w-6 h-6 text-white" />,
      title: 'Bankfähiger Report',
      description: 'PDF mit Annahmen, Cashflow-Tabelle und Szenarien zum Teilen.',
      accent: true,
    },
  ];

  const importActions = [
    {
      title: 'Foto aufnehmen',
      description: 'Mach ein Bild vom Exposé – KI erkennt Preise, Flächen, Zimmer & Miete.',
      icon: <Camera className="h-5 w-5 text-[hsl(var(--brand-2))]" />,
      target: '/input-method?focus=foto',
    },
    {
      title: 'Inserat einfügen',
      description: 'URL von ImmoScout, Immowelt & Co. einfügen und automatisch auslesen lassen.',
      icon: <LinkIcon className="h-5 w-5 text-[hsl(var(--brand))]" />,
      target: '/input-method?focus=url',
    },
    {
      title: 'Excel & Werte importieren',
      description: 'Vorlage hochladen oder manuell starten – ideal für bestehende Kalkulationen.',
      icon: <FileBarChart className="h-5 w-5 text-[hsl(var(--accent))]" />,
      target: '/input-method?focus=excel',
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
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand))]/5 via-white to-[hsl(var(--brand-2))]/10 backdrop-blur-xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand))]/25 to-transparent" />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push('/')} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--accent))] shadow-lg shadow-[hsl(var(--brand))]/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-xl font-semibold tracking-tight text-transparent">
              ImVestr
            </span>
          </button>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[hsl(var(--accent))] md:flex">
            <button
              onClick={() => document.getElementById('imports')?.scrollIntoView({ behavior: 'smooth' })}
              className="transition hover:text-[hsl(var(--brand))]"
            >
              Importe
            </button>
            <button
              onClick={() => document.getElementById('market-ai')?.scrollIntoView({ behavior: 'smooth' })}
              className="transition hover:text-[hsl(var(--brand))]"
            >
              Markt & Lage
            </button>
            <button
              onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' })}
              className="transition hover:text-[hsl(var(--brand))]"
            >
              Ablauf
            </button>
            <button
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="transition hover:text-[hsl(var(--brand))]"
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <SignInButton mode="modal" forceRedirectUrl="/input-method" fallbackRedirectUrl="/input-method">
                <button className="text-sm font-semibold text-[hsl(var(--brand))] transition hover:text-[hsl(var(--brand-2))]">
                  Anmelden
                </button>
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
            <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F7F9FF] to-[hsl(var(--brand-2))]/10" />
            <div className="absolute left-1/2 top-0 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[hsl(var(--brand))]/15 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--brand))]/20 bg-white/80 px-4 py-2 text-sm font-medium text-[hsl(var(--brand))]">
              <Sparkles className="h-4 w-4" />
              Foto, Link oder Excel – Importiere in unter 60 Sekunden.
            </div>

            {isSignedIn && user?.firstName && (
              <p className="mb-4 text-base text-[#6C7F99]">Hey {user.firstName}, lass uns die nächste Chance prüfen.</p>
            )}

            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-[#0F172A]">
              Importiere dein Objekt, KI prüft Rendite & Lage sofort.
            </h1>
            <p className="mt-5 text-lg text-[#4b5563]">
              Foto knipsen, Inserat verlinken oder Excel hochladen: ImVestr liest deine Daten aus, vergleicht die Mikrolage per KI und liefert Cashflow, Nettomietrendite, Eigenkapitalrendite & DSCR in Sekunden.
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

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {importActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => router.push(action.target)}
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-[hsl(var(--brand))]/10 bg-white/90 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--brand))]/5 text-[hsl(var(--brand))] group-hover:bg-[hsl(var(--brand))] group-hover:text-white">
                    {action.icon}
                  </div>
                  <span className="text-base font-semibold text-[#0F172A]">{action.title}</span>
                  <span className="text-sm text-[#4b5563]">{action.description}</span>
                  <span className="flex items-center gap-1 pt-1 text-sm font-semibold text-[hsl(var(--brand))]">
                    Import starten
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="imports" className="relative z-0 px-6 pb-24 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#264171]/5 via-[#6C7F99]/10 to-transparent rounded-t-[48px]" />
          <div className="mx-auto max-w-5xl rounded-[32px] bg-white/90 p-10 shadow-2xl shadow-[#264171]/10 backdrop-blur">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-3xl font-semibold text-[#0F172A]">Importiere dein Objekt, wie es dir passt.</h2>
              <p className="text-base text-[#4b5563]">
                Spare dir Copy-Paste: Unser Import erkennt Inserate, Exposés und Fotos automatisch – du prüfst nur noch die Zahlen.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Screenshot & Foto',
                  description: 'Zieh Exposé-Bilder oder frisch geschossene Fotos hierher. KI liest Kaufpreis, Lage, Miete & mehr aus.',
                  icon: <Camera className="h-6 w-6 text-[#264171]" />,
                },
                {
                  title: 'Inserat-URL',
                  description: 'Link zu ImmoScout & Co. einfügen, ImVestr übernimmt die wichtigsten Kennzahlen.',
                  icon: <MapPin className="h-6 w-6 text-[#E6AE63]" />,
                },
                {
                  title: 'Excel & manuelle Eingabe',
                  description: 'Eigene Werte importieren oder Felder selbst ausfüllen – komplett flexibel.',
                  icon: <FileBarChart className="h-6 w-6 text-[#6C7F99]" />,
                },
              ].map((importOption) => (
                <div
                  key={importOption.title}
                  className="group flex flex-col gap-3 rounded-3xl border border-[#264171]/10 bg-gradient-to-br from-white via-[#F7F9FF] to-white/80 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#264171]/10 text-[#264171] transition group-hover:bg-[#264171] group-hover:text-white">
                    {importOption.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">{importOption.title}</h3>
                  <p className="text-sm leading-relaxed text-[#4b5563]">{importOption.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="market-ai"
          className="relative overflow-hidden px-6 pb-24"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--brand))]/15 via-[#F7F9FF] to-[hsl(var(--brand-2))]/20" />
          <div className="absolute -top-12 right-1/2 h-64 w-64 translate-x-1/2 rounded-full bg-white/30 blur-3xl" />

          <div className="mx-auto flex max-w-5xl flex-col gap-12 rounded-[32px] border border-white/60 bg-white/80 p-10 shadow-2xl shadow-[hsl(var(--brand))]/15 backdrop-blur">
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[hsl(var(--brand))]/20 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--brand))]">
                <Sparkles className="h-3.5 w-3.5" />
                KI Lage- & Marktanalyse
              </div>
              <h2 className="text-3xl font-semibold text-[#0F172A]">Mikrolage verstehen statt raten.</h2>
              <p className="text-base text-[#4b5563]">
                ImVestr bewertet die Lage deines Objekts automatisch – mit Mietspiegeln, Marktvergleich und Nachbarschaftsdaten. Du siehst sofort, ob dein Deal im Umfeld besteht.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-4 rounded-3xl border border-[hsl(var(--brand))]/15 bg-white/90 p-6 text-left shadow-inner">
                <h3 className="text-lg font-semibold text-[#0F172A]">Was unsere KI prüft</h3>
                <ul className="space-y-3 text-sm text-[#4b5563]">
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-[hsl(var(--brand))]" />
                    Mikrolage-Score auf Basis von Infrastruktur, Nachfrage & Vergleichsmieten.
                  </li>
                  <li className="flex items-start gap-2">
                    <LineChart className="mt-0.5 h-4 w-4 text-[hsl(var(--brand-2))]" />
                    Miet- und Kaufpreisvergleich gegenüber ähnlichen Objekten in deiner Umgebung.
                  </li>
                  <li className="flex items-start gap-2">
                    <BarChart3 className="mt-0.5 h-4 w-4 text-[hsl(var(--accent))]" />
                    Szenarien für Cashflow, Rendite und DSCR mit editierbaren Annahmen.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-[hsl(var(--brand-2))]/25 bg-gradient-to-br from-white via-[#F7F9FF] to-[hsl(var(--brand-2))]/15 p-6 shadow-lg shadow-[hsl(var(--brand))]/10">
                <h3 className="text-lg font-semibold text-[#0F172A]">Warum das wichtig ist</h3>
                <div className="space-y-3 text-sm text-[#4b5563]">
                  <p>
                    <strong className="font-semibold text-[hsl(var(--brand))]">Marktpreis-Check:</strong> Wir zeigen dir, ob die Angebotsmiete zu hoch ist und wie viel Spielraum du hast.
                  </p>
                  <p>
                    <strong className="font-semibold text-[hsl(var(--brand))]">Standort-Benchmark:</strong> Jede Bewertung enthält eine Karte mit Mikrolage-Bewertung und Nachfrageindikatoren.
                  </p>
                  <p>
                    <strong className="font-semibold text-[hsl(var(--brand))]">Transparente Datenquellen:</strong> Mietspiegel, Portale und amtliche Daten – alles nachvollziehbar aufgeführt.
                  </p>
                </div>
                <button
                  onClick={handleGetStarted}
                  className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[hsl(var(--brand))] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--brand))]/20 transition hover:bg-[hsl(var(--brand))]/90"
                >
                  Lage jetzt analysieren
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
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
          <div className="mx-auto flex max-w-5xl flex-col gap-10 rounded-3xl bg-white/95 p-10 shadow-xl shadow-[#264171]/10 backdrop-blur">
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

        <section className="relative px-6 py-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#264171] via-[#1f3460] to-[#6C7F99]" />
          <div className="mx-auto flex max-w-5xl flex-col gap-10 text-white">
            <div className="flex flex-col gap-3 text-center">
              <h2 className="text-3xl font-semibold">Transparenz statt Marketing-Zahlen.</h2>
              <p className="text-base text-white/80">
                Wir zeigen dir Quellen, Annahmen und Rechenlogik direkt im Tool. So kannst du jede Zahl nachvollziehen und anpassen.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Datenquellen sichtbar',
                  description: 'Jeder Wert ist mit Quelle oder Eingabe markiert – du entscheidest, was übernommen wird.',
                },
                {
                  title: 'Annäherungen erklärbar',
                  description: 'Modelle offenbaren Annahmen zu Mieten, Kaufnebenkosten und Zins. Anpassung jederzeit möglich.',
                },
                {
                  title: 'Sichere Infrastruktur',
                  description: 'DSGVO-konforme Speicherung in der EU, verschlüsselte Übertragung und rollenbasierte Zugriffe.',
                },
              ].map((trustPoint) => (
                <div key={trustPoint.title} className="rounded-3xl border border-white/20 bg-white/10 p-6 text-left shadow-lg shadow-black/10">
                  <h3 className="text-lg font-semibold">{trustPoint.title}</h3>
                  <p className="mt-3 text-sm text-white/80">{trustPoint.description}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/15 bg-white/5 p-6 text-sm backdrop-blur md:flex-row">
              <div className="flex items-center gap-3 text-left">
                <ShieldCheck className="h-10 w-10 text-white" />
                <p className="max-w-lg text-white/80">
                  Kein Marketing-Blabla: Du siehst, welche Inputs fehlen, welche Annahmen gelten und wie der Cashflow entsteht.
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
