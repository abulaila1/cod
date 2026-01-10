import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import type { ProductPerformance } from '@/types/reports';

interface ProductsTabProps {
  products: ProductPerformance[];
  isLoading: boolean;
}

export function ProductsTab({ products, isLoading }: ProductsTabProps) {
  const { formatCurrency } = useBusiness();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const topByRevenue = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topByProfit = [...products].sort((a, b) => b.profit - a.profit).slice(0, 5);
  const topByDeliveryRate = [...products].sort((a, b) => b.delivery_rate - a.delivery_rate).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            أعلى المنتجات إيراداً
          </h3>
          <div className="space-y-3">
            {topByRevenue.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    {product.category_name && (
                      <p className="text-xs text-gray-500 truncate">{product.category_name}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap mr-2">
                  {formatCurrency(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            أعلى المنتجات ربحاً
          </h3>
          <div className="space-y-3">
            {topByProfit.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      هامش {product.profit_margin.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap mr-2">
                  {formatCurrency(product.profit)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            أعلى المنتجات في نسبة التسليم
          </h3>
          <div className="space-y-3">
            {topByDeliveryRate.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {product.total_orders} طلب
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-600 whitespace-nowrap mr-2">
                  {product.delivery_rate.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل جميع المنتجات</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <th className="text-right">المنتج</th>
                <th className="text-right">الفئة</th>
                <th className="text-center">عدد الطلبات</th>
                <th className="text-center">المسلم</th>
                <th className="text-center">المرتجع</th>
                <th className="text-center">نسبة التسليم</th>
                <th className="text-right">الإيرادات</th>
                <th className="text-right">الربح</th>
                <th className="text-center">هامش الربح</th>
                <th className="text-right">متوسط السعر</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="font-medium">{product.name}</td>
                  <td className="text-gray-600">{product.category_name || '-'}</td>
                  <td className="text-center">{product.total_orders}</td>
                  <td className="text-center text-green-600">{product.delivered_orders}</td>
                  <td className="text-center text-red-600">{product.returned_orders}</td>
                  <td className="text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.delivery_rate >= 70
                          ? 'bg-green-100 text-green-800'
                          : product.delivery_rate >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.delivery_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="font-semibold">{formatCurrency(product.revenue)}</td>
                  <td className={`font-semibold ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(product.profit)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`${
                        product.profit_margin >= 20
                          ? 'text-green-600'
                          : product.profit_margin >= 10
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      } font-medium`}
                    >
                      {product.profit_margin.toFixed(1)}%
                    </span>
                  </td>
                  <td>{formatCurrency(product.avg_price)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
