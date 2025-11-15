'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--bg))] to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-[120px] md:text-[180px] font-bold text-[hsl(var(--brand))] opacity-20 leading-none">
            404
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Seite nicht gefunden
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Die angeforderte Seite existiert leider nicht oder wurde verschoben.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[hsl(var(--brand))] text-[hsl(var(--brand))] rounded-lg hover:bg-[hsl(var(--brand))] hover:text-white transition-all duration-200 font-medium min-w-[200px] justify-center"
          >
            <ArrowLeft size={20} />
            Zurück
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--brand))] text-white rounded-lg hover:bg-[hsl(var(--brand))]/90 transition-all duration-200 font-medium min-w-[200px] justify-center"
          >
            <Home size={20} />
            Zur Startseite
          </button>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Beliebte Seiten
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/pricing"
              className="px-4 py-2 text-sm text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/10 rounded-lg transition-colors"
            >
              Preise
            </a>
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/10 rounded-lg transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/impressum"
              className="px-4 py-2 text-sm text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/10 rounded-lg transition-colors"
            >
              Impressum
            </a>
            <a
              href="/datenschutz"
              className="px-4 py-2 text-sm text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/10 rounded-lg transition-colors"
            >
              Datenschutz
            </a>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            Benötigen Sie Hilfe?{' '}
            <a
              href="mailto:info@imvestr.de"
              className="text-[hsl(var(--brand))] hover:underline"
            >
              Kontaktieren Sie uns
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
