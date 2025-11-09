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
  const [displayCount, setDisplayCount] = useState(300);

  useEffect(() => {
    // Live counter - increments every 30 seconds
    const interval = setInterval(() => {
      setAnalysisCount((prev) => prev + 1);
    }, 30000); // Alle 30 Sekunden +1

    return () => clearInterval(interval);
  }, []);

  // Animated counter effect
  useEffect(() => {
    if (displayCount === analysisCount) return;

    const duration = 1000; // 1 second animation
    const steps = 30;
    const increment = (analysisCount - displayCount) / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayCount(analysisCount);
        clearInterval(timer);
      } else {
        setDisplayCount((prev) => Math.round(prev + increment));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [analysisCount, displayCount]);

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
      text: `> ${displayCount} Analysen erstellt`,
    },
  ];

  return (
    <div className="flex flex-row flex-wrap items-center justify-center gap-1.5 sm:gap-3">
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/40 shadow-sm text-[10px] sm:text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-white/80"
        >
          <div className="flex items-center justify-center opacity-70">
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
