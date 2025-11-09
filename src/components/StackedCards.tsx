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
 * Stacked Cards Component - Simple Transform-based Stacking
 * All cards in same layer, staggered via translateY + scale
 */
export function StackedCards({ steps }: StackedCardsProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleGetStarted = () => {
    router.push('/input-method');
  };

  const cardHeight = 280; // Base card height in px
  const offset = 40; // Vertical offset between cards
  const containerHeight = cardHeight + offset * (steps.length - 1);

  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-2xl">
        {/* Container with calculated height */}
        <div
          className="relative isolation-isolate"
          style={{ height: `${containerHeight}px` }}
        >
          {steps.map((step, idx) => {
            const isActive = activeIndex === idx;
            const translateY = idx * offset;
            const scale = isActive ? 1.02 : 1;
            const zIndex = isActive ? 999 : steps.length - idx;

            return (
              <div
                key={step.number}
                className="absolute inset-x-0 top-0 cursor-pointer transition-all duration-300 ease-out motion-reduce:transition-none"
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  zIndex,
                }}
                onClick={() => setActiveIndex(isActive ? null : idx)}
                onFocus={() => setActiveIndex(idx)}
                onBlur={() => setActiveIndex(null)}
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

                  {/* CTA Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetStarted();
                    }}
                    className="flex items-center gap-2 text-sm font-semibold transition-all duration-200 group"
                    style={{ color: step.color }}
                  >
                    {step.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
