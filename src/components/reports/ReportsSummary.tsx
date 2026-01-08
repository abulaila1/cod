import { Card, CardHeader, CardContent } from '@/components/ui';
import type { ReportSummary } from '@/types/reports';
import { TrendingUp, TrendingDown, Package, CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface ReportsSummaryProps {
  summary: ReportSummary;
  isLoading: boolean;
}

export function ReportsSummary({ summary, isLoading }: ReportsSummaryProps) {
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

  const cards = [
    {
      title: 'إجمالي الطلبات',
      value: summary.total_orders,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'تم التوصيل',
      value: summary.delivered_orders,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'مرتجع',
      value: summary.return_orders,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'نسبة التسليم',
      value: formatPercent(summary.delivery_rate),
      icon: summary.delivery_rate >= 70 ? TrendingUp : TrendingDown,
      color: summary.delivery_rate >= 70 ? 'text-green-600' : 'text-yellow-600',
      bgColor: summary.delivery_rate >= 70 ? 'bg-green-50' : 'bg-yellow-50',
    },
    {
      title: 'إجمالي المبيعات',
      value: formatCurrency(summary.gross_sales) + ' ج.م',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'صافي الربح',
      value: formatCurrency(summary.net_profit) + ' ج.م',
      icon: summary.net_profit >= 0 ? TrendingUp : TrendingDown,
      color: summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: summary.net_profit >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent>
              <div className="h-24 bg-zinc-100 animate-pulse rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-zinc-950">{card.value}</p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
