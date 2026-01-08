import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input } from '@/components/ui';
import type { PerformanceBreakdown, ProductPerformance } from '@/types/performance';
import { Eye, Search, TrendingUp, TrendingDown } from 'lucide-react';

interface RankingTableProps {
  data: (PerformanceBreakdown | ProductPerformance)[];
  type: 'country' | 'carrier' | 'employee' | 'product';
  dateFrom: string;
  dateTo: string;
}

export function RankingTable({ data, type, dateFrom, dateTo }: RankingTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'delivery_rate' | 'net_profit' | 'total_orders'>('net_profit');

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'delivery_rate') return b.delivery_rate - a.delivery_rate;
    if (sortBy === 'net_profit') return b.net_profit - a.net_profit;
    return b.total_orders - a.total_orders;
  });

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercent = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  const getDeliveryRateColor = (rate: number): string => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewOrders = (itemId: string) => {
    const params = new URLSearchParams();
    params.set('date_from', dateFrom);
    params.set('date_to', dateTo);

    if (type === 'country') params.set('country_id', itemId);
    if (type === 'carrier') params.set('carrier_id', itemId);
    if (type === 'employee') params.set('employee_id', itemId);

    navigate(`/app/orders?${params.toString()}`);
  };

  return (
    <Card>
      <div className="p-6 border-b border-zinc-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="net_profit">صافي الربح</option>
              <option value="delivery_rate">نسبة التسليم</option>
              <option value="total_orders">عدد الطلبات</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                #
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                {type === 'country' && 'الدولة'}
                {type === 'carrier' && 'شركة الشحن'}
                {type === 'employee' && 'الموظف'}
                {type === 'product' && 'المنتج'}
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                إجمالي الطلبات
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                تم التوصيل
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                مرتجع
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                نسبة التسليم
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                الإيرادات
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                صافي الربح
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-950">
                        {item.name}
                      </span>
                      {index < 3 && (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-950">
                    {item.total_orders}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    {item.delivered_orders}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {item.return_orders}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getDeliveryRateColor(item.delivery_rate)}`}>
                      {formatPercent(item.delivery_rate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-950">
                    {formatCurrency(item.gross_sales)} ج.م
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${item.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.net_profit)} ج.م
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOrders(item.id)}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      عرض الطلبات
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
