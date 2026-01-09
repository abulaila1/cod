import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { TopProduct } from '@/services/analytics.service';

interface TopProductsChartProps {
  products: TopProduct[];
  formatCurrency: (value: number) => string;
}

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export function TopProductsChart({ products, formatCurrency }: TopProductsChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const item = payload[0].payload;

    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-800 mb-2">{item.name}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">الإيرادات:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">عدد المبيعات:</span>
            <span className="font-semibold text-gray-900">{item.totalSold}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">نسبة التوصيل:</span>
            <span className="font-semibold text-emerald-600">{item.deliveryRate.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  };

  if (!products.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        لا توجد منتجات مباعة في هذه الفترة
      </div>
    );
  }

  const chartData = products.map((p, i) => ({
    ...p,
    shortName: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
    fill: colors[i % colors.length]
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
              return value;
            }}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fill: '#374151', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
          <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={24}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
