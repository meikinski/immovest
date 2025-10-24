'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { usePaywall } from '@/contexts/PaywallContext';
import {
  User,
  Crown,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { isPremium, premiumUsageCount, canAccessPremium, refreshPremiumStatus } =
    usePaywall();
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
      return;
    }

    if (isSignedIn) {
      loadPremiumDetails();
    }
  }, [isLoaded, isSignedIn, router]);

  const loadPremiumDetails = async () => {
    try {
      const response = await fetch('/api/premium/status');
      if (response.ok) {
        const data = await response.json();
        setPremiumUntil(data.premiumUntil);
      }
    } catch (error) {
      console.error('Error loading premium details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    // TODO: Create Stripe customer portal session
    alert(
      'Stripe Customer Portal Integration folgt. Hier können Sie Ihr Abo verwalten.'
    );
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--brand))]"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--bg))] to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil & Einstellungen</h1>
                <p className="text-sm text-gray-600">
                  Verwalte dein Konto und deine Einstellungen
                </p>
              </div>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Premium Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div
              className={`p-6 ${
                isPremium
                  ? 'bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      isPremium ? 'bg-white/20' : 'bg-gray-200'
                    }`}
                  >
                    <Crown
                      size={32}
                      className={isPremium ? 'text-yellow-300' : 'text-gray-400'}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">
                      {isPremium ? 'Premium Mitglied' : 'Kostenloser Plan'}
                    </h2>
                    {isPremium && premiumUntil ? (
                      <p className={isPremium ? 'text-white/80' : 'text-gray-600'}>
                        Aktiv bis{' '}
                        {new Date(premiumUntil).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    ) : (
                      <p className="text-gray-600">
                        {2 - premiumUsageCount} kostenlose Premium-Analysen verfügbar
                      </p>
                    )}
                  </div>
                </div>

                {isPremium ? (
                  <button
                    onClick={handleManageSubscription}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                  >
                    <CreditCard size={18} />
                    Abo verwalten
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-[hsl(var(--brand))] text-white rounded-lg hover:bg-[hsl(var(--brand-2))] transition flex items-center gap-2"
                  >
                    <Sparkles size={18} />
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            {/* Premium Features */}
            {!isPremium && (
              <div className="p-6 border-t border-gray-200">
                <h3 className="font-semibold mb-4">Mit Premium erhältst du:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Unbegrenzte Markt- & Lageanalysen',
                    'KI-gestützte Investitionsempfehlungen',
                    'Erweiterte Szenario-Analysen',
                    'Premium-Support',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2
                        size={16}
                        className="text-[hsl(var(--success))] flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Usage Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Settings size={20} />
              Nutzungsstatistik
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">Premium-Zugriffe (gesamt)</span>
                <span className="font-semibold text-[hsl(var(--brand))]">
                  {premiumUsageCount}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">Verbleibende kostenlose Zugriffe</span>
                <span className="font-semibold text-[hsl(var(--brand))]">
                  {isPremium ? '∞' : Math.max(0, 2 - premiumUsageCount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-700">Premium-Status</span>
                <div className="flex items-center gap-2">
                  {isPremium ? (
                    <>
                      <CheckCircle2 size={18} className="text-[hsl(var(--success))]" />
                      <span className="font-semibold text-[hsl(var(--success))]">
                        Aktiv
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} className="text-gray-400" />
                      <span className="font-semibold text-gray-600">Inaktiv</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <User size={20} />
              Account-Einstellungen
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User size={18} className="text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Meine Analysen</p>
                    <p className="text-sm text-gray-600">
                      Gespeicherte Immobilien-Analysen
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2 text-red-900">Gefahrenzone</h3>
            <p className="text-sm text-red-700 mb-4">
              Diese Aktionen können nicht rückgängig gemacht werden.
            </p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
              <LogOut size={18} />
              Account löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
