import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

const periods = [
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'last7days', label: '7 أيام' },
  { value: 'last30days', label: '30 يوم' },
  { value: 'thisMonth', label: 'هذا الشهر' },
  { value: 'lastMonth', label: 'الشهر الماضي' }
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-1.5 px-3 text-gray-500">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">الفترة:</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
              ${value === period.value
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
