'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { usePaywall } from '@/contexts/PaywallContext';
import { getAllAnalyses, SavedAnalysis } from '@/lib/storage';
import { useImmoStore } from '@/store/useImmoStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Crown,
  CreditCard,
  Settings,
  LogOut,
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
  Save,
} from 'lucide-react';

// Separate component for handling search params
function PurchaseTracker() {
  const searchParams = useSearchParams();
  const { trackPurchase } = useAnalytics();
  const { refreshPremiumStatus, isPremium } = usePaywall();
  const purchaseTracked = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  // Store the success params so we can use them even after URL cleanup
  const successRef = useRef<{ success: boolean; sessionId: string | null; plan: string | null }>({
    success: false,
    sessionId: null,
    plan: null,
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const plan = searchParams.get('plan');

    if (success === 'true' && sessionId && plan && !purchaseTracked.current) {
      purchaseTracked.current = true;

      // Store in ref for polling
      successRef.current = { success: true, sessionId, plan };

      // Determine purchase value based on plan
      const value = plan === 'yearly' ? 69 : 13.99;
      const planName = plan === 'yearly' ? 'Jahresabo' : 'Monatsabo';

      // Track the purchase event for GTM/GA4
      trackPurchase(sessionId, value, [
        {
          item_id: plan,
          item_name: planName,
          price: value,
          quantity: 1,
        },
      ]);

      // Show initial loading message
      toast.loading('Aktiviere Premium-Zugang...', { id: 'premium-activation' });
    }
  }, [searchParams, trackPurchase]);

  // Poll for premium status after purchase
  useEffect(() => {
    console.log('[PurchaseTracker] Effect triggered - isPremium:', isPremium, 'retryCount:', retryCount, 'hasSuccess:', successRef.current.success);

    if (successRef.current.success && successRef.current.sessionId && !isPremium && retryCount < 15) {
      // First check is immediate, subsequent checks have delay
      const delay = retryCount === 0 ? 0 : 2000;

      const timer = setTimeout(async () => {
        console.log(`[PurchaseTracker] 🔄 Checking premium status (attempt ${retryCount + 1}/15)`);
        console.log('[PurchaseTracker] Session ID:', successRef.current.sessionId);

        // After 5 failed attempts, try manual verification
        if (retryCount >= 5 && successRef.current.sessionId) {
          console.log('[PurchaseTracker] 🔧 Attempting manual session verification...');
          try {
            const verifyResponse = await fetch('/api/stripe/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: successRef.current.sessionId }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('[PurchaseTracker] Manual verification result:', verifyData);

              if (verifyData.success && verifyData.isPremium) {
                console.log('[PurchaseTracker] ✅ Manual verification successful!');
                // Force refresh premium status
                await refreshPremiumStatus();
                setRetryCount(prev => prev + 1);
                return; // Exit early, let next cycle check isPremium
              }
            }
          } catch (err) {
            console.error('[PurchaseTracker] Manual verification error:', err);
          }
        }

        await refreshPremiumStatus();
        setRetryCount(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (isPremium && successRef.current.success) {
      // Premium status confirmed!
      toast.success('Zahlung erfolgreich! Dein Premium-Zugang wurde aktiviert.', { id: 'premium-activation' });
      console.log('[PurchaseTracker] ✅ Premium status confirmed after', retryCount, 'attempts');

      // Clear URL parameters after success
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      // Clear ref
      successRef.current = { success: false, sessionId: null, plan: null };
    } else if (retryCount >= 15 && !isPremium && successRef.current.success) {
      // Failed to get premium status after retries
      console.error('[PurchaseTracker] ❌ Failed after 15 retries');
      console.error('[PurchaseTracker] Session ID:', successRef.current.sessionId);

      toast.error('Premium-Aktivierung verzögert. Die Zahlung war erfolgreich, aber die Aktivierung dauert länger. Bitte lade die Seite in 1-2 Minuten neu.', {
        id: 'premium-activation',
        duration: 10000
      });

      // Clear URL parameters even on failure
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [isPremium, retryCount, refreshPremiumStatus]);

  return null;
}

function ProfileContent() {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { isPremium, premiumUsageCount } = usePaywall();
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const loadAnalysis = useImmoStore((s) => s.loadAnalysis);
  const resetAnalysis = useImmoStore((s) => s.resetAnalysis);

  const loadPremiumDetails = async () => {
    try {
      console.log('[ProfileContent] Loading premium details...');
      const response = await fetch('/api/premium/status');
      if (response.ok) {
        const data = await response.json();
        console.log('[ProfileContent] Premium details:', data);
        setPremiumUntil(data.premiumUntil);
      }
    } catch (error) {
      console.error('[ProfileContent] Error loading premium details:', error);
    }
  };

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
  }, [isLoaded, isSignedIn, userId, isPremium]);

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } else {
        const { error } = await response.json();
        toast.error(error || 'Fehler beim Öffnen des Abrechnungsportals');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast.error('Fehler beim Öffnen des Abrechnungsportals');
    }
  };

  const handleNewAnalysis = () => {
    // Reset all fields to default values
    resetAnalysis();
    router.push('/input-method');
  };

  const handleOpenAnalysis = async (analysisId: string) => {
    const success = await loadAnalysis(analysisId, userId);
    if (success) {
      router.push('/step/tabs');
    } else {
      toast.error('Fehler beim Laden der Analyse');
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <PurchaseTracker />
      </Suspense>
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
            <UserButton afterSignOutUrl="/">
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Profil & Einstellungen"
                  labelIcon={<Save size={16} />}
                  href="/profile"
                />
              </UserButton.MenuItems>
            </UserButton>
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
                    onClick={() => router.push('/pricing')}
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
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
