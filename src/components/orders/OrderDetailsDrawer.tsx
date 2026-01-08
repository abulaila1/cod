import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, Badge, Select, Input, Textarea } from '@/components/ui';
import { OrdersService } from '@/services';
import type { OrderWithRelations, Status, AuditLogWithUser, OrderUpdatePatch } from '@/types/domain';
import { useAuth } from '@/contexts/AuthContext';
import { X, Clock, User, Edit2, Save } from 'lucide-react';

interface OrderDetailsDrawerProps {
  orderId: string;
  businessId: string;
  statuses: Status[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function OrderDetailsDrawer({
  orderId,
  businessId,
  statuses,
  isOpen,
  onClose,
  onUpdate,
}: OrderDetailsDrawerProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<OrderUpdatePatch>({});

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    }
  }, [isOpen, orderId]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      const [orderData, logs] = await Promise.all([
        OrdersService.getOrderById(orderId),
        OrdersService.getOrderAuditLogs(orderId),
      ]);

      setOrder(orderData);
      setAuditLogs(logs);

      if (orderData) {
        setEditForm({
          revenue: orderData.revenue,
          cost: orderData.cost,
          shipping_cost: orderData.shipping_cost,
          notes: orderData.notes || '',
        });
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (statusId: string) => {
    if (!user || !order) return;

    try {
      await OrdersService.updateOrderStatus(businessId, orderId, statusId, user.id);
      await loadOrderDetails();
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !order) return;

    try {
      setIsSaving(true);
      await OrdersService.updateOrderFields(businessId, orderId, editForm, user.id);
      await loadOrderDetails();
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateNetProfit = () => {
    if (!order) return 0;
    return order.profit || (order.revenue - order.cost - order.shipping_cost);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">تفاصيل الطلب</h2>
            <p className="text-sm text-zinc-500">#{order?.id.substring(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="h-32 bg-zinc-100 animate-pulse rounded-lg" />
            <div className="h-48 bg-zinc-100 animate-pulse rounded-lg" />
            <div className="h-64 bg-zinc-100 animate-pulse rounded-lg" />
          </div>
        ) : order ? (
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-zinc-950">معلومات الطلب</h3>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit2 className="h-4 w-4 ml-2" />
                      تعديل
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      التاريخ
                    </label>
                    <p className="text-sm text-zinc-950">{formatDate(order.order_date)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      الحالة
                    </label>
                    <Select
                      value={order.status_id}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name_ar}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      الدولة
                    </label>
                    <p className="text-sm text-zinc-950">{order.country?.name_ar || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      شركة الشحن
                    </label>
                    <p className="text-sm text-zinc-950">{order.carrier?.name_ar || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      الموظف
                    </label>
                    <p className="text-sm text-zinc-950">{order.employee?.name_ar || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-base font-bold text-zinc-950">البيانات المالية</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        الإيراد
                      </label>
                      <Input
                        type="number"
                        value={editForm.revenue}
                        onChange={(e) =>
                          setEditForm({ ...editForm, revenue: parseFloat(e.target.value) })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        التكلفة
                      </label>
                      <Input
                        type="number"
                        value={editForm.cost}
                        onChange={(e) =>
                          setEditForm({ ...editForm, cost: parseFloat(e.target.value) })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        تكلفة الشحن
                      </label>
                      <Input
                        type="number"
                        value={editForm.shipping_cost}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            shipping_cost: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        ملاحظات
                      </label>
                      <Textarea
                        value={editForm.notes}
                        onChange={(e) =>
                          setEditForm({ ...editForm, notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                      <Button
                        onClick={handleSaveChanges}
                        variant="primary"
                        className="flex-1"
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 ml-2" />
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        الإيراد
                      </label>
                      <p className="text-lg font-bold text-zinc-950">
                        {formatCurrency(order.revenue)} ج.م
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        التكلفة
                      </label>
                      <p className="text-lg font-bold text-zinc-950">
                        {formatCurrency(order.cost)} ج.م
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        الشحن
                      </label>
                      <p className="text-lg font-bold text-zinc-950">
                        {formatCurrency(order.shipping_cost)} ج.م
                      </p>
                    </div>

                    <div className="col-span-2 pt-4 border-t border-zinc-200">
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        صافي الربح
                      </label>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculateNetProfit())} ج.م
                      </p>
                    </div>

                    {order.notes && (
                      <div className="col-span-2 pt-4 border-t border-zinc-200">
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          ملاحظات
                        </label>
                        <p className="text-sm text-zinc-950 bg-zinc-50 p-3 rounded-lg">
                          {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-base font-bold text-zinc-950">سجل التغييرات</h3>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6">
                    لا توجد تغييرات مسجلة
                  </p>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex gap-4 pb-4 border-b border-zinc-100 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                          {log.action === 'status_change' || log.action === 'bulk_status_change' ? (
                            <Clock className="h-4 w-4 text-zinc-600" />
                          ) : (
                            <User className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-zinc-950">
                              {log.action === 'status_change' && 'تغيير الحالة'}
                              {log.action === 'bulk_status_change' && 'تغيير جماعي للحالة'}
                              {log.action === 'update' && 'تحديث البيانات'}
                            </p>
                            <span className="text-xs text-zinc-500 whitespace-nowrap">
                              {formatDate(log.created_at)}
                            </span>
                          </div>

                          {log.before && log.after && (
                            <div className="text-xs text-zinc-600 space-y-1">
                              <p>
                                من: <Badge variant="secondary">{log.before.status_label || 'N/A'}</Badge>
                              </p>
                              <p>
                                إلى: <Badge variant="primary">{log.after.status_label || 'N/A'}</Badge>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-zinc-500">لم يتم العثور على الطلب</p>
          </div>
        )}
      </div>
    </>
  );
}
