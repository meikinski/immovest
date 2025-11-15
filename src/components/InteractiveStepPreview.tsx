'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  caption: string;
  image: string;
  color: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Objekt angeben',
    description: 'Adresse und Eckdaten zur Immobilie angeben.',
    caption: 'Schnelle Erfassung aller Immobiliendaten',
    image: '/imvestr_objektdaten.png',
    color: '#E6AE63',
  },
  {
    number: 2,
    title: 'Kennzahlen & Analysen',
    description: 'Cashflow, Nettorendite, DSCR in Sekunden.',
    caption: 'Alle wichtigen Kennzahlen auf einen Blick',
    image: '/imvestr_kpis.png',
    color: '#264171',
  },
  {
    number: 3,
    title: 'Szenarien testen',
    description: 'Miete, Zins, EK variieren – Effekt live sehen.',
    caption: 'Was-wäre-wenn Szenarien durchspielen',
    image: '/imvestr_szenarien.png',
    color: '#A56554',
  },
];

interface InteractiveStepPreviewProps {
  onStartAnalysis: () => void;
}

export function InteractiveStepPreview({ onStartAnalysis }: InteractiveStepPreviewProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [ringFlash, setRingFlash] = useState(false);
  const [glowEffect, setGlowEffect] = useState(false);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const [announceText, setAnnounceText] = useState('');

  useEffect(() => {
    // Skip auto-scroll on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Update screen reader announcement
    setAnnounceText(`Vorschau aktualisiert: Schritt ${steps[activeStep].number} - ${steps[activeStep].title}`);

    // Trigger glow effect
    setGlowEffect(true);
    const glowTimer = setTimeout(() => setGlowEffect(false), 600);

    // Trigger ring flash animation on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setRingFlash(true);
      const timer = setTimeout(() => setRingFlash(false), 600);

      // Auto-scroll to image frame
      if (imageFrameRef.current) {
        imageFrameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return () => {
        clearTimeout(timer);
        clearTimeout(glowTimer);
      };
    }

    return () => clearTimeout(glowTimer);
  }, [activeStep]);

  return (
    <div>
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announceText}
      </div>

      {/* Mobile: Segmented Control + Image */}
      <div className="md:hidden">
        {/* Segmented Control - Finger-friendly on mobile */}
        <div className="flex justify-center gap-2 mb-6 p-1.5 bg-gray-100 rounded-full max-w-md mx-auto">
          {steps.map((step, idx) => (
            <button
              key={step.number}
              onClick={() => setActiveStep(idx)}
              aria-label={`Schritt ${step.number}: ${step.title}`}
              aria-current={activeStep === idx ? 'step' : undefined}
              className={`flex-1 px-5 py-3.5 rounded-full text-base font-semibold transition-all duration-200 min-h-[48px] ${
                activeStep === idx
                  ? 'bg-white shadow-md'
                  : 'text-gray-600'
              }`}
              style={{
                color: activeStep === idx ? step.color : undefined,
              }}
            >
              {step.number}
            </button>
          ))}
        </div>

        {/* Current Step Badge */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-gray-200 shadow-md">
            <span className="text-sm font-semibold" style={{ color: steps[activeStep].color }}>
              {activeStep + 1}/3
            </span>
            <span className="text-sm text-gray-600">
              {steps[activeStep].title}
            </span>
          </div>
        </div>

        {/* Image Frame with Crossfade */}
        <div
          ref={imageFrameRef}
          className={`relative min-h-[48vh] aspect-[16/10] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-600 ${
            ringFlash ? 'ring-4 ring-[hsl(var(--brand))]/40' : 'ring-0'
          }`}
        >
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeStep === idx ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Highlight Overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${step.color}15, transparent 70%)`,
                }}
              />
              <div className="relative w-full h-full p-4">
                <Image
                  src={step.image}
                  alt={`Schritt ${step.number}: ${step.title} - ${step.description}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  quality={90}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Step Details */}
        <div className="mt-6 space-y-4">
          {steps.map((step, idx) => (
            activeStep === idx && (
              <div
                key={step.number}
                className={`p-6 rounded-2xl border-2 border-[hsl(var(--brand))] bg-gradient-to-br from-white to-[hsl(var(--brand))]/5 shadow-lg transition-all duration-600 ${
                  glowEffect ? 'ring-4 ring-[hsl(var(--brand))]/30 shadow-[0_0_20px_hsl(var(--brand)/.20)]' : ''
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg"
                    style={{
                      backgroundColor: step.color,
                      color: 'white'
                    }}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#0F172A] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#6C7F99] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
                <p className="text-center text-base text-[#6C7F99] font-medium mb-4">
                  {step.caption}
                </p>
              </div>
            )
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onStartAnalysis}
            className="group flex items-center justify-center gap-2 px-6 h-12 rounded-full font-semibold text-[hsl(var(--brand-2))] bg-white border-2 border-[hsl(var(--brand-2))] transition-all duration-200 hover:bg-[hsl(var(--brand-2))]/12 hover:shadow-[0_2px_8px_hsl(var(--brand-2)/.20)] hover:-translate-y-0.5"
          >
            <span>Analyse starten</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Desktop: Two Column Layout */}
      <div className="hidden md:grid md:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
        {/* Left: Stepper */}
        <div className="space-y-4">
        {steps.map((step, idx) => (
          <button
            key={step.number}
            onClick={() => setActiveStep(idx)}
            onMouseEnter={() => setActiveStep(idx)}
            className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
              activeStep === idx
                ? 'border-[hsl(var(--brand))] bg-gradient-to-br from-white to-[hsl(var(--brand))]/5 shadow-lg'
                : 'border-gray-200 bg-white hover:border-[hsl(var(--brand))]/30 hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Number Badge */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 transition-all duration-300 ${
                  activeStep === idx ? 'scale-110 shadow-lg' : ''
                }`}
                style={{
                  backgroundColor: activeStep === idx ? step.color : '#E7ECF2',
                  color: activeStep === idx ? 'white' : '#6C7F99'
                }}
              >
                {step.number}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-[#0F172A] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#6C7F99] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Right: Preview */}
      <div className="space-y-6 lg:sticky lg:top-24">
        {/* Browser Frame Card */}
        <div
          className="relative bg-white rounded-[24px] overflow-hidden"
          style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            border: '1px solid #E7ECF2',
            maxWidth: '880px',
            aspectRatio: '16 / 10',
          }}
        >
          {/* Highlight Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${steps[activeStep].color}15, transparent 70%)`,
            }}
          />

          {/* Screenshot */}
          <div className="relative w-full h-full p-4">
            <Image
              src={steps[activeStep].image}
              alt={`Schritt ${steps[activeStep].number}: ${steps[activeStep].title} - ${steps[activeStep].description}`}
              fill
              className="object-contain transition-opacity duration-500"
              sizes="(max-width: 1024px) 100vw, 880px"
              quality={90}
            />
          </div>
        </div>

        {/* Caption */}
        <p className="text-center text-base text-[#6C7F99] font-medium">
          {steps[activeStep].caption}
        </p>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={onStartAnalysis}
            className="group flex items-center justify-center gap-2 px-6 h-12 rounded-full font-semibold text-[hsl(var(--brand-2))] bg-white border-2 border-[hsl(var(--brand-2))] transition-all duration-200 hover:bg-[hsl(var(--brand-2))]/12 hover:shadow-[0_2px_8px_hsl(var(--brand-2)/.20)] hover:-translate-y-0.5"
          >
            <span>Analyse starten</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
