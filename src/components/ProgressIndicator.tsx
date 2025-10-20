import React from 'react';

type Step = 'input-method' | 'a' | 'b' | 'c' | 'tabs';

interface ProgressProps {
  currentStep: Step;
}

const STEPS: Array<{ key: Step; label: string }> = [
  { key: 'input-method', label: 'Eingabe' },
  { key: 'a', label: 'Objekt' },
  { key: 'b', label: 'Kosten' },
  { key: 'c', label: 'Finanzierung' },
  { key: 'tabs', label: 'Analyse' },
];

export function ProgressIndicator({ currentStep }: ProgressProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Labels */}
      <div className="flex justify-between mt-3">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          
          return (
            <div
              key={step.key}
              className={`flex flex-col items-center transition-all duration-300 ${
                isActive
                  ? 'scale-110'
                  : isCompleted
                  ? 'opacity-60'
                  : 'opacity-40'
              }`}
            >
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mb-1 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[hsl(var(--brand))] text-white'
                    : isActive
                    ? 'bg-[hsl(var(--brand-2))] text-white ring-4 ring-[hsl(var(--brand-2))]/20'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              
              {/* Label */}
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? 'text-[hsl(var(--brand))]'
                    : isCompleted
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Text */}
      <div className="text-center mt-3 text-sm text-gray-600">
        Schritt {currentIndex + 1} von {STEPS.length}
      </div>
    </div>
  );
}