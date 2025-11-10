'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPreferences = JSON.parse(cookieConsent);
      setPreferences(savedPreferences);
      applyConsent(savedPreferences);
    }
  }, []);

  const applyConsent = (prefs: CookiePreferences) => {
    // Apply consent to Google Tag Manager
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cookie_consent_update',
        analytics_consent: prefs.analytics ? 'granted' : 'denied',
        marketing_consent: prefs.marketing ? 'granted' : 'denied',
      });
    }

    // If analytics is denied, disable GTM
    if (!prefs.analytics && typeof window !== 'undefined') {
      // Disable Google Analytics
      (window as any)['ga-disable-' + process.env.NEXT_PUBLIC_GTM_ID] = true;
    }
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    applyConsent(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    savePreferences(necessaryOnly);
  };

  const acceptSelected = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {!showSettings ? (
            // Main Banner
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="bg-[hsl(var(--brand))]/10 rounded-full p-3">
                    <Cookie size={32} className="text-[hsl(var(--brand))]" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    🍪 Cookie-Einstellungen
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung
                    auf unserer Website zu bieten. Einige Cookies sind technisch notwendig, während andere
                    uns helfen, unsere Website zu verbessern und relevante Inhalte anzuzeigen.
                  </p>
                  <p className="text-gray-600 text-sm">
                    Weitere Informationen finden Sie in unserer{' '}
                    <a
                      href="/datenschutz"
                      className="text-[hsl(var(--brand))] hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Datenschutzerklärung
                    </a>
                    .
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[200px]">
                  <button
                    onClick={acceptAll}
                    className="px-6 py-3 bg-[hsl(var(--brand))] text-white rounded-lg hover:bg-[hsl(var(--brand))]/90 transition-all duration-200 font-medium text-sm whitespace-nowrap"
                  >
                    Alle akzeptieren
                  </button>
                  <button
                    onClick={acceptNecessary}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium text-sm whitespace-nowrap"
                  >
                    Nur notwendige
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-6 py-3 bg-white border-2 border-[hsl(var(--brand))] text-[hsl(var(--brand))] rounded-lg hover:bg-[hsl(var(--brand))]/5 transition-all duration-200 font-medium text-sm whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <Settings size={16} />
                    Einstellungen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Cookie-Einstellungen anpassen
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Schließen"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Necessary Cookies */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">Notwendige Cookies</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Immer aktiv
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht
                      deaktiviert werden. Sie werden in der Regel nur als Reaktion auf Ihre Aktionen gesetzt,
                      wie z.B. das Festlegen von Datenschutzeinstellungen oder das Ausfüllen von Formularen.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[hsl(var(--brand))] cursor-not-allowed"
                  />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Analyse-Cookies</h3>
                    <p className="text-sm text-gray-600">
                      Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren,
                      indem sie Informationen anonym sammeln und melden. Wir verwenden Google Analytics zur
                      Analyse des Nutzerverhaltens.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))] cursor-pointer"
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Marketing-Cookies</h3>
                    <p className="text-sm text-gray-600">
                      Diese Cookies werden verwendet, um Ihnen relevante Werbung und Marketing-Kampagnen
                      anzuzeigen. Sie werden auch verwendet, um die Effektivität von Werbekampagnen zu messen.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))] cursor-pointer"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={acceptSelected}
                  className="flex-1 px-6 py-3 bg-[hsl(var(--brand))] text-white rounded-lg hover:bg-[hsl(var(--brand))]/90 transition-all duration-200 font-medium"
                >
                  Auswahl speichern
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 px-6 py-3 bg-white border-2 border-[hsl(var(--brand))] text-[hsl(var(--brand))] rounded-lg hover:bg-[hsl(var(--brand))]/5 transition-all duration-200 font-medium"
                >
                  Alle akzeptieren
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
