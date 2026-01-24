'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Keyboard, Camera, X, ArrowRight, CheckCircle2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useImmoStore } from '@/store/useImmoStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsEvents } from '@/lib/analytics';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

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

  // Scroll State for Header
  const [isScrolled, setIsScrolled] = useState(false);

  // Reset form when component mounts (user starts new input)
  useEffect(() => {
    resetAnalysis();
    // Clear localStorage to prevent persistence hook from reloading old data
    localStorage.removeItem('immovest_kpi_state');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    track(AnalyticsEvents.AI_IMPORT_STARTED, {
      import_method: 'url',
      import_url: url.trim()
    });

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
          import_url: url.trim(),
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
        import_url: url.trim(),
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setUrlError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header variant="fixed" />

      {/* Main Content */}
      <div className="relative pt-32 pb-20 px-6 bg-[#f5f5f7]">
        <div className="relative max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tighter text-[#001d3d]">
              Wie möchtest du <span className="text-[#ff6b00]">starten?</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Drei smarte Wege, um deine Immobilien-Daten in Sekunden zu erfassen
            </p>
          </div>

          {/* Method Cards - 3 Column Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Manual Input - FIRST */}
            <div className="relative bg-white rounded-[32px] border border-gray-100 p-8 md:p-10 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Keyboard className="w-8 h-8 text-[#ff6b00]" />
                </div>
                <h3 className="text-2xl font-bold text-[#001d3d] mb-3">
                  Manuelle Eingabe
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Gib alle Daten selbst ein – volle Kontrolle über jedes Detail
                </p>
              </div>

              <button
                onClick={() => {
                  resetAnalysis();
                  localStorage.removeItem('immovest_kpi_state');
                  router.push('/step/a');
                }}
                className="w-full py-4 bg-[#ff6b00] text-white font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Jetzt starten</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Benefits */}
              <div className="mt-6 space-y-2">
                {['Volle Kontrolle über Eingabe', 'Funktioniert immer', 'Perfekt für eigene Daten'].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* URL Import with AI - SECOND */}
            <div className="relative bg-white rounded-[32px] border border-gray-100 p-8 md:p-10 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              {/* KI Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#ff6b00] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                <Sparkles size={16} />
                <span>KI-Power</span>
              </div>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <LinkIcon className="w-8 h-8 text-[#ff6b00]" />
                </div>
                <h3 className="text-2xl font-bold text-[#001d3d] mb-3">
                  URL Import
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Kopiere einfach den Link von ImmoScout24, Immowelt oder anderen Portalen
                </p>
              </div>

              {/* URL Input */}
              <div className="space-y-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.immobilienscout24.de/..."
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#ff6b00] focus:outline-none focus:ring-4 focus:ring-[#ff6b00]/15 transition-all hover:border-gray-300"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlSubmit();
                  }}
                />

                <button
                  onClick={handleUrlSubmit}
                  disabled={urlLoading || !url.trim()}
                  className="w-full py-4 bg-[#ff6b00] text-white font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {['Umgeht CloudFront-Blockierung', 'Funktioniert mit den meisten Portalen', 'KI extrahiert alle Daten'].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Foto machen - THIRD */}
            <div className="relative bg-white rounded-[32px] border border-gray-100 p-8 md:p-10 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              {/* KI Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#ff6b00] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                <Sparkles size={16} />
                <span>KI-Power</span>
              </div>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Camera className="w-8 h-8 text-[#ff6b00]" />
                </div>
                <h3 className="text-2xl font-bold text-[#001d3d] mb-3">
                  Foto scannen
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Fotografiere das Exposé mit deinem Smartphone
                </p>
              </div>

              {/* Camera Access Only */}
              {!imagePreview ? (
                <div className="text-center">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-16 border-2 border-dashed border-[#ff6b00]/40 rounded-3xl bg-white hover:border-[#ff6b00] hover:bg-orange-50 transition-all"
                  >
                    <Camera className="w-16 h-16 text-[#ff6b00] mx-auto mb-4" />
                    <p className="text-lg font-bold text-gray-900 mb-2">
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
                    className="w-full py-4 bg-[#ff6b00] text-white font-bold rounded-full hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {imageLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>KI analysiert...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight size={20} />
                        <span>Jetzt analysieren</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Benefits */}
              <div className="mt-6 space-y-2">
                {['100% zuverlässig', 'Funktioniert mit allen Portalen', 'Sekunden-schnell'].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[#ff6b00]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center px-6 py-4 bg-orange-50 rounded-3xl border border-orange-100">
            <p className="text-sm text-gray-700 font-medium">
              <span className="text-[#ff6b00] font-bold">Tipp:</span> URL Import und Foto-Scan sind deutlich schneller als manuelle Eingabe
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
