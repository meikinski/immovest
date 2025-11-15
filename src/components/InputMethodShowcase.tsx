'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link as LinkIcon, Camera, Keyboard, Sparkles } from 'lucide-react';

interface InputMethod {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
}

const inputMethods: InputMethod[] = [
  {
    id: 'url',
    icon: <LinkIcon className="w-6 h-6" />,
    title: 'URL-Import',
    description: 'Link einfügen – Preis, Fläche, Miete & Adresse werden erkannt.',
    image: '/duo_importurl_transparent.png',
  },
  {
    id: 'photo',
    icon: <Camera className="w-6 h-6" />,
    title: 'Foto-Analyse',
    description: 'Exposé-Screenshot hochladen – KI liest Zahlen & Text.',
    image: '/duo_importfoto_transparent.png',
  },
  {
    id: 'manual',
    icon: <Keyboard className="w-6 h-6" />,
    title: 'Manuelle Eingabe',
    description: 'Selbst eintragen – volle Kontrolle über jeden Wert.',
    image: '/duo_importmanuell_transparent.png',
  },
];

interface InputMethodShowcaseProps {
  onMethodSelect: (methodId: string) => void;
}

export function InputMethodShowcase({ onMethodSelect }: InputMethodShowcaseProps) {
  const [activeMethod, setActiveMethod] = useState(0);
  const [ringFlash, setRingFlash] = useState(false);
  const [showCoachMark, setShowCoachMark] = useState(false);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const [announceText, setAnnounceText] = useState('');

  // Check for coach mark hint on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenHint = localStorage.getItem('seenImportHint');
      if (!hasSeenHint) {
        // Show coach mark on first method change
        const timeout = setTimeout(() => {
          setShowCoachMark(false);
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, []);

  useEffect(() => {
    // Skip auto-scroll on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Update screen reader announcement
    setAnnounceText(`Vorschau aktualisiert: ${inputMethods[activeMethod].title}`);

    // Show coach mark on first change
    if (typeof window !== 'undefined') {
      const hasSeenHint = localStorage.getItem('seenImportHint');
      if (!hasSeenHint) {
        setShowCoachMark(true);
        localStorage.setItem('seenImportHint', 'true');
        const timeout = setTimeout(() => {
          setShowCoachMark(false);
        }, 3000);
      }
    }

    // Trigger ring flash animation on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setRingFlash(true);
      const timer = setTimeout(() => setRingFlash(false), 600);

      // Auto-scroll to image frame
      if (imageFrameRef.current) {
        imageFrameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return () => clearTimeout(timer);
    }
  }, [activeMethod]);

  return (
    <div>
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announceText}
      </div>

      {/* Mobile: Segmented Control + Image */}
      <div className="md:hidden">
        {/* Segmented Control - Finger-friendly on mobile */}
        <div className="flex justify-center gap-2 mb-6 p-1.5 bg-gray-100 rounded-full">
          {inputMethods.map((method, idx) => (
            <button
              key={method.id}
              onClick={() => setActiveMethod(idx)}
              aria-label={method.title}
              aria-current={activeMethod === idx ? 'step' : undefined}
              className={`flex-1 px-5 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 min-h-[48px] ${
                activeMethod === idx
                  ? 'bg-white text-[hsl(var(--brand))] shadow-md'
                  : 'text-gray-600 hover:text-[hsl(var(--brand))]'
              }`}
            >
              {method.title.replace('-Import', '').replace('Foto-Analyse', 'Foto').replace('Manuelle Eingabe', 'Manuell')}
            </button>
          ))}
        </div>

        {/* Image Frame with Crossfade */}
        <div className="relative max-w-full overflow-hidden">
          {/* Coach Mark Hint */}
          {showCoachMark && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-4 py-2 bg-[hsl(var(--brand))] text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-2">
                <span>Bereich markiert</span>
                <span className="text-lg">↓</span>
              </div>
            </div>
          )}

          <div
            ref={imageFrameRef}
            className={`relative w-full min-h-[48vh] aspect-[16/10] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-600 ${
              ringFlash ? 'ring-4 ring-[hsl(var(--brand))]/40' : 'ring-0'
            }`}
          >
          {inputMethods.map((method, idx) => (
            <div
              key={method.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeMethod === idx ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={method.image}
                alt={`${method.title}: ${method.description}`}
                width={1600}
                height={1000}
                sizes="(max-width: 768px) 100vw, 800px"
                className="w-full h-full object-contain"
                loading={idx === 0 ? 'eager' : 'lazy'}
                quality={90}
              />
            </div>
          ))}
          </div>
        </div>

        {/* Mobile Tab Details with integrated CTA */}
        <div className="mt-6 space-y-4">
          {inputMethods.map((method, idx) => (
            activeMethod === idx && (
              <div key={method.id} className="p-6 rounded-2xl border-2 border-[hsl(var(--brand))] bg-gradient-to-br from-white to-[hsl(var(--brand))]/5 shadow-lg">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[hsl(var(--brand))] text-white shadow-lg">
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-[#0F172A]">
                        {method.title}
                      </h3>
                      {(method.id === 'url' || method.id === 'photo') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-xs font-medium">
                          <Sparkles className="w-3 h-3" />
                          KI
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#6C7F99] leading-relaxed">
                      {method.description}
                    </p>
                  </div>
                </div>
                {/* CTA Button inside card */}
                <button
                  onClick={() => onMethodSelect(method.id)}
                  className="w-full px-6 h-12 rounded-full font-semibold text-[hsl(var(--brand-2))] bg-white border-2 border-[hsl(var(--brand-2))] transition-all duration-200 hover:bg-[hsl(var(--brand-2))]/12 hover:shadow-[0_2px_8px_hsl(var(--brand-2)/.20)] hover:-translate-y-0.5"
                >
                  {method.id === 'url' && 'URL eingeben'}
                  {method.id === 'photo' && 'Foto hochladen'}
                  {method.id === 'manual' && 'Formular öffnen'}
                </button>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Desktop: Two Column Layout */}
      <div className="hidden md:grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Tabs/Methods */}
        <div className="space-y-4">
        {inputMethods.map((method, idx) => (
          <div
            key={method.id}
            onClick={() => setActiveMethod(idx)}
            onMouseEnter={() => setActiveMethod(idx)}
            className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
              activeMethod === idx
                ? 'border-[hsl(var(--brand))] bg-gradient-to-br from-white to-[hsl(var(--brand))]/5 shadow-lg'
                : 'border-gray-200 bg-white hover:border-[hsl(var(--brand))]/30 hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  activeMethod === idx
                    ? 'bg-[hsl(var(--brand))] text-white scale-110 shadow-lg'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {method.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-[#0F172A]">
                    {method.title}
                  </h3>
                  {(method.id === 'url' || method.id === 'photo') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      KI
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#6C7F99] leading-relaxed">
                  {method.description}
                </p>
              </div>
            </div>

            {/* Context CTA */}
            {activeMethod === idx && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMethodSelect(method.id);
                  }}
                  className="w-full mt-2 px-6 h-12 rounded-full font-semibold text-[hsl(var(--brand-2))] bg-white border-2 border-[hsl(var(--brand-2))] transition-all duration-200 hover:bg-[hsl(var(--brand-2))]/12 hover:shadow-[0_2px_8px_hsl(var(--brand-2)/.20)] hover:-translate-y-0.5"
                >
                  {method.id === 'url' && 'URL eingeben'}
                  {method.id === 'photo' && 'Foto hochladen'}
                  {method.id === 'manual' && 'Formular öffnen'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right: Product Image - Larger */}
      <div className="relative scale-110">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src={inputMethods[activeMethod].image}
            alt={`${inputMethods[activeMethod].title}: ${inputMethods[activeMethod].description}`}
            width={1600}
            height={1000}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 900px"
            className="w-full h-auto transition-opacity duration-500"
            priority
            quality={90}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
