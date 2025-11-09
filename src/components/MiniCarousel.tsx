'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileBarChart, LineChart, Bot } from 'lucide-react';

/**
 * Mini Carousel mit 3 Screenshots (Placeholders)
 * Zeigt: KPI-Karten, KI-Kommentar, PDF-Muster
 * Mit Swipe-Unterstützung für Mobile und echter Infinite Loop
 */
export function MiniCarousel() {
  const [activeIndex, setActiveIndex] = useState(1); // Start at first real slide (after clone)
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      title: 'KPI-Karten',
      description: 'Alle wichtigen Kennzahlen auf einen Blick',
      icon: <LineChart className="w-8 h-8" />,
      color: '#264171',
      image: '/imevstr_kpis.png',
    },
    {
      title: 'Objektdaten',
      description: 'Komplette Immobiliendaten strukturiert erfassen',
      icon: <Bot className="w-8 h-8" />,
      color: '#E6AE63',
      image: '/objektdaten.png',
    },
    {
      title: 'Szenarien',
      description: 'Verschiedene Finanzierungsszenarien durchspielen',
      icon: <FileBarChart className="w-8 h-8" />,
      color: '#A56554',
      image: '/szenarien.png',
    },
  ];

  // Create infinite loop by cloning first and last slides
  const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]];

  const next = () => {
    setIsTransitioning(true);
    setActiveIndex((prev) => prev + 1);
  };

  const prev = () => {
    setIsTransitioning(true);
    setActiveIndex((prev) => prev - 1);
  };

  // Handle infinite loop reset
  useEffect(() => {
    if (activeIndex === 0) {
      // At cloned last slide, jump to real last slide
      setTimeout(() => {
        setIsTransitioning(false);
        setActiveIndex(slides.length);
      }, 500);
    } else if (activeIndex === extendedSlides.length - 1) {
      // At cloned first slide, jump to real first slide
      setTimeout(() => {
        setIsTransitioning(false);
        setActiveIndex(1);
      }, 500);
    }
  }, [activeIndex, slides.length, extendedSlides.length]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      prev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div
          className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {extendedSlides.map((slide, idx) => (
            <div
              key={`${slide.title}-${idx}`}
              className="w-full flex-shrink-0 p-8 min-h-[500px] flex flex-col items-center justify-center text-center bg-white"
            >
              {/* Screenshot */}
              <div className="w-full max-w-3xl mb-6 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-200">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-bold text-[#0F172A] mb-3">{slide.title}</h3>
              <p className="text-base text-[#6C7F99] max-w-md">{slide.description}</p>
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
        {slides.map((_, idx) => {
          // Map activeIndex to real slide index (accounting for clones)
          const realIndex = activeIndex === 0 ? slides.length - 1 :
                           activeIndex === extendedSlides.length - 1 ? 0 :
                           activeIndex - 1;
          return (
            <button
              key={idx}
              onClick={() => {
                setIsTransitioning(true);
                setActiveIndex(idx + 1);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === realIndex ? 'w-8 bg-[hsl(var(--brand))]' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Zu Bild ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
