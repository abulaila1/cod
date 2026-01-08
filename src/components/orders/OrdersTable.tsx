import { Button, Card, Select } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import type { OrderWithRelations, Status } from '@/types/domain';
import { Eye } from 'lucide-react';

interface OrdersTableProps {
  orders: OrderWithRelations[];
  statuses: Status[];
  selectedOrderIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOrder: (orderId: string, checked: boolean) => void;
  onStatusChange: (orderId: string, statusId: string) => void;
  onViewDetails: (orderId: string) => void;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function OrdersTable({
  orders,
  statuses,
  selectedOrderIds,
  onSelectAll,
  onSelectOrder,
  onStatusChange,
  onViewDetails,
  currentPage,
  pageSize,
  totalCount,
  pageCount,
  onPageChange,
  onPageSizeChange,
}: OrdersTableProps) {
  const { formatCurrency } = useBusiness();

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateNetProfit = (order: OrderWithRelations): number => {
    return order.profit || (order.revenue - order.cost - order.shipping_cost);
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-right">
                <input
                  type="checkbox"
                  checked={selectedOrderIds.length === orders.length && orders.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-zinc-300"
                />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                رقم الطلب
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                التاريخ
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                الحالة
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                الدولة
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                شركة الشحن
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                الموظف
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                الإيراد
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                التكلفة
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                الربح
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-zinc-50 transition-colors cursor-pointer"
                onClick={() => onViewDetails(order.id)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.id)}
                    onChange={(e) => onSelectOrder(order.id, e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-mono text-zinc-950">
                  #{order.id.substring(0, 8)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {formatDate(order.order_date)}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={order.status_id}
                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                    className="text-xs py-1"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name_ar}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-950">
                  {order.country?.name_ar || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-950">
                  {order.carrier?.name_ar || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-950">
                  {order.employee?.name_ar || '-'}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-zinc-950">
                  {formatCurrency(order.revenue)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {formatCurrency(order.cost)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-green-600">
                  {formatCurrency(calculateNetProfit(order))}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(order.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600">
            عرض {orders.length} من {totalCount} طلب
          </span>
          <Select
            value={pageSize.toString()}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
            }}
            className="text-sm py-1"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-zinc-600">
            صفحة {currentPage} من {pageCount || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === pageCount || pageCount === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            التالي
          </Button>
        </div>
      </div>
    </Card>
  );
}
