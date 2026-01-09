import { useState, useEffect } from 'react';
import { Button, Select, DateRangePicker, Input } from '@/components/ui';
import type { OrderFilters, Status, Country, Carrier, Employee, City, Product } from '@/types/domain';
import { X, Filter, RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/services/supabase';

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
  businessId?: string;
}

const DATE_PRESETS = [
  { label: 'اليوم', value: 'today' },
  { label: 'الأمس', value: 'yesterday' },
  { label: 'آخر 7 أيام', value: 'last7' },
  { label: 'آخر 30 يوم', value: 'last30' },
  { label: 'هذا الشهر', value: 'thisMonth' },
  { label: 'الشهر الماضي', value: 'lastMonth' },
];

const COLLECTION_STATUSES = [
  { value: '', label: 'الكل' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'collected', label: 'تم التحصيل' },
  { value: 'partial', label: 'تحصيل جزئي' },
  { value: 'failed', label: 'فشل التحصيل' },
];

const ORDER_SOURCES = [
  { value: '', label: 'الكل' },
  { value: 'website', label: 'الموقع الإلكتروني' },
  { value: 'facebook', label: 'فيسبوك' },
  { value: 'instagram', label: 'انستقرام' },
  { value: 'tiktok', label: 'تيك توك' },
  { value: 'snapchat', label: 'سناب شات' },
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'phone', label: 'هاتف' },
  { value: 'other', label: 'أخرى' },
];

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
  businessId,
}: FiltersPanelProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    date: true,
    status: true,
    location: true,
    shipping: true,
    team: true,
    advanced: false,
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    if (businessId && filters.country_id) {
      loadCities(filters.country_id);
    }
  }, [businessId, filters.country_id]);

  useEffect(() => {
    if (businessId) {
      loadProducts();
    }
  }, [businessId]);

  useEffect(() => {
    let count = 0;
    if (filters.date_from || filters.date_to) count++;
    if (filters.status_id || (filters.status_ids && filters.status_ids.length > 0)) count++;
    if (filters.country_id) count++;
    if (filters.city_id) count++;
    if (filters.carrier_id) count++;
    if (filters.employee_id) count++;
    if (filters.product_id) count++;
    if (filters.collection_status) count++;
    if (filters.order_source) count++;
    if (filters.has_tracking !== undefined) count++;
    if (filters.is_late) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const loadCities = async (countryId: string) => {
    const { data } = await supabase
      .from('cities')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_active', true)
      .order('name_ar');

    setCities(data || []);
  };

  const loadProducts = async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from('products')
      .select('id, name_ar, sku')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name_ar');

    setProducts(data || []);
  };

  if (!isOpen) return null;

  const handleChange = (key: keyof OrderFilters, value: unknown) => {
    const newFilters = { ...filters, [key]: value || undefined };

    if (key === 'country_id' && !value) {
      newFilters.city_id = undefined;
    }

    onFiltersChange(newFilters);
  };

  const applyDatePreset = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (preset) {
      case 'today':
        startDate = today;
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = startDate;
        break;
      case 'last7':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0],
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({
    title,
    section,
  }: {
    title: string;
    section: keyof typeof expandedSections;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
    >
      {title}
      {expandedSections[section] ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      <div className="fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-zinc-600" />
            <h2 className="text-lg font-bold text-zinc-950">الفلاتر</h2>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="border-b border-zinc-100 pb-4">
            <SectionHeader title="الفترة الزمنية" section="date" />
            {expandedSections.date && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => applyDatePreset(preset.value)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <DateRangePicker
                  startDate={filters.date_from || ''}
                  endDate={filters.date_to || ''}
                  onStartDateChange={(date) => handleChange('date_from', date)}
                  onEndDateChange={(date) => handleChange('date_to', date)}
                />
              </div>
            )}
          </div>

          <div className="border-b border-zinc-100 pb-4">
            <SectionHeader title="الحالة" section="status" />
            {expandedSections.status && (
              <div className="mt-3">
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
            )}
          </div>

          <div className="border-b border-zinc-100 pb-4">
            <SectionHeader title="الموقع الجغرافي" section="location" />
            {expandedSections.location && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
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

                {filters.country_id && cities.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                      المدينة
                    </label>
                    <Select
                      value={filters.city_id || ''}
                      onChange={(e) => handleChange('city_id', e.target.value)}
                    >
                      <option value="">الكل</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name_ar}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-b border-zinc-100 pb-4">
            <SectionHeader title="الشحن" section="shipping" />
            {expandedSections.shipping && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
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
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    رقم التتبع
                  </label>
                  <Select
                    value={filters.has_tracking === undefined ? '' : filters.has_tracking ? 'yes' : 'no'}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('has_tracking', val === '' ? undefined : val === 'yes');
                    }}
                  >
                    <option value="">الكل</option>
                    <option value="yes">لديه رقم تتبع</option>
                    <option value="no">بدون رقم تتبع</option>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="border-b border-zinc-100 pb-4">
            <SectionHeader title="الفريق" section="team" />
            {expandedSections.team && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
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
            )}
          </div>

          <div className="pb-4">
            <SectionHeader title="فلاتر متقدمة" section="advanced" />
            {expandedSections.advanced && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    المنتج
                  </label>
                  <Select
                    value={filters.product_id || ''}
                    onChange={(e) => handleChange('product_id', e.target.value)}
                  >
                    <option value="">الكل</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name_ar} {product.sku ? `(${product.sku})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    حالة التحصيل
                  </label>
                  <Select
                    value={filters.collection_status || ''}
                    onChange={(e) => handleChange('collection_status', e.target.value)}
                  >
                    {COLLECTION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    مصدر الطلب
                  </label>
                  <Select
                    value={filters.order_source || ''}
                    onChange={(e) => handleChange('order_source', e.target.value)}
                  >
                    {ORDER_SOURCES.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.is_late || false}
                      onChange={(e) => handleChange('is_late', e.target.checked || undefined)}
                      className="rounded border-zinc-300"
                    />
                    <span className="text-sm text-zinc-700">الطلبات المتأخرة فقط</span>
                  </label>
                </div>

                {filters.is_late && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                      متأخرة أكثر من (أيام)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={filters.late_days || 5}
                      onChange={(e) => handleChange('late_days', parseInt(e.target.value) || 5)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-4 flex gap-3">
          <Button onClick={onClear} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 ml-2" />
            مسح الفلاتر
          </Button>
          <Button onClick={onClose} variant="primary" className="flex-1">
            تطبيق
          </Button>
        </div>
      </div>
    </>
  );
}
