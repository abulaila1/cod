import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import type { ReportRow, ReportGroupBy } from '@/types/reports';
import { Eye, ArrowUpDown } from 'lucide-react';

interface ReportsTableProps {
  rows: ReportRow[];
  groupBy: ReportGroupBy;
  filters: any;
}

export function ReportsTable({ rows, groupBy, filters }: ReportsTableProps) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'net_profit' | 'gross_sales' | 'delivery_rate'>('net_profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const sortedRows = [...rows].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * multiplier;
  });

  const handleSort = (field: 'net_profit' | 'gross_sales' | 'delivery_rate') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const handleViewOrders = (row: ReportRow) => {
    const params = new URLSearchParams();
    params.set('date_from', row.date_from);
    params.set('date_to', row.date_to);

    if (filters.country_id) params.set('country_id', filters.country_id);
    if (filters.carrier_id) params.set('carrier_id', filters.carrier_id);
    if (filters.employee_id) params.set('employee_id', filters.employee_id);
    if (filters.status_id) params.set('status_id', filters.status_id);
    if (filters.product_id) params.set('product_id', filters.product_id);

    navigate(`/app/orders?${params.toString()}`);
  };

  const getDeliveryRateColor = (rate: number): string => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                الفترة
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
              <th
                className="px-6 py-4 text-right text-xs font-medium text-zinc-600 cursor-pointer hover:bg-zinc-100"
                onClick={() => handleSort('delivery_rate')}
              >
                <div className="flex items-center justify-end gap-2">
                  نسبة التسليم
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium text-zinc-600 cursor-pointer hover:bg-zinc-100"
                onClick={() => handleSort('gross_sales')}
              >
                <div className="flex items-center justify-end gap-2">
                  الإيرادات
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium text-zinc-600 cursor-pointer hover:bg-zinc-100"
                onClick={() => handleSort('net_profit')}
              >
                <div className="flex items-center justify-end gap-2">
                  صافي الربح
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                متوسط قيمة الطلب
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              sortedRows.map((row, index) => (
                <tr key={index} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-950">
                    {row.period_label}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-950">
                    {row.total_orders}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    {row.delivered_orders}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {row.return_orders}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getDeliveryRateColor(row.delivery_rate)}`}>
                      {formatPercent(row.delivery_rate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-950">
                    {formatCurrency(row.gross_sales)} ج.م
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-bold ${
                        row.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(row.net_profit)} ج.م
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-950">
                    {formatCurrency(row.aov)} ج.م
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOrders(row)}
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
