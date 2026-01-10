import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Users, Trophy, Activity } from 'lucide-react';
import type { EmployeePerformance } from '@/types/reports';

interface EmployeesTabProps {
  employees: EmployeePerformance[];
  isLoading: boolean;
}

export function EmployeesTab({ employees, isLoading }: EmployeesTabProps) {
  const { formatCurrency } = useBusiness();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const topEmployees = [...employees].sort((a, b) => b.productivity - a.productivity).slice(0, 5);
  const topByRevenue = [...employees].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topByDeliveryRate = [...employees].sort((a, b) => b.delivery_rate - a.delivery_rate).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            الأكثر إنتاجية
          </h3>
          <div className="space-y-3">
            {topEmployees.map((employee, index) => (
              <div key={employee.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center ${
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                        : index === 2
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                        : 'bg-gray-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{employee.name}</p>
                    <p className="text-xs text-gray-500">{employee.total_orders} طلب</p>
                  </div>
                </div>
                <div className="text-left mr-2">
                  <p className="text-sm font-bold text-blue-600">{employee.productivity}</p>
                  <p className="text-xs text-gray-500">طلب/يوم</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            الأعلى إيراداً
          </h3>
          <div className="space-y-3">
            {topByRevenue.map((employee, index) => (
              <div key={employee.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(employee.avg_order_value)} متوسط
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap mr-2">
                  {formatCurrency(employee.revenue)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            أعلى نسبة تسليم
          </h3>
          <div className="space-y-3">
            {topByDeliveryRate.map((employee, index) => (
              <div key={employee.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
                    <p className="text-xs text-gray-500">
                      {employee.delivered_orders} مسلم
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600 whitespace-nowrap mr-2">
                  {employee.delivery_rate.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل أداء الموظفين</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <th className="text-right">الموظف</th>
                <th className="text-center">عدد الطلبات</th>
                <th className="text-center">المؤكد</th>
                <th className="text-center">المسلم</th>
                <th className="text-center">نسبة التأكيد</th>
                <th className="text-center">نسبة التسليم</th>
                <th className="text-right">الإيرادات</th>
                <th className="text-right">متوسط الطلب</th>
                <th className="text-center">المعلق</th>
                <th className="text-center">المتأخر</th>
                <th className="text-center">الإنتاجية</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="font-semibold">{employee.name}</td>
                  <td className="text-center">{employee.total_orders}</td>
                  <td className="text-center text-blue-600">{employee.confirmed_orders}</td>
                  <td className="text-center text-green-600">{employee.delivered_orders}</td>
                  <td className="text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.confirmation_rate >= 80
                          ? 'bg-green-100 text-green-800'
                          : employee.confirmation_rate >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {employee.confirmation_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.delivery_rate >= 70
                          ? 'bg-green-100 text-green-800'
                          : employee.delivery_rate >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {employee.delivery_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="font-semibold">{formatCurrency(employee.revenue)}</td>
                  <td>{formatCurrency(employee.avg_order_value)}</td>
                  <td className="text-center text-orange-600">{employee.pending_orders}</td>
                  <td className="text-center">
                    {employee.late_orders > 0 ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {employee.late_orders}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="text-center">
                    <span
                      className={`font-semibold ${
                        employee.productivity >= 20
                          ? 'text-green-600'
                          : employee.productivity >= 10
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {employee.productivity}
                    </span>
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
