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
 * Stacked Cards Component - Hover to Front
 * Cards stack with hover bringing them forward + side navigation
 */
export function StackedCards({ steps }: StackedCardsProps) {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleCardClick = () => {
    router.push('/input-method');
  };

  const cardHeight = 280; // Base card height in px
  const offset = 40; // Vertical offset between cards
  const containerHeight = cardHeight + offset * (steps.length - 1);

  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-8">
          {/* Cards Container */}
          <div className="flex-1">
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
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(idx)}
                    onBlur={() => setHoveredIndex(null)}
                    aria-label={`${step.title} - ${step.description}`}
                  >
                    <div
                      className="glass rounded-3xl border-2 border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300"
                      style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, ${step.color}18 100%)`,
                      }}
                    >
                      {/* Content */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                            {step.number}. {step.title}
                          </h3>
                          <p className="text-base text-[#6C7F99] leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ml-4"
                          style={{ backgroundColor: step.color }}
                        >
                          <div className="text-white">{step.icon}</div>
                        </div>
                      </div>

                      {/* CTA Text */}
                      <div
                        className="flex items-center gap-2 text-sm font-semibold transition-all duration-200 group"
                        style={{ color: step.color }}
                      >
                        {step.cta}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side Navigation */}
          <div className="hidden md:flex flex-col gap-3 self-start pt-12">
            {steps.map((step, idx) => (
              <button
                key={step.number}
                onClick={() => {
                  setActiveIndex(idx);
                  setHoveredIndex(idx);
                  setTimeout(() => setHoveredIndex(null), 300);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                  hoveredIndex === idx
                    ? 'scale-110 shadow-lg'
                    : 'scale-100'
                }`}
                style={{
                  backgroundColor: hoveredIndex === idx ? step.color : 'white',
                  color: hoveredIndex === idx ? 'white' : step.color,
                  border: `2px solid ${step.color}`,
                }}
                aria-label={`Zu Schritt ${step.number}`}
              >
                {step.number}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
