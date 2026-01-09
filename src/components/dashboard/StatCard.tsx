import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendData } from '@/services/analytics.service';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: TrendData;
  color: 'emerald' | 'blue' | 'amber' | 'red' | 'teal' | 'cyan';
  sparklineData?: number[];
}

const colorConfig = {
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
    iconBg: 'bg-emerald-500',
    text: 'text-emerald-600',
    sparkline: '#10B981'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
    iconBg: 'bg-blue-500',
    text: 'text-blue-600',
    sparkline: '#3B82F6'
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
    iconBg: 'bg-amber-500',
    text: 'text-amber-600',
    sparkline: '#F59E0B'
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100/50',
    iconBg: 'bg-red-500',
    text: 'text-red-600',
    sparkline: '#EF4444'
  },
  teal: {
    bg: 'bg-gradient-to-br from-teal-50 to-teal-100/50',
    iconBg: 'bg-teal-500',
    text: 'text-teal-600',
    sparkline: '#14B8A6'
  },
  cyan: {
    bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50',
    iconBg: 'bg-cyan-500',
    text: 'text-cyan-600',
    sparkline: '#06B6D4'
  }
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const height = 32;
  const width = 80;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({ title, value, icon, trend, color, sparklineData }: StatCardProps) {
  const config = colorConfig[color];

  return (
    <div className={`${config.bg} p-5 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>

          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend.trend === 'up' && (
                <span className="flex items-center text-emerald-600 text-xs font-medium">
                  <TrendingUp className="w-3.5 h-3.5 ml-0.5" />
                  {Math.abs(trend.percentChange).toFixed(1)}%
                </span>
              )}
              {trend.trend === 'down' && (
                <span className="flex items-center text-red-600 text-xs font-medium">
                  <TrendingDown className="w-3.5 h-3.5 ml-0.5" />
                  {Math.abs(trend.percentChange).toFixed(1)}%
                </span>
              )}
              {trend.trend === 'neutral' && (
                <span className="flex items-center text-gray-500 text-xs font-medium">
                  <Minus className="w-3.5 h-3.5 ml-0.5" />
                  0%
                </span>
              )}
              <span className="text-gray-400 text-xs">عن الفترة السابقة</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`${config.iconBg} p-2.5 rounded-xl text-white shadow-sm`}>
            {icon}
          </div>
          {sparklineData && <Sparkline data={sparklineData} color={config.sparkline} />}
        </div>
      </div>
    </div>
  );
}
