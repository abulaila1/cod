import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Truck, TrendingUp, TrendingDown } from 'lucide-react';
import type { CarrierPerformance, CityPerformance } from '@/types/reports';

interface CarriersTabProps {
  carriers: CarrierPerformance[];
  cities: CityPerformance[];
  isLoading: boolean;
}

export function CarriersTab({ carriers, cities, isLoading }: CarriersTabProps) {
  const { formatCurrency } = useBusiness();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const topCarriersByDelivery = [...carriers].sort((a, b) => b.delivery_rate - a.delivery_rate).slice(0, 5);
  const topCitiesByOrders = [...cities].sort((a, b) => b.total_orders - a.total_orders).slice(0, 10);
  const topCitiesByDelivery = [...cities].sort((a, b) => b.delivery_rate - a.delivery_rate).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">أداء شركات الشحن</h2>

        <Card className="overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th className="text-right">شركة الشحن</th>
                  <th className="text-center">عدد الطلبات</th>
                  <th className="text-center">المسلم</th>
                  <th className="text-center">المرتجع</th>
                  <th className="text-center">نسبة التسليم</th>
                  <th className="text-center">نسبة المرتجعات</th>
                  <th className="text-right">تكلفة الشحن</th>
                  <th className="text-right">متوسط التكلفة</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map((carrier) => (
                  <tr key={carrier.id}>
                    <td className="font-semibold flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      {carrier.name}
                    </td>
                    <td className="text-center font-medium">{carrier.total_orders}</td>
                    <td className="text-center text-green-600 font-medium">{carrier.delivered_orders}</td>
                    <td className="text-center text-red-600 font-medium">{carrier.returned_orders}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            carrier.delivery_rate >= 70
                              ? 'bg-green-100 text-green-800'
                              : carrier.delivery_rate >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {carrier.delivery_rate.toFixed(1)}%
                        </span>
                        {carrier.delivery_rate >= 70 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {carrier.return_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="font-semibold">{formatCurrency(carrier.total_shipping_cost)}</td>
                    <td>{formatCurrency(carrier.avg_shipping_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">أداء المدن</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">أفضل المدن حسب عدد الطلبات</h3>
            <div className="space-y-3">
              {topCitiesByOrders.map((city, index) => (
                <div key={city.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{city.name}</p>
                      <p className="text-xs text-gray-500 truncate">{city.country_name}</p>
                    </div>
                  </div>
                  <div className="text-left mr-4">
                    <p className="text-sm font-bold text-gray-900">{city.total_orders}</p>
                    <p className="text-xs text-green-600">{city.delivery_rate.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">أفضل المدن حسب نسبة التسليم</h3>
            <div className="space-y-3">
              {topCitiesByDelivery.map((city, index) => (
                <div key={city.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{city.name}</p>
                      <p className="text-xs text-gray-500">{city.total_orders} طلب</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600 whitespace-nowrap mr-2">
                    {city.delivery_rate.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">تفاصيل جميع المدن</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th className="text-right">المدينة</th>
                  <th className="text-right">الدولة</th>
                  <th className="text-center">عدد الطلبات</th>
                  <th className="text-center">المسلم</th>
                  <th className="text-center">نسبة التسليم</th>
                  <th className="text-right">الإيرادات</th>
                  <th className="text-right">متوسط تكلفة الشحن</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city) => (
                  <tr key={city.id}>
                    <td className="font-medium">{city.name}</td>
                    <td className="text-gray-600">{city.country_name}</td>
                    <td className="text-center">{city.total_orders}</td>
                    <td className="text-center text-green-600">{city.delivered_orders}</td>
                    <td className="text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          city.delivery_rate >= 70
                            ? 'bg-green-100 text-green-800'
                            : city.delivery_rate >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {city.delivery_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="font-semibold">{formatCurrency(city.revenue)}</td>
                    <td>{formatCurrency(city.avg_shipping_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
