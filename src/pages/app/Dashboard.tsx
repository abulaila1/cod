import { useState, useEffect } from 'react';
// import {
//   AreaChart,
//   Area,
//   PieChart,
//   Pie,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
//   CartesianGrid,
// } from 'recharts';
import clsx from 'clsx';
import { Card, DateRangePicker, Select } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { MetricsService, type MetricsFilters, type KPIs, type TimeSeriesDataPoint } from '@/domain/metrics';
import { EntitiesService } from '@/services';
import type { Country, Carrier, Employee, ProductBreakdown, CountryBreakdown } from '@/types/domain';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  ShoppingCart,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  delivered: '#10b981',
  pending: '#f59e0b',
  canceled: '#ef4444',
  rto: '#dc2626',
  out_for_delivery: '#3b82f6',
  default: '#6b7280',
};

export function Dashboard() {
  const { currentBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<ProductBreakdown[]>([]);
  const [topCountries, setTopCountries] = useState<CountryBreakdown[]>([]);

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
      const [kpisData, timeSeriesData, statusData, breakdowns] = await Promise.all([
        MetricsService.getKpis(currentBusiness.id, filters),
        MetricsService.getTimeSeries(currentBusiness.id, filters),
        MetricsService.getStatusDistribution(currentBusiness.id, filters),
        MetricsService.getBreakdowns(currentBusiness.id, filters),
      ]);

      setKpis(kpisData);
      setTimeSeries(timeSeriesData);
      setStatusDistribution(statusData);
      setTopProducts(breakdowns.by_product.slice(0, 5));
      setTopCountries(breakdowns.by_country.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ar-EG').format(Math.round(num));
  };

  const setQuickDateRange = (range: 'today' | 'week' | 'month') => {
    const end = new Date().toISOString().split('T')[0];
    let start: string;

    if (range === 'today') {
      start = end;
    } else if (range === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split('T')[0];
    }

    setFilters({ ...filters, date_from: start, date_to: end });
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  const deliveryRateColor = kpis && kpis.delivery_rate >= 70 ? 'text-emerald-600' : 'text-amber-600';
  const returnRateColor = kpis && kpis.return_rate <= 20 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 mb-1">لوحة التحكم</h1>
          <p className="text-sm text-zinc-600">نظرة شاملة على أداء عملك</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickDateRange('today')}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            اليوم
          </button>
          <button
            onClick={() => setQuickDateRange('week')}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => setQuickDateRange('month')}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            آخر 30 يوم
          </button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-zinc-50 border-zinc-200">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                الفترة الزمنية
              </label>
              <DateRangePicker
                startDate={filters.date_from}
                endDate={filters.date_to}
                onStartDateChange={(date) => setFilters({ ...filters, date_from: date })}
                onEndDateChange={(date) => setFilters({ ...filters, date_to: date })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">الدولة</label>
              <Select
                value={filters.country_id || ''}
                onChange={(e) =>
                  setFilters({ ...filters, country_id: e.target.value || undefined })
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
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                شركة الشحن
              </label>
              <Select
                value={filters.carrier_id || ''}
                onChange={(e) =>
                  setFilters({ ...filters, carrier_id: e.target.value || undefined })
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
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">الموظف</label>
              <Select
                value={filters.employee_id || ''}
                onChange={(e) =>
                  setFilters({ ...filters, employee_id: e.target.value || undefined })
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
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-zinc-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-zinc-200 rounded w-32"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : !kpis ? (
        <div className="text-center py-12">
          <p className="text-zinc-600">فشل تحميل البيانات</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <DollarSign className="h-5 w-5 text-emerald-700" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xs font-medium text-emerald-900 mb-1">صافي الربح</p>
                <p className="text-2xl font-bold text-emerald-950">
                  {formatCurrency(kpis.net_profit)} <span className="text-sm font-normal">ج.م</span>
                </p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className={clsx('flex items-center gap-1', deliveryRateColor)}>
                    <span className="text-xs font-semibold">{kpis.delivery_rate.toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-blue-900 mb-1">نسبة التسليم</p>
                <p className="text-2xl font-bold text-blue-950">
                  {formatNumber(kpis.delivered_orders)} <span className="text-sm font-normal">طلب</span>
                </p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-violet-100 rounded-xl">
                    <ShoppingCart className="h-5 w-5 text-violet-700" />
                  </div>
                  <Calendar className="h-4 w-4 text-violet-600" />
                </div>
                <p className="text-xs font-medium text-violet-900 mb-1">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-violet-950">{formatNumber(kpis.total_orders)}</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-red-50 border-rose-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-rose-100 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-rose-700" />
                  </div>
                  <div className={clsx('flex items-center gap-1', returnRateColor)}>
                    <span className="text-xs font-semibold">{kpis.return_rate.toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-rose-900 mb-1">نسبة المرتجع</p>
                <p className="text-2xl font-bold text-rose-950">
                  {formatNumber(kpis.return_orders)} <span className="text-sm font-normal">طلب</span>
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 shadow-sm">
              <div className="p-5 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-950">المبيعات والأرباح</h3>
                <p className="text-xs text-zinc-500 mt-0.5">تطور الإيرادات والربح الصافي</p>
              </div>
              <div className="p-5">
                <div className="h-[280px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-700 mb-2">Charts Loading...</p>
                    <p className="text-xs text-zinc-500">تحميل الرسوم البيانية...</p>
                  </div>
                </div>
                {/* Temporarily disabled - recharts dependency needs installation */}
                {/* {timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={timeSeries}>
                      ...
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-zinc-500">
                    لا توجد بيانات لعرض الرسم البياني
                  </div>
                )} */}
              </div>
            </Card>

            <Card className="shadow-sm">
              <div className="p-5 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-950">توزيع حالات الطلبات</h3>
                <p className="text-xs text-zinc-500 mt-0.5">نسبة الطلبات حسب الحالة</p>
              </div>
              <div className="p-5">
                {statusDistribution.length > 0 ? (
                  <>
                    <div className="h-[200px] flex items-center justify-center mb-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-zinc-700 mb-2">Pie Chart Loading...</p>
                        <p className="text-xs text-zinc-500">تحميل الرسم البياني...</p>
                      </div>
                    </div>
                    {/* Temporarily disabled - recharts */}
                    {/* <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        ...
                      </PieChart>
                    </ResponsiveContainer> */}
                    <div className="space-y-2">
                      {statusDistribution.map((status) => (
                        <div key={status.status_key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  STATUS_COLORS[status.status_key] || STATUS_COLORS.default,
                              }}
                            />
                            <span className="text-xs text-zinc-700">{status.label_ar}</span>
                          </div>
                          <span className="text-xs font-semibold text-zinc-950">
                            {status.percentage.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-60 flex items-center justify-center text-sm text-zinc-500">
                    لا توجد بيانات لعرضها
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <div className="p-5 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-950">أفضل المنتجات</h3>
                <p className="text-xs text-zinc-500 mt-0.5">المنتجات الأكثر ربحية</p>
              </div>
              <div className="p-5">
                {topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {topProducts.map((product) => (
                      <div
                        key={product.product_id}
                        className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-950">
                            {product.name_ar}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {formatNumber(product.total_items)} قطعة • {formatNumber(product.total_orders)} طلب
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-emerald-700">
                            {formatCurrency(product.profit)} ج.م
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {product.delivery_rate.toFixed(0)}% تسليم
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-zinc-500">
                    لا توجد بيانات
                  </div>
                )}
              </div>
            </Card>

            <Card className="shadow-sm">
              <div className="p-5 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-950">أفضل المحافظات</h3>
                <p className="text-xs text-zinc-500 mt-0.5">المحافظات الأعلى في التسليم</p>
              </div>
              <div className="p-5">
                {topCountries.length > 0 ? (
                  <div className="space-y-3">
                    {topCountries.map((country) => (
                      <div key={country.country_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-950">
                            {country.name_ar}
                          </span>
                          <span className="text-sm font-bold text-zinc-950">
                            {country.delivery_rate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'absolute top-0 right-0 h-full rounded-full transition-all',
                              country.delivery_rate >= 70
                                ? 'bg-emerald-500'
                                : country.delivery_rate >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            )}
                            style={{ width: `${country.delivery_rate}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{formatNumber(country.delivered)} / {formatNumber(country.total)} طلب</span>
                          <span>{formatCurrency(country.net_profit)} ج.م</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-zinc-500">
                    لا توجد بيانات
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white shadow-sm">
              <div className="p-5">
                <p className="text-xs font-medium text-zinc-600 mb-2">إجمالي المبيعات</p>
                <p className="text-xl font-bold text-zinc-950">
                  {formatCurrency(kpis.gross_sales)} <span className="text-sm font-normal text-zinc-600">ج.م</span>
                </p>
              </div>
            </Card>
            <Card className="bg-white shadow-sm">
              <div className="p-5">
                <p className="text-xs font-medium text-zinc-600 mb-2">تكلفة البضاعة</p>
                <p className="text-xl font-bold text-zinc-950">
                  {formatCurrency(kpis.total_cogs)} <span className="text-sm font-normal text-zinc-600">ج.م</span>
                </p>
              </div>
            </Card>
            <Card className="bg-white shadow-sm">
              <div className="p-5">
                <p className="text-xs font-medium text-zinc-600 mb-2">تكلفة الشحن</p>
                <p className="text-xl font-bold text-zinc-950">
                  {formatCurrency(kpis.total_shipping_cost)} <span className="text-sm font-normal text-zinc-600">ج.م</span>
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
