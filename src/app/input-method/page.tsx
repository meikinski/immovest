'use client';

import React, { useState } from 'react';
import { Keyboard, Link2, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useImmoStore } from '@/store/useImmoStore';

export default function InputMethodPage() {
  const router = useRouter();
  const importData = useImmoStore(s => s.importData);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      setError('Bitte gib eine URL ein');
      return;
    }

    // Validiere URL-Format
    try {
      new URL(url);
    } catch {
      setError('Ungültige URL. Bitte überprüfe das Format.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Scraping fehlgeschlagen');
      }

      const { data } = await response.json();

      // Daten in Store importieren
      importData({
        kaufpreis: data.kaufpreis || 0,
        adresse: data.adresse || '',
        flaeche: data.flaeche || 0,
        zimmer: data.zimmer || 0,
        baujahr: data.baujahr || new Date().getFullYear(),
        miete: data.miete || 0,
        hausgeld: data.hausgeld || 0,
        makler_pct: data.makler_pct || 0,
      });
      
      // Weiterleitung zu Step A
      router.push('/step/a');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Wie möchtest du starten?</h1>
          <p className="text-gray-600">
            Wähle, wie du die Objektdaten eingeben möchtest
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Manual Input */}
          <button
            onClick={() => router.push('/step/a')}
            className="card p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group text-left border-2 border-transparent hover:border-[hsl(var(--brand))]/20"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[hsl(var(--brand))]/10 rounded-xl flex items-center justify-center group-hover:bg-[hsl(var(--brand))]/20 transition-colors">
                <Keyboard className="w-6 h-6 text-[hsl(var(--brand))]" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[hsl(var(--brand))] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Manuelle Eingabe</h3>
            <p className="text-sm text-gray-600">
              Gib alle Daten selbst ein – volle Kontrolle über jedes Detail
            </p>
          </button>

          {/* URL Import */}
          <div className="card p-8 border-2 border-[hsl(var(--brand-2))]/20 hover:shadow-xl hover:border-[hsl(var(--brand-2))]/40 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[hsl(var(--brand-2))]/10 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6 text-[hsl(var(--brand-2))]" />
              </div>
              <span className="px-2 py-1 bg-[hsl(var(--brand-2))]/10 text-[hsl(var(--brand-2))] text-xs font-semibold rounded-full">
                KI-gestützt
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Per URL importieren</h3>
            <p className="text-sm text-gray-600 mb-4">
              Füge einen Link zu ImmobilienScout24, Immowelt o.ä. ein
            </p>

            {/* URL Input */}
            <div className="space-y-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://www.immobilienscout24.de/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[hsl(var(--brand-2))] focus:ring-2 focus:ring-[hsl(var(--brand-2))]/20 transition-all text-sm"
                disabled={loading}
              />
              
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleUrlSubmit}
                disabled={loading || !url.trim()}
                className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[hsl(var(--brand-2))] border-t-transparent rounded-full animate-spin" />
                    <span>Analysiere...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Daten importieren</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Unterstützt: ImmobilienScout24, Immowelt, eBay Kleinanzeigen
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="card-gradient p-4 text-center">
          <p className="text-sm text-gray-700">
            💡 <strong>Tipp:</strong> Mit der URL-Funktion sparst du Zeit – wir extrahieren automatisch Kaufpreis, Fläche, Zimmer, Baujahr und mehr.
          </p>
        </div>
      </div>
    </div>
  );
}