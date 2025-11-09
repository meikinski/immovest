'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, TrendingUp } from 'lucide-react';

/**
 * Trust Badges für Social Proof
 * Zeigt: Kein Login, Fakten statt Bauchgefühl, Analysen-Counter
 * Optimiert: Kleiner, mehr Opacity, monochrome Icons
 */
export function TrustBadges() {
  const [analysisCount, setAnalysisCount] = useState(300);

  useEffect(() => {
    // Live counter - increments every 30 seconds
    const interval = setInterval(() => {
      setAnalysisCount((prev) => prev + 1);
    }, 30000); // Alle 30 Sekunden +1

    return () => clearInterval(interval);
  }, []);

  const badges = [
    {
      icon: <Lock className="w-3.5 h-3.5" />,
      text: 'Kein Login für erste KPIs',
    },
    {
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      text: 'Fakten statt Bauchgefühl',
    },
    {
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      text: `> ${analysisCount} Analysen erstellt`,
    },
  ];

  return (
    <div className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3">
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-white/30 shadow-sm text-xs font-medium text-gray-600 transition-all duration-200 hover:bg-white/50"
        >
          <div className="flex items-center justify-center opacity-60">
            {badge.icon}
          </div>
          <span className="whitespace-nowrap">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
}
