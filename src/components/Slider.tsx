'use client';

import React from 'react';

type SliderProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string; // z.B. "%", "pp"
  helpText?: string;
  id?: string;
};

export default function Slider({
  label, value, onChange, min, max, step = 1, suffix = '', helpText, id
}: SliderProps) {
  const sliderId = id || `sl-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="slider-card">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={sliderId} className="text-sm font-medium text-[var(--color-text-default)]">
          {label}
        </label>
        <div className="text-sm text-[var(--color-text-muted)]">
          {value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} {suffix}
        </div>
      </div>

      <input
        id={sliderId}
        type="range"
        className="range-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={helpText ? `${sliderId}-help` : undefined}
      />

      {helpText && (
        <p id={`${sliderId}-help`} className="mt-1 text-xs text-[var(--color-text-muted)]">
          {helpText}
        </p>
      )}
    </div>
  );
}
