'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, CheckCircle2, Sparkles, Zap, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@clerk/nextjs';

interface PricingCardsProps {
  onClose?: () => void;
}

export default function PricingCards({}: PricingCardsProps) {
  const { userId } = useAuth();
  const { trackUpgradeClick } = useAnalytics();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carousel state for mobile
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update active index based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth - 32; // 100vw - 32px (padding)
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to specific card when dot is clicked
  const scrollToCard = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.offsetWidth - 32;
    container.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
  };

  // Beide Abos haben die gleichen Features, nur unterschiedlicher Preis
  const baseFeatures = [
    'Unbegrenzte Markt- & Lageanalysen',
    'KI-gestützte Investitionsempfehlungen',
    'Detaillierte Szenario-Analysen',
    'PDF-Export deiner Analysen',
    'Gespeicherte Analysen ohne Limit',
  ];

  const plans = [
    {
      name: 'Monatsabo',
      price: '12,99',
      period: 'pro Monat',
      description: 'Flexibel und monatlich kündbar',
      priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!,
      icon: <Zap className="w-6 h-6" />,
      popular: false,
      features: [
        ...baseFeatures,
        'Monatlich kündbar',
      ],
    },
    {
      name: 'Jahresabo',
      price: '69',
      period: 'pro Jahr',
      originalPrice: '155,88',
      savings: '59%',
      description: 'Spare 59% - Nur 5,75 € pro Monat',
      priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!,
      icon: <Crown className="w-6 h-6" />,
      popular: true,
      features: [
        ...baseFeatures,
        'Spare 86,88 € im Jahr',
      ],
    },
  ];

  const handleSelectPlan = async (priceId: string, planName: string) => {
    if (!userId) {
      // Redirect to sign-in page with return URL
      toast.info('Bitte melde dich an, um fortzufahren');
      router.push('/sign-in?redirect_url=/pricing');
      return;
    }

    // Track upgrade click before initiating checkout
    trackUpgradeClick(planName, 'pricing_page');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen der Checkout-Session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Keine Checkout-URL erhalten');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b00]/10 rounded-full text-[#ff6b00] font-semibold text-xs uppercase tracking-widest mb-4">
          <Sparkles className="w-4 h-4" />
          Premium freischalten
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight tracking-tight">
          <span className="text-[#001d3d]">Wähle deinen</span> <span className="text-[#ff6b00]">Plan</span>
        </h2>
        <p className="text-gray-600 text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
          Erhalte unbegrenzten Zugang zu allen Premium-Features und KI-gestützten Analysen
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Pricing Cards - Desktop Grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-[40px] border-2 p-8 md:p-10 transition-all hover:shadow-2xl hover:-translate-y-2 duration-300 bg-white ${
              plan.popular
                ? 'border-[#ff6b00] shadow-xl'
                : 'border-gray-200 hover:border-[#ff6b00]/50'
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                <div className="px-4 py-1.5 bg-[#ff6b00] text-white text-sm font-semibold rounded-full shadow-lg whitespace-nowrap">
                  Empfohlen
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-6">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-sm ${
                plan.popular
                  ? 'bg-[#001d3d] text-[#ff6b00]'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {plan.icon}
              </div>

              <h3 className="text-2xl font-bold mb-2 text-[#001d3d]">{plan.name}</h3>
              <p className="text-gray-600 text-sm">{plan.description}</p>

              {/* Price */}
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#001d3d]">{plan.price} €</span>
                  <span className="text-gray-600">/ {plan.period}</span>
                </div>

                {plan.originalPrice && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-gray-500 line-through text-sm">
                      {plan.originalPrice} €
                    </span>
                    <span className="px-2 py-0.5 bg-[#ff6b00]/10 text-[#ff6b00] text-xs font-semibold rounded-full">
                      Spare {plan.savings}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ff6b00] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => handleSelectPlan(
                plan.priceId,
                plan.name === 'Jahresabo' ? 'yearly' : 'monthly'
              )}
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-full font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                plan.popular
                  ? 'bg-[#ff6b00] text-white hover:shadow-xl hover:scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {isLoading ? 'Wird geladen...' : 'Jetzt upgraden'}
            </button>

          </div>
        ))}
      </div>

      {/* Pricing Cards - Mobile Carousel */}
      <div className="md:hidden w-full pt-6">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pl-4 pr-4 pb-4"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="w-[calc(100vw-32px)] flex-shrink-0 snap-start"
            >
                <div
                  className={`relative rounded-[40px] border-2 p-6 bg-white ${
                    plan.popular
                      ? 'border-[#ff6b00] shadow-xl'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-4 py-1.5 bg-[#ff6b00] text-white text-sm font-semibold rounded-full shadow-lg whitespace-nowrap">
                        Empfohlen
                      </div>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-sm ${
                      plan.popular
                        ? 'bg-[#001d3d] text-[#ff6b00]'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {plan.icon}
                    </div>

                    <h3 className="text-2xl font-bold mb-2 text-[#001d3d]">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>

                    {/* Price */}
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-[#001d3d]">{plan.price} €</span>
                        <span className="text-gray-600">/ {plan.period}</span>
                      </div>

                      {plan.originalPrice && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-gray-500 line-through text-sm">
                            {plan.originalPrice} €
                          </span>
                          <span className="px-2 py-0.5 bg-[#ff6b00]/10 text-[#ff6b00] text-xs font-semibold rounded-full">
                            Spare {plan.savings}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#ff6b00] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(
                      plan.priceId,
                      plan.name === 'Jahresabo' ? 'yearly' : 'monthly'
                    )}
                    disabled={isLoading}
                    className={`w-full py-4 px-6 rounded-full font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular
                        ? 'bg-[#ff6b00] text-white hover:shadow-xl hover:scale-105 shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {isLoading ? 'Wird geladen...' : 'Jetzt upgraden'}
                  </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {plans.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToCard(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex ? 'w-8 bg-[#ff6b00]' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Zu Plan ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Free-Plan Abgrenzung */}
      <div className="mt-10 max-w-2xl mx-auto bg-gray-50 border border-gray-200 rounded-[28px] p-6">
        <h3 className="font-bold text-[#001d3d] mb-3">Was ist kostenlos?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">✅ Kostenlos</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• 1 vollständige Analyse</li>
              <li>• Cashflow-Berechnung</li>
              <li>• Rendite-Kennzahlen</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-[#ff6b00] uppercase tracking-wider mb-2">⚡ Nur mit Premium</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Unbegrenzte Analysen</li>
              <li>• Markt- & Lageanalyse</li>
              <li>• PDF-Export (Bank-ready)</li>
              <li>• KI-Investitionsempfehlungen</li>
              <li>• Analysen speichern</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ Block */}
      <div className="mt-10 max-w-2xl mx-auto">
        <h3 className="font-bold text-[#001d3d] text-xl mb-6 text-center">Häufige Fragen</h3>
        <PricingFAQ />
      </div>

      {/* Trust Badges */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Sichere Zahlung powered by Stripe
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>🔒 SSL-verschlüsselt</span>
          <span>•</span>
          <span>💳 Alle Zahlungsmethoden</span>
          <span>•</span>
          <span>🇪🇺 DSGVO-konform</span>
        </div>
      </div>
    </div>
  );
}

// FAQ sub-component
function PricingFAQ() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  const faqs = [
    {
      q: 'Kann ich jederzeit kündigen?',
      a: 'Ja — das Monatsabo ist monatlich kündbar, das Jahresabo zum Ablauf des Jahres. Keine Mindestlaufzeit, keine versteckten Gebühren.',
    },
    {
      q: 'Wie läuft die Abrechnung?',
      a: 'Die Zahlung erfolgt einmalig beim Abschluss über Stripe (Kreditkarte, SEPA-Lastschrift). Du erhältst eine Rechnung per E-Mail.',
    },
    {
      q: 'Was ist im Free-Plan enthalten?',
      a: 'Du kannst eine vollständige Analyse kostenlos durchführen inkl. Cashflow-Berechnung und Rendite-Kennzahlen. Für unbegrenzte Analysen, Marktdaten, PDF-Export und KI-Empfehlungen brauchst du Premium.',
    },
    {
      q: 'Gibt es eine Testphase?',
      a: 'Ja — der Free-Plan ist deine Testphase. Du kannst imvestr vollständig testen, bevor du dich für Premium entscheidest.',
    },
  ];
  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => (
        <div key={idx} className="border border-gray-200 rounded-[20px] overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-sm text-[#001d3d]">{faq.q}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-3 ${openIdx === idx ? 'rotate-180' : ''}`} />
          </button>
          {openIdx === idx && (
            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
