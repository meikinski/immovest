import React from 'react';
import { Check } from 'lucide-react';

type Step = 'input-method' | 'a' | 'b' | 'c' | 'tabs';

interface ProgressProps {
  currentStep: Step;
}

const STEPS: Array<{ key: Step; label: string }> = [
  { key: 'input-method', label: 'Schritt 1' },
  { key: 'a', label: 'Schritt 2' },
  { key: 'b', label: 'Schritt 3' },
  { key: 'c', label: 'Schritt 4' },
  { key: 'tabs', label: 'Schritt 5' },
];

export function ProgressIndicator({ currentStep }: ProgressProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" style={{ zIndex: 0 }} />

        {/* Progress Line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] transition-all duration-700 ease-out"
          style={{
            width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
            zIndex: 1
          }}
        />

        {/* Steps Container - Evenly distributed with flex-1 */}
        <div className="relative flex items-center justify-between w-full" style={{ zIndex: 2 }}>
          {STEPS.map((step, idx) => {
            const isActive = idx === currentIndex;
            const isCompleted = idx < currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-4 border-white shadow-lg
                    ${isCompleted
                      ? 'bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white scale-100'
                      : isActive
                        ? 'bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-white scale-110 shadow-2xl shadow-[hsl(var(--brand))]/30'
                        : 'bg-white text-gray-400 border-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Label - Hidden on smaller screens with more granular breakpoints */}
                <span
                  className={`
                    mt-3 text-xs font-medium transition-colors text-center whitespace-nowrap hidden md:block
                    ${isActive
                      ? 'text-[hsl(var(--brand))]'
                      : isCompleted
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </span>

                {/* Mobile: Show only for active step */}
                <span
                  className={`
                    mt-3 text-xs font-medium transition-colors text-center whitespace-nowrap md:hidden
                    ${isActive ? 'text-[hsl(var(--brand))]' : 'hidden'}
                  `}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Progress Text */}
      <div className="mt-6 text-center sm:hidden">
        <p className="text-sm text-gray-600">
          Schritt <span className="font-bold text-[hsl(var(--brand))]">{currentIndex + 1}</span> von {STEPS.length}
        </p>
      </div>
    </div>
  );
}