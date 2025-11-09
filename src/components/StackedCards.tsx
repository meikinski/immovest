'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  color: string;
}

interface StackedCardsProps {
  steps: Step[];
}

/**
 * Stacked Cards Component with scroll animation
 * Cards stack on top of each other and fade/scale as you scroll
 */
export function StackedCards({ steps }: StackedCardsProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number[]>([0, 0, 0]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate when container enters/exits viewport
      const containerTop = scrollY + rect.top;
      const containerBottom = containerTop + rect.height;
      const viewportTop = scrollY;
      const viewportBottom = scrollY + windowHeight;

      // Each card gets its own scroll "zone"
      const cardHeight = 400; // Approx card height
      const offsetBetweenCards = windowHeight * 0.3; // Distance between card activations

      const newProgress = steps.map((_, idx) => {
        const cardTriggerPoint = containerTop + (idx * offsetBetweenCards);
        const cardEndPoint = cardTriggerPoint + offsetBetweenCards;

        const viewportCenter = scrollY + windowHeight / 2;

        if (viewportCenter < cardTriggerPoint) {
          return 0;
        } else if (viewportCenter > cardEndPoint) {
          return 1;
        } else {
          return (viewportCenter - cardTriggerPoint) / (cardEndPoint - cardTriggerPoint);
        }
      });

      setScrollProgress(newProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial calculation with small delay to ensure proper layout
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [steps.length]);

  const handleGetStarted = () => {
    router.push('/input-method');
  };

  return (
    <div ref={containerRef} className="relative py-24" style={{ minHeight: `${100 + (steps.length * 50)}vh` }}>
      <div className="sticky top-24 max-w-2xl mx-auto px-6 h-[500px]">
        {steps.map((step, idx) => {
          const progress = scrollProgress[idx];

          // Scale: Cards below current are slightly smaller
          const scale = 0.95 + (progress * 0.05);

          // Opacity: Fade out cards as next one comes in
          const nextProgress = idx < steps.length - 1 ? scrollProgress[idx + 1] : 0;
          const opacity = Math.max(0, 1 - nextProgress * 2);

          // TranslateY: Stack cards with vertical offset
          const baseOffset = idx * 20; // Base stacking offset
          const scrollOffset = (1 - progress) * 60; // Move up as it activates
          const translateY = baseOffset + scrollOffset;

          return (
            <div
              key={step.number}
              className="absolute top-0 left-0 right-0 will-change-transform"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity,
                zIndex: steps.length - idx,
                pointerEvents: idx === steps.length - 1 || progress > 0.5 ? 'auto' : 'none',
              }}
            >
              <div
                className="rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, white 0%, ${step.color}12 100%)`,
                }}
              >
                {/* Icon repositioned to top-right corner */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-bold text-[#0F172A] mb-2">
                      {step.number}. {step.title}
                    </h3>
                    <p className="text-lg text-[#6C7F99] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ml-4"
                    style={{ backgroundColor: step.color }}
                  >
                    <div className="text-white">{step.icon}</div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleGetStarted}
                  className="flex items-center gap-2 text-base font-semibold transition-all duration-200 group"
                  style={{ color: step.color }}
                >
                  {step.cta}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
