'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Check, ChevronDown, FileText, FlaskConical, Infinity as Unbegrenzt, Lock, MapPin, Sparkles, TrendingUp } from 'lucide-react';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import { useImmoStore } from '@/store/useImmoStore';
import { useFounderOffer } from '@/hooks/useFounderOffer';
import {
  gruenderpreisHinweis, PLAENE, PRICING_FAQ, PRICING_TEXTE, preis, PREIS_JAHR, type Abrechnung,
} from '@/config/pricing';

const ANALYSE_ICONS = [MapPin, Sparkles, TrendingUp, FlaskConical, FileText];

interface PricingSectionProps {
  /** id der Section, z. B. "preise" als Sprungziel auf der Homepage */
  id?: string;
  /** h1 auf /pricing, h2 eingebettet (Homepage, später Paywall) */
  headingAs?: 'h1' | 'h2';
  /** Kleine Zeile über der Überschrift */
  eyebrow?: string;
  /** FAQ unter den Karten anzeigen */
  showFaq?: boolean;
  /** Ort für Tracking (click_location / cta_location) */
  ort: string;
  /** Wenn gesetzt: paywall_viewed mit diesem trigger, sobald die Section sichtbar ist */
  paywallTrigger?: string;
  /**
   * Kompakt (z. B. in der Paywall): nur die Planwahl mit Preis und Button,
   * ohne Überschrift, Inhaltsliste, Kostenlos-Karte und FAQ
   */
  compact?: boolean;
  /** Interner Pfad, auf den Stripe nach der Zahlung zurückleitet (sonst /abo) */
  returnTo?: string;
  /** Wird direkt vor dem Weiterleiten zu Stripe aufgerufen (z. B. Eingaben sichern) */
  onBeforeCheckout?: (plan: Abrechnung) => void;
  /** Zusätzliche Parameter für checkout_started (z. B. trigger) */
  trackingParams?: Record<string, unknown>;
  className?: string;
}

export function PricingSection({
  id, headingAs = 'h2', eyebrow, showFaq = true, ort, paywallTrigger, compact = false,
  returnTo, onBeforeCheckout, trackingParams, className = '',
}: PricingSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const resetAnalysis = useImmoStore(s => s.resetAnalysis);
  const [abrechnung, setAbrechnung] = useState<Abrechnung>(PLAENE.premium.standard);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const angebot = useFounderOffer();
  const gruenderAngebot = angebot?.active ? angebot : null;

  // paywall_viewed einmal, sobald die Section im Blick ist
  useEffect(() => {
    const el = sectionRef.current;
    if (!paywallTrigger || !el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(eintraege => {
      if (eintraege.some(e => e.isIntersecting)) {
        trackEvent(AnalyticsEvents.PAYWALL_VIEWED, { trigger: paywallTrigger, signed_in: !!isSignedIn });
        obs.disconnect();
      }
    }, { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
    // isSignedIn absichtlich nicht als Abhängigkeit: das Event soll nur einmal feuern
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paywallTrigger]);

  const option = PLAENE.premium.optionen[abrechnung];
  // Gründerpreis gilt nur für das Jahresabo; welche Stripe-Price-ID genutzt wird, entscheidet der Server
  const gruender = abrechnung === 'yearly' ? gruenderAngebot : null;
  const betrag = gruender ? (gruender.amount ?? PREIS_JAHR) : option.betrag;

  const kostenlosStarten = () => {
    trackEvent(AnalyticsEvents.CTA_CLICKED, { cta_name: 'start_analysis', cta_location: `${ort}_kostenlos` });
    if (isSignedIn) resetAnalysis();
  };

  const checkoutStarten = async () => {
    if (!isSignedIn) {
      toast.info('Bitte melde dich an, um fortzufahren');
      router.push(`/sign-up?redirect_url=${encodeURIComponent(pathname || '/pricing')}`);
      return;
    }

    trackEvent(AnalyticsEvents.CHECKOUT_STARTED, {
      ...trackingParams,
      plan: abrechnung,
      plan_name: abrechnung,
      click_location: ort,
      value: betrag,
      currency: 'EUR',
      founder_price: !!gruender,
      ...(returnTo ? { return_to: returnTo } : {}),
    });

    setLaedt(true);
    setFehler(null);
    try {
      onBeforeCheckout?.(abrechnung);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: abrechnung, returnTo }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Keine Checkout-URL erhalten');
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setFehler('Der Bezahlvorgang konnte nicht gestartet werden. Bitte versuche es erneut.');
      setLaedt(false);
    }
  };

  const Heading = headingAs;

  if (compact) {
    return (
      <section ref={sectionRef} id={id} className={className}>
        <div role="radiogroup" aria-label="Abrechnung" className="flex flex-col gap-2.5">
          {(['yearly', 'monthly'] as const).map(a => {
            const o = PLAENE.premium.optionen[a];
            const g = a === 'yearly' ? gruenderAngebot : null;
            const gewaehlt = abrechnung === a;
            return (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={gewaehlt}
                onClick={() => setAbrechnung(a)}
                className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${gewaehlt ? 'border-[#ff6b00] bg-orange-50/40' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <span aria-hidden className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${gewaehlt ? 'border-[#ff6b00]' : 'border-slate-300'}`}>
                  {gewaehlt && <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b00]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="flex items-center gap-2 font-extrabold text-[#001d3d]">
                      {o.label}
                      {a === 'yearly' && !g && o.ersparnis && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{o.ersparnis}</span>
                      )}
                    </span>
                    <span className="flex items-baseline gap-1.5 tabular-nums" data-slot={g ? 'gruenderpreis' : undefined}>
                      {g && <s className="text-sm font-bold text-slate-400">{preis(PREIS_JAHR)} €</s>}
                      <b className="text-xl font-black text-[#001d3d]">{g ? g.priceLabel : o.preisText}</b>
                      <span className="text-[13px] text-slate-600">{o.zeitraum}</span>
                    </span>
                  </span>
                  <span className="mt-1 block text-[13px] text-slate-600">
                    {g?.amount ? `nur ${preis(g.amount / 12)} € pro Monat` : o.hinweis}
                  </span>
                  {g && <span className="mt-1 block text-[13px] font-bold text-[#ff6b00]">{gruenderpreisHinweis(g.endsAtLabel)}</span>}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={checkoutStarten}
          disabled={laedt}
          className="mt-4 w-full rounded-2xl bg-[#ff6b00] py-3.5 font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#ff6b00]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {laedt ? 'Wird geladen …' : `${PLAENE.premium.cta} · ${abrechnung === 'yearly' && gruenderAngebot ? gruenderAngebot.priceLabel : option.preisText} ${option.zeitraum}`}
        </button>
        {fehler && <p role="alert" className="mt-3 text-center text-sm text-red-600">{fehler}</p>}
        <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-xs text-slate-500">
          <Lock size={12} className="mt-[2px] shrink-0" />
          <span>{PRICING_TEXTE.vertrauen}</span>
        </p>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id={id} className={`scroll-mt-20 px-5 py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-4xl">
        {/* Überschrift */}
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#ff6b00]">{eyebrow}</span>}
          <Heading className="mt-2.5 text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#001d3d] md:text-[42px]">
            {PRICING_TEXTE.headline}
          </Heading>
        </div>

        {/* Was jede vollständige Analyse enthält (einmal, nicht pro Karte) */}
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-center text-sm font-bold text-[#001d3d]">{PRICING_TEXTE.analyseTitel}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {PRICING_TEXTE.analyseInhalt.map((t, i) => {
              const Icon = ANALYSE_ICONS[i] ?? Check;
              return (
                <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[13px] font-semibold text-slate-700">
                  <Icon size={14} className="shrink-0 text-[#ff6b00]" />{t}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Karten */}
        <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2">
          {/* Kostenlos */}
          <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <h3 className="text-lg font-extrabold text-[#001d3d]">{PLAENE.free.titel}</h3>
            <p className="mt-4 text-[40px] font-black leading-none tracking-tight tabular-nums text-[#001d3d]">{PLAENE.free.preis}</p>
            <p className="mt-2 text-[13px] text-slate-600">Ohne Kreditkarte, nur mit E-Mail</p>
            <ul className="mb-6 mt-6 flex flex-1 flex-col gap-2.5 text-[15px]">
              {PLAENE.free.merkmale.map((t, i) => (
                <li key={t} className={`flex gap-2.5 ${i === 0 ? 'font-bold text-[#001d3d]' : 'text-slate-600'}`}>
                  <Check size={18} strokeWidth={2.6} className="mt-0.5 shrink-0 text-emerald-600" />{t}
                </li>
              ))}
            </ul>
            <Link
              href={PLAENE.free.href}
              onClick={kostenlosStarten}
              className="block w-full rounded-2xl border-[1.5px] border-slate-200 bg-white py-3.5 text-center font-bold text-[#001d3d] transition hover:border-[#001d3d]"
            >
              {PLAENE.free.cta}
            </Link>
          </article>

          {/* Premium */}
          <article className="relative flex flex-col rounded-3xl border-2 border-[#ff6b00] bg-white p-6 shadow-xl shadow-orange-500/15 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-[#001d3d]">{PLAENE.premium.titel}</h3>
              {/* Abrechnung wählen */}
              <div role="radiogroup" aria-label="Abrechnung" className="inline-flex rounded-full bg-slate-100 p-1 text-[13px] font-bold">
                {(['yearly', 'monthly'] as const).map(a => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={abrechnung === a}
                    onClick={() => setAbrechnung(a)}
                    className={`rounded-full px-3 py-1.5 transition ${abrechnung === a ? 'bg-white text-[#001d3d] shadow-sm' : 'text-slate-500 hover:text-[#001d3d]'}`}
                  >
                    {PLAENE.premium.optionen[a].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 min-h-[88px]">
              {gruender ? (
                // Gründerpreis: nur solange FOUNDER_OFFER_ENABLED gesetzt und FOUNDER_OFFER_ENDS_AT nicht erreicht ist
                <p className="flex flex-wrap items-baseline gap-x-2" data-slot="gruenderpreis">
                  <s className="text-xl font-bold text-slate-400 tabular-nums">{preis(PREIS_JAHR)} €</s>
                  <b className="text-[40px] font-black leading-none tracking-tight tabular-nums text-[#001d3d]">{gruender.priceLabel}</b>
                  <span className="text-sm text-slate-600">{option.zeitraum}</span>
                </p>
              ) : (
                <p className="flex items-baseline gap-1.5">
                  <b className="text-[40px] font-black leading-none tracking-tight tabular-nums text-[#001d3d]">{option.preisText}</b>
                  <span className="text-sm text-slate-600">{option.zeitraum}</span>
                </p>
              )}
              <p className="mt-2 text-[13px] text-slate-600">
                {gruender?.amount ? `nur ${preis(gruender.amount / 12)} € pro Monat` : option.hinweis}
              </p>
              {gruender ? (
                <p className="mt-2 text-[13px] font-bold text-[#ff6b00]">{gruenderpreisHinweis(gruender.endsAtLabel)}</p>
              ) : option.ersparnis && (
                <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{option.ersparnis}</span>
              )}
            </div>

            <ul className="mb-6 mt-4 flex flex-1 flex-col gap-2.5 text-[15px]">
              <li className="flex gap-2.5 font-bold text-[#001d3d]">
                <Unbegrenzt size={18} strokeWidth={2.6} className="mt-0.5 shrink-0 text-[#ff6b00]" />{PLAENE.premium.hauptzeile}
              </li>
              <li className="flex gap-2.5 text-slate-600">
                <Check size={18} strokeWidth={2.6} className="mt-0.5 shrink-0 text-emerald-600" />Alles aus Kostenlos
              </li>
            </ul>

            <button
              type="button"
              onClick={checkoutStarten}
              disabled={laedt}
              className="w-full rounded-2xl bg-[#ff6b00] py-3.5 font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#ff6b00]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {laedt ? 'Wird geladen …' : PLAENE.premium.cta}
            </button>
            {fehler && <p role="alert" className="mt-3 text-center text-sm text-red-600">{fehler}</p>}
          </article>
        </div>

        {/* Vertrauen */}
        <p className="mx-auto mt-6 flex max-w-3xl items-start justify-center gap-1.5 text-center text-[13px] text-slate-600">
          <Lock size={13} className="mt-[3px] shrink-0" />
          <span>{PRICING_TEXTE.vertrauen}</span>
        </p>

        {/* FAQ: <details> funktioniert ohne JavaScript */}
        {showFaq && (
          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-center text-2xl font-extrabold text-[#001d3d]">Häufige Fragen</h2>
            <div className="mt-6 flex flex-col gap-2.5">
              {PRICING_FAQ.map(f => (
                <details key={f.frage} className="group rounded-2xl border border-slate-200 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-bold text-[#001d3d] [&::-webkit-details-marker]:hidden">
                    {f.frage}
                    <ChevronDown size={18} className="shrink-0 text-[#ff6b00] transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-slate-600">{f.antwort}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

