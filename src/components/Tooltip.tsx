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
          px-4 py-3 text-sm text-white
          bg-[hsl(var(--accent))] shadow-lg rounded-md
          transition-opacity duration-300 z-20
          whitespace-pre-line leading-relaxed
          w-[85vw] sm:w-[400px] md:w-[480px] lg:w-[540px] xl:w-[600px]
          text-left ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
