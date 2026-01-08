import { Star } from 'lucide-react';
import { Card } from '@/components/ui';
import type { PerformanceBreakdown } from '@/types/performance';

interface CarriersPerformanceTableProps {
  data: PerformanceBreakdown[];
  isLoading: boolean;
}

export function CarriersPerformanceTable({ data, isLoading }: CarriersPerformanceTableProps) {
  const formatPercent = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  const getDeliveryRateColor = (rate: number): string => {
    if (rate >= 30) return 'text-green-600 font-semibold';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600 font-semibold';
  };

  const getReturnRate = (item: PerformanceBreakdown): number => {
    return item.total_orders > 0 ? (item.return_orders / item.total_orders) * 100 : 0;
  };

  const getRating = (deliveryRate: number): number => {
    if (deliveryRate >= 80) return 5;
    if (deliveryRate >= 60) return 4;
    if (deliveryRate >= 40) return 3;
    if (deliveryRate >= 20) return 2;
    return 1;
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                الشركة
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                إجمالي الطلبات
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                نسبة التسليم
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                نسبة الإرجاع
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                التقييم
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const returnRate = getReturnRate(item);
                const rating = getRating(item.delivery_rate);

                return (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-950">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-950">
                      {item.total_orders}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${getDeliveryRateColor(item.delivery_rate)}`}>
                        {formatPercent(item.delivery_rate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {formatPercent(returnRate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-zinc-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-zinc-600 mr-2">
                          ({rating}/5)
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
