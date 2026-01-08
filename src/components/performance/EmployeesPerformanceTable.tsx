import { Card, Badge } from '@/components/ui';
import { Trophy, TrendingUp } from 'lucide-react';
import type { PerformanceBreakdown } from '@/types/performance';

interface EmployeesPerformanceTableProps {
  data: PerformanceBreakdown[];
  isLoading: boolean;
}

export function EmployeesPerformanceTable({ data, isLoading }: EmployeesPerformanceTableProps) {
  const formatPercent = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const calculateBonus = (deliveryRate: number, totalOrders: number): number => {
    let bonus = 0;

    if (deliveryRate >= 80 && totalOrders >= 100) {
      bonus = 1000;
    } else if (deliveryRate >= 70 && totalOrders >= 50) {
      bonus = 500;
    } else if (deliveryRate >= 60 && totalOrders >= 30) {
      bonus = 300;
    } else if (deliveryRate >= 50 && totalOrders >= 20) {
      bonus = 150;
    }

    return bonus;
  };

  const getDeliveryRateColor = (rate: number): string => {
    if (rate >= 70) return 'text-green-600 font-bold';
    if (rate >= 50) return 'text-yellow-600 font-semibold';
    return 'text-red-600';
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
                #
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                الموظف
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                الطلبات المؤكدة
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                نسبة التأكيد
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                نسبة التسليم النهائية
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                المكافأة
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const confirmationRate = 100;
                const bonus = calculateBonus(item.delivery_rate, item.total_orders);
                const isTopPerformer = index < 3 && item.delivery_rate >= 70;

                return (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-600">{index + 1}</span>
                        {isTopPerformer && (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-950">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-950">
                      {item.total_orders}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-green-600 font-semibold">
                        {formatPercent(confirmationRate)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getDeliveryRateColor(item.delivery_rate)}`}>
                          {formatPercent(item.delivery_rate)}
                        </span>
                        {item.delivery_rate >= 70 && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {bonus > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 font-semibold">
                          {formatCurrency(bonus)} ج.م
                        </Badge>
                      ) : (
                        <span className="text-sm text-zinc-500">-</span>
                      )}
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
