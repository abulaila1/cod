import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  CarriersService,
  type Carrier,
  type CarrierAnalytics,
  type CarrierSettings,
  type CarrierCityPrice,
} from '@/services/carriers.service';
import { CountriesService, type City } from '@/services/countries.service';
import { Card, CardContent, Button, Input, Modal, Badge } from '@/components/ui';
import {
  ArrowRight,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  MapPin,
  Settings,
  DollarSign,
  Edit2,
  Save,
  X,
  Palette,
} from 'lucide-react';

export function CarrierDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBusiness, formatCurrency, getCurrencySymbol, country } = useBusiness();

  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [analytics, setAnalytics] = useState<CarrierAnalytics | null>(null);
  const [settings, setSettings] = useState<CarrierSettings | null>(null);
  const [cityPrices, setCityPrices] = useState<CarrierCityPrice[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  const [settingsForm, setSettingsForm] = useState({
    good_threshold: 70,
    warning_threshold: 50,
    good_color: '#10B981',
    warning_color: '#F59E0B',
    bad_color: '#EF4444',
  });

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    if (currentBusiness && id) {
      loadData();
    }
  }, [currentBusiness, id]);

  useEffect(() => {
    if (currentBusiness && id) {
      loadAnalytics();
    }
  }, [dateFrom, dateTo]);

  const loadData = async () => {
    if (!currentBusiness || !id) return;

    try {
      setIsLoading(true);

      const [carrierData, settingsData, pricesData, citiesData] = await Promise.all([
        CarriersService.getById(currentBusiness.id, id),
        CarriersService.getSettings(currentBusiness.id, id),
        CarriersService.getCityPrices(currentBusiness.id, id),
        CountriesService.listCities(currentBusiness.id),
      ]);

      if (!carrierData) {
        navigate('/app/carriers');
        return;
      }

      setCarrier(carrierData);
      setSettings(settingsData);
      setCityPrices(pricesData);
      setAllCities(citiesData);

      if (settingsData) {
        setSettingsForm({
          good_threshold: settingsData.good_threshold,
          warning_threshold: settingsData.warning_threshold,
          good_color: settingsData.good_color,
          warning_color: settingsData.warning_color,
          bad_color: settingsData.bad_color,
        });
      }

      await loadAnalytics();
    } catch (error) {
      console.error('Failed to load carrier details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!currentBusiness || !id) return;

    try {
      const analyticsData = await CarriersService.getAnalytics(
        currentBusiness.id,
        id,
        dateFrom,
        dateTo
      );
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentBusiness || !id) return;

    try {
      const updated = await CarriersService.updateSettings(currentBusiness.id, id, settingsForm);
      setSettings(updated);
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('فشل حفظ الإعدادات');
    }
  };

  const getCityCustomPrice = (cityId: string): number | null => {
    const customPrice = cityPrices.find(p => p.city_id === cityId);
    return customPrice ? customPrice.shipping_cost : null;
  };

  const handleSaveCityPrice = async (cityId: string) => {
    if (!currentBusiness || !id) return;

    try {
      const price = parseFloat(editingPrice) || 0;
      await CarriersService.setCityPrice(currentBusiness.id, id, cityId, price);
      const pricesData = await CarriersService.getCityPrices(currentBusiness.id, id);
      setCityPrices(pricesData);
      setEditingCityId(null);
      setEditingPrice('');
    } catch (error) {
      console.error('Failed to save city price:', error);
      alert('فشل حفظ السعر');
    }
  };

  const handleResetCityPrice = async (cityId: string) => {
    if (!currentBusiness || !id) return;

    try {
      await CarriersService.removeCityPrice(currentBusiness.id, id, cityId);
      const pricesData = await CarriersService.getCityPrices(currentBusiness.id, id);
      setCityPrices(pricesData);
    } catch (error) {
      console.error('Failed to reset city price:', error);
    }
  };

  const getCityPerformanceColor = (deliveryRate: number) => {
    const goodThreshold = settings?.good_threshold || 70;
    const warningThreshold = settings?.warning_threshold || 50;
    const goodColor = settings?.good_color || '#10B981';
    const warningColor = settings?.warning_color || '#F59E0B';
    const badColor = settings?.bad_color || '#EF4444';

    if (deliveryRate >= goodThreshold) return goodColor;
    if (deliveryRate >= warningThreshold) return warningColor;
    return badColor;
  };

  const getCityPerformanceLabel = (deliveryRate: number) => {
    const goodThreshold = settings?.good_threshold || 70;
    const warningThreshold = settings?.warning_threshold || 50;

    if (deliveryRate >= goodThreshold) return 'ممتاز';
    if (deliveryRate >= warningThreshold) return 'متوسط';
    return 'ضعيف';
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-zinc-100 animate-pulse rounded-lg w-48" />
        <div className="h-48 bg-zinc-100 animate-pulse rounded-2xl" />
        <div className="h-96 bg-zinc-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">شركة الشحن غير موجودة</p>
      </div>
    );
  }

  const bestCities = analytics?.city_performance.slice(0, 5) || [];
  const worstCities = analytics?.city_performance.slice(-5).reverse() || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/app/carriers')}>
          <ArrowRight className="h-4 w-4" />
          العودة
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-950">{carrier.name_ar}</h1>
              {carrier.name_en && (
                <p className="text-zinc-500">{carrier.name_en}</p>
              )}
            </div>
            <Badge variant={carrier.is_active ? 'success' : 'default'}>
              {carrier.is_active ? 'نشط' : 'معطل'}
            </Badge>
          </div>
        </div>

        <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
          <Settings className="h-4 w-4" />
          إعدادات الألوان
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <span className="text-zinc-500">إلى</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">إجمالي الطلبات</p>
                    <p className="text-2xl font-bold">{analytics.total_orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm">تم التسليم</p>
                    <p className="text-2xl font-bold">{analytics.delivered_orders}</p>
                    <p className="text-emerald-100 text-xs">{analytics.delivery_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-red-100 text-sm">مرتجع</p>
                    <p className="text-2xl font-bold">{analytics.returned_orders}</p>
                    <p className="text-red-100 text-xs">{analytics.return_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-amber-100 text-sm">في التوصيل</p>
                    <p className="text-2xl font-bold">{analytics.in_transit_orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-zinc-950">أفضل المناطق</h3>
                </div>

                {bestCities.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-3">
                    {bestCities.map((city, index) => (
                      <div
                        key={city.city_id}
                        className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: getCityPerformanceColor(city.delivery_rate) }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-950">{city.city_name}</p>
                          <p className="text-xs text-zinc-500">
                            {city.delivered_orders} من {city.total_orders} طلب
                          </p>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-white text-sm font-bold"
                          style={{ backgroundColor: getCityPerformanceColor(city.delivery_rate) }}
                        >
                          {city.delivery_rate.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-zinc-950">أسوأ المناطق</h3>
                </div>

                {worstCities.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-3">
                    {worstCities.map((city, index) => (
                      <div
                        key={city.city_id}
                        className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: getCityPerformanceColor(city.delivery_rate) }}
                        >
                          {worstCities.length - index}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-950">{city.city_name}</p>
                          <p className="text-xs text-zinc-500">
                            {city.delivered_orders} من {city.total_orders} طلب
                          </p>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-white text-sm font-bold"
                          style={{ backgroundColor: getCityPerformanceColor(city.delivery_rate) }}
                        >
                          {city.delivery_rate.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {analytics.city_performance.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-zinc-950">أداء جميع المناطق</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {analytics.city_performance.map((city) => (
                    <div
                      key={city.city_id}
                      className="p-3 rounded-xl text-center transition-all hover:shadow-md"
                      style={{
                        backgroundColor: `${getCityPerformanceColor(city.delivery_rate)}15`,
                        borderWidth: 2,
                        borderColor: getCityPerformanceColor(city.delivery_rate),
                      }}
                    >
                      <p className="font-medium text-zinc-950 text-sm mb-1">{city.city_name}</p>
                      <p
                        className="text-xl font-bold"
                        style={{ color: getCityPerformanceColor(city.delivery_rate) }}
                      >
                        {city.delivery_rate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {city.total_orders} طلب
                      </p>
                      <Badge
                        className="mt-2 text-xs text-white"
                        style={{ backgroundColor: getCityPerformanceColor(city.delivery_rate) }}
                      >
                        {getCityPerformanceLabel(city.delivery_rate)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-zinc-950">أسعار الشحن حسب المدينة</h3>
          </div>

          {allCities.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              لم يتم إضافة مدن بعد. قم بإضافة المدن من صفحة الدولة والمدن.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600">المدينة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600">السعر الافتراضي</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600">سعر مخصص</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600">السعر المستخدم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {allCities.map((city) => {
                    const customPrice = getCityCustomPrice(city.id);
                    const isEditing = editingCityId === city.id;
                    const usedPrice = customPrice !== null ? customPrice : city.shipping_cost;

                    return (
                      <tr key={city.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-zinc-400" />
                            <span className="font-medium text-zinc-950">{city.name_ar}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {formatCurrency(city.shipping_cost)}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-28"
                              autoFocus
                            />
                          ) : customPrice !== null ? (
                            <span className="text-emerald-600 font-medium">
                              {formatCurrency(customPrice)}
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={customPrice !== null ? 'success' : 'default'}>
                            {formatCurrency(usedPrice)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveCityPrice(city.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCityId(null);
                                  setEditingPrice('');
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCityId(city.id);
                                  setEditingPrice(customPrice?.toString() || city.shipping_cost.toString());
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {customPrice !== null && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResetCityPrice(city.id)}
                                  title="إعادة للسعر الافتراضي"
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showSettingsModal && (
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="إعدادات تلوين المناطق"
          size="lg"
        >
          <div className="space-y-6">
            <p className="text-zinc-600 text-sm">
              حدد النسب والألوان التي تريد استخدامها لتصنيف أداء المناطق لهذه الشركة
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl border-2" style={{ borderColor: settingsForm.good_color }}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: settingsForm.good_color }}
                  />
                  <span className="font-semibold text-zinc-950">أداء ممتاز</span>
                </div>
                <Input
                  label="النسبة الأدنى %"
                  type="number"
                  min="0"
                  max="100"
                  value={settingsForm.good_threshold}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    good_threshold: parseInt(e.target.value) || 0,
                  })}
                />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">اللون</label>
                  <input
                    type="color"
                    value={settingsForm.good_color}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      good_color: e.target.value,
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border-2" style={{ borderColor: settingsForm.warning_color }}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: settingsForm.warning_color }}
                  />
                  <span className="font-semibold text-zinc-950">أداء متوسط</span>
                </div>
                <Input
                  label="النسبة الأدنى %"
                  type="number"
                  min="0"
                  max="100"
                  value={settingsForm.warning_threshold}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    warning_threshold: parseInt(e.target.value) || 0,
                  })}
                />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">اللون</label>
                  <input
                    type="color"
                    value={settingsForm.warning_color}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      warning_color: e.target.value,
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border-2" style={{ borderColor: settingsForm.bad_color }}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: settingsForm.bad_color }}
                  />
                  <span className="font-semibold text-zinc-950">أداء ضعيف</span>
                </div>
                <p className="text-sm text-zinc-500 mb-3">
                  أقل من {settingsForm.warning_threshold}%
                </p>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">اللون</label>
                  <input
                    type="color"
                    value={settingsForm.bad_color}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      bad_color: e.target.value,
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl">
              <p className="text-sm text-zinc-600 mb-3">معاينة:</p>
              <div className="flex items-center gap-4">
                <div
                  className="px-4 py-2 rounded-lg text-white font-bold"
                  style={{ backgroundColor: settingsForm.good_color }}
                >
                  {settingsForm.good_threshold}%+ = ممتاز
                </div>
                <div
                  className="px-4 py-2 rounded-lg text-white font-bold"
                  style={{ backgroundColor: settingsForm.warning_color }}
                >
                  {settingsForm.warning_threshold}-{settingsForm.good_threshold - 1}% = متوسط
                </div>
                <div
                  className="px-4 py-2 rounded-lg text-white font-bold"
                  style={{ backgroundColor: settingsForm.bad_color }}
                >
                  &lt;{settingsForm.warning_threshold}% = ضعيف
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                إلغاء
              </Button>
              <Button variant="accent" onClick={handleSaveSettings}>
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
