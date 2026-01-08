import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Button, Select, DateRangePicker } from '@/components/ui';
import { SkeletonCard } from '@/components/common/Skeleton';
import { useBusiness } from '@/contexts/BusinessContext';
import { MetricsService, type MetricsFilters, type KPIs } from '@/domain/metrics';
import { EntitiesService } from '@/services';
import type { Country, Carrier, Employee } from '@/types/domain';
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
} from 'lucide-react';

export function Dashboard() {
  const { currentBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [filters, setFilters] = useState<MetricsFilters>({
    date_from: sevenDaysAgo.toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    include_ad_cost: true,
    delivered_denominator: 'delivered',
  });

  useEffect(() => {
    if (currentBusiness) {
      loadData();
      loadFiltersOptions();
    }
  }, [currentBusiness]);

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [filters, currentBusiness]);

  const loadData = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const data = await MetricsService.getKpis(currentBusiness.id, filters);
      setKpis(data);
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiltersOptions = async () => {
    if (!currentBusiness) return;

    try {
      const [countriesData, carriersData, employeesData] = await Promise.all([
        EntitiesService.getCountries(currentBusiness.id),
        EntitiesService.getCarriers(currentBusiness.id),
        EntitiesService.getEmployees(currentBusiness.id),
      ]);

      setCountries(countriesData);
      setCarriers(carriersData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ar-EG').format(Math.round(num));
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-950 mb-2">لوحة التحكم</h1>
        <p className="text-zinc-600">نظرة شاملة على أداء عملك</p>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                الفترة الزمنية
              </label>
              <DateRangePicker
                startDate={filters.date_from}
                endDate={filters.date_to}
                onStartDateChange={(date) =>
                  setFilters({ ...filters, date_from: date })
                }
                onEndDateChange={(date) => setFilters({ ...filters, date_to: date })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                الدولة
              </label>
              <Select
                value={filters.country_id || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    country_id: e.target.value || undefined,
                  })
                }
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
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    carrier_id: e.target.value || undefined,
                  })
                }
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
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    employee_id: e.target.value || undefined,
                  })
                }
              >
                <option value="">الكل</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name_ar}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !kpis ? (
        <div className="text-center py-12">
          <p className="text-zinc-600">فشل تحميل البيانات</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card hover>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold text-zinc-950">
                    {formatNumber(kpis.total_orders)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">تم التوصيل</p>
                  <p className="text-3xl font-bold text-zinc-950">
                    {formatNumber(kpis.delivered_orders)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">قيد التنفيذ</p>
                  <p className="text-3xl font-bold text-zinc-950">
                    {formatNumber(kpis.active_orders)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">المرتجع</p>
                  <p className="text-3xl font-bold text-zinc-950">
                    {formatNumber(kpis.return_orders)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">نسبة التسليم</p>
                  <p className="text-3xl font-bold text-zinc-950">
                    {formatPercentage(kpis.delivery_rate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">نسبة المرتجع</p>
                  <p className="text-3xl font-bold text-zinc-950">
                    {formatPercentage(kpis.return_rate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">صافي الربح</p>
                  <p className="text-3xl font-bold text-zinc-950">
                    {formatCurrency(kpis.net_profit)} ج.م
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-sky-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">متوسط قيمة الطلب</p>
                  <p className="text-3xl font-bold text-zinc-950">
                    {formatCurrency(kpis.aov)} ج.م
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-zinc-950">ملخص الأداء</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold text-zinc-950">
                    {formatCurrency(kpis.gross_sales)} ج.م
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">تكلفة البضاعة</p>
                  <p className="text-2xl font-bold text-zinc-950">
                    {formatCurrency(kpis.total_cogs)} ج.م
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">تكلفة الشحن</p>
                  <p className="text-2xl font-bold text-zinc-950">
                    {formatCurrency(kpis.total_shipping_cost)} ج.م
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
