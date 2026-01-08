import { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Edit, Save, X, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface CountryPerformanceData {
  id: string;
  name: string;
  total_orders: number;
  delivered_orders: number;
  return_orders: number;
  delivery_rate: number;
  gross_sales: number;
  net_profit: number;
  shipping_cost?: number;
  cod_fees?: number;
}

interface CountriesPerformanceTableProps {
  data: CountryPerformanceData[];
  isLoading: boolean;
  onUpdateShippingCost?: (countryId: string, cost: number) => Promise<void>;
}

export function CountriesPerformanceTable({
  data,
  isLoading,
  onUpdateShippingCost
}: CountriesPerformanceTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getPerformanceStatus = (deliveryRate: number, netProfit: number) => {
    if (deliveryRate >= 70 && netProfit > 0) {
      return { text: 'زيادة الميزانية', color: 'bg-green-100 text-green-800', icon: TrendingUp };
    }
    if (deliveryRate >= 50 && netProfit > 0) {
      return { text: 'مستقر', color: 'bg-blue-100 text-blue-800', icon: AlertCircle };
    }
    if (deliveryRate < 50 || netProfit < 0) {
      return { text: 'مراجعة', color: 'bg-red-100 text-red-800', icon: TrendingDown };
    }
    return { text: 'متابعة', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
  };

  const handleEdit = (item: CountryPerformanceData) => {
    setEditingId(item.id);
    setEditValue((item.shipping_cost || 0).toString());
  };

  const handleSave = async (countryId: string) => {
    if (onUpdateShippingCost) {
      await onUpdateShippingCost(countryId, parseFloat(editValue) || 0);
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                الدولة
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                إجمالي الطلبات
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                تكلفة الشحن
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                رسوم COD
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                صافي الربح
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                التوصية
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const status = getPerformanceStatus(item.delivery_rate, item.net_profit);
                const StatusIcon = status.icon;
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-950">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-950">
                      {item.total_orders}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm text-zinc-950">
                          {formatCurrency(item.shipping_cost || 0)} ج.م
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-950">
                      {formatCurrency(item.cod_fees || 0)} ج.م
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${
                        item.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(item.net_profit)} ج.م
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.text}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(item.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
