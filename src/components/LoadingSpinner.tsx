'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  messages?: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_MESSAGES = [
  'Analysiere die Immobilie...',
  'Sammle aktuelle Marktdaten...',
  'Prüfe Lagequalität...',
  'Gib mir noch einen Moment...',
  'Gleich geschafft...',
  'Suche vergleichbare Objekte...',
  'Das kann manchmal etwas dauern...',
  'Bereite deine Analyse vor...',
];

export function LoadingSpinner({ 
  messages = DEFAULT_MESSAGES, 
  className = '',
  size = 'md'
}: LoadingSpinnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 6000); // Wechsel alle 6 Sekunden

    return () => clearInterval(interval);
  }, [messages.length]);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} text-[hsl(var(--brand))] animate-spin`} 
      />
      <p 
        className={`${textSizeClasses[size]} text-gray-600 text-center animate-fade-in`}
        key={currentIndex}
      >
        {messages[currentIndex]}
      </p>
    </div>
  );
}

// Kompakte Variante für Inline-Loading
export function LoadingDots({ text = 'Lädt' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-1">
      <span className="text-gray-600">{text}</span>
      <span className="flex space-x-1">
        <span className="w-1.5 h-1.5 bg-[hsl(var(--brand))] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-[hsl(var(--brand))] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-[hsl(var(--brand))] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
    </div>
  );
}