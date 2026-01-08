import { Button, Select, DateRangePicker } from '@/components/ui';
import type { OrderFilters, Status, Country, Carrier, Employee } from '@/types/domain';
import { X, Filter } from 'lucide-react';

interface FiltersPanelProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClear: () => void;
  statuses: Status[];
  countries: Country[];
  carriers: Carrier[];
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  onClear,
  statuses,
  countries,
  carriers,
  employees,
  isOpen,
  onClose,
}: FiltersPanelProps) {
  if (!isOpen) return null;

  const handleChange = (key: keyof OrderFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      <div className="fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-zinc-600" />
            <h2 className="text-lg font-bold text-zinc-950">الفلاتر</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              الفترة الزمنية
            </label>
            <DateRangePicker
              startDate={filters.date_from || ''}
              endDate={filters.date_to || ''}
              onStartDateChange={(date) => handleChange('date_from', date)}
              onEndDateChange={(date) => handleChange('date_to', date)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              الحالة
            </label>
            <Select
              value={filters.status_id || ''}
              onChange={(e) => handleChange('status_id', e.target.value)}
            >
              <option value="">الكل</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name_ar}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              الدولة
            </label>
            <Select
              value={filters.country_id || ''}
              onChange={(e) => handleChange('country_id', e.target.value)}
            >
              <option value="">الكل</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name_ar}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              شركة الشحن
            </label>
            <Select
              value={filters.carrier_id || ''}
              onChange={(e) => handleChange('carrier_id', e.target.value)}
            >
              <option value="">الكل</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name_ar}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              الموظف
            </label>
            <Select
              value={filters.employee_id || ''}
              onChange={(e) => handleChange('employee_id', e.target.value)}
            >
              <option value="">الكل</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name_ar}
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex gap-3">
            <Button onClick={onClear} variant="outline" className="flex-1">
              مسح الفلاتر
            </Button>
            <Button onClick={onClose} variant="primary" className="flex-1">
              تطبيق
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
