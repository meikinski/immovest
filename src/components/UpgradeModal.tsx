'use client';

import React, { useState } from 'react';
import { Crown, X, Check, Sparkles, Loader2, Zap } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useAnalytics } from '@/hooks/useAnalytics';

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  remainingFreeUses: number;
};

export function UpgradeModal({ isOpen, onClose, remainingFreeUses }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuth();
  const { trackUpgradeClick } = useAnalytics();

  if (!isOpen) return null;

  const handleSelectPlan = async (priceId: string, planName: string) => {
    if (!userId) {
      setError('Bitte melde dich zuerst an');
      return;
    }

    // Track upgrade click before initiating checkout
    trackUpgradeClick(planName, 'upgrade_modal');

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
          {/* Features - Beide Abos haben die gleichen Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-4">Premium Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Unbegrenzte Markt- & Lageanalysen',
                'KI-gestützte Investitionsempfehlungen',
                'Detaillierte Szenario-Analysen',
                'PDF-Export deiner Analysen',
                'Premium-Support',
                'Gespeicherte Analysen ohne Limit',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-[hsl(var(--success))]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-[hsl(var(--success))]" />
                  </div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Pricing Options */}
          <div className="space-y-4 mb-6">
            {/* Yearly Plan */}
            <div className="relative border-2 border-[hsl(var(--brand))] rounded-xl p-5 bg-gradient-to-br from-[hsl(var(--brand))]/5 to-white">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-[hsl(var(--brand))] text-white text-xs font-semibold rounded-full">
                Spare 59%
              </div>

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[hsl(var(--brand))]/10 rounded-lg flex items-center justify-center">
                    <Crown className="w-5 h-5 text-[hsl(var(--brand))]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Jahresabo</h4>
                    <p className="text-xs text-gray-600">Nur 5,75 € pro Monat</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[hsl(var(--brand))]">69 €</div>
                  <div className="text-xs text-gray-500 line-through">167,88 €</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!, 'yearly')}
                disabled={isLoading}
                className="w-full bg-[hsl(var(--brand))] text-white py-3 rounded-lg font-semibold hover:bg-[hsl(var(--brand-2))] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Jahresabo wählen
                  </>
                )}
              </button>
            </div>

            {/* Monthly Plan */}
            <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Monatsabo</h4>
                    <p className="text-xs text-gray-600">Jederzeit kündbar</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">13,99 €</div>
                  <div className="text-xs text-gray-500">pro Monat</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!, 'monthly')}
                disabled={isLoading}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Monatsabo wählen
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="text-center text-xs text-gray-500 mb-4">
            🔒 Sichere Zahlung via Stripe • 14 Tage Geld-zurück-Garantie
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
