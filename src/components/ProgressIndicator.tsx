import React from 'react';
import { Check } from 'lucide-react';

type Step = 'input-method' | 'a' | 'b' | 'c' | 'tabs';

interface ProgressProps {
  currentStep: Step;
}

const STEPS: Array<{ key: Step; label: string }> = [
  { key: 'input-method', label: 'Start' },
  { key: 'a', label: 'Schritt 1' },
  { key: 'b', label: 'Schritt 2' },
  { key: 'c', label: 'Schritt 3' },
  { key: 'tabs', label: 'Ergebnis' },
];

export function ProgressIndicator({ currentStep }: ProgressProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          const isLast = idx === STEPS.length - 1;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle/Icon */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                    ${isCompleted 
                      ? 'bg-[hsl(var(--brand))] text-white' 
                      : isActive 
                        ? 'bg-[hsl(var(--brand-2))] text-white ring-4 ring-[hsl(var(--brand-2))]/20' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                
                {/* Label - immer sichtbar, aber nur aktiv hervorgehoben */}
                <span
                  className={`
                    mt-2 text-xs font-medium transition-colors
                    ${isActive 
                      ? 'text-[hsl(var(--brand))]' 
                      : isCompleted 
                        ? 'text-gray-600' 
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 relative" style={{ top: '-12px' }}>
                  <div
                    className={`
                      h-full transition-all duration-500
                      ${idx < currentIndex 
                        ? 'bg-[hsl(var(--brand))]' 
                        : 'bg-gray-200'
                      }
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}