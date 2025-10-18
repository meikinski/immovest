// src/components/InputField.tsx
'use client';

import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  value: string | number;
  unit?: string;
  className?: string;
  onValueChange?: (v: string) => void; // eigene string-basierte API
}

export function InputField({
  label,
  value,
  unit,
  type = 'text',
  onChange,
  onValueChange,
  className = '',
  ...rest
}: InputFieldProps) {
  return (
    <div className="relative">
      {label && (
        <label className="block mb-1 text-sm text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => {
          onChange?.(e); // native Event weiterreichen
          onValueChange?.(e.target.value); // eigene string-API verwenden
        }}
        className={`w-full bg-transparent focus:outline-none border-none ${className}`}
        {...rest} // alle weiteren Props (z. B. onBlur, onFocus, placeholder)
      />
      {unit && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {unit}
        </span>
      )}
    </div>
  );
}
