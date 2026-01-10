import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';
import type { AdvancedReportSummary } from '@/types/reports';

interface OverviewTabProps {
  summary: AdvancedReportSummary;
  isLoading: boolean;
}

export function OverviewTab({ summary, isLoading }: OverviewTabProps) {
  const { formatCurrency } = useBusiness();

  const kpis = [
    {
      label: 'إجمالي الإيرادات',
      value: formatCurrency(summary.gross_sales),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'صافي الربح',
      value: formatCurrency(summary.net_profit),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `هامش ${summary.profit_margin.toFixed(1)}%`,
    },
    {
      label: 'إجمالي التكاليف',
      value: formatCurrency(summary.total_cost),
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: `${summary.cost_to_revenue_ratio.toFixed(1)}% من الإيرادات`,
    },
    {
      label: 'متوسط قيمة الطلب',
      value: formatCurrency(summary.aov),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'إجمالي الطلبات',
      value: summary.total_orders.toLocaleString(),
      icon: Package,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      subtitle: `${summary.delivered_orders} مسلم`,
    },
    {
      label: 'نسبة التسليم',
      value: `${summary.delivery_rate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'نسبة المرتجعات',
      value: `${((summary.return_orders / summary.total_orders) * 100 || 0).toFixed(1)}%`,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      subtitle: `${summary.return_orders} طلب`,
    },
    {
      label: 'الطلبات النشطة',
      value: summary.active_orders.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `${summary.late_orders} متأخر`,
    },
    {
      label: 'العملاء الجدد',
      value: summary.new_customers.toLocaleString(),
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      subtitle: `${summary.repeat_customers} مكرر`,
    },
  ];

  const costBreakdown = [
    { label: 'تكلفة البضاعة', value: summary.total_cogs, color: 'bg-blue-500' },
    { label: 'تكاليف الشحن', value: summary.total_shipping, color: 'bg-orange-500' },
    { label: 'رسوم COD', value: summary.total_cod_fees, color: 'bg-yellow-500' },
    { label: 'تكاليف الإعلانات', value: summary.total_ad_cost, color: 'bg-red-500' },
  ];

  const totalCostWithAds = summary.total_cost + summary.total_ad_cost;
  const profitData = [
    { label: 'الإيرادات', value: summary.gross_sales, color: 'bg-green-500' },
    { label: 'التكاليف', value: totalCostWithAds, color: 'bg-red-500' },
    { label: 'الربح', value: summary.net_profit, color: 'bg-blue-500' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{kpi.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">تفصيل التكاليف</h3>
          <div className="space-y-3">
            {costBreakdown.map((item, index) => {
              const percentage = totalCostWithAds > 0 ? (item.value / totalCostWithAds) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm font-semibold">
              <span>إجمالي التكاليف</span>
              <span>{formatCurrency(totalCostWithAds)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">التحليل المالي</h3>
          <div className="space-y-4">
            {profitData.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${item.color}`} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">هامش الربح</span>
                <span className="text-lg font-bold text-green-600">{summary.profit_margin.toFixed(1)}%</span>
              </div>
            </div>
            {summary.total_ad_cost > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">عائد الاستثمار الإعلاني (ROAS)</span>
                <span className="text-lg font-bold text-blue-600">
                  {(summary.gross_sales / summary.total_ad_cost).toFixed(2)}x
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">COD والتحصيلات</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">المبلغ المحصل</span>
              <span className="font-semibold text-green-600">{formatCurrency(summary.cod_collected)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">المبلغ المعلق</span>
              <span className="font-semibold text-orange-600">{formatCurrency(summary.cod_pending)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">رسوم COD</span>
              <span className="font-semibold text-gray-900">{formatCurrency(summary.total_cod_fees)}</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">نسبة التحصيل</span>
                <span className="text-lg font-bold text-blue-600">{summary.collection_rate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">مؤشرات الأداء</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">نسبة التسليم الناجح</span>
                <span className="font-semibold">{summary.delivery_rate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${summary.delivery_rate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">نسبة المرتجعات</span>
                <span className="font-semibold">
                  {((summary.return_orders / summary.total_orders) * 100 || 0).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(summary.return_orders / summary.total_orders) * 100 || 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600">الطلبات المعلقة</p>
                <p className="text-xl font-bold text-gray-900">{summary.pending_orders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">الطلبات المتأخرة</p>
                <p className="text-xl font-bold text-red-600">{summary.late_orders}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
