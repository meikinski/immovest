import React from 'react';
import { Check } from 'lucide-react';

type Step = 'input-method' | 'a' | 'a2' | 'b' | 'c' | 'tabs';

interface ProgressProps {
  currentStep: Step;
}

const STEPS: Array<{ key: Step; label: string }> = [
  { key: 'a', label: 'SCHRITT 1' },
  { key: 'a2', label: 'SCHRITT 2' },
  { key: 'b', label: 'SCHRITT 3' },
  { key: 'c', label: 'SCHRITT 4' },
  { key: 'tabs', label: 'SCHRITT 5' },
];

export function ProgressIndicator({ currentStep }: ProgressProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="w-full max-w-5xl mx-auto mb-12 px-4">
      <div className="relative">
        {/* Steps Container */}
        <div className="relative flex justify-between items-center">
          {STEPS.map((step, idx) => {
            const isActive = idx === currentIndex;
            const isCompleted = idx < currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center relative">
                {/* Connector Line - only show between steps */}
                {idx < STEPS.length - 1 && (
                  <div className="absolute top-3 left-1/2 h-0.5 bg-slate-200" style={{ width: 'calc(100vw / 5)', zIndex: 0 }} />
                )}

                {/* Step Circle */}
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 relative z-10
                    ${isActive
                      ? 'bg-[#ff6b00] shadow-lg shadow-[#ff6b00]/30'
                      : isCompleted
                        ? 'bg-[#001d3d]'
                        : 'bg-slate-200'
                    }
                  `}
                >
                  {isCompleted && (
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-3 text-[10px] font-black uppercase tracking-[0.15em] transition-colors text-center whitespace-nowrap
                    ${isActive
                      ? 'text-[#001d3d]'
                      : isCompleted
                        ? 'text-slate-400'
                        : 'text-slate-300'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
