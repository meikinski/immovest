'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth, useUser, SignInButton, UserButton } from '@clerk/nextjs';

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const handleGetStarted = () => {
    router.push('/input-method');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Clean & Minimal with gradient background */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand))]/5 via-[hsl(var(--brand-2))]/5 to-transparent backdrop-blur-lg"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand))]/20 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-lg flex items-center justify-center shadow-lg shadow-[hsl(var(--brand))]/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">
              ImmoVest
            </span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <SignInButton
                mode="modal"
                forceRedirectUrl="/input-method"
                fallbackRedirectUrl="/input-method"
              >
                <button className="text-sm font-medium text-gray-700 hover:text-[hsl(var(--brand))] transition">
                  Anmelden
                </button>
              </SignInButton>
            ) : (
              <UserButton afterSignOutUrl="/" />
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Modern & Clean with gradient background */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand))]/5 via-white to-[hsl(var(--brand-2))]/5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[hsl(var(--brand))]/10 to-transparent rounded-full blur-3xl"></div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--brand))]/5 border border-[hsl(var(--brand))]/10 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-[hsl(var(--brand))]" />
            <span className="text-sm font-medium text-[hsl(var(--brand))]">
              KI-gestützte Immobilienanalyse
            </span>
          </div>

          {/* Welcome Message for Logged In Users */}
          {isSignedIn && user?.firstName && (
            <p className="text-xl text-gray-700 mb-6">
              Willkommen zurück, {user.firstName}!
            </p>
          )}

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
            Investiere smarter<br />in Immobilien
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Analysiere Renditen und Marktpreise in Sekunden. Fundierte Entscheidungen durch KI-Power.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {isSignedIn ? (
              <>
                {/* Logged In: Primary CTA */}
                <button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-[hsl(var(--brand))]/20 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  Jetzt Immobilie bewerten
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                {/* Logged In: Secondary CTA */}
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-[hsl(var(--brand))] hover:text-[hsl(var(--brand))] transition-all duration-300"
                >
                  Profil & Einstellungen
                </button>
              </>
            ) : (
              <>
                {/* Not Logged In: Primary CTA */}
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-[hsl(var(--brand))]/20 transition-all duration-300 flex items-center justify-center gap-2 group">
                    Einloggen/Anmelden
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
                {/* Not Logged In: Secondary CTA */}
                <button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-[hsl(var(--brand))] hover:text-[hsl(var(--brand))] transition-all duration-300"
                >
                  Als Gast testen
                </button>
              </>
            )}
          </div>

          {/* Login Benefits */}
          {!isSignedIn && (
            <div className="flex flex-col items-center justify-center gap-3 text-sm text-gray-600">
              <div className="flex items-start gap-2 max-w-xl">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                <p>
                  Mit kostenlosem Account: Analysen speichern und unbegrenzter Zugriff auf alle Features.
                </p>
              </div>
              <div className="flex items-start gap-2 max-w-xl">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                <p>
                  Starte ohne Kreditkarte mit 2 Premium-Analysen gratis.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Minimal */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Alles was du brauchst
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professionelle Immobilienanalyse in Sekunden
            </p>
          </div>

          {/* Feature Grid - 3 Columns */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '📊',
                title: 'KPI-Analyse',
                description: 'Cashflow, Rendite, DSCR – alle wichtigen Kennzahlen sofort',
              },
              {
                icon: '🤖',
                title: 'Marktdaten',
                description: 'Automatische Bewertung von Lage und Marktpreisen',
              },
              {
                icon: '📄',
                title: 'PDF Export',
                description: 'Professioneller Report – perfekte Vorbereitung fürs Bankgespräch',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-[hsl(var(--brand))]/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-[hsl(var(--brand))] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Final Push */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-3xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Bereit für deine erste Analyse?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Starte jetzt kostenlos und analysiere Immobilien wie ein Profi
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-[hsl(var(--brand))] font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-2 group"
            >
              Jetzt loslegen
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ImmoVest. Made with ❤️ for smarter investments.</p>
        </div>
      </footer>
    </div>
  );
}
