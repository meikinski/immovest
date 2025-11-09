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
      const containerTop = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress for each card
      const newProgress = steps.map((_, idx) => {
        const cardStart = containerTop + (idx * containerHeight) / steps.length;
        const cardEnd = cardStart + containerHeight / steps.length;
        const progress = Math.max(
          0,
          Math.min(1, (scrollY + windowHeight / 2 - cardStart) / (cardEnd - cardStart))
        );
        return progress;
      });

      setScrollProgress(newProgress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [steps.length]);

  const handleGetStarted = () => {
    router.push('/input-method');
  };

  return (
    <div ref={containerRef} className="relative min-h-[200vh] py-24">
      <div className="sticky top-20 max-w-2xl mx-auto px-6">
        {steps.map((step, idx) => {
          const progress = scrollProgress[idx];
          const scale = 1 - (1 - progress) * 0.05 * idx;
          const opacity = progress > 0.8 && idx < steps.length - 1 ? 1 - (progress - 0.8) * 5 : 1;
          const translateY = (1 - progress) * 50 * idx;

          return (
            <div
              key={step.number}
              className="absolute inset-0 transition-all duration-300"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity,
                zIndex: steps.length - idx,
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
