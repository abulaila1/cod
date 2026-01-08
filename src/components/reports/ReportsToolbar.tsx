import { Card, CardContent, Button, Select, DateRangePicker } from '@/components/ui';
import type { ReportGroupBy } from '@/types/reports';
import { RefreshCw, Download, Save, Filter } from 'lucide-react';

interface ReportsToolbarProps {
  dateFrom: string;
  dateTo: string;
  groupBy: ReportGroupBy;
  includeAdCost: boolean;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onGroupByChange: (groupBy: ReportGroupBy) => void;
  onIncludeAdCostChange: (include: boolean) => void;
  onRefresh: () => void;
  onExport: () => void;
  onSaveReport: () => void;
  onShowFilters: () => void;
}

export function ReportsToolbar({
  dateFrom,
  dateTo,
  groupBy,
  includeAdCost,
  onDateFromChange,
  onDateToChange,
  onGroupByChange,
  onIncludeAdCostChange,
  onRefresh,
  onExport,
  onSaveReport,
  onShowFilters,
}: ReportsToolbarProps) {
  return (
    <Card className="mb-6">
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                الفترة الزمنية
              </label>
              <DateRangePicker
                startDate={dateFrom}
                endDate={dateTo}
                onStartDateChange={onDateFromChange}
                onEndDateChange={onDateToChange}
              />
            </div>

            <div className="w-full lg:w-48">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                نوع التقرير
              </label>
              <Select
                value={groupBy}
                onChange={(e) => onGroupByChange(e.target.value as ReportGroupBy)}
                className="w-full"
              >
                <option value="day">يومي</option>
                <option value="week">أسبوعي</option>
                <option value="month">شهري</option>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={onShowFilters}>
                <Filter className="ml-2 h-4 w-4" />
                فلاتر
              </Button>
              <Button variant="primary" onClick={onRefresh}>
                <RefreshCw className="ml-2 h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAdCost}
                  onChange={(e) => onIncludeAdCostChange(e.target.checked)}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-700">احتساب تكلفة الإعلانات</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onSaveReport}>
                <Save className="ml-2 h-4 w-4" />
                حفظ التقرير
              </Button>
              <Button variant="outline" onClick={onExport}>
                <Download className="ml-2 h-4 w-4" />
                تصدير CSV
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
