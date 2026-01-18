'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, X, Check, Sparkles, Loader2, Zap } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';

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
  const router = useRouter();

  if (!isOpen) return null;

  const handleSelectPlan = async (priceId: string, planName: string) => {
    if (!userId) {
      // Redirect to sign-in page
      toast.info('Bitte melde dich an, um Premium freizuschalten');
      onClose(); // Close modal first
      router.push('/sign-in');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-slate-100">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#001d3d] to-[#001d3d]/90 text-white p-10 rounded-t-[2.5rem]">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-all"
          >
            <X size={22} />
          </button>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-[#ff6b00] rounded-2xl flex items-center justify-center shadow-lg">
              <Crown className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Premium freischalten</h2>
              <p className="text-white/70 text-sm font-semibold mt-1">
                {remainingFreeUses > 0
                  ? `Noch ${remainingFreeUses} kostenlose Premium-Analyse${remainingFreeUses > 1 ? 'n' : ''} verfügbar`
                  : 'Deine kostenlosen Premium-Analysen sind aufgebraucht'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-10">
          {/* Features */}
          <div className="mb-8">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-5">Premium Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Unbegrenzte Markt- & Lageanalysen',
                'KI-gestützte Investitionsempfehlungen',
                'Detaillierte Szenario-Analysen',
                'PDF-Export deiner Analysen',
                'Premium-Support',
                'Gespeicherte Analysen ohne Limit',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-green-600 font-bold" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Pricing Options */}
          <div className="space-y-5 mb-6">
            {/* Yearly Plan - Recommended */}
            <div className="relative border-2 border-[#ff6b00] rounded-[2rem] p-6 bg-gradient-to-br from-orange-50/50 to-white shadow-lg">
              <div className="absolute -top-3 left-6 px-4 py-1.5 bg-[#ff6b00] text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                Spare 59%
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#ff6b00]/10 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-[#ff6b00]" />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-[#001d3d]">Jahresabo</h4>
                    <p className="text-sm text-slate-600 font-semibold">Nur 5,75 € pro Monat</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-[#ff6b00]">69 €</div>
                  <div className="text-xs text-slate-500 line-through font-semibold">167,88 €</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!, 'yearly')}
                disabled={isLoading}
                className="w-full bg-[#ff6b00] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#ff6b00]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Jahresabo wählen
                  </>
                )}
              </button>
            </div>

            {/* Monthly Plan */}
            <div className="border-2 border-slate-200 rounded-[2rem] p-6 hover:border-slate-300 transition-all bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-[#001d3d]">Monatsabo</h4>
                    <p className="text-sm text-slate-600 font-semibold">Jederzeit kündbar</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-[#001d3d]">13,99 €</div>
                  <div className="text-xs text-slate-500 font-semibold">pro Monat</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!, 'monthly')}
                disabled={isLoading}
                className="w-full bg-[#001d3d] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#001d3d]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Monatsabo wählen
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="text-center text-sm text-slate-500 mb-6 font-semibold">
            🔒 Sichere Zahlung via Stripe • 14 Tage Geld-zurück-Garantie
          </div>

          {/* Alternative */}
          {remainingFreeUses > 0 && (
            <div className="text-center">
              <button
                onClick={onClose}
                className="text-sm text-slate-600 hover:text-slate-800 transition font-semibold"
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
