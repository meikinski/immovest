import React from 'react';
import { Tooltip } from '@/components/Tooltip';

type Trend = 'up' | 'down' | 'flat' | undefined;

export function KpiCard({
  title,
  value,
  trend,
  help,
  className,
}: {
  title: string;
  value: string;
  trend?: Trend;
  help?: string;
  className?: string;
}) {
  return (
    <div className={`card p-6 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-600 flex items-center uppercase tracking-wider">
          {title}
          {help ? (
            <span className="ml-2">
              <Tooltip text={help}>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 border-2 border-gray-200 text-gray-500 text-xs font-bold cursor-pointer hover:bg-gray-200 transition-colors">
                  ?
                </span>
              </Tooltip>
            </span>
          ) : null}
        </div>
        {trend ? (
          <span
            className={`text-sm font-bold ${
              trend === 'up'
                ? 'text-green-600'
                : trend === 'down'
                ? 'text-red-600'
                : 'text-gray-500'
            }`}
            aria-label={trend === 'up' ? 'steigend' : trend === 'down' ? 'fallend' : 'neutral'}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        ) : null}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
