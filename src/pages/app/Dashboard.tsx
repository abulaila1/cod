import { useMemo } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  Package, Truck, DollarSign, RefreshCw
} from 'lucide-react';
import { useOrdersList } from '@/hooks/useOrdersList';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/common/Skeleton';

const formatCurrency = (amount: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

export function Dashboard() {
  const { currentBusiness } = useBusiness();
  const { orders, isLoading } = useOrdersList(currentBusiness?.id);

  const metrics = useMemo(() => {
    const safeOrders = orders || [];

    const totalOrders = safeOrders.length;
    const delivered = safeOrders.filter(o => o.status?.counts_as_delivered).length;
    const returned = safeOrders.filter(o => o.status?.counts_as_return).length;

    const totalRevenue = safeOrders.reduce((sum, o) => sum + (Number(o.revenue) || 0), 0);
    const netProfit = safeOrders.reduce((sum, o) => sum + ((Number(o.revenue) || 0) - (Number(o.shipping_cost) || 0) - (Number(o.cogs) || 0)), 0);

    const deliveryRate = totalOrders ? Math.round((delivered / totalOrders) * 100) : 0;
    const returnRate = totalOrders ? Math.round((returned / totalOrders) * 100) : 0;

    return { totalOrders, totalRevenue, netProfit, deliveryRate, returnRate };
  }, [orders]);

  const chartData = useMemo(() => {
    const safeOrders = orders || [];
    if (!safeOrders.length) return [];

    return safeOrders.slice(0, 10).map((o) => ({
      date: new Date(o.created_at).toLocaleDateString(),
      sales: Number(o.revenue) || 0,
      profit: (Number(o.revenue) || 0) - (Number(o.cogs) || 0)
    }));
  }, [orders]);

  const statusData = useMemo(() => {
    const safeOrders = orders || [];
    const stats = { delivered: 0, returned: 0, active: 0 };
    safeOrders.forEach(o => {
      if (o.status?.counts_as_delivered) stats.delivered++;
      else if (o.status?.counts_as_return) stats.returned++;
      else if (o.status?.counts_as_active) stats.active++;
    });

    const data = [
      { name: 'تم التسليم', value: stats.delivered, color: '#10B981' },
      { name: 'مرتجع', value: stats.returned, color: '#EF4444' },
      { name: 'نشط', value: stats.active, color: '#3B82F6' },
    ].filter(d => d.value > 0);

    return data.length > 0 ? data : [{ name: 'لا يوجد بيانات', value: 1, color: '#E5E7EB' }];
  }, [orders]);

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

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
          value={formatCurrency(metrics?.netProfit || 0, currentBusiness?.currency)}
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
          icon={<Truck className="w-5 h-5 text-purple-600" />}
          color="purple"
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
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">حالة الطلبات</h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="p-6 border-none shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-50`}>{icon}</div>
      </div>
    </Card>
  );
}
