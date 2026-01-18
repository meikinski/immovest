import React from 'react';
import { Tooltip } from '@/components/Tooltip';
import { LucideIcon } from 'lucide-react';

type Trend = 'up' | 'down' | 'flat' | undefined;

export function KpiCard({
  title,
  value,
  trend,
  help,
  className,
  icon: Icon,
  trendLabel,
}: {
  title: string;
  value: string;
  trend?: Trend;
  help?: string;
  className?: string;
  icon?: LucideIcon;
  trendLabel?: string;
}) {
  return (
    <div className={`bg-white p-6 rounded-[40px] border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:border-[#ff6b00]/30 transition-all duration-300 ${className ?? ''}`}>
      <div className="flex justify-between items-start mb-4">
        {Icon && (
          <div className="p-3 bg-slate-50 rounded-xl text-[#001d3d]">
            <Icon size={20} />
          </div>
        )}
        {trendLabel && (
          <span className="text-emerald-600 text-xs font-bold">{trendLabel}</span>
        )}
        {!trendLabel && trend && (
          <span
            className={`text-xs font-bold ${
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                ? 'text-red-600'
                : 'text-gray-500'
            }`}
            aria-label={trend === 'up' ? 'steigend' : trend === 'down' ? 'fallend' : 'neutral'}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{title}</p>
        {help && (
          <Tooltip text={help}>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-xs font-bold cursor-pointer hover:bg-gray-200 transition-colors">
              ?
            </span>
          </Tooltip>
        )}
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold text-[#001d3d]">{value}</span>
      </div>
    </div>
  );
}
