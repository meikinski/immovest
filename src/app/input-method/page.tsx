'use client';

import React, { useState, useRef } from 'react';
import { Keyboard, Camera, Upload, X, ArrowRight, CheckCircle2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import { useImmoStore } from '@/store/useImmoStore';

export default function InputMethodPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const importData = useImmoStore(s => s.importData);

  // Screenshot State
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // URL Import State
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [urlWarnings, setUrlWarnings] = useState<string[]>([]);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleImageSubmit = async () => {
    if (!image) {
      setImageError('Bitte wähle ein Bild aus');
      return;
    }

    setImageLoading(true);
    setImageError('');

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
        let errorMsg = result.error || 'Bildanalyse fehlgeschlagen';
        if (result.hint) {
          errorMsg += ' ' + result.hint;
        }
        throw new Error(errorMsg);
      }

      const { data } = result;

      importData({
        kaufpreis: data.kaufpreis || 0,
        adresse: data.adresse || '',
        flaeche: data.flaeche || 0,
        zimmer: data.zimmer || 0,
        baujahr: data.baujahr || new Date().getFullYear(),
        miete: data.miete || 0,
        objekttyp: data.objekttyp || 'wohnung',
      });

      router.push('/step/a');
    } catch (err) {
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
        throw new Error(result.error || result.details || 'Fehler beim Laden der Daten');
      }

      // Import data into store
      if (result.data) {
        importData(result.data);

        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          setUrlWarnings(result.warnings);
        }

        router.push('/step/a');
      } else {
        throw new Error('Keine Daten gefunden');
      }
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with gradient background */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand))]/5 via-[hsl(var(--brand-2))]/5 to-transparent backdrop-blur-lg"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand))]/20 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent"
          >
            ImmoVest
          </button>

          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <SignInButton mode="modal">
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

      {/* Main Content with gradient background */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand))]/5 via-white to-[hsl(var(--brand-2))]/5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[hsl(var(--brand))]/10 to-transparent rounded-full blur-3xl"></div>

        <div className="relative max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Wie möchtest du starten?
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Wähle deine bevorzugte Methode für den Datenimport
            </p>
          </div>

          {/* Method Cards - 3 Column Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Manual Input - FIRST */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 md:p-8 hover:border-[hsl(var(--brand))]/30 hover:shadow-xl transition-all">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Keyboard className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Manuelle Eingabe
                </h3>
                <p className="text-gray-600">
                  Gib alle Daten selbst ein – volle Kontrolle
                </p>
              </div>

              <button
                onClick={() => router.push('/step/a')}
                className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-[hsl(var(--brand))] hover:text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/5 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Jetzt eingeben</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  <strong>Perfekt wenn:</strong> Du bereits alle Daten hast oder selbst eingeben möchtest
                </p>
              </div>
            </div>

            {/* URL Import with AI - SECOND */}
            <div className="relative bg-gradient-to-br from-white to-purple-50 rounded-3xl border-2 border-purple-200 p-6 md:p-8 shadow-xl">
              {/* AI Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold rounded-full shadow-lg flex items-center gap-1">
                <Sparkles size={14} />
                <span>KI-Power</span>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
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
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlSubmit();
                  }}
                />

                <button
                  onClick={handleUrlSubmit}
                  disabled={urlLoading || !url.trim()}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Foto machen - THIRD */}
            <div className="relative bg-gradient-to-br from-white to-[hsl(var(--brand))]/5 rounded-3xl border-2 border-[hsl(var(--brand))]/20 p-6 md:p-8 shadow-xl">
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-sm font-semibold rounded-full shadow-lg">
                ⚡ Empfohlen
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Foto machen
                </h3>
                <p className="text-gray-600">
                  Mach ein Foto der Anzeige – KI extrahiert automatisch alle Daten
                </p>
              </div>

              {/* Upload Area */}
              {!imagePreview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-[hsl(var(--brand))]/30 rounded-2xl p-12 text-center bg-white hover:border-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/5 transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-[hsl(var(--brand))] mx-auto mb-4" />
                  <p className="text-base font-semibold text-gray-900 mb-2">
                    Bild hochladen
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Klicken oder Drag & Drop
                  </p>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 bg-[hsl(var(--brand))] text-white rounded-lg hover:bg-[hsl(var(--brand-2))] transition text-sm font-medium"
                    >
                      Datei wählen
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-4 py-2 border-2 border-[hsl(var(--brand))] text-[hsl(var(--brand))] rounded-lg hover:bg-[hsl(var(--brand))]/5 transition text-sm font-medium flex items-center gap-2"
                    >
                      <Camera size={16} />
                      Foto machen
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <p className="text-xs text-gray-400">
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

                  <button
                    onClick={handleImageSubmit}
                    disabled={imageLoading}
                    className="w-full py-4 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white font-semibold rounded-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
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
