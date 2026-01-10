import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Users, TrendingUp, Star } from 'lucide-react';
import type { CustomerPerformance } from '@/types/reports';

interface CustomersTabProps {
  customers: CustomerPerformance[];
  isLoading: boolean;
}

export function CustomersTab({ customers, isLoading }: CustomersTabProps) {
  const { formatCurrency } = useBusiness();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const newCustomers = customers.filter((c) => !c.is_repeat);
  const repeatCustomers = customers.filter((c) => c.is_repeat);
  const topCustomers = [...customers].sort((a, b) => b.lifetime_value - a.lifetime_value).slice(0, 10);

  const totalRevenue = customers.reduce((sum, c) => sum + c.total_revenue, 0);
  const avgLTV = customers.length > 0 ? totalRevenue / customers.length : 0;
  const repeatRate = customers.length > 0 ? (repeatCustomers.length / customers.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي العملاء</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {newCustomers.length} جديد، {repeatCustomers.length} مكرر
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">متوسط القيمة الدائمة</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgLTV)}</p>
              <p className="text-xs text-gray-500 mt-1">لكل عميل</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">معدل تكرار الشراء</p>
              <p className="text-2xl font-bold text-gray-900">{repeatRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{repeatCustomers.length} عميل مكرر</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">من جميع العملاء</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          أفضل 10 عملاء
        </h3>
        <div className="space-y-3">
          {topCustomers.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-gray-500">
                    {customer.phone} • {customer.city_name || 'غير محدد'}
                  </p>
                </div>
              </div>
              <div className="text-left mr-4">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(customer.lifetime_value)}</p>
                <p className="text-xs text-gray-500">{customer.total_orders} طلب</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل جميع العملاء</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <th className="text-right">الاسم</th>
                <th className="text-right">الهاتف</th>
                <th className="text-right">المدينة</th>
                <th className="text-center">عدد الطلبات</th>
                <th className="text-right">إجمالي الإيرادات</th>
                <th className="text-right">متوسط قيمة الطلب</th>
                <th className="text-center">نوع العميل</th>
                <th className="text-right">آخر طلب</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-medium">{customer.name}</td>
                  <td className="text-gray-600">{customer.phone || '-'}</td>
                  <td className="text-gray-600">{customer.city_name || '-'}</td>
                  <td className="text-center">{customer.total_orders}</td>
                  <td className="font-semibold">{formatCurrency(customer.total_revenue)}</td>
                  <td>{formatCurrency(customer.avg_order_value)}</td>
                  <td className="text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.is_repeat
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {customer.is_repeat ? 'مكرر' : 'جديد'}
                    </span>
                  </td>
                  <td className="text-gray-600">
                    {new Date(customer.last_order_date).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
