'use client';

import React, { useState } from 'react';
import { Crown, X, Sparkles, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpsellBannerProps {
  onDismiss?: () => void;
  remainingFreeUses: number;
}

export function UpsellBanner({ onDismiss, remainingFreeUses }: UpsellBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  if (!isVisible) return null;

  // Only show after 2nd premium usage (when remainingFreeUses = 0)
  if (remainingFreeUses !== 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 animate-slide-up">
      <div className="relative overflow-hidden rounded-2xl border-2 border-[hsl(var(--brand))] bg-gradient-to-br from-white via-[hsl(var(--brand))]/5 to-[hsl(var(--brand-2))]/10 shadow-2xl backdrop-blur-sm">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand))]/10 via-transparent to-[hsl(var(--brand-2))]/10 animate-pulse"></div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Banner schließen"
        >
          <X size={18} className="text-gray-600" />
        </button>

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-yellow-300" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[hsl(var(--brand))]" />
                <span className="text-sm font-semibold text-[hsl(var(--brand))] uppercase tracking-wide">
                  Noch 1 Premium-Analyse frei!
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">
                Sichere dir jetzt unbegrenzten Zugang
              </h3>

              <p className="text-gray-600 mb-1">
                Du hast bereits 2 Premium-Analysen genutzt – Überzeuge dich selbst von der Qualität!
              </p>

              <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                <span className="text-gray-500 line-through">167,88 €</span>
                <span className="text-2xl font-bold text-[hsl(var(--brand))]">69 €</span>
                <span className="text-gray-600">/ Jahr</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Spare 59%
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
              <button
                onClick={handleUpgrade}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
              >
                <TrendingUp size={18} />
                Jahresabo wählen
              </button>

              <button
                onClick={handleDismiss}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Später entscheiden
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              ✓ Unbegrenzte Analysen
            </span>
            <span className="flex items-center gap-1">
              ✓ Nur 5,75 € / Monat
            </span>
            <span className="flex items-center gap-1">
              ✓ Jederzeit kündbar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
