// src/components/Tooltip.tsx
'use client';

import { ReactNode, useState } from 'react';

interface TooltipProps {
  text: string | ReactNode;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-block group"
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div
        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3
          px-4 py-3 text-sm text-slate-700
          bg-slate-50 border-2 border-[#ff6b00] shadow-xl rounded-xl
          transition-opacity duration-300 z-20
          whitespace-normal leading-relaxed
          max-w-[280px] sm:max-w-[320px]
          text-left ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {text}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0
            border-l-6 border-l-transparent
            border-r-6 border-r-transparent
            border-t-6 border-t-[#ff6b00]"
        />
      </div>
    </span>
  );
}
