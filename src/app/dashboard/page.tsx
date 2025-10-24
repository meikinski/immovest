'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import {
  Home, Plus, FileText, Crown, TrendingUp, Calendar, MapPin,
  BarChart3, ArrowRight, Sparkles, Settings
} from 'lucide-react';
import { getAllAnalyses, SavedAnalysis } from '@/lib/storage';
import { useImmoStore } from '@/store/useImmoStore';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [premiumUsageCount, setPremiumUsageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
      return;
    }

    if (isLoaded) {
      // Load analyses from localStorage
      const loadedAnalyses = getAllAnalyses(userId);
      setAnalyses(loadedAnalyses);

      // Load premium usage
      const storedUsage = localStorage.getItem(userId ? `premium_usage_${userId}` : 'guest_premium_usage');
      if (storedUsage) {
        setPremiumUsageCount(parseInt(storedUsage, 10));
      }

      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, userId, router]);

  const handleNewAnalysis = () => {
    router.push('/input-method');
  };

  const loadAnalysis = useImmoStore((s) => s.loadAnalysis);

  const handleOpenAnalysis = async (analysisId: string) => {
    // Load analysis into store (pass userId from Clerk)
    const success = await loadAnalysis(analysisId, userId);

    if (success) {
      router.push('/step/tabs');
    } else {
      alert('Fehler beim Laden der Analyse');
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[hsl(var(--brand))] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  const isPremium = false; // TODO: Check from user metadata
  const freeUsagesRemaining = Math.max(0, 2 - premiumUsageCount);

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <div className="w-10 h-10 bg-[hsl(var(--brand))] rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[hsl(var(--brand))]">ImmoVest</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleNewAnalysis}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Neue Analyse
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Profil & Einstellungen"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Verwalte deine Immobilien-Analysen</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Premium Status */}
          <div className="card p-6 border-2 border-[hsl(var(--brand-2))]/20">
            <div className="flex items-center justify-between mb-3">
              <Crown className={`w-6 h-6 ${isPremium ? 'text-yellow-500' : 'text-gray-400'}`} />
              {isPremium ? (
                <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-semibold rounded-full">
                  Premium
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                  Free
                </span>
              )}
            </div>
            <h3 className="font-semibold mb-1">Account-Status</h3>
            {!isPremium && (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  {freeUsagesRemaining} von 2 Premium-Analysen verfügbar
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full btn-secondary text-sm py-2"
                >
                  Upgrade auf Premium
                </button>
              </>
            )}
            {isPremium && (
              <p className="text-sm text-gray-600">
                Unbegrenzte Premium-Analysen
              </p>
            )}
          </div>

          {/* Total Analyses */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[hsl(var(--brand))]/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-[hsl(var(--brand))]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analyses.length}</p>
                <p className="text-sm text-gray-600">Gespeicherte Analysen</p>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <div className="card p-6 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white">
            <Sparkles className="w-6 h-6 mb-3" />
            <h3 className="font-semibold mb-2">Schnellstart</h3>
            <p className="text-sm mb-3 opacity-90">
              Analysiere eine neue Immobilie in wenigen Minuten
            </p>
            <button
              onClick={handleNewAnalysis}
              className="w-full bg-white text-[hsl(var(--brand))] py-2 rounded-lg font-medium hover:bg-opacity-90 transition"
            >
              Jetzt starten
            </button>
          </div>
        </div>

        {/* Saved Analyses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Meine Analysen
            </h2>
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
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Erste Analyse erstellen
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
}
