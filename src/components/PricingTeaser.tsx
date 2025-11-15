'use client';

import React, { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePaywall } from '@/contexts/PaywallContext';
import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * Pricing Teaser mit Toggle Jährlich/Monatlich
 * Vergleich: Free vs. Pro
 */
export function PricingTeaser() {
  const router = useRouter();
  const { isPremium } = usePaywall();
  const { trackUpgradeClick } = useAnalytics();
  const [isYearly, setIsYearly] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Don't show pricing for premium users
  if (isPremium) {
    return null;
  }

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'Kostenlos',
      features: [
        { text: 'Unbegrenzte KPI-Berechnungen', included: true },
        { text: '1× KI-Kommentar', included: true },
        { text: 'Grundlegende Analyse', included: true },
        { text: 'Markt & Lageanalyse', included: false },
        { text: 'Szenarien-Rechner', included: false },
        { text: 'PDF-Export', included: false },
        { text: 'Analysen speichern', included: false },
      ],
      cta: 'Kostenlos starten',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: isYearly ? '69' : '13.99',
      period: isYearly ? 'pro Jahr' : 'pro Monat',
      savings: isYearly ? 'Spare 59% (nur 5,75€/Monat)' : null,
      features: [
        { text: 'Unbegrenzte KPI-Berechnungen', included: true },
        { text: 'Unbegrenzte KI-Kommentare', included: true },
        { text: 'Markt & Lageanalyse', included: true },
        { text: 'Szenarien-Rechner', included: true },
        { text: 'Bankfähiger PDF-Export', included: true },
        { text: 'Alle Analysen speichern', included: true },
      ],
      cta: 'Jetzt upgraden',
      highlighted: true,
    },
  ];

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

    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleUpgradeClick = () => {
    // Track upgrade click with plan type based on yearly/monthly toggle
    const planName = isYearly ? 'pro_yearly' : 'pro_monthly';
    trackUpgradeClick(planName, 'pricing_teaser');

    // Navigate to pricing page
    router.push('/pricing');
  };

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E6AE63]/30 bg-[#E6AE63]/5 px-4 py-2 text-sm font-medium text-[#264171] mb-4">
            <Sparkles className="h-4 w-4 text-[#E6AE63]" />
            Preise
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
            Wähle deinen Plan
          </h2>
          <p className="text-lg text-[#6C7F99] mb-8">
            Starte kostenlos oder upgrade für volle Features
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-100 rounded-full">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !isYearly
                  ? 'bg-white text-[hsl(var(--brand))] shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                isYearly
                  ? 'bg-white text-[hsl(var(--brand))] shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Jährlich
              {isYearly && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  -59%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Plans Grid - Desktop */}
        <div className="hidden md:grid md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border-2 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                plan.highlighted
                  ? 'border-[hsl(var(--brand))] bg-gradient-to-br from-white to-[hsl(var(--brand))]/5 shadow-xl'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Highlighted Badge */}
              {plan.highlighted && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-sm font-semibold rounded-full shadow-lg whitespace-nowrap z-10">
                  Beliebt
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-5xl font-bold text-[hsl(var(--brand))]">
                    {plan.price}
                  </span>
                  {plan.price !== '0' && (
                    <span className="text-xl text-gray-600">€</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{plan.period}</p>
                {plan.savings && (
                  <p className="text-xs font-medium text-green-600 mt-2">
                    {plan.savings}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-3 text-sm ${
                      feature.included ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? '' : 'line-through'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() =>
                  plan.highlighted
                    ? handleUpgradeClick()
                    : router.push('/input-method')
                }
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white shadow-lg hover:shadow-xl hover:scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Plans Carousel - Mobile */}
        <div className="md:hidden max-w-md mx-auto pt-6">
          <div
            className="relative overflow-visible"
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
                    className={`relative rounded-3xl border-2 p-8 ${
                      plan.highlighted
                        ? 'border-[hsl(var(--brand))] bg-gradient-to-br from-white to-[hsl(var(--brand))]/5 shadow-xl'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Highlighted Badge */}
                    {plan.highlighted && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-sm font-semibold rounded-full shadow-lg whitespace-nowrap z-10">
                        Beliebt
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1 mb-1">
                        <span className="text-5xl font-bold text-[hsl(var(--brand))]">
                          {plan.price}
                        </span>
                        {plan.price !== '0' && (
                          <span className="text-xl text-gray-600">€</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{plan.period}</p>
                      {plan.savings && (
                        <p className="text-xs font-medium text-green-600 mt-2">
                          {plan.savings}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-3 text-sm ${
                            feature.included ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? '' : 'line-through'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() =>
                        plan.highlighted
                          ? handleUpgradeClick()
                          : router.push('/input-method')
                      }
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                        plan.highlighted
                          ? 'bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white shadow-lg hover:shadow-xl hover:scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {plan.cta}
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
      </div>
    </div>
  );
}
