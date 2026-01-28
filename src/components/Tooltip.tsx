// src/components/Tooltip.tsx
'use client';

import { ReactNode, useState, useRef } from 'react';

interface TooltipProps {
  text: string | ReactNode;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    // Add a delay before closing to allow moving mouse to tooltip content
    closeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  const handleTooltipMouseEnter = () => {
    // Keep tooltip open when hovering over it
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    // Close tooltip when mouse leaves the tooltip content
    setIsVisible(false);
  };

  return (
    <span
      className="relative inline-block group"
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2
          px-4 py-2.5 text-xs text-slate-700
          bg-slate-50 border-2 border-[#ff6b00] shadow-xl rounded-xl
          transition-opacity duration-300 z-50
          whitespace-normal leading-relaxed
          w-[240px] sm:w-[280px]
          text-left ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      >
        {text}
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0
            border-l-6 border-l-transparent
            border-r-6 border-r-transparent
            border-b-6 border-b-[#ff6b00]"
        />
      </div>
    </span>
  );
}
