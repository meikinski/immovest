'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Keyboard, Camera, X, ArrowRight, CheckCircle2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthUI } from '@/components/AuthUI';
import { useImmoStore } from '@/store/useImmoStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsEvents } from '@/lib/analytics';

export default function InputMethodPage() {
  const router = useRouter();
  const { track } = useAnalytics();
  const importData = useImmoStore(s => s.importData);
  const resetAnalysis = useImmoStore(s => s.resetAnalysis);

  // Screenshot State
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageWarnings, setImageWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // URL Import State
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [urlWarnings, setUrlWarnings] = useState<string[]>([]);

  // Reset form when component mounts (user starts new input)
  useEffect(() => {
    resetAnalysis();
    // Clear localStorage to prevent persistence hook from reloading old data
    localStorage.removeItem('immovest_kpi_state');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Bitte wähle eine Bilddatei aus');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError('Bild ist zu groß (max. 10 MB)');
      return;
    }

    setImage(file);
    setImageError('');
    setImageWarnings([]);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleImageSubmit = async () => {
    if (!image) {
      setImageError('Bitte wähle ein Bild aus');
      return;
    }

    // Track AI Import Started
    track(AnalyticsEvents.AI_IMPORT_STARTED, { import_method: 'screenshot' });

    setImageLoading(true);
    setImageError('');
    setImageWarnings([]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);

      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      const response = await fetch('/api/extract-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMsg = result.error || 'Bildanalyse fehlgeschlagen. Bitte versuche es mit einem klareren Bild.';
        if (result.hint) {
          errorMsg += ' ' + result.hint;
        }
        throw new Error(errorMsg);
      }

      const { data, warnings } = result;

      // Reset form before importing new data
      resetAnalysis();
      localStorage.removeItem('immovest_kpi_state');

      // Import data into store
      importData({
        kaufpreis: data.kaufpreis || 0,
        adresse: data.adresse || '',
        flaeche: data.flaeche || 0,
        zimmer: data.zimmer || 0,
        baujahr: data.baujahr || new Date().getFullYear(),
        miete: data.miete || 0,
        hausgeld: data.hausgeld || 0,
        hausgeld_umlegbar: data.hausgeld_umlegbar || 0,
        objekttyp: data.objekttyp || 'wohnung',
      });

      // Generate analysis ID without saving (user must explicitly save)
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      importData({ analysisId });

      // Track successful import
      track(AnalyticsEvents.AI_IMPORT_COMPLETED, {
        import_method: 'screenshot',
        has_warnings: warnings && warnings.length > 0,
      });

      // Show warnings if any
      if (warnings && warnings.length > 0) {
        setImageWarnings(warnings);
        // Give user time to see warnings before navigating
        setTimeout(() => router.push('/step/a'), 2000);
      } else {
        router.push('/step/a');
      }
    } catch (err) {
      // Track failed import
      track(AnalyticsEvents.AI_IMPORT_FAILED, {
        import_method: 'screenshot',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setImageError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setImageLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      setUrlError('Bitte gib eine URL ein');
      return;
    }

    // Track AI Import Started
    track(AnalyticsEvents.AI_IMPORT_STARTED, { import_method: 'url' });

    setUrlLoading(true);
    setUrlError('');
    setUrlWarnings([]);

    try {
      const response = await fetch('/api/scrape-with-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Die Daten konnten nicht geladen werden. Stelle sicher, dass die URL korrekt ist.');
      }

      // Reset form before importing new data
      resetAnalysis();
      localStorage.removeItem('immovest_kpi_state');

      // Import data into store
      if (result.data) {
        importData(result.data);

        // Generate analysis ID without saving (user must explicitly save)
        const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        importData({ analysisId });

        // Show warnings if any
        if (result.warnings.length > 0) {
          setUrlWarnings(result.warnings);
        }

        // Track successful import
        track(AnalyticsEvents.AI_IMPORT_COMPLETED, {
          import_method: 'url',
          has_warnings: result.warnings.length > 0,
        });

        router.push('/step/a');
      } else {
        throw new Error('Keine Immobiliendaten in der URL gefunden. Versuche eine andere URL.');
      }
    } catch (err) {
      // Track failed import
      track(AnalyticsEvents.AI_IMPORT_FAILED, {
        import_method: 'url',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setUrlError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setUrlLoading(false);
    }
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
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1"
          >
            <div className="w-12 h-12 relative">
              <Image
                src="/logo.png"
                alt="imvestr Logo"
                width={48}
                height={48}
                className="rounded-lg"
                priority
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">
              imvestr
            </span>
          </button>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <AuthUI variant="light" />
          </div>
        </div>
      </header>

      {/* Main Content with gradient background */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand))]/5 via-white to-[hsl(var(--brand-2))]/5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[hsl(var(--brand))]/10 to-transparent rounded-full blur-3xl"></div>

        <div className="relative max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                Wie möchtest du starten?
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Wähle deine bevorzugte Methode für den Datenimport
            </p>
          </div>

          {/* Section Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Deine Eingabemethoden
            </h2>
            <p className="text-base text-gray-600">
              Flexibel, schnell und auf deine Bedürfnisse zugeschnitten
            </p>
          </div>

          {/* Method Cards - 3 Column Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Manual Input - FIRST - Solid Navy Blue */}
            <div className="relative bg-gradient-to-br from-white to-[hsl(var(--brand))]/10 rounded-3xl border-2 border-[hsl(var(--brand))]/20 p-6 md:p-8 hover:border-[hsl(var(--brand))]/30 hover:shadow-xl transition-all">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[hsl(var(--brand))] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Keyboard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[hsl(var(--brand))] mb-2">
                  Manuelle Eingabe
                </h3>
                <p className="text-gray-600">
                  Gib alle Daten selbst ein – volle Kontrolle
                </p>
              </div>

              <button
                onClick={() => {
                  resetAnalysis();
                  localStorage.removeItem('immovest_kpi_state');
                  router.push('/step/a');
                }}
                className="w-full py-4 bg-[hsl(var(--brand))] text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-[hsl(var(--brand))]/20 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Jetzt eingeben</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Benefits */}
              <div className="mt-6 space-y-2">
                {['Volle Kontrolle über Eingabe', 'Funktioniert immer', 'Perfekt für eigene Daten'].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--brand))]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* URL Import with AI - SECOND - Full Gradient Theme */}
            <div className="relative bg-gradient-to-br from-[hsl(var(--brand))]/10 via-[hsl(var(--brand-2))]/10 to-white rounded-3xl border-2 border-[hsl(var(--brand))]/20 p-6 md:p-8 shadow-xl">
              {/* KI Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-sm font-semibold rounded-full shadow-lg flex items-center gap-1">
                <Sparkles size={14} />
                <span>KI-Power</span>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <LinkIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent mb-2">
                  URL Import
                </h3>
                <p className="text-gray-600">
                  KI analysiert automatisch die Immobilien-Anzeige
                </p>
              </div>

              {/* URL Input */}
              <div className="space-y-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.immobilienscout24.de/..."
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--brand))]/20 rounded-xl focus:border-[hsl(var(--brand))] focus:outline-none transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlSubmit();
                  }}
                />

                <button
                  onClick={handleUrlSubmit}
                  disabled={urlLoading || !url.trim()}
                  className="w-full py-4 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-[hsl(var(--brand))]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {urlLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analysiere...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>Mit KI analysieren</span>
                    </>
                  )}
                </button>

                {urlError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {urlError}
                  </div>
                )}

                {urlWarnings.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-xs space-y-1">
                    <p className="font-semibold">⚠️ Hinweise:</p>
                    {urlWarnings.map((warning, idx) => (
                      <p key={idx}>• {warning}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="mt-6 space-y-2">
                {['Umgeht CloudFront-Blockierung', 'Funktioniert mit allen Portalen', 'KI extrahiert alle Daten'].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--brand))]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Foto machen - THIRD - Solid Orange */}
            <div className="relative bg-gradient-to-br from-white to-[hsl(var(--brand-2))]/10 rounded-3xl border-2 border-[hsl(var(--brand-2))]/30 p-6 md:p-8 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[hsl(var(--brand-2))] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[hsl(var(--brand-2))] mb-2">
                  Foto machen
                </h3>
                <p className="text-gray-600">
                  Mach ein Foto der Anzeige – KI extrahiert automatisch alle Daten
                </p>
              </div>

              {/* Camera Access Only */}
              {!imagePreview ? (
                <div className="text-center">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-16 border-2 border-dashed border-[hsl(var(--brand-2))]/40 rounded-2xl bg-white hover:border-[hsl(var(--brand-2))] hover:bg-[hsl(var(--brand-2))]/5 transition-all"
                  >
                    <Camera className="w-16 h-16 text-[hsl(var(--brand-2))] mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Foto aufnehmen
                    </p>
                    <p className="text-sm text-gray-500">
                      Klicken um Kamera zu öffnen
                    </p>
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <p className="text-xs text-gray-400 mt-4">
                    Max. 10 MB • PNG, JPG, WebP
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                        setImageError('');
                        setImageWarnings([]);
                      }}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {imageError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {imageError}
                    </div>
                  )}

                  {imageWarnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-xs space-y-1">
                      <p className="font-semibold">⚠️ Hinweise:</p>
                      {imageWarnings.map((warning, idx) => (
                        <p key={idx}>• {warning}</p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleImageSubmit}
                    disabled={imageLoading}
                    className="w-full py-4 bg-[hsl(var(--brand-2))] text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-[hsl(var(--brand-2))]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {imageLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>KI analysiert Bild...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight size={20} />
                        <span>Daten extrahieren</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Benefits */}
              <div className="mt-6 space-y-2">
                {['100% zuverlässig', 'Funktioniert mit allen Portalen', 'Sekunden-schnell'].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--brand-2))]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              💡 <strong>Tipp:</strong> Foto machen oder URL Import mit KI – beide Methoden sind schneller als manuelle Eingabe!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
