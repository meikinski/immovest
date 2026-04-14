import React from 'react';

type Step = 'input-method' | 'a' | 'a2' | 'b' | 'c' | 'tabs';

interface ProgressProps {
  currentStep: Step;
}

const INPUT_STEPS: Array<{ key: Step; label: string }> = [
  { key: 'a', label: 'Objekt' },
  { key: 'a2', label: 'Details' },
  { key: 'b', label: 'Finanzierung' },
  { key: 'c', label: 'Steuern' },
];

export function ProgressIndicator({ currentStep }: ProgressProps) {
  const currentIndex = INPUT_STEPS.findIndex(s => s.key === currentStep);
  const total = INPUT_STEPS.length;
  const progressPct = currentIndex >= 0 ? ((currentIndex + 1) / total) * 100 : 100;
  const stepLabel = INPUT_STEPS[currentIndex]?.label ?? '';
  const stepNumber = currentIndex >= 0 ? currentIndex + 1 : total;

  return (
    <div className="w-full max-w-xl mx-auto mb-8 px-0">
      {/* Schritt X von Y */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-[#001d3d] uppercase tracking-widest">
          Schritt {stepNumber} von {total}
          {stepLabel ? ` — ${stepLabel}` : ''}
        </span>
        <span className="text-xs text-gray-400 font-semibold">
          {Math.round(progressPct)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#001d3d]/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#ff6b00] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
