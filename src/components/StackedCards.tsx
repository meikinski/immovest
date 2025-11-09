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
      const containerTop = window.scrollY + rect.top;
      const containerHeight = container.offsetHeight;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress for each card
      const newProgress = steps.map((_, idx) => {
        // Distribute cards evenly across the container height
        const sectionHeight = containerHeight / steps.length;
        const cardStart = containerTop + (idx * sectionHeight);
        const cardEnd = cardStart + sectionHeight;

        // Calculate progress based on viewport center
        const viewportCenter = scrollY + windowHeight / 2;
        const progress = Math.max(
          0,
          Math.min(1, (viewportCenter - cardStart) / (cardEnd - cardStart))
        );
        return progress;
      });

      setScrollProgress(newProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [steps.length]);

  const handleGetStarted = () => {
    router.push('/input-method');
  };

  return (
    <div ref={containerRef} className="relative py-24" style={{ minHeight: `${150 * steps.length}vh` }}>
      <div className="sticky top-20 max-w-2xl mx-auto px-6">
        {steps.map((step, idx) => {
          const progress = scrollProgress[idx];
          // Improved scaling: start at 0.9 for cards below and scale to 1
          const scale = 0.9 + (progress * 0.1);
          // Fade out previous cards as new one comes in
          const opacity = idx < steps.length - 1
            ? Math.max(0, 1 - Math.max(0, scrollProgress[idx + 1] - 0.2) * 5)
            : 1;
          // Stack cards with offset
          const translateY = Math.max(0, (1 - progress) * 80) + (idx * 8);

          return (
            <div
              key={step.number}
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity,
                zIndex: idx,
                transition: 'transform 0.1s ease-out, opacity 0.3s ease-out',
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
