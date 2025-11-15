'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--bg))] to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl"></div>
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <AlertTriangle size={64} className="text-red-500" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Etwas ist schiefgelaufen
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[hsl(var(--brand))] text-[hsl(var(--brand))] rounded-lg hover:bg-[hsl(var(--brand))] hover:text-white transition-all duration-200 font-medium min-w-[200px] justify-center"
          >
            <RefreshCw size={20} />
            Erneut versuchen
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--brand))] text-white rounded-lg hover:bg-[hsl(var(--brand))]/90 transition-all duration-200 font-medium min-w-[200px] justify-center"
          >
            <Home size={20} />
            Zur Startseite
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Problem bleibt bestehen?
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Versuchen Sie folgende Schritte:
            </p>
            <ul className="list-disc list-inside space-y-1 max-w-md mx-auto text-left">
              <li>Aktualisieren Sie die Seite</li>
              <li>Löschen Sie Ihren Browser-Cache</li>
              <li>Überprüfen Sie Ihre Internetverbindung</li>
              <li>Versuchen Sie es zu einem späteren Zeitpunkt erneut</li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            Wenn das Problem weiterhin besteht,{' '}
            <a
              href="mailto:info@imvestr.de"
              className="text-[hsl(var(--brand))] hover:underline font-medium"
            >
              kontaktieren Sie uns
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
