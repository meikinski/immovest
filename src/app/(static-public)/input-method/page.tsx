'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Keyboard, Camera, X, Link as LinkIcon, Sparkles, ChevronDown, ChevronRight, ClipboardPaste, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useImmoStore } from '@/store/useImmoStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsEvents, importDomain, merkeEingabeMethode } from '@/lib/analytics';
import { bereinigeHinweise, pruefeImport } from '@/lib/importPruefung';
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

  // Der Link-Import ist immer sichtbar (Hauptweg), der Foto-Scan klappt auf
  const [fotoOffen, setFotoOffen] = useState(false);

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
    // Allow selecting the same file again
    e.target.value = '';
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

      const { warnings } = result;
      // Fehlende Angaben und Platzhalter bleiben leer und werden auf der ersten Eingabeseite genannt
      const { daten: data, fehlend, unsicher } = pruefeImport({ objekttyp: 'wohnung', ...result.data });

      // Reset form before importing new data
      resetAnalysis();
      localStorage.removeItem('immovest_kpi_state');

      // Import data into store
      importData({
        kaufpreis: data.kaufpreis || 0,
        adresse: data.adresse || '',
        flaeche: data.flaeche || 0,
        zimmer: data.zimmer || 0,
        baujahr: data.baujahr || 0,
        miete: data.miete || 0,
        hausgeld: data.hausgeld || 0,
        hausgeld_umlegbar: data.hausgeld_umlegbar || 0,
        objekttyp: data.objekttyp || 'wohnung',
        importFehlend: fehlend,
        importUnsicher: unsicher,
        importHinweise: bereinigeHinweise(warnings, fehlend, unsicher),
      });

      // Generate analysis ID without saving (user must explicitly save)
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      importData({ analysisId });

      // Track successful import
      merkeEingabeMethode('screenshot');
      track(AnalyticsEvents.AI_IMPORT_COMPLETED, {
        import_method: 'screenshot',
        has_warnings: (warnings && warnings.length > 0) || fehlend.length > 0,
        missing_fields: fehlend.join(',') || 'none',
      });

      // Hinweise stehen dauerhaft oben auf der ersten Eingabeseite, daher ohne Wartezeit weiter
      router.push('/step/a');
    } catch (err) {
      // Track failed import
      track(AnalyticsEvents.AI_IMPORT_FAILED, {
        import_method: 'screenshot',
        error: (err instanceof Error ? err.message : 'Unknown error').slice(0, 100),
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
      import_domain: importDomain(url)
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
        // Prioritize 'details' over 'error' for more specific error messages
        throw new Error(result.details || result.error || 'Die Daten konnten nicht geladen werden. Stelle sicher, dass die URL korrekt ist.');
      }

      // Reset form before importing new data
      resetAnalysis();
      localStorage.removeItem('immovest_kpi_state');

      // Import data into store
      if (result.data) {
        const fehlend = Array.isArray(result.fehlend) ? result.fehlend : [];
        importData({
          ...result.data,
          importFehlend: fehlend,
          importUnsicher: Array.isArray(result.unsicher) ? result.unsicher : [],
          importHinweise: Array.isArray(result.hinweise) ? result.hinweise : [],
        });

        // Generate analysis ID without saving (user must explicitly save)
        const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        importData({ analysisId });

        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          setUrlWarnings(result.warnings);
        }

        // Track successful import
        merkeEingabeMethode('url');
        track(AnalyticsEvents.AI_IMPORT_COMPLETED, {
          import_method: 'url',
          import_domain: importDomain(url),
          has_warnings: (result.warnings?.length ?? 0) > 0 || fehlend.length > 0,
          missing_fields: fehlend.join(',') || 'none',
        });

        router.push('/step/a');
      } else {
        throw new Error('Keine Immobiliendaten in der URL gefunden. Versuche eine andere URL.');
      }
    } catch (err) {
      // Track failed import
      track(AnalyticsEvents.AI_IMPORT_FAILED, {
        import_method: 'url',
        import_domain: importDomain(url),
        error: (err instanceof Error ? err.message : 'Unknown error').slice(0, 100),
      });
      setUrlError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setUrlLoading(false);
    }
  };

  const startManual = () => {
    merkeEingabeMethode('manual');
    resetAnalysis();
    localStorage.removeItem('immovest_kpi_state');
    router.push('/step/a');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setUrlError('');
      }
    } catch {
      // Clipboard not available or permission denied – user can paste manually
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageError('');
    setImageWarnings([]);
  };

  // Aufgeklappten Foto-Bereich in den Blick holen (vor allem auf kleinen Bildschirmen)
  const fotoPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fotoOffen) fotoPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [fotoOffen]);

  return (
    <div className="min-h-screen bg-white">
      <Header variant="fixed" />

      <main className="bg-[#f5f5f7] px-4 pb-16 pt-24 sm:px-6 sm:pt-28 md:pb-24 md:pt-32">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center md:mb-10">
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-[#001d3d] sm:text-4xl md:text-5xl">
              Wie möchtest du <span className="text-[#ff6b00]">starten?</span>
            </h1>
            <p className="mx-auto max-w-md text-base text-gray-600 md:text-lg">
              Kennzahlen sofort und ohne Anmeldung.
            </p>
          </div>

          {/* Method List */}
          <div className="space-y-3">
            {/* URL Import: Hauptweg, immer offen */}
            <section
              aria-labelledby="method-url-titel"
              className="overflow-hidden rounded-2xl border border-[#ff6b00] bg-white shadow-sm ring-4 ring-[#ff6b00]/10"
            >
              <div className="flex items-center gap-4 p-4 pb-0 sm:p-5 sm:pb-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff7f0]">
                  <LinkIcon className="h-6 w-6 text-[#ff6b00]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="method-url-titel" className="text-base font-bold text-[#001d3d] sm:text-lg">Link aus dem Portal einfügen</h2>
                    <AiBadge />
                  </div>
                  <p className="text-sm text-gray-600">ImmoScout24, Immowelt, Kleinanzeigen</p>
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                <div className="relative">
                  <input
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (urlError) setUrlError('');
                    }}
                    placeholder="https://www.immobilienscout24.de/expose/..."
                    aria-label="Inserat-URL"
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-4 pr-28 text-base transition-colors focus:border-[#ff6b00] focus:outline-none focus:ring-4 focus:ring-[#ff6b00]/15"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUrlSubmit();
                    }}
                  />
                  <button
                    type="button"
                    onClick={url ? () => { setUrl(''); setUrlError(''); } : handlePaste}
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#ff6b00] hover:bg-[#fff7f0]"
                  >
                    {url ? (
                      <>
                        <X className="h-4 w-4" />
                        <span>Leeren</span>
                      </>
                    ) : (
                      <>
                        <ClipboardPaste className="h-4 w-4" />
                        <span>Einfügen</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={urlLoading || !url.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3.5 font-bold text-white transition-colors hover:bg-[#ff6b00]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {urlLoading ? (
                    <>
                      <Spinner />
                      <span>Analysiere...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Mit KI analysieren</span>
                    </>
                  )}
                </button>

                {/* Fehlgeschlagener Import: der Link bleibt im Feld, zuerst Foto/Screenshot, dann manuelle Eingabe */}
                {urlError && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <p className="whitespace-pre-line">{urlError}</p>
                    <p className="mt-2 font-semibold text-[#001d3d]">Dein Link bleibt im Feld. So kommst du trotzdem weiter:</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setFotoOffen(true)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-4 py-2.5 font-bold text-white transition-colors hover:bg-[#ff6b00]/90"
                      >
                        <Camera className="h-4 w-4" />
                        Foto/Screenshot scannen
                      </button>
                      <button
                        type="button"
                        onClick={startManual}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-bold text-[#001d3d] transition-colors hover:border-[#001d3d]"
                      >
                        <Keyboard className="h-4 w-4" />
                        Manuell eingeben
                      </button>
                    </div>
                  </div>
                )}
                {urlWarnings.length > 0 && <WarningBox warnings={urlWarnings} />}
              </div>
            </section>

            {/* Photo Scan */}
            <div
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${
                fotoOffen ? 'border-[#ff6b00]' : 'border-gray-200 hover:border-[#ff6b00]/50'
              }`}
            >
              <button
                type="button"
                onClick={() => setFotoOffen(v => !v)}
                aria-expanded={fotoOffen}
                aria-controls="method-foto"
                className="flex w-full items-center gap-4 p-4 text-left active:bg-gray-50 sm:p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff7f0]">
                  <Camera className="h-6 w-6 text-[#ff6b00]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-[#001d3d] sm:text-lg">Foto/Screenshot scannen</h2>
                    <AiBadge />
                  </div>
                  <p className="text-sm text-gray-600">Exposé fotografieren oder Screenshot hochladen</p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${fotoOffen ? 'rotate-180 text-[#ff6b00]' : ''}`}
                />
              </button>

              {/* Hidden file inputs (always mounted so refs stay valid) */}
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

              {fotoOffen && (
                <div ref={fotoPanelRef} id="method-foto" className="space-y-3 border-t border-gray-100 p-4 sm:p-5">
                  {!imagePreview ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#ff6b00]/40 px-3 py-6 transition-colors hover:border-[#ff6b00] hover:bg-[#fff7f0] active:bg-[#fff7f0]"
                        >
                          <Camera className="h-7 w-7 text-[#ff6b00]" />
                          <span className="text-sm font-bold text-[#001d3d]">Foto aufnehmen</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-3 py-6 transition-colors hover:border-[#ff6b00] hover:bg-[#fff7f0] active:bg-[#fff7f0]"
                        >
                          <ImageIcon className="h-7 w-7 text-[#ff6b00]" />
                          <span className="text-sm font-bold text-[#001d3d]">Bild hochladen</span>
                        </button>
                      </div>
                      <p className="text-center text-xs text-gray-400">Max. 10 MB · PNG, JPG, WebP</p>
                    </>
                  ) : (
                    <>
                      <div className="relative overflow-hidden rounded-xl bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Vorschau" className="max-h-72 w-full object-contain" />
                        <button
                          type="button"
                          onClick={clearImage}
                          disabled={imageLoading}
                          aria-label="Bild entfernen"
                          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition-colors hover:bg-white hover:text-red-600 disabled:opacity-50"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleImageSubmit}
                        disabled={imageLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3.5 font-bold text-white transition-colors hover:bg-[#ff6b00]/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {imageLoading ? (
                          <>
                            <Spinner />
                            <span>KI analysiert...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>Mit KI analysieren</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {imageError && <ErrorBox message={imageError} />}
                  {imageWarnings.length > 0 && <WarningBox warnings={imageWarnings} />}
                </div>
              )}
            </div>

            {/* Manual Input */}
            <button
              type="button"
              onClick={startManual}
              className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#ff6b00]/50 active:bg-gray-50 sm:p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff7f0]">
                <Keyboard className="h-6 w-6 text-[#ff6b00]" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-[#001d3d] sm:text-lg">Manuelle Eingabe</h2>
                <p className="text-sm text-gray-600">Alle Daten selbst eingeben</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#ff6b00]" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
      <Sparkles className="h-3 w-3" />
      KI
    </span>
  );
}

function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function WarningBox({ warnings }: { warnings: string[] }) {
  return (
    <div className="space-y-1 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
      <p className="font-semibold">⚠️ Hinweise:</p>
      {warnings.map((warning, idx) => (
        <p key={idx}>• {warning}</p>
      ))}
    </div>
  );
}
