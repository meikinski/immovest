'use client';

import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue.replace(',', '.'));
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  return (
    <div className="slider-card">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={sliderId} className="text-sm font-medium text-[var(--color-text-default)]">
          {label}
        </label>
        <div className="text-sm text-[var(--color-text-muted)]">
          {isEditing ? (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-20 px-2 py-1 text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setInputValue(value.toString());
              }}
              className="hover:text-[var(--color-text-default)] transition-colors"
            >
              {value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} {suffix}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Decrement button for mobile precision */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
          aria-label={`${label} verringern`}
        >
          <Minus className="w-5 h-5" />
        </button>

        <input
          id={sliderId}
          type="range"
          className="range-input flex-1"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-describedby={helpText ? `${sliderId}-help` : undefined}
        />

        {/* Increment button for mobile precision */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
          aria-label={`${label} erhöhen`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {helpText && (
        <p id={`${sliderId}-help`} className="mt-1 text-xs text-[var(--color-text-muted)]">
          {helpText}
        </p>
      )}
    </div>
  );
}
