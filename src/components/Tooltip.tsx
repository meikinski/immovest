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
          px-3 py-2 text-xs text-white
          bg-[hsl(var(--accent))] shadow-lg rounded-md
          transition-opacity duration-300 z-20
          whitespace-pre-line text-[13px] font-medium leading-snug
          max-w-[90vw] sm:max-w-xs md:max-w-sm lg:max-w-md text-center ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {text}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0
            border-l-6 border-l-transparent
            border-r-6 border-r-transparent
            border-t-6 border-t-[hsl(var(--accent))]"
        />
      </div>
    </span>
  );
}
