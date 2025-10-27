'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { usePaywall } from '@/contexts/PaywallContext';
import { getAllAnalyses, SavedAnalysis } from '@/lib/storage';
import { useImmoStore } from '@/store/useImmoStore';
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
  BarChart3,
  MapPin,
  Calendar,
  FileText,
  Plus,
  ArrowRight,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { isPremium, premiumUsageCount, canAccessPremium, refreshPremiumStatus } =
    usePaywall();
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const loadAnalysis = useImmoStore((s) => s.loadAnalysis);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
      return;
    }

    if (isSignedIn) {
      loadPremiumDetails();
      // Load analyses
      const loadedAnalyses = getAllAnalyses(userId);
      setAnalyses(loadedAnalyses);
    }
  }, [isLoaded, isSignedIn, userId, router]);

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

  const handleNewAnalysis = () => {
    router.push('/input-method');
  };

  const handleOpenAnalysis = async (analysisId: string) => {
    const success = await loadAnalysis(analysisId, userId);
    if (success) {
      router.push('/step/tabs');
    } else {
      alert('Fehler beim Laden der Analyse');
    }
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
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil & Einstellungen</h1>
                <p className="text-sm text-gray-600">
                  Verwalte dein Konto, Analysen und Einstellungen
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

          {/* Saved Analyses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <BarChart3 size={20} />
                Meine Analysen
              </h3>
              <button
                onClick={handleNewAnalysis}
                className="px-4 py-2 bg-[hsl(var(--brand))] text-white rounded-lg hover:bg-[hsl(var(--brand-2))] transition text-sm font-medium flex items-center gap-2"
              >
                <Plus size={16} />
                Neue Analyse
              </button>
            </div>

            {analyses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Noch keine Analysen</h3>
                <p className="text-gray-600 mb-6">
                  Erstelle deine erste Immobilien-Analyse und sie wird hier gespeichert
                </p>
                <button
                  onClick={handleNewAnalysis}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--brand))] text-white rounded-lg hover:bg-[hsl(var(--brand-2))] transition font-medium"
                >
                  <Plus size={18} />
                  Erste Analyse erstellen
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.analysisId}
                    className="border border-gray-200 rounded-xl p-4 hover:border-[hsl(var(--brand))] hover:shadow-md transition cursor-pointer"
                    onClick={() => handleOpenAnalysis(analysis.analysisId)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <MapPin className="w-5 h-5 text-[hsl(var(--brand))]" />
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(analysis.createdAt || Date.now()).toLocaleDateString('de-DE')}
                      </span>
                    </div>

                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {analysis.analysisName || analysis.adresse || 'Unbenannte Analyse'}
                    </h3>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kaufpreis:</span>
                        <span className="font-medium">
                          {(analysis.kaufpreis || 0).toLocaleString('de-DE')} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nettorend.:</span>
                        <span className="font-medium text-[hsl(var(--success))]">
                          {(analysis.nettorendite || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cashflow:</span>
                        <span className={`font-medium ${
                          (analysis.cashflow_operativ || 0) >= 0
                            ? 'text-[hsl(var(--success))]'
                            : 'text-[hsl(var(--danger))]'
                        }`}>
                          {(analysis.cashflow_operativ || 0).toLocaleString('de-DE')} €
                        </span>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 py-2 border border-[hsl(var(--brand))] text-[hsl(var(--brand))] rounded-lg hover:bg-[hsl(var(--brand))] hover:text-white transition">
                      Öffnen
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
