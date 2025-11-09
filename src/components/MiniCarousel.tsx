'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileBarChart, LineChart, Bot } from 'lucide-react';

/**
 * Mini Carousel mit 3 Screenshots (Placeholders)
 * Zeigt: KPI-Karten, KI-Kommentar, PDF-Muster
 */
export function MiniCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = [
    {
      title: 'KPI-Karten',
      description: 'Alle wichtigen Kennzahlen auf einen Blick',
      icon: <LineChart className="w-8 h-8" />,
      color: '#264171',
    },
    {
      title: 'KI-Einschätzung',
      description: 'Erste Investment-Analyse basierend auf deinen Zahlen',
      icon: <Bot className="w-8 h-8" />,
      color: '#E6AE63',
    },
    {
      title: 'PDF-Report',
      description: 'Bankfähiger Report mit allen Details',
      icon: <FileBarChart className="w-8 h-8" />,
      color: '#A56554',
    },
  ];

  const next = () => setActiveIndex((prev) => (prev + 1) % slides.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-xl">
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div
              key={slide.title}
              className="w-full flex-shrink-0 p-12 min-h-[400px] flex flex-col items-center justify-center text-center"
              style={{
                background: `linear-gradient(135deg, ${slide.color}08 0%, ${slide.color}15 100%)`,
              }}
            >
              {/* Icon */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                style={{ backgroundColor: slide.color }}
              >
                <div className="text-white">{slide.icon}</div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-[#0F172A] mb-3">{slide.title}</h3>

              {/* Description */}
              <p className="text-base text-[#6C7F99] max-w-md">{slide.description}</p>

              {/* Placeholder Badge */}
              <div className="mt-8 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-gray-200">
                <span className="text-xs font-medium text-gray-600">
                  Screenshot Placeholder {idx + 1}/3
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all hover:scale-110"
          aria-label="Vorheriges Bild"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all hover:scale-110"
          aria-label="Nächstes Bild"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === activeIndex ? 'w-8 bg-[hsl(var(--brand))]' : 'w-2 bg-gray-300'
            }`}
            aria-label={`Zu Bild ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
