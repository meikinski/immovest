'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, LogIn, UserCircle, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { useAuth, SignInButton } from '@clerk/nextjs';

export default function WelcomePage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleGuestContinue = () => {
    router.push('/input-method');
  };

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/input-method');
    } else {
      router.push('/input-method');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--bg))] to-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[hsl(var(--brand))] rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-[hsl(var(--brand))]">ImmoVest</span>
        </div>

        {!isSignedIn && (
          <SignInButton mode="modal">
            <button className="btn-secondary flex items-center gap-2">
              <LogIn size={18} />
              Anmelden
            </button>
          </SignInButton>
        )}

        {isSignedIn && (
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary flex items-center gap-2"
          >
            <UserCircle size={18} />
            Dashboard
          </button>
        )}
      </header>

      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen px-6 py-20">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-3xl mb-6 shadow-xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[hsl(var(--brand))]">
              Willkommen bei ImmoVest
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4">
              Deine KI-gestützte Immobilien-Investitionsanalyse
            </p>
            <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto">
              Analysiere Renditen, vergleiche Marktpreise und treffe fundierte Investitionsentscheidungen – in Minuten, nicht Tagen.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[hsl(var(--brand))]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-[hsl(var(--brand))]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Rendite-Analyse</h3>
              <p className="text-sm text-gray-600">
                Cashflow, Nettorendite, DSCR und weitere KPIs auf einen Blick
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[hsl(var(--brand-2))]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-[hsl(var(--brand-2))]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">KI-Marktanalyse</h3>
              <p className="text-sm text-gray-600">
                Intelligente Bewertung von Lage, Mietpreisen und Kaufpreisen
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[hsl(var(--accent))]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-[hsl(var(--accent))]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Szenario-Rechner</h3>
              <p className="text-sm text-gray-600">
                Teste verschiedene Parameter und vergleiche Szenarien
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 border-2 border-[hsl(var(--brand))]/20">
              <h2 className="text-2xl font-bold text-center mb-6">
                Bereit, deine erste Immobilie zu analysieren?
              </h2>

              <div className="space-y-4">
                {/* Primary CTA - Get Started */}
                <button
                  onClick={handleGetStarted}
                  className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 hover:shadow-xl transition-all"
                >
                  <Sparkles size={20} />
                  Jetzt starten
                </button>

                {/* Secondary CTA - Continue as Guest */}
                {!isSignedIn && (
                  <button
                    onClick={handleGuestContinue}
                    className="w-full btn-secondary py-4 text-lg flex items-center justify-center gap-3"
                  >
                    Als Gast fortfahren
                  </button>
                )}

                {/* Info Box */}
                <div className="bg-[hsl(var(--brand))]/5 rounded-xl p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[hsl(var(--brand))] mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold mb-1">Kostenlos testen</p>
                      <p>
                        KPI-Analysen sind komplett kostenlos. Premium-Features wie Marktvergleiche
                        kannst du {!isSignedIn ? 'nach Anmeldung' : ''} 2x gratis nutzen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Vertraut von Investoren, Maklern und Immobilien-Enthusiasten</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} ImmoVest. Made with ❤️ for smarter investments.</p>
      </footer>
    </div>
  );
}
