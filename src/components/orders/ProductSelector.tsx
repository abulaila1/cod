import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { Plus, Trash2, Package } from 'lucide-react';
import type { Product } from '@/types/domain';

export interface OrderItemForm {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
}

interface ProductSelectorProps {
  products: Product[];
  items: OrderItemForm[];
  onChange: (items: OrderItemForm[]) => void;
  currency: string;
}

export function ProductSelector({
  products,
  items,
  onChange,
  currency,
}: ProductSelectorProps) {
  const [selectedProductId, setSelectedProductId] = useState('');

  const handleAddProduct = () => {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const existingIndex = items.findIndex((item) => item.product_id === selectedProductId);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      onChange(newItems);
    } else {
      onChange([
        ...items,
        {
          product_id: product.id,
          product_name: product.name_ar,
          quantity: 1,
          unit_price: product.price,
          unit_cost: product.cost,
        },
      ]);
    }

    setSelectedProductId('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...items];
    newItems[index].quantity = quantity;
    onChange(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    if (price < 0) return;
    const newItems = [...items];
    newItems[index].unit_price = price;
    onChange(newItems);
  };

  const totalRevenue = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);

  const activeProducts = products.filter((p) => p.is_active);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">اختر منتج للإضافة...</option>
            {activeProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name_ar} - {product.price} {currency}
                {product.sku ? ` (${product.sku})` : ''}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          onClick={handleAddProduct}
          disabled={!selectedProductId}
        >
          <Plus className="h-4 w-4 ml-1" />
          إضافة
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-primary-500 bg-primary-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>لم يتم إضافة منتجات بعد</p>
          <p className="text-sm">اختر منتج من القائمة أعلاه</p>
        </div>
      ) : (
        <div className="border border-primary-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-2 text-right text-sm font-medium text-primary-700">
                  المنتج
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-primary-700 w-24">
                  الكمية
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-primary-700 w-32">
                  السعر
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-primary-700 w-24">
                  الإجمالي
                </th>
                <th className="px-4 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-primary-900">{item.product_name}</div>
                    <div className="text-xs text-primary-500">
                      التكلفة: {item.unit_cost} {currency}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                      className="w-28 text-center"
                    />
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {(item.unit_price * item.quantity).toFixed(2)} {currency}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-primary-100">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-left font-semibold">
                  المجموع
                </td>
                <td className="px-4 py-3 text-center font-bold text-lg">
                  {totalRevenue.toFixed(2)} {currency}
                </td>
                <td></td>
              </tr>
              <tr className="bg-primary-50">
                <td colSpan={3} className="px-4 py-2 text-left text-sm text-primary-600">
                  إجمالي التكلفة
                </td>
                <td className="px-4 py-2 text-center text-sm text-primary-600">
                  {totalCost.toFixed(2)} {currency}
                </td>
                <td></td>
              </tr>
              <tr className="bg-green-50">
                <td colSpan={3} className="px-4 py-2 text-left text-sm font-medium text-green-700">
                  الربح المتوقع (قبل الشحن)
                </td>
                <td className="px-4 py-2 text-center text-sm font-medium text-green-700">
                  {(totalRevenue - totalCost).toFixed(2)} {currency}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
