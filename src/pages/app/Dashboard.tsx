import { useState, useEffect, useCallback } from 'react';
import {
  Package, DollarSign, RefreshCw, Truck, TrendingUp,
  ShoppingCart, Clock, BarChart3
} from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Skeleton } from '@/components/common/Skeleton';
import {
  StatCard,
  RevenueChart,
  StatusDonut,
  TopProductsChart,
  PeriodSelector,
  RecentOrders,
  CarrierStats
} from '@/components/dashboard';
import {
  AnalyticsService,
  type DashboardStats,
  type TrendData,
  type DailyData,
  type TopProduct,
  type CarrierStat,
  type RecentOrder
} from '@/services/analytics.service';

interface AnalyticsData {
  stats: DashboardStats;
  previousStats: DashboardStats;
  dailyData: DailyData[];
  topProducts: TopProduct[];
  carriers: CarrierStat[];
  recentOrders: RecentOrder[];
  statusBreakdown: { name: string; value: number; color: string }[];
}

export function Dashboard() {
  const { currentBusiness, formatCurrency } = useBusiness();
  const [period, setPeriod] = useState('last30days');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!currentBusiness?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const dateRange = AnalyticsService.getDateRange(period);
      const prevDateRange = AnalyticsService.getPreviousPeriodRange(period);

      const [stats, previousStats, dailyData, topProducts, carriers, recentOrders, statusBreakdown] =
        await Promise.all([
          AnalyticsService.getDashboardStats(currentBusiness.id, dateRange),
          AnalyticsService.getDashboardStats(currentBusiness.id, prevDateRange),
          AnalyticsService.getDailyData(currentBusiness.id, dateRange),
          AnalyticsService.getTopProducts(currentBusiness.id, dateRange),
          AnalyticsService.getCarrierStats(currentBusiness.id, dateRange),
          AnalyticsService.getRecentOrders(currentBusiness.id),
          AnalyticsService.getStatusBreakdown(currentBusiness.id, dateRange)
        ]);

      setData({ stats, previousStats, dailyData, topProducts, carriers, recentOrders, statusBreakdown });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness?.id, period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getTrend = (current: number, previous: number): TrendData => {
    return AnalyticsService.calculateTrend(current, previous);
  };

  const getSparklineData = (key: 'revenue' | 'profit' | 'orders'): number[] => {
    if (!data?.dailyData) return [];
    return data.dailyData.slice(-7).map(d => d[key]);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalOrders: 0,
    totalRevenue: 0,
    netProfit: 0,
    deliveredOrders: 0,
    returnedOrders: 0,
    activeOrders: 0,
    deliveryRate: 0,
    returnRate: 0,
    averageOrderValue: 0,
    pendingOrders: 0
  };

  const previousStats = data?.previousStats || stats;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            مرحباً بك في {currentBusiness?.name || 'لوحة التحكم'}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="صافي الربح"
          value={formatCurrency(stats.netProfit)}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
          trend={getTrend(stats.netProfit, previousStats.netProfit)}
          sparklineData={getSparklineData('profit')}
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
          trend={getTrend(stats.totalRevenue, previousStats.totalRevenue)}
          sparklineData={getSparklineData('revenue')}
        />
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders.toLocaleString('ar-SA')}
          icon={<Package className="w-5 h-5" />}
          color="cyan"
          trend={getTrend(stats.totalOrders, previousStats.totalOrders)}
          sparklineData={getSparklineData('orders')}
        />
        <StatCard
          title="متوسط قيمة الطلب"
          value={formatCurrency(stats.averageOrderValue)}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="amber"
          trend={getTrend(stats.averageOrderValue, previousStats.averageOrderValue)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="تم التوصيل"
          value={stats.deliveredOrders.toLocaleString('ar-SA')}
          icon={<Truck className="w-5 h-5" />}
          color="teal"
          trend={getTrend(stats.deliveredOrders, previousStats.deliveredOrders)}
        />
        <StatCard
          title="نسبة التوصيل"
          value={`${stats.deliveryRate.toFixed(1)}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          color="emerald"
          trend={getTrend(stats.deliveryRate, previousStats.deliveryRate)}
        />
        <StatCard
          title="المرتجعات"
          value={stats.returnedOrders.toLocaleString('ar-SA')}
          icon={<RefreshCw className="w-5 h-5" />}
          color="red"
          trend={getTrend(stats.returnedOrders, previousStats.returnedOrders)}
        />
        <StatCard
          title="طلبات معلقة"
          value={stats.pendingOrders.toLocaleString('ar-SA')}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">الأداء المالي</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600">الإيرادات</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600">الأرباح</span>
              </div>
            </div>
          </div>
          <RevenueChart data={data?.dailyData || []} formatCurrency={formatCurrency} />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع الحالات</h3>
          <StatusDonut
            data={data?.statusBreakdown || []}
            totalOrders={stats.totalOrders}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">أفضل المنتجات</h3>
          <TopProductsChart
            products={data?.topProducts || []}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">أداء شركات الشحن</h3>
          <CarrierStats carriers={data?.carriers || []} />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">آخر الطلبات</h3>
          <RecentOrders
            orders={data?.recentOrders || []}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
}
