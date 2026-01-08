import React, { useMemo } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package,
  Truck, AlertCircle, DollarSign, RefreshCw
} from 'lucide-react';
import { useOrdersList } from '@/hooks/useOrdersList';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/common/Skeleton';

function formatCurrency(amount: number, currency: string = 'EGP'): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Dashboard() {
  const { currentBusiness } = useBusiness();
  const { orders, isLoading } = useOrdersList();

  // --- 1. Calculate Metrics ---
  const metrics = useMemo(() => {
    if (!orders.length) return null;

    const totalOrders = orders.length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const returned = orders.filter(o => o.status === 'returned').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    // Approximate profit (assuming 30% margin if cost not set - placeholder logic)
    const netProfit = orders.reduce((sum, o) => sum + ((o.total_amount || 0) - (o.shipping_cost || 0) - (o.products?.cost_price || 0)), 0);

    const deliveryRate = totalOrders ? Math.round((delivered / totalOrders) * 100) : 0;
    const returnRate = totalOrders ? Math.round((returned / totalOrders) * 100) : 0;

    return { totalOrders, totalRevenue, netProfit, deliveryRate, returnRate };
  }, [orders]);

  // --- 2. Prepare Chart Data ---
  const chartData = useMemo(() => {
    if (!orders.length) return [];
    // Group by Date (Simple implementation)
    const grouped = orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toLocaleDateString('en-GB'); // DD/MM/YYYY
      if (!acc[date]) acc[date] = { date, sales: 0, profit: 0 };
      acc[date].sales += order.total_amount || 0;
      acc[date].profit += ((order.total_amount || 0) - (order.shipping_cost || 0));
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped).slice(-7); // Last 7 days
  }, [orders]);

  const statusData = useMemo(() => {
    const statuses = { delivered: 0, returned: 0, pending: 0, shipping: 0 };
    orders.forEach(o => {
      if (o.status === 'delivered') statuses.delivered++;
      else if (o.status === 'returned') statuses.returned++;
      else if (o.status === 'pending') statuses.pending++;
      else statuses.shipping++;
    });
    return [
      { name: 'تم التسليم', value: statuses.delivered, color: '#10B981' }, // Emerald
      { name: 'مرتجع', value: statuses.returned, color: '#EF4444' },     // Red
      { name: 'قيد الشحن', value: statuses.shipping, color: '#3B82F6' }, // Blue
      { name: 'معلق', value: statuses.pending, color: '#F59E0B' },       // Amber
    ].filter(d => d.value > 0);
  }, [orders]);

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">نظرة عامة</h1>
          <p className="text-sm text-gray-500">مرحباً بك في {currentBusiness?.name || 'متجرك'}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="صافي الربح"
          value={formatCurrency(metrics?.netProfit || 0, currentBusiness?.currency)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          trend="up"
          color="emerald"
        />
        <StatCard
          title="نسبة التسليم"
          value={`${metrics?.deliveryRate || 0}%`}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          trend={metrics?.deliveryRate && metrics.deliveryRate > 50 ? 'up' : 'down'}
          color="blue"
        />
        <StatCard
          title="إجمالي الطلبات"
          value={metrics?.totalOrders || 0}
          icon={<Truck className="w-5 h-5 text-gray-600" />}
          color="gray"
        />
        <StatCard
          title="نسبة المرتجع"
          value={`${metrics?.returnRate || 0}%`}
          icon={<RefreshCw className="w-5 h-5 text-red-600" />}
          trend={metrics?.returnRate && metrics.returnRate > 20 ? 'down' : 'up'}
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (Sales) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">نمو المبيعات والأرباح</h3>
          <div className="h-80 w-full" dir="ltr">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="المبيعات" />
                  <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fillOpacity={0} fill="transparent" name="الربح" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">لا توجد بيانات كافية للرسم البياني</div>
            )}
          </div>
        </div>

        {/* Status Chart (Donut) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">توزيع حالات الطلبات</h3>
          <div className="h-64 w-full" dir="ltr">
             {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400">لا توجد طلبات</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Stat Cards
function StatCard({ title, value, icon, trend, color }: any) {
  return (
    <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-4 flex items-center text-xs ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          <span className="font-medium">{trend === 'up' ? 'تحسن' : 'تراجع'}</span>
          <span className="text-gray-400 mx-1">مقارنة بالفترة السابقة</span>
        </div>
      )}
    </Card>
  );
}
