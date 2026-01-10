import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, Badge, Select, Input, Textarea } from '@/components/ui';
import { OrdersService, CarriersService } from '@/services';
import type { OrderWithRelations, Status, AuditLogWithUser, OrderUpdatePatch, OrderItemWithProduct } from '@/types/domain';
import type { Carrier } from '@/services/carriers.service';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  X,
  Clock,
  User,
  Edit2,
  Save,
  Copy,
  MessageCircle,
  Phone,
  ExternalLink,
  MapPin,
  Package,
  Truck,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface OrderDetailsDrawerProps {
  orderId: string;
  businessId: string;
  statuses: Status[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isAdmin?: boolean;
}

export function OrderDetailsDrawer({
  orderId,
  businessId,
  statuses,
  isOpen,
  onClose,
  onUpdate,
  isAdmin = true,
}: OrderDetailsDrawerProps) {
  const { user } = useAuth();
  const { formatCurrency, currentBusiness } = useBusiness();
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemWithProduct[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogWithUser[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<OrderUpdatePatch>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'financial' | 'history'>('details');

  const currency = currentBusiness?.settings?.currency || 'ر.س';

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
      loadCarriers();
    }
  }, [isOpen, orderId]);

  const loadCarriers = async () => {
    try {
      const carriersList = await CarriersService.list(businessId, { activeOnly: true });
      setCarriers(carriersList);
    } catch (error) {
      console.error('Failed to load carriers:', error);
    }
  };

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      const [orderData, items, logs] = await Promise.all([
        OrdersService.getOrderById(orderId),
        OrdersService.getOrderItems(orderId),
        OrdersService.getOrderAuditLogs(orderId),
      ]);

      setOrder(orderData);
      setOrderItems(items);
      setAuditLogs(logs);

      if (orderData) {
        setEditForm({
          revenue: orderData.revenue,
          cost: orderData.cost,
          shipping_cost: orderData.shipping_cost,
          cod_fees: orderData.cod_fees || 0,
          collected_amount: orderData.collected_amount || undefined,
          notes: orderData.notes || '',
          tracking_number: orderData.tracking_number || '',
          customer_name: orderData.customer_name || '',
          customer_phone: orderData.customer_phone || '',
          customer_address: orderData.customer_address || '',
          carrier_id: orderData.carrier_id || '',
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
    return order.profit || (order.revenue - order.cost - order.shipping_cost - (order.cod_fees || 0));
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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone.replace(/^0/, '')}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const openTracking = () => {
    if (!order?.tracking_number || !order.carrier?.tracking_url) return;
    const url = order.carrier.tracking_url.replace('{tracking}', order.tracking_number);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'details' as const, label: 'التفاصيل' },
    ...(isAdmin ? [{ id: 'financial' as const, label: 'المالية' }] : []),
    { id: 'history' as const, label: 'السجل' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-[650px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">تفاصيل الطلب</h2>
              <p className="text-sm text-zinc-500 font-mono">
                #{order?.order_number || order?.id.substring(0, 8)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <div className="h-32 bg-zinc-100 animate-pulse rounded-lg" />
              <div className="h-48 bg-zinc-100 animate-pulse rounded-lg" />
              <div className="h-64 bg-zinc-100 animate-pulse rounded-lg" />
            </div>
          ) : order ? (
            <div className="p-6 space-y-6">
              {activeTab === 'details' && (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-zinc-400" />
                          <h3 className="text-base font-bold text-zinc-950">معلومات العميل</h3>
                        </div>
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
                      {isEditing ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                              اسم العميل
                            </label>
                            <Input
                              value={editForm.customer_name || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, customer_name: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                              رقم الهاتف
                            </label>
                            <Input
                              value={editForm.customer_phone || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, customer_phone: e.target.value })
                              }
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                              العنوان
                            </label>
                            <Textarea
                              value={editForm.customer_address || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, customer_address: e.target.value })
                              }
                              rows={2}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-zinc-500">الاسم</p>
                              <p className="text-base font-medium text-zinc-950">
                                {order.customer_name || '-'}
                              </p>
                            </div>
                          </div>

                          {order.customer_phone && (
                            <div className="flex items-center justify-between bg-zinc-50 rounded-lg p-3">
                              <div>
                                <p className="text-sm text-zinc-500">رقم الهاتف</p>
                                <p className="text-base font-mono text-zinc-950" dir="ltr">
                                  {order.customer_phone}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => copyToClipboard(order.customer_phone!, 'phone')}
                                  className={`p-2 rounded-lg transition-colors ${
                                    copiedField === 'phone'
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-white text-zinc-600 hover:bg-zinc-100'
                                  }`}
                                  title="نسخ"
                                >
                                  {copiedField === 'phone' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => openWhatsApp(order.customer_phone!)}
                                  className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                                  title="واتساب"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </button>
                                <a
                                  href={`tel:${order.customer_phone}`}
                                  className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                  title="اتصال"
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-zinc-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-zinc-500">العنوان</p>
                              <p className="text-sm text-zinc-950">
                                {[order.country?.name_ar, order.city?.name_ar, order.customer_address]
                                  .filter(Boolean)
                                  .join(' - ') || '-'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-zinc-400" />
                        <h3 className="text-base font-bold text-zinc-950">المنتجات</h3>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {orderItems.length > 0 ? (
                        <div className="space-y-3">
                          {orderItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {item.product?.image_url ? (
                                  <img
                                    src={item.product.image_url}
                                    alt={item.product?.name_ar}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-zinc-200 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-zinc-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-zinc-950">
                                    {item.product?.name_ar || 'منتج غير معروف'}
                                  </p>
                                  {item.product?.sku && (
                                    <p className="text-xs text-zinc-500 font-mono">
                                      SKU: {item.product.sku}
                                    </p>
                                  )}
                                  <p className="text-sm text-zinc-600">
                                    {item.quantity} x {formatCurrency(item.unit_price)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-zinc-950">
                                  {formatCurrency(item.unit_price * item.quantity)}
                                </p>
                                {item.product && (
                                  <p className={`text-xs ${
                                    (item.product.physical_stock - item.product.reserved_stock) > 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}>
                                    {(item.product.physical_stock - item.product.reserved_stock) > 0
                                      ? 'متوفر'
                                      : 'غير متوفر'}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-zinc-500 py-4">لا توجد منتجات</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-zinc-400" />
                        <h3 className="text-base font-bold text-zinc-950">معلومات الشحن</h3>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-zinc-500 mb-1">الحالة</p>
                          <Select
                            value={order.status_id || ''}
                            onChange={(e) => handleStatusChange(e.target.value)}
                          >
                            {statuses.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.name_ar}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-500 mb-1">شركة الشحن</p>
                          {isEditing ? (
                            <Select
                              value={editForm.carrier_id || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, carrier_id: e.target.value })
                              }
                            >
                              <option value="">اختر شركة الشحن</option>
                              {carriers.map((carrier) => (
                                <option key={carrier.id} value={carrier.id}>
                                  {carrier.name_ar}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <p className="text-base text-zinc-950">
                              {order.carrier?.name_ar || '-'}
                            </p>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            رقم التتبع (AWB)
                          </label>
                          <Input
                            value={editForm.tracking_number || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, tracking_number: e.target.value })
                            }
                            dir="ltr"
                            placeholder="أدخل رقم التتبع"
                          />
                        </div>
                      ) : order.tracking_number ? (
                        <div className="flex items-center justify-between bg-zinc-50 rounded-lg p-3">
                          <div>
                            <p className="text-sm text-zinc-500">رقم التتبع</p>
                            <p className="text-base font-mono text-zinc-950" dir="ltr">
                              {order.tracking_number}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(order.tracking_number!, 'tracking')}
                              className={`p-2 rounded-lg transition-colors ${
                                copiedField === 'tracking'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-white text-zinc-600 hover:bg-zinc-100'
                              }`}
                              title="نسخ"
                            >
                              {copiedField === 'tracking' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                            {order.carrier?.tracking_url && (
                              <button
                                onClick={openTracking}
                                className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                title="تتبع الشحنة"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null}

                      <div>
                        <p className="text-sm text-zinc-500 mb-1">الموظف المسؤول</p>
                        <p className="text-base text-zinc-950">
                          {order.employee?.name_ar || '-'}
                        </p>
                      </div>

                      {isEditing && (
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            ملاحظات
                          </label>
                          <Textarea
                            value={editForm.notes || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, notes: e.target.value })
                            }
                            rows={3}
                          />
                        </div>
                      )}

                      {!isEditing && order.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-800">ملاحظات</p>
                              <p className="text-sm text-amber-700">{order.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isEditing && (
                        <div className="flex gap-3 pt-4 border-t border-zinc-200">
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
                            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'financial' && isAdmin && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-zinc-400" />
                        <h3 className="text-base font-bold text-zinc-950">البيانات المالية</h3>
                      </div>
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
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                              الإيراد
                            </label>
                            <Input
                              type="number"
                              value={editForm.revenue}
                              onChange={(e) =>
                                setEditForm({ ...editForm, revenue: parseFloat(e.target.value) || 0 })
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
                                setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })
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
                                setEditForm({ ...editForm, shipping_cost: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                              رسوم COD
                            </label>
                            <Input
                              type="number"
                              value={editForm.cod_fees}
                              onChange={(e) =>
                                setEditForm({ ...editForm, cod_fees: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                              المبلغ المحصل
                            </label>
                            <Input
                              type="number"
                              value={editForm.collected_amount || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  collected_amount: parseFloat(e.target.value) || undefined,
                                })
                              }
                              placeholder="أدخل المبلغ المحصل فعلياً"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-zinc-200">
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
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-50 rounded-lg p-4">
                            <p className="text-sm text-zinc-500 mb-1">إجمالي المبيعات</p>
                            <p className="text-xl font-bold text-zinc-950">
                              {formatCurrency(order.revenue)}
                            </p>
                          </div>

                          <div className="bg-zinc-50 rounded-lg p-4">
                            <p className="text-sm text-zinc-500 mb-1">تكلفة المنتجات</p>
                            <p className="text-xl font-bold text-zinc-950">
                              {formatCurrency(order.cost)}
                            </p>
                          </div>

                          <div className="bg-zinc-50 rounded-lg p-4">
                            <p className="text-sm text-zinc-500 mb-1">تكلفة الشحن</p>
                            <p className="text-xl font-bold text-zinc-950">
                              {formatCurrency(order.shipping_cost)}
                            </p>
                          </div>

                          <div className="bg-zinc-50 rounded-lg p-4">
                            <p className="text-sm text-zinc-500 mb-1">رسوم COD</p>
                            <p className="text-xl font-bold text-zinc-950">
                              {formatCurrency(order.cod_fees || 0)}
                            </p>
                          </div>
                        </div>

                        <div className={`rounded-lg p-4 ${calculateNetProfit() >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className={`text-sm mb-1 ${calculateNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            صافي الربح
                          </p>
                          <p className={`text-2xl font-bold ${calculateNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculateNetProfit())}
                          </p>
                        </div>

                        {order.collected_amount !== null && order.collected_amount !== undefined && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-blue-600 mb-1">المبلغ المحصل</p>
                            <p className="text-xl font-bold text-blue-700">
                              {formatCurrency(order.collected_amount)}
                            </p>
                            {order.collected_amount !== order.revenue && (
                              <p className={`text-xs mt-1 ${
                                order.collected_amount < order.revenue ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {order.collected_amount < order.revenue
                                  ? `فرق: ${formatCurrency(order.revenue - order.collected_amount)}`
                                  : `زيادة: ${formatCurrency(order.collected_amount - order.revenue)}`}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'history' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-zinc-400" />
                      <h3 className="text-base font-bold text-zinc-950">سجل التغييرات</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {auditLogs.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-6">
                        لا توجد تغييرات مسجلة
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {auditLogs.map((log, index) => (
                          <div
                            key={log.id}
                            className={`relative flex gap-4 ${
                              index < auditLogs.length - 1 ? 'pb-4' : ''
                            }`}
                          >
                            {index < auditLogs.length - 1 && (
                              <div className="absolute right-4 top-8 bottom-0 w-0.5 bg-zinc-200" />
                            )}
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 z-10">
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

                              {log.before && log.after && (log.action === 'status_change' || log.action === 'bulk_status_change') && (
                                <div className="text-xs text-zinc-600 flex items-center gap-2">
                                  <span className="px-2 py-1 bg-zinc-100 rounded">
                                    {log.before.status_label || '-'}
                                  </span>
                                  <span className="text-zinc-400">→</span>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {log.after.status_label || '-'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-zinc-500">لم يتم العثور على الطلب</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
