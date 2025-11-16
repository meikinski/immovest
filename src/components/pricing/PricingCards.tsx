'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Crown, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { usePaywall } from '@/contexts/PaywallContext';
import { useAnalytics } from '@/hooks/useAnalytics';

interface PricingCardsProps {
  onClose?: () => void;
}

export default function PricingCards({}: PricingCardsProps) {
  const { userId } = useAuth();
  const { isPremium } = usePaywall();
  const { trackUpgradeClick } = useAnalytics();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carousel state for mobile
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Swipe handlers for mobile carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeIndex < plans.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else if (isRightSwipe && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }

    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Show message for premium users
  if (isPremium) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-lg font-semibold rounded-full shadow-lg mb-6">
          <Crown className="w-6 h-6" />
          Du bist bereits Premium-Mitglied
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Du hast bereits Zugriff auf alle Premium-Features. Viel Erfolg bei deinen Immobilienanalysen!
        </p>
        <div className="inline-flex flex-col gap-3 text-left bg-white border-2 border-[hsl(var(--brand))]/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 text-gray-700">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>Unbegrenzte Markt- & Lageanalysen</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>KI-gestützte Investitionsempfehlungen</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>Detaillierte Szenario-Analysen</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>PDF-Export deiner Analysen</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>Gespeicherte Analysen ohne Limit</span>
          </div>
        </div>
      </div>
    );
  }

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
      price: '13,99',
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
      originalPrice: '167,88',
      savings: '59%',
      description: 'Spare 59% - Nur 5,75 € pro Monat',
      priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!,
      icon: <Crown className="w-6 h-6" />,
      popular: true,
      features: [
        ...baseFeatures,
        'Spare 98,88 € im Jahr',
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
    <div className="w-full max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--brand))]/10 rounded-full text-[hsl(var(--brand))] font-medium text-sm mb-4">
          <Sparkles className="w-4 h-4" />
          Premium freischalten
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Wähle deinen Plan
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
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
            className={`relative rounded-2xl border-2 p-8 transition-all hover:shadow-2xl ${
              plan.popular
                ? 'border-[hsl(var(--brand))] shadow-xl scale-105'
                : 'border-gray-200 hover:border-[hsl(var(--brand))]/50'
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                <div className="px-4 py-1.5 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-sm font-semibold rounded-full shadow-lg whitespace-nowrap">
                  Empfohlen
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                plan.popular
                  ? 'bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {plan.icon}
              </div>

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-sm">{plan.description}</p>

              {/* Price */}
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price} €</span>
                  <span className="text-gray-600">/ {plan.period}</span>
                </div>

                {plan.originalPrice && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-gray-500 line-through text-sm">
                      {plan.originalPrice} €
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
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
                  <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))] flex-shrink-0 mt-0.5" />
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
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                plan.popular
                  ? 'bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white hover:shadow-lg hover:scale-105'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {isLoading ? 'Wird geladen...' : 'Jetzt starten'}
            </button>

          </div>
        ))}
      </div>

      {/* Pricing Cards - Mobile Carousel */}
      <div className="md:hidden w-full max-w-md mx-auto pt-6 overflow-hidden">
        <div
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="w-full flex-shrink-0 px-2"
              >
                <div
                  className={`relative rounded-2xl border-2 p-8 ${
                    plan.popular
                      ? 'border-[hsl(var(--brand))] shadow-xl'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-4 py-1.5 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-sm font-semibold rounded-full shadow-lg whitespace-nowrap">
                        Empfohlen
                      </div>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                      plan.popular
                        ? 'bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {plan.icon}
                    </div>

                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>

                    {/* Price */}
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{plan.price} €</span>
                        <span className="text-gray-600">/ {plan.period}</span>
                      </div>

                      {plan.originalPrice && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-gray-500 line-through text-sm">
                            {plan.originalPrice} €
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
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
                        <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))] flex-shrink-0 mt-0.5" />
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
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white hover:shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {isLoading ? 'Wird geladen...' : 'Jetzt starten'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {plans.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex ? 'w-8 bg-[hsl(var(--brand))]' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Zu Plan ${idx + 1}`}
            />
          ))}
        </div>
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
