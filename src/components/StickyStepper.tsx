'use client';

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number; // 1, 2, or 3
}

const steps = [
  { number: 1, label: 'Objekt angeben' },
  { number: 2, label: 'KPIs & KI-Einschätzung' },
  { number: 3, label: 'Szenarien testen' },
];

/**
 * Sticky Stepper - bleibt am oberen Rand beim Scrollen
 * Zeigt linearen Fortschritt: 1 → 2 → 3
 */
export function StickyStepper({ currentStep }: StepperProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Wird sticky nach 100px Scroll
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isSticky
          ? 'bg-white/95 backdrop-blur-lg shadow-md py-3'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <React.Fragment key={step.number}>
                {/* Step Circle */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 w-full justify-center">
                    {/* Circle */}
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-white'
                          : isCurrent
                          ? 'bg-white border-[hsl(var(--brand))] text-[hsl(var(--brand))]'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <span
                    className={`text-xs font-medium text-center transition-all duration-300 ${
                      isCompleted || isCurrent
                        ? 'text-[hsl(var(--brand))]'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2 -mt-8">
                    <div
                      className={`h-full transition-all duration-500 ${
                        currentStep > step.number
                          ? 'bg-[hsl(var(--brand))] w-full'
                          : 'bg-transparent w-0'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
