'use client';

import React, { useState } from 'react';
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
 * Stacked Cards Component
 * Desktop: 3 cards side-by-side (grid-cols-3)
 * Mobile: Stacked with hover-to-front
 */
export function StackedCards({ steps }: StackedCardsProps) {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleCardClick = () => {
    router.push('/input-method');
  };

  const cardHeight = 280;
  const offset = 40;
  const containerHeight = cardHeight + offset * (steps.length - 1);

  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={handleCardClick}
              className="group relative text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div
                className="glass rounded-3xl border-2 border-gray-200 p-8 shadow-xl h-full flex flex-col"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, ${step.color}18 100%)`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-6"
                  style={{ backgroundColor: step.color }}
                >
                  <div className="text-white">{step.icon}</div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-base text-[#6C7F99] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* CTA */}
                <div
                  className="flex items-center gap-2 text-sm font-semibold mt-6 transition-all duration-200"
                  style={{ color: step.color }}
                >
                  {step.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile: Stacked Layout */}
        <div className="md:hidden">
          <div
            className="relative isolation-isolate"
            style={{ height: `${containerHeight}px` }}
          >
            {steps.map((step, idx) => {
              const isHovered = hoveredIndex === idx;
              const baseTranslateY = idx * offset;
              const hoverOffset = isHovered ? -8 : 0;
              const translateY = baseTranslateY + hoverOffset;
              const zIndex = isHovered ? 999 : steps.length - idx;

              return (
                <button
                  key={step.number}
                  className="absolute inset-x-0 top-0 transition-all duration-300 ease-out motion-reduce:transition-none text-left w-full"
                  style={{
                    transform: `translateY(${translateY}px)`,
                    zIndex,
                  }}
                  onClick={handleCardClick}
                  onTouchStart={() => setHoveredIndex(idx)}
                  onTouchEnd={() => setHoveredIndex(null)}
                  aria-label={`${step.title} - ${step.description}`}
                >
                  <div
                    className="glass rounded-3xl border-2 border-gray-200 p-6 shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, ${step.color}18 100%)`,
                    }}
                  >
                    {/* Content */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                          {step.number}. {step.title}
                        </h3>
                        <p className="text-sm text-[#6C7F99] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ml-3"
                        style={{ backgroundColor: step.color }}
                      >
                        <div className="text-white scale-90">{step.icon}</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div
                      className="flex items-center gap-2 text-xs font-semibold"
                      style={{ color: step.color }}
                    >
                      {step.cta}
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
