'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, TrendingUp } from 'lucide-react';

/**
 * Trust Badges für Social Proof
 * Zeigt: Kein Login, Fakten statt Bauchgefühl, Analysen-Counter
 */
export function TrustBadges() {
  const [analysisCount, setAnalysisCount] = useState(300);

  useEffect(() => {
    // Simuliere ansteigende Zahl (könnte später durch echte API ersetzt werden)
    const interval = setInterval(() => {
      setAnalysisCount((prev) => prev + 1);
    }, 30000); // Alle 30 Sekunden +1

    return () => clearInterval(interval);
  }, []);

  const badges = [
    {
      icon: <Lock className="w-5 h-5" />,
      text: 'Kein Login für erste KPIs',
      color: '#264171',
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      text: 'Fakten statt Bauchgefühl',
      color: '#E6AE63',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      text: `> ${analysisCount} Analysen erstellt`,
      color: '#22c55e',
      live: true,
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ backgroundColor: `${badge.color}15` }}
          >
            <div style={{ color: badge.color }}>{badge.icon}</div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {badge.text}
          </span>
          {badge.live && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
