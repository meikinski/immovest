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
      <div className="relative overflow-hidden rounded-3xl border-2 border-orange-200 bg-orange-50 shadow-2xl">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b00] opacity-5 rounded-full -mr-20 -mt-20 blur-3xl" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-orange-100 transition-colors z-10"
          aria-label="Banner schließen"
        >
          <X size={18} className="text-slate-600" />
        </button>

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#ff6b00]" />
                <span className="text-sm font-black text-[#ff6b00] uppercase tracking-wider">
                  Noch 1 Premium-Analyse frei!
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-black mb-2 text-[#001d3d]">
                Sichere dir jetzt unbegrenzten Zugang
              </h3>

              <p className="text-slate-700 mb-2 text-sm leading-relaxed">
                Du hast bereits 2 Premium-Analysen genutzt – Überzeuge dich selbst von der Qualität!
              </p>

              <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                <span className="text-slate-500 line-through">167,88 €</span>
                <span className="text-2xl font-black text-[#ff6b00]">69 €</span>
                <span className="text-slate-700">/ Jahr</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Spare 59%
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
              <button
                onClick={handleUpgrade}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 shadow-lg"
              >
                <TrendingUp size={18} />
                Jahresabo wählen
              </button>

              <button
                onClick={handleDismiss}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium"
              >
                Später entscheiden
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-4 pt-4 border-t border-orange-200 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-700 font-medium">
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
