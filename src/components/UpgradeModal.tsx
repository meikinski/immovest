'use client';

import React, { useState } from 'react';
import { Crown, X, Check, Sparkles, Loader2 } from 'lucide-react';

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  remainingFreeUses: number;
};

export function UpgradeModal({ isOpen, onClose, remainingFreeUses }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Premium freischalten</h2>
              <p className="text-white/80 text-sm">
                {remainingFreeUses > 0
                  ? `Noch ${remainingFreeUses} kostenlose Premium-Analyse${remainingFreeUses > 1 ? 'n' : ''} verfügbar`
                  : 'Deine kostenlosen Premium-Analysen sind aufgebraucht'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Features */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Premium Features:</h3>
            <div className="space-y-3">
              {[
                'Unbegrenzte Markt- & Lageanalysen',
                'KI-gestützte Investitionsempfehlungen',
                'Detaillierte Miet- und Kaufpreisvergleiche',
                'Erweiterte Szenario-Analysen',
                'Prioritäts-Support',
                'PDF-Export mit Premium-Branding',
                'Gespeicherte Analysen ohne Limit',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[hsl(var(--success))]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-[hsl(var(--success))]" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-[hsl(var(--brand))]">19,90 €</span>
              <span className="text-gray-600">/ Monat</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Jederzeit kündbar • Keine versteckten Kosten
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Weiterleitung zu Stripe...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Jetzt Premium werden
                </>
              )}
            </button>
          </div>

          {/* Alternative */}
          {remainingFreeUses > 0 && (
            <div className="text-center">
              <button
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-800 transition"
              >
                Später • Ich nutze meine {remainingFreeUses} kostenlosen Analyse{remainingFreeUses > 1 ? 'n' : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
