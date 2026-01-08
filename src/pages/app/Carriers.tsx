import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  CarriersService,
  type Carrier,
  type CarrierAnalytics,
} from '@/services/carriers.service';
import { Card, CardContent, Button, Input, Modal, Badge } from '@/components/ui';
import {
  Plus,
  Search,
  Truck,
  Edit2,
  Trash2,
  BarChart3,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
} from 'lucide-react';

export function Carriers() {
  const navigate = useNavigate();
  const { currentBusiness, formatCurrency } = useBusiness();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [carrierStats, setCarrierStats] = useState<Map<string, CarrierAnalytics>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);

  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    tracking_url: '',
  });

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [currentBusiness]);

  const loadData = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const carriersData = await CarriersService.list(currentBusiness.id, {
        search,
        activeOnly: showActiveOnly,
      });
      setCarriers(carriersData);

      const statsMap = new Map<string, CarrierAnalytics>();
      await Promise.all(
        carriersData.map(async (carrier) => {
          try {
            const analytics = await CarriersService.getAnalytics(currentBusiness.id, carrier.id);
            statsMap.set(carrier.id, analytics);
          } catch (e) {
            console.error(`Failed to load analytics for carrier ${carrier.id}`, e);
          }
        })
      );
      setCarrierStats(statsMap);
    } catch (error) {
      console.error('Failed to load carriers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness) {
      const debounce = setTimeout(() => {
        loadCarriers();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [search, showActiveOnly]);

  const loadCarriers = async () => {
    if (!currentBusiness) return;
    try {
      const carriersData = await CarriersService.list(currentBusiness.id, {
        search,
        activeOnly: showActiveOnly,
      });
      setCarriers(carriersData);
    } catch (error) {
      console.error('Failed to load carriers:', error);
    }
  };

  const resetForm = () => {
    setForm({ name_ar: '', name_en: '', tracking_url: '' });
    setEditingCarrier(null);
  };

  const openEditCarrier = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    setForm({
      name_ar: carrier.name_ar,
      name_en: carrier.name_en || '',
      tracking_url: carrier.tracking_url || '',
    });
    setShowModal(true);
  };

  const handleSaveCarrier = async () => {
    if (!currentBusiness || !form.name_ar) return;

    try {
      if (editingCarrier) {
        await CarriersService.update(currentBusiness.id, editingCarrier.id, form);
      } else {
        await CarriersService.create(currentBusiness.id, form);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Failed to save carrier:', error);
      alert(error.message || 'فشل حفظ شركة الشحن');
    }
  };

  const handleDeleteCarrier = async (carrier: Carrier) => {
    if (!currentBusiness) return;
    if (!confirm(`هل أنت متأكد من حذف "${carrier.name_ar}"؟`)) return;

    try {
      await CarriersService.delete(currentBusiness.id, carrier.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete carrier:', error);
      alert('فشل حذف شركة الشحن');
    }
  };

  const handleToggleActive = async (carrier: Carrier) => {
    if (!currentBusiness) return;

    try {
      await CarriersService.toggleActive(currentBusiness.id, carrier.id, !carrier.is_active);
      loadCarriers();
    } catch (error) {
      console.error('Failed to toggle carrier:', error);
    }
  };

  const getDeliveryRateColor = (rate: number) => {
    if (rate >= 70) return 'text-emerald-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getDeliveryRateBg = (rate: number) => {
    if (rate >= 70) return 'bg-emerald-100';
    if (rate >= 50) return 'bg-amber-100';
    return 'bg-red-100';
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  const totalCarriers = carriers.length;
  const activeCarriers = carriers.filter(c => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">شركات الشحن</h1>
          <p className="text-zinc-600 mt-1">إدارة شركات الشحن وتحليل أدائها</p>
        </div>

        <Button
          variant="accent"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4" />
          إضافة شركة شحن
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي الشركات</p>
                <p className="text-3xl font-bold mt-1">{totalCarriers}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Truck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">الشركات النشطة</p>
                <p className="text-3xl font-bold mt-1">{activeCarriers}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">الشركات المعطلة</p>
                <p className="text-3xl font-bold mt-1">{totalCarriers - activeCarriers}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="بحث في شركات الشحن..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pr-10"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="rounded border-zinc-300"
                    />
                    النشطة فقط
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {carriers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Truck className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-zinc-950 mb-2">لا توجد شركات شحن</h3>
                <p className="text-zinc-600 mb-6">ابدأ بإضافة شركات الشحن التي تتعامل معها</p>
                <Button
                  variant="accent"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  إضافة أول شركة شحن
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {carriers.map((carrier) => {
                const stats = carrierStats.get(carrier.id);
                const deliveryRate = stats?.delivery_rate || 0;

                return (
                  <Card
                    key={carrier.id}
                    className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                      !carrier.is_active ? 'opacity-60' : ''
                    }`}
                    onClick={() => navigate(`/app/carriers/${carrier.id}`)}
                  >
                    <div className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${
                            carrier.is_active ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400'
                          }`}>
                            <Truck className="h-6 w-6" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-zinc-950">{carrier.name_ar}</h3>
                              <Badge variant={carrier.is_active ? 'success' : 'default'} size="sm">
                                {carrier.is_active ? 'نشط' : 'معطل'}
                              </Badge>
                            </div>
                            {carrier.name_en && (
                              <p className="text-sm text-zinc-500">{carrier.name_en}</p>
                            )}
                          </div>
                        </div>

                        {stats && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs mb-1">
                                <Package className="h-3.5 w-3.5" />
                                الطلبات
                              </div>
                              <p className="text-xl font-bold text-zinc-950">{stats.total_orders}</p>
                            </div>

                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs mb-1">
                                <CheckCircle className="h-3.5 w-3.5" />
                                تم التسليم
                              </div>
                              <p className="text-xl font-bold text-emerald-600">{stats.delivered_orders}</p>
                            </div>

                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-red-500 text-xs mb-1">
                                <XCircle className="h-3.5 w-3.5" />
                                مرتجع
                              </div>
                              <p className="text-xl font-bold text-red-500">{stats.returned_orders}</p>
                            </div>

                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs mb-1">
                                {deliveryRate >= 70 ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                )}
                                نسبة التسليم
                              </div>
                              <div className={`inline-flex items-center px-2 py-1 rounded-lg ${getDeliveryRateBg(deliveryRate)}`}>
                                <p className={`text-lg font-bold ${getDeliveryRateColor(deliveryRate)}`}>
                                  {deliveryRate.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/app/carriers/${carrier.id}`)}
                          >
                            <BarChart3 className="h-4 w-4" />
                            التفاصيل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCarrier(carrier)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <button
                            onClick={() => handleToggleActive(carrier)}
                            className={`p-2 rounded-lg transition-colors ${
                              carrier.is_active
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={carrier.is_active ? 'تعطيل' : 'تفعيل'}
                          >
                            {carrier.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteCarrier(carrier)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={editingCarrier ? 'تعديل شركة الشحن' : 'إضافة شركة شحن'}
        >
          <div className="space-y-4">
            <Input
              label="اسم الشركة بالعربية *"
              placeholder="أرامكس"
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            />
            <Input
              label="اسم الشركة بالإنجليزية"
              placeholder="Aramex"
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            />
            <Input
              label="رابط التتبع (اختياري)"
              placeholder="https://tracking.example.com/?id="
              value={form.tracking_url}
              onChange={(e) => setForm({ ...form, tracking_url: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button
                variant="accent"
                onClick={handleSaveCarrier}
                disabled={!form.name_ar}
              >
                {editingCarrier ? 'حفظ التغييرات' : 'إضافة الشركة'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
