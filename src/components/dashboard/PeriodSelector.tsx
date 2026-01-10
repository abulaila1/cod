import { Calendar, X } from 'lucide-react';
import { useState } from 'react';

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
  customRange?: { from: string; to: string } | null;
  onCustomRangeChange?: (range: { from: string; to: string } | null) => void;
}

const periods = [
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'last7days', label: '7 أيام' },
  { value: 'last30days', label: '30 يوم' },
  { value: 'thisMonth', label: 'هذا الشهر' },
  { value: 'lastMonth', label: 'الشهر الماضي' },
  { value: 'custom', label: 'نطاق مخصص' }
];

export function PeriodSelector({ value, onChange, customRange, onCustomRangeChange }: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handlePeriodChange = (period: string) => {
    if (period === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(period);
      if (onCustomRangeChange) {
        onCustomRangeChange(null);
      }
    }
  };

  const handleApplyCustom = () => {
    if (fromDate && toDate && onCustomRangeChange) {
      onCustomRangeChange({ from: fromDate, to: toDate });
      onChange('custom');
      setShowCustom(false);
    }
  };

  const handleClearCustom = () => {
    setFromDate('');
    setToDate('');
    setShowCustom(false);
    if (onCustomRangeChange) {
      onCustomRangeChange(null);
    }
    onChange('last30days');
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-1.5 px-3 text-gray-500">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">الفترة:</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
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

      {value === 'custom' && customRange && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-900 font-medium">
            من {formatDateLabel(customRange.from)} إلى {formatDateLabel(customRange.to)}
          </span>
          <button
            onClick={handleClearCustom}
            className="mr-auto p-1 hover:bg-blue-100 rounded transition-colors"
            title="إلغاء"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      )}

      {showCustom && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">اختر النطاق الزمني</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate || undefined}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate || undefined}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCustom(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleApplyCustom}
                disabled={!fromDate || !toDate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
