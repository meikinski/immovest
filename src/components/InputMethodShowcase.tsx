'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Link as LinkIcon, Camera, Keyboard, Sparkles } from 'lucide-react';

interface InputMethod {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  hotspot: {
    top: string;
    left: string;
    width: string;
    height: string;
    label: string;
  };
}

const inputMethods: InputMethod[] = [
  {
    id: 'url',
    icon: <LinkIcon className="w-6 h-6" />,
    title: 'URL-Import',
    description: 'Link einfügen → wir ziehen Kaufpreis, Fläche, Miete, Zimmer, Adresse.',
    hotspot: {
      top: '35%',
      left: '30%',
      width: '40%',
      height: '15%',
      label: 'URL Import',
    },
  },
  {
    id: 'photo',
    icon: <Camera className="w-6 h-6" />,
    title: 'Foto-Analyse',
    description: 'Exposé-Screenshot hochladen → KI liest Text & Zahlen.',
    hotspot: {
      top: '50%',
      left: '55%',
      width: '35%',
      height: '25%',
      label: 'Foto Upload',
    },
  },
  {
    id: 'manual',
    icon: <Keyboard className="w-6 h-6" />,
    title: 'Manuelle Eingabe',
    description: 'Volle Kontrolle über jeden Wert.',
    hotspot: {
      top: '20%',
      left: '20%',
      width: '30%',
      height: '20%',
      label: 'Formular',
    },
  },
];

interface InputMethodShowcaseProps {
  onMethodSelect: (methodId: string) => void;
}

export function InputMethodShowcase({ onMethodSelect }: InputMethodShowcaseProps) {
  const [activeMethod, setActiveMethod] = useState(0);

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
      {/* Left: Tabs/Methods */}
      <div className="space-y-4">
        {inputMethods.map((method, idx) => (
          <button
            key={method.id}
            onClick={() => setActiveMethod(idx)}
            onMouseEnter={() => setActiveMethod(idx)}
            className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
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
                  {method.id === 'url' && (
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
                  className="w-full mt-2 py-2.5 px-4 bg-[hsl(var(--brand-2))] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[hsl(var(--brand-2))]/20 transition-all"
                >
                  {method.id === 'url' && 'URL eingeben'}
                  {method.id === 'photo' && 'Foto hochladen'}
                  {method.id === 'manual' && 'Formular öffnen'}
                </button>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Right: Product Mockup with Hotspot */}
      <div className="relative">
        {/* Main Product Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src="/imvestr_inputmethod.png"
            alt="imvestr Input-Methoden"
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />

          {/* Hotspot Overlay */}
          <div
            className="absolute transition-all duration-500 ease-out pointer-events-none"
            style={{
              top: inputMethods[activeMethod].hotspot.top,
              left: inputMethods[activeMethod].hotspot.left,
              width: inputMethods[activeMethod].hotspot.width,
              height: inputMethods[activeMethod].hotspot.height,
            }}
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(165, 101, 84, 0.2) 0%, transparent 70%)',
                boxShadow: '0 0 40px rgba(165, 101, 84, 0.4), inset 0 0 20px rgba(165, 101, 84, 0.2)',
              }}
            />

            {/* Outline */}
            <div
              className="absolute inset-0 rounded-2xl border-2 animate-pulse"
              style={{
                borderColor: 'rgba(165, 101, 84, 0.6)',
                boxShadow: '0 0 20px rgba(165, 101, 84, 0.3)',
              }}
            />

            {/* Label */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-3 py-1 bg-[hsl(var(--brand-2))] text-white text-sm font-medium rounded-full shadow-lg">
                {inputMethods[activeMethod].hotspot.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
