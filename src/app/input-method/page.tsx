'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Keyboard, Link2, Sparkles, ChevronRight, Camera, Upload, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useImmoStore } from '@/store/useImmoStore';

export default function InputMethodPage() {
  const router = useRouter();
  const importData = useImmoStore(s => s.importData);

  // URL State
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Screenshot State
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Create preview
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
      // Convert to base64
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

      // Daten in Store importieren
      importData({
        kaufpreis: data.kaufpreis || 0,
        adresse: data.adresse || '',
        flaeche: data.flaeche || 0,
        zimmer: data.zimmer || 0,
        baujahr: data.baujahr || new Date().getFullYear(),
        miete: data.miete || 0,
        objekttyp: data.objekttyp || 'wohnung',
      });

      // Weiterleitung zu Step A
      router.push('/step/a');
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setImageLoading(false);
    }
  };

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

      const result = await response.json();

      if (!response.ok) {
        let errorMsg = result.error || 'Scraping fehlgeschlagen';
        if (result.hint) {
          errorMsg += ' ' + result.hint;
        }
        if (result.technicalDetails) {
          console.error('Technical details:', result.technicalDetails);
        }
        throw new Error(errorMsg);
      }

      const { data } = result;

      // Daten in Store importieren
      importData({
        kaufpreis: data.kaufpreis || 0,
        adresse: data.adresse || '',
        flaeche: data.flaeche || 0,
        zimmer: data.zimmer || 0,
        baujahr: data.baujahr || new Date().getFullYear(),
        miete: data.miete || 0,
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
      <div className="max-w-6xl w-full">
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Manual Input */}
          <button
            onClick={() => router.push('/step/a')}
            className="card p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[hsl(var(--brand))]/10 rounded-xl flex items-center justify-center group-hover:bg-[hsl(var(--brand))]/20 transition-colors">
                <Keyboard className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[hsl(var(--brand))] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold mb-2">Manuelle Eingabe</h3>
            <p className="text-xs text-gray-600">
              Gib alle Daten selbst ein
            </p>
          </button>

          {/* Screenshot Upload - RECOMMENDED */}
          <div className="card p-6 border-2 border-[hsl(var(--brand))]/30 bg-gradient-to-br from-white to-[hsl(var(--brand))]/5 relative">
            {/* Recommended Badge */}
            <span className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-xs font-semibold rounded-full shadow-lg">
              Empfohlen
            </span>

            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[hsl(var(--brand))]/10 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <span className="px-2 py-1 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] text-xs font-semibold rounded-full">
                KI-Vision
              </span>
            </div>
            <h3 className="font-semibold mb-2">Screenshot hochladen</h3>
            <p className="text-xs text-gray-600 mb-4">
              Screenshot vom Inserat → KI extrahiert Daten
            </p>

            {/* Upload Area */}
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/5 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Bild hochladen
                </p>
                <p className="text-xs text-gray-500">
                  Klicken oder Drag & Drop
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <button
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    setImageError('');
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {imageError && (
              <p className="text-xs text-red-600 mt-2">{imageError}</p>
            )}

            {imagePreview && (
              <button
                onClick={handleImageSubmit}
                disabled={imageLoading}
                className="w-full btn-primary mt-3 text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {imageLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analysiere...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Daten extrahieren</span>
                  </>
                )}
              </button>
            )}

            <p className="text-xs text-gray-500 text-center mt-3">
              ✨ 100% zuverlässig, keine Blockierung
            </p>
          </div>

          {/* URL Import - WITH WARNING */}
          <div className="card p-6 border border-gray-200 opacity-70">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Link2 className="w-5 h-5 text-gray-500" />
              </div>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="font-semibold mb-2">Per URL importieren</h3>
            <p className="text-xs text-gray-600 mb-3">
              Funktioniert nicht zuverlässig
            </p>

            {/* Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-orange-800">
                <strong>⚠️ Hinweis:</strong> Immobilienportale blockieren automatische Zugriffe. Nutze stattdessen die Screenshot-Methode!
              </p>
            </div>

            {/* URL Input - Disabled by default, show anyway */}
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800 mb-2">
                Trotzdem versuchen
              </summary>
              <div className="space-y-2 mt-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[hsl(var(--brand))] focus:ring-2 focus:ring-[hsl(var(--brand))]/20 transition-all text-xs"
                  disabled={loading}
                />

                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}

                <button
                  onClick={handleUrlSubmit}
                  disabled={loading || !url.trim()}
                  className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[hsl(var(--brand))] border-t-transparent rounded-full animate-spin" />
                      <span>Versuche...</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={12} />
                      <span>URL importieren</span>
                    </>
                  )}
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* Info Banner */}
        <div className="card-gradient p-4 text-center">
          <p className="text-sm text-gray-700">
            💡 <strong>Tipp:</strong> Mache einen Screenshot vom Immobilien-Inserat → Lade ihn hoch → KI extrahiert automatisch alle Daten!
          </p>
        </div>
      </div>
    </div>
  );
}
