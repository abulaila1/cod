import { Package, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RecentOrder } from '@/services/analytics.service';

interface RecentOrdersProps {
  orders: RecentOrder[];
  formatCurrency: (value: number) => string;
}

export function RecentOrders({ orders, formatCurrency }: RecentOrdersProps) {
  if (!orders.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Package className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">لا توجد طلبات حتى الآن</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-10 rounded-full"
              style={{ backgroundColor: order.status_color }}
            />
            <div>
              <p className="text-sm font-medium text-gray-800">{order.customer_name}</p>
              <p className="text-xs text-gray-500">{order.tracking_number}</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">{formatCurrency(order.revenue)}</p>
            <p
              className="text-xs font-medium"
              style={{ color: order.status_color }}
            >
              {order.status_name}
            </p>
          </div>
        </div>
      ))}

      <Link
        to="/orders"
        className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
      >
        عرض كل الطلبات
        <ArrowLeft className="w-4 h-4" />
      </Link>
    </div>
  );
}
