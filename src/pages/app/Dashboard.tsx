import { useMemo } from 'react';
import {
  Package, Truck, DollarSign, RefreshCw
} from 'lucide-react';
import { useOrdersList } from '@/hooks/useOrdersList';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/common/Skeleton';

export function Dashboard() {
  const { currentBusiness, formatCurrency } = useBusiness();
  const { orders, isLoading } = useOrdersList(currentBusiness?.id);

  const metrics = useMemo(() => {
    const safeOrders = orders || [];

    const totalOrders = safeOrders.length;
    const delivered = safeOrders.filter(o => o.status?.counts_as_delivered).length;
    const returned = safeOrders.filter(o => o.status?.counts_as_return).length;

    const totalRevenue = safeOrders.reduce((sum, o) => sum + (Number(o.revenue) || 0), 0);
    const netProfit = safeOrders.reduce((sum, o) => sum + ((Number(o.revenue) || 0) - (Number(o.shipping_cost) || 0) - (Number(o.cost) || 0)), 0);

    const deliveryRate = totalOrders ? Math.round((delivered / totalOrders) * 100) : 0;
    const returnRate = totalOrders ? Math.round((returned / totalOrders) * 100) : 0;

    return { totalOrders, totalRevenue, netProfit, deliveryRate, returnRate };
  }, [orders]);

  const chartData = useMemo(() => {
    const safeOrders = orders || [];
    if (!safeOrders.length) return [];

    const grouped: Record<string, number> = {};
    safeOrders.forEach((o) => {
      const date = new Date(o.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + (Number(o.revenue) || 0);
    });

    return Object.entries(grouped).slice(-7).map(([date, sales]) => ({ date, sales }));
  }, [orders]);

  const statusData = useMemo(() => {
    const safeOrders = orders || [];
    const stats = { delivered: 0, returned: 0, active: 0 };
    safeOrders.forEach(o => {
      if (o.status?.counts_as_delivered) stats.delivered++;
      else if (o.status?.counts_as_return) stats.returned++;
      else if (o.status?.counts_as_active) stats.active++;
    });

    const total = stats.delivered + stats.returned + stats.active;
    return { ...stats, total: total || 1 };
  }, [orders]);

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  const maxSales = Math.max(...chartData.map(d => d.sales), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">نظرة عامة</h1>
          <p className="text-sm text-gray-500">مرحباً بك في {currentBusiness?.name || 'لوحة التحكم'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="صافي الربح"
          value={formatCurrency(metrics?.netProfit || 0)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          title="إجمالي الطلبات"
          value={metrics?.totalOrders || 0}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="نسبة التسليم"
          value={`${metrics?.deliveryRate || 0}%`}
          icon={<Truck className="w-5 h-5 text-teal-600" />}
          color="teal"
        />
        <StatCard
          title="نسبة المرتجع"
          value={`${metrics?.returnRate || 0}%`}
          icon={<RefreshCw className="w-5 h-5 text-red-600" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">الأداء المالي</h3>
          <div className="h-64">
            {chartData.length > 0 ? (
              <div className="flex items-end justify-around h-full gap-2 pt-4">
                {chartData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full flex justify-center mb-2">
                      <div
                        className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500"
                        style={{ height: `${(item.sales / maxSales) * 180}px` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 truncate max-w-full">{item.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                لا توجد بيانات متاحة
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">حالة الطلبات</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="12"
                  strokeDasharray={`${(statusData.delivered / statusData.total) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="12"
                  strokeDasharray={`${(statusData.returned / statusData.total) * 251.2} 251.2`}
                  strokeDashoffset={`-${(statusData.delivered / statusData.total) * 251.2}`}
                  strokeLinecap="round"
                />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="12"
                  strokeDasharray={`${(statusData.active / statusData.total) * 251.2} 251.2`}
                  strokeDashoffset={`-${((statusData.delivered + statusData.returned) / statusData.total) * 251.2}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">{statusData.total > 1 ? statusData.total : 0}</span>
              </div>
            </div>
            <div className="mt-6 space-y-2 w-full">
              <LegendItem color="bg-emerald-500" label="تم التسليم" value={statusData.delivered} />
              <LegendItem color="bg-red-500" label="مرتجع" value={statusData.returned} />
              <LegendItem color="bg-blue-500" label="نشط" value={statusData.active} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  const bgColors: Record<string, string> = {
    emerald: 'bg-emerald-50',
    blue: 'bg-blue-50',
    teal: 'bg-teal-50',
    red: 'bg-red-50',
  };
  return (
    <Card className="p-6 border-none shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${bgColors[color] || 'bg-gray-50'}`}>{icon}</div>
      </div>
    </Card>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
