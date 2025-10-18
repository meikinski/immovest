// src/components/ScoreGauge.tsx
'use client';

import React from 'react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

interface ScoreGaugeProps {
  score: number; // 0–100
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  // Score auf [0,100] begrenzen
  const pct = Math.max(0, Math.min(100, score));

  // Single data point – der Wert wird jetzt auf 100 bezogen
  const data = [{ value: pct }];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        data={data}
        startAngle={90}
        endAngle={-270}     // 360° im Uhrzeigersinn
        innerRadius="70%"
        outerRadius="90%"
      >
        {/* 1) Achse mit fester Domain [0,100] */}
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />

        {/* 2) Gradient-Definition */}
        <defs>
          <linearGradient id="gradScore" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />   {/* violet-600 */}
            <stop offset="100%" stopColor="#22D3EE" /> {/* teal-400 */}
          </linearGradient>
        </defs>

        {/* 3) Hintergrund-Ring (vollständig in Hellgrau) */}
        <RadialBar
          dataKey="value"
          background={{ fill: '#F0F0F5' }}
          cornerRadius={999}
          fill="#F0F0F5"
          isAnimationActive={false}
        />

        {/* 4) Farb-Ring, der nur pct% füllt */}
        <RadialBar
          dataKey="value"
          cornerRadius={999}
          fill="url(#gradScore)"
          isAnimationActive={true}
          animationDuration={800}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
