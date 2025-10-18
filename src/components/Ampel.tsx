// src/components/Ampel.tsx
'use client';

import React from 'react';
import { Frown, Meh, Smile } from 'lucide-react';

export interface AmpelProps {
  cashflow: number;
  nettorendite: number;
  className?: string;  
}

export function Ampel({
  cashflow,
  nettorendite,
  className = '',
}: AmpelProps) {
  // Standard: rote Stimmung
  let Icon = Frown;
  let cssVar = '--color-accent';

  if (cashflow >= 0) {
    if (nettorendite >= 3) {
      Icon = Smile;
      cssVar = '--color-secondary';
    } else if (nettorendite >= 1) {
      Icon = Meh;
      cssVar = '--color-primary';
    }
  }

  return (
    <div className="flex justify-center items-center">
      <Icon
        className={className}
        style={{ color: `var(${cssVar})` }}
      />
    </div>
  );
}
