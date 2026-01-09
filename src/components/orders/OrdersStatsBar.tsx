import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { OrdersService } from '@/services/orders.service';
import type { OrderStatistics } from '@/types/domain';
import {
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface OrdersStatsBarProps {
  businessId: string;
  currency?: string;
  onLateOrdersClick?: () => void;
}

export function OrdersStatsBar({
  businessId,
  currency = 'ر.س',
  onLateOrdersClick
}: OrdersStatsBarProps) {
  const [stats, setStats] = useState<OrderStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [businessId]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await OrdersService.getOrderStatistics(businessId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 animate-pulse rounded-lg" />
              <div className="flex-1">
                <div className="h-3 bg-zinc-100 animate-pulse rounded w-20 mb-2" />
                <div className="h-5 bg-zinc-100 animate-pulse rounded w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      label: 'طلبات اليوم',
      value: stats.today_count.toString(),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'نسبة التأكيد',
      value: `${stats.confirmation_rate}%`,
      icon: TrendingUp,
      color: stats.confirmation_rate >= 70 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600',
      iconBg: stats.confirmation_rate >= 70 ? 'bg-green-100' : 'bg-amber-100',
    },
    {
      label: 'قيمة الطلبات المعلقة',
      value: `${formatCurrency(stats.pending_value)} ${currency}`,
      icon: Clock,
      color: 'bg-cyan-50 text-cyan-600',
      iconBg: 'bg-cyan-100',
    },
    {
      label: 'طلبات متأخرة',
      value: stats.late_orders_count.toString(),
      icon: AlertTriangle,
      color: stats.late_orders_count > 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-600',
      iconBg: stats.late_orders_count > 0 ? 'bg-red-100' : 'bg-zinc-100',
      onClick: stats.late_orders_count > 0 ? onLateOrdersClick : undefined,
      alert: stats.late_orders_count > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card
            key={index}
            className={`p-4 ${item.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${item.alert ? 'ring-1 ring-red-200' : ''}`}
            onClick={item.onClick}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                <Icon className={`h-5 w-5 ${item.color.split(' ')[1]}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">{item.label}</p>
                <p className={`text-lg font-bold ${item.color.split(' ')[1]}`}>
                  {item.value}
                </p>
              </div>
              {item.alert && (
                <div className="mr-auto">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
