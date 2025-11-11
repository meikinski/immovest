'use client';

import React, { useState } from 'react';
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
    description: 'Adresse oder Eckdaten eintippen.',
    caption: 'Schnelle Erfassung aller Immobiliendaten',
    image: '/imvestr_objektdaten.png',
    color: '#E6AE63',
  },
  {
    number: 2,
    title: 'KPIs & KI-Kurzcheck',
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

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
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
              alt={steps[activeStep].title}
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
            className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-white border-2 border-[hsl(var(--brand-2))] text-[hsl(var(--brand-2))] font-medium rounded-xl hover:bg-[hsl(var(--brand-2))] hover:text-white hover:shadow-xl transition-all"
          >
            <span>Analyse starten</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
