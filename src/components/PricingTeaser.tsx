'use client';

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Pricing Teaser mit Toggle Jährlich/Monatlich
 * Vergleich: Free vs. Pro
 */
export function PricingTeaser() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);

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
        { text: 'Premium Support', included: true },
      ],
      cta: 'Jetzt upgraden',
      highlighted: true,
    },
  ];

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
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

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-sm font-semibold rounded-full shadow-lg">
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
                    ? router.push('/pricing')
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
      </div>
    </div>
  );
}
