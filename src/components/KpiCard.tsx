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
    <div className={`card p-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium text-gray-700 flex items-center">
          {title}
          {help ? (
            <span className="ml-1">
              <Tooltip text={help}>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-gray-500 text-[10px] leading-4 cursor-pointer">
                  ?
                </span>
              </Tooltip>
            </span>
          ) : null}
        </div>
        {trend ? (
          <span
            className={`text-xs ${
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
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
