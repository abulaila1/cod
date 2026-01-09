import { useState } from 'react';
import { Button, Card, Select, Badge } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import type { OrderWithRelations, Status } from '@/types/domain';
import {
  Eye,
  Copy,
  MessageCircle,
  ExternalLink,
  MoreHorizontal,
  Printer,
  RefreshCw,
  Phone,
  Package,
  Truck
} from 'lucide-react';

interface OrdersTableProps {
  orders: OrderWithRelations[];
  statuses: Status[];
  selectedOrderIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOrder: (orderId: string, checked: boolean) => void;
  onStatusChange: (orderId: string, statusId: string) => void;
  onViewDetails: (orderId: string) => void;
  onDuplicate?: (orderId: string) => void;
  onPrint?: (orderId: string) => void;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isAdmin?: boolean;
}

export function OrdersTable({
  orders,
  statuses,
  selectedOrderIds,
  onSelectAll,
  onSelectOrder,
  onStatusChange,
  onViewDetails,
  onDuplicate,
  onPrint,
  currentPage,
  pageSize,
  totalCount,
  pageCount,
  onPageChange,
  onPageSizeChange,
  isAdmin = true,
}: OrdersTableProps) {
  const { formatCurrency, currentBusiness } = useBusiness();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const currency = currentBusiness?.settings?.currency || 'ر.س';

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateNetProfit = (order: OrderWithRelations): number => {
    return order.profit || (order.revenue - order.cost - order.shipping_cost - (order.cod_fees || 0));
  };

  const getStatusColor = (status: Status | null): string => {
    if (!status) return 'bg-zinc-100 text-zinc-700';

    const colorMap: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-emerald-100 text-emerald-700',
      shipped: 'bg-cyan-100 text-cyan-700',
      delivered: 'bg-green-100 text-green-700',
      returned: 'bg-red-100 text-red-700',
      cancelled: 'bg-zinc-100 text-zinc-700',
      rto: 'bg-rose-100 text-rose-700',
    };

    const key = (status as any).key || '';
    return colorMap[key] || status.color || 'bg-zinc-100 text-zinc-700';
  };

  const copyToClipboard = async (text: string, orderId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone.replace(/^0/, '')}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const openTracking = (order: OrderWithRelations) => {
    if (!order.tracking_number || !order.carrier?.tracking_url) return;
    const url = order.carrier.tracking_url.replace('{tracking}', order.tracking_number);
    window.open(url, '_blank');
  };

  const maskPhone = (phone: string): string => {
    if (!phone || phone.length < 6) return phone;
    return `${phone.substring(0, 3)}****${phone.substring(phone.length - 2)}`;
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-3 py-3 text-right w-10">
                <input
                  type="checkbox"
                  checked={selectedOrderIds.length === orders.length && orders.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-zinc-300"
                />
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                رقم الطلب
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                التاريخ
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                العميل
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                الحالة
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                الدولة
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                شركة الشحن
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                رقم التتبع
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                الموظف
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                الإيراد
              </th>
              {isAdmin && (
                <>
                  <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                    التكلفة
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600">
                    الربح
                  </th>
                </>
              )}
              <th className="px-3 py-3 text-right text-xs font-medium text-zinc-600 w-20">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`hover:bg-zinc-50 transition-colors ${
                  selectedOrderIds.includes(order.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.id)}
                    onChange={(e) => onSelectOrder(order.id, e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                </td>
                <td
                  className="px-3 py-3 cursor-pointer"
                  onClick={() => onViewDetails(order.id)}
                >
                  <span className="text-sm font-mono text-zinc-950 hover:text-blue-600">
                    #{order.order_number || order.id.substring(0, 8)}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-zinc-600">
                  {formatDate(order.order_date)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-950 truncate max-w-[150px]">
                      {order.customer_name || '-'}
                    </span>
                    {order.customer_phone && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-500 font-mono" dir="ltr">
                          {isAdmin ? order.customer_phone : maskPhone(order.customer_phone)}
                        </span>
                        {isAdmin && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(order.customer_phone!, order.id);
                              }}
                              className="p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                              title="نسخ الرقم"
                            >
                              <Copy className={`h-3 w-3 ${copiedId === order.id ? 'text-green-500' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhatsApp(order.customer_phone!);
                              }}
                              className="p-0.5 text-green-500 hover:text-green-600 transition-colors"
                              title="فتح واتساب"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={order.status_id || ''}
                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                    className="text-xs py-1 min-w-[120px]"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name_ar}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-3 text-sm text-zinc-950">
                  <div className="flex flex-col">
                    <span>{order.country?.name_ar || '-'}</span>
                    {order.city && (
                      <span className="text-xs text-zinc-500">{order.city.name_ar}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  {order.carrier ? (
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-sm text-zinc-950">{order.carrier.name_ar}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {order.tracking_number ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {order.tracking_number}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(order.tracking_number!, `tracking-${order.id}`);
                        }}
                        className="p-0.5 text-zinc-400 hover:text-zinc-600"
                        title="نسخ رقم التتبع"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {order.carrier?.tracking_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTracking(order);
                          }}
                          className="p-0.5 text-blue-500 hover:text-blue-600"
                          title="تتبع الشحنة"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3 text-sm text-zinc-950">
                  {order.employee?.name_ar || '-'}
                </td>
                <td className="px-3 py-3 text-sm font-medium text-zinc-950">
                  {formatCurrency(order.revenue)}
                </td>
                {isAdmin && (
                  <>
                    <td className="px-3 py-3 text-sm text-zinc-600">
                      {formatCurrency(order.cost)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-sm font-medium ${calculateNetProfit(order) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(calculateNetProfit(order))}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(order.id)}
                      className="p-1.5"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActionMenuId(actionMenuId === order.id ? null : order.id)}
                        className="p-1.5"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {actionMenuId === order.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActionMenuId(null)}
                          />
                          <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-20 min-w-[140px]">
                            {onDuplicate && (
                              <button
                                onClick={() => {
                                  onDuplicate(order.id);
                                  setActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-right text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                تكرار الطلب
                              </button>
                            )}
                            {onPrint && (
                              <button
                                onClick={() => {
                                  onPrint(order.id);
                                  setActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-right text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                              >
                                <Printer className="h-4 w-4" />
                                طباعة الفاتورة
                              </button>
                            )}
                            {order.customer_phone && (
                              <>
                                <button
                                  onClick={() => {
                                    copyToClipboard(order.customer_phone!, order.id);
                                    setActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-right text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                                >
                                  <Copy className="h-4 w-4" />
                                  نسخ رقم الهاتف
                                </button>
                                <button
                                  onClick={() => {
                                    openWhatsApp(order.customer_phone!);
                                    setActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-right text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  فتح واتساب
                                </button>
                                <a
                                  href={`tel:${order.customer_phone}`}
                                  className="w-full px-3 py-2 text-right text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                  onClick={() => setActionMenuId(null)}
                                >
                                  <Phone className="h-4 w-4" />
                                  اتصال مباشر
                                </a>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">لا توجد طلبات</p>
        </div>
      )}

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
