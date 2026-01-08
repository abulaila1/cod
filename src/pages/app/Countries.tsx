import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { CountriesService, type Country, type City } from '@/services/countries.service';
import { Card, CardContent, Button, Input, Modal, Badge } from '@/components/ui';
import {
  Globe,
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Truck,
  DollarSign,
  Settings,
  Check,
  X,
  Filter,
} from 'lucide-react';

const POPULAR_COUNTRIES = [
  { name_ar: 'المملكة العربية السعودية', name_en: 'Saudi Arabia', code: 'SA', currency: 'SAR', symbol: 'ر.س' },
  { name_ar: 'الإمارات العربية المتحدة', name_en: 'United Arab Emirates', code: 'AE', currency: 'AED', symbol: 'د.إ' },
  { name_ar: 'مصر', name_en: 'Egypt', code: 'EG', currency: 'EGP', symbol: 'ج.م' },
  { name_ar: 'الكويت', name_en: 'Kuwait', code: 'KW', currency: 'KWD', symbol: 'د.ك' },
  { name_ar: 'قطر', name_en: 'Qatar', code: 'QA', currency: 'QAR', symbol: 'ر.ق' },
  { name_ar: 'البحرين', name_en: 'Bahrain', code: 'BH', currency: 'BHD', symbol: 'د.ب' },
  { name_ar: 'عمان', name_en: 'Oman', code: 'OM', currency: 'OMR', symbol: 'ر.ع' },
  { name_ar: 'الأردن', name_en: 'Jordan', code: 'JO', currency: 'JOD', symbol: 'د.أ' },
];

export function Countries() {
  const { currentBusiness, refreshCountry } = useBusiness();
  const [country, setCountry] = useState<Country | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  const [countryForm, setCountryForm] = useState({
    name_ar: '',
    name_en: '',
    code: '',
    currency: '',
    currency_symbol: '',
  });

  const [cityForm, setCityForm] = useState({
    name_ar: '',
    name_en: '',
    shipping_cost: 0,
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
      const [countryData, citiesData] = await Promise.all([
        CountriesService.getCountry(currentBusiness.id),
        CountriesService.listCities(currentBusiness.id, {
          search,
          activeOnly: showActiveOnly,
        }),
      ]);
      setCountry(countryData);
      setCities(citiesData);

      if (countryData) {
        setCountryForm({
          name_ar: countryData.name_ar,
          name_en: countryData.name_en || '',
          code: countryData.code,
          currency: countryData.currency,
          currency_symbol: countryData.currency_symbol,
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness) {
      const debounce = setTimeout(() => {
        loadCities();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [search, showActiveOnly]);

  const loadCities = async () => {
    if (!currentBusiness) return;
    try {
      const citiesData = await CountriesService.listCities(currentBusiness.id, {
        search,
        activeOnly: showActiveOnly,
      });
      setCities(citiesData);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const selectPresetCountry = (preset: typeof POPULAR_COUNTRIES[0]) => {
    setCountryForm({
      name_ar: preset.name_ar,
      name_en: preset.name_en,
      code: preset.code,
      currency: preset.currency,
      currency_symbol: preset.symbol,
    });
  };

  const handleSaveCountry = async () => {
    if (!currentBusiness || !countryForm.name_ar || !countryForm.currency) return;

    try {
      await CountriesService.createOrUpdateCountry(currentBusiness.id, countryForm);
      setShowCountryModal(false);
      await loadData();
      await refreshCountry();
    } catch (error) {
      console.error('Failed to save country:', error);
      alert('فشل حفظ الدولة');
    }
  };

  const resetCityForm = () => {
    setCityForm({ name_ar: '', name_en: '', shipping_cost: 0 });
    setEditingCity(null);
  };

  const openEditCity = (city: City) => {
    setEditingCity(city);
    setCityForm({
      name_ar: city.name_ar,
      name_en: city.name_en || '',
      shipping_cost: city.shipping_cost,
    });
    setShowCityModal(true);
  };

  const handleSaveCity = async () => {
    if (!currentBusiness || !cityForm.name_ar) return;

    try {
      if (editingCity) {
        await CountriesService.updateCity(currentBusiness.id, editingCity.id, cityForm);
      } else {
        await CountriesService.createCity(currentBusiness.id, cityForm);
      }
      setShowCityModal(false);
      resetCityForm();
      loadCities();
    } catch (error: any) {
      console.error('Failed to save city:', error);
      alert(error.message || 'فشل حفظ المدينة');
    }
  };

  const handleDeleteCity = async (city: City) => {
    if (!currentBusiness) return;
    if (!confirm(`هل أنت متأكد من حذف "${city.name_ar}"؟`)) return;

    try {
      await CountriesService.deleteCity(currentBusiness.id, city.id);
      loadCities();
    } catch (error) {
      console.error('Failed to delete city:', error);
      alert('فشل حذف المدينة');
    }
  };

  const handleToggleCityActive = async (city: City) => {
    if (!currentBusiness) return;

    try {
      await CountriesService.toggleCityActive(currentBusiness.id, city.id, !city.is_active);
      loadCities();
    } catch (error) {
      console.error('Failed to toggle city:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0 }).format(amount);
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  const filteredCities = cities;
  const activeCitiesCount = cities.filter(c => c.is_active).length;
  const totalShippingAvg = cities.length > 0
    ? cities.reduce((sum, c) => sum + c.shipping_cost, 0) / cities.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">الدولة والمدن</h1>
          <p className="text-zinc-600 mt-1">إعداد دولة التشغيل والمدن مع تكاليف الشحن</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 bg-zinc-100 animate-pulse rounded-2xl" />
          <div className="h-64 bg-zinc-100 animate-pulse rounded-2xl" />
        </div>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                    <Globe className="h-8 w-8" />
                  </div>
                  <div>
                    {country ? (
                      <>
                        <h2 className="text-2xl font-bold">{country.name_ar}</h2>
                        <p className="text-emerald-100 mt-1">
                          {country.name_en} ({country.code})
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-xl font-semibold">لم يتم إعداد الدولة</h2>
                        <p className="text-emerald-100 mt-1">قم بإعداد دولة التشغيل الخاصة بك</p>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCountryModal(true)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Settings className="h-4 w-4" />
                  {country ? 'تعديل' : 'إعداد'}
                </Button>
              </div>

              {country && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                    <p className="text-emerald-100 text-sm">العملة</p>
                    <p className="text-xl font-bold mt-1">{country.currency}</p>
                    <p className="text-emerald-100 text-sm">{country.currency_symbol}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                    <p className="text-emerald-100 text-sm">عدد المدن</p>
                    <p className="text-xl font-bold mt-1">{cities.length}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                    <p className="text-emerald-100 text-sm">المدن النشطة</p>
                    <p className="text-xl font-bold mt-1">{activeCitiesCount}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                    <p className="text-emerald-100 text-sm">متوسط الشحن</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(totalShippingAvg)}</p>
                    <p className="text-emerald-100 text-sm">{country.currency_symbol}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {country && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                          placeholder="بحث في المدن..."
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

                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        resetCityForm();
                        setShowCityModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      إضافة مدينة
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {filteredCities.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-16">
                    <MapPin className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-zinc-950 mb-2">لا توجد مدن</h3>
                    <p className="text-zinc-600 mb-6">ابدأ بإضافة المدن التي تقوم بالتوصيل إليها</p>
                    <Button
                      variant="accent"
                      onClick={() => {
                        resetCityForm();
                        setShowCityModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      إضافة أول مدينة
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCities.map((city) => (
                    <Card
                      key={city.id}
                      className={`overflow-hidden transition-all hover:shadow-lg ${
                        !city.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              city.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                            }`}>
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-zinc-950">{city.name_ar}</h3>
                              {city.name_en && (
                                <p className="text-xs text-zinc-500">{city.name_en}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant={city.is_active ? 'success' : 'default'} size="sm">
                            {city.is_active ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>

                        <div className="bg-zinc-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-zinc-600 text-sm mb-1">
                            <Truck className="h-4 w-4" />
                            تكلفة الشحن
                          </div>
                          <p className="text-2xl font-bold text-zinc-950">
                            {formatCurrency(city.shipping_cost)}
                            <span className="text-sm font-normal text-zinc-500 mr-1">
                              {country.currency_symbol}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openEditCity(city)}
                          >
                            <Edit2 className="h-4 w-4" />
                            تعديل
                          </Button>
                          <button
                            onClick={() => handleToggleCityActive(city)}
                            className={`p-2 rounded-lg transition-colors ${
                              city.is_active
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={city.is_active ? 'تعطيل' : 'تفعيل'}
                          >
                            {city.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteCity(city)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {!country && (
            <Card>
              <CardContent className="text-center py-16">
                <Globe className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-zinc-950 mb-2">قم بإعداد دولة التشغيل</h3>
                <p className="text-zinc-600 mb-6">
                  حدد الدولة التي تعمل بها لتتمكن من إضافة المدن وتحديد تكاليف الشحن
                </p>
                <Button variant="accent" onClick={() => setShowCountryModal(true)}>
                  <Settings className="h-4 w-4" />
                  إعداد الدولة
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showCountryModal && (
        <Modal
          isOpen={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          title={country ? 'تعديل الدولة' : 'إعداد الدولة'}
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">اختر من الدول الشائعة</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {POPULAR_COUNTRIES.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => selectPresetCountry(preset)}
                    className={`p-3 rounded-xl border-2 text-right transition-all ${
                      countryForm.code === preset.code
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <p className="font-medium text-zinc-950 text-sm">{preset.name_ar}</p>
                    <p className="text-xs text-zinc-500">{preset.currency}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-zinc-500 mb-4">أو أدخل البيانات يدوياً</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="اسم الدولة بالعربية *"
                  placeholder="المملكة العربية السعودية"
                  value={countryForm.name_ar}
                  onChange={(e) => setCountryForm({ ...countryForm, name_ar: e.target.value })}
                />
                <Input
                  label="اسم الدولة بالإنجليزية"
                  placeholder="Saudi Arabia"
                  value={countryForm.name_en}
                  onChange={(e) => setCountryForm({ ...countryForm, name_en: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  label="رمز الدولة"
                  placeholder="SA"
                  value={countryForm.code}
                  onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
                <Input
                  label="رمز العملة *"
                  placeholder="SAR"
                  value={countryForm.currency}
                  onChange={(e) => setCountryForm({ ...countryForm, currency: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
                <Input
                  label="رمز العملة المحلي"
                  placeholder="ر.س"
                  value={countryForm.currency_symbol}
                  onChange={(e) => setCountryForm({ ...countryForm, currency_symbol: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCountryModal(false)}>
                إلغاء
              </Button>
              <Button
                variant="accent"
                onClick={handleSaveCountry}
                disabled={!countryForm.name_ar || !countryForm.currency}
              >
                حفظ
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showCityModal && (
        <Modal
          isOpen={showCityModal}
          onClose={() => {
            setShowCityModal(false);
            resetCityForm();
          }}
          title={editingCity ? 'تعديل المدينة' : 'إضافة مدينة'}
        >
          <div className="space-y-4">
            <Input
              label="اسم المدينة بالعربية *"
              placeholder="الرياض"
              value={cityForm.name_ar}
              onChange={(e) => setCityForm({ ...cityForm, name_ar: e.target.value })}
            />
            <Input
              label="اسم المدينة بالإنجليزية"
              placeholder="Riyadh"
              value={cityForm.name_en}
              onChange={(e) => setCityForm({ ...cityForm, name_en: e.target.value })}
            />
            <Input
              label={`تكلفة الشحن (${country?.currency_symbol || ''})`}
              type="number"
              min="0"
              step="0.01"
              placeholder="25"
              value={cityForm.shipping_cost}
              onChange={(e) => setCityForm({ ...cityForm, shipping_cost: parseFloat(e.target.value) || 0 })}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCityModal(false);
                  resetCityForm();
                }}
              >
                إلغاء
              </Button>
              <Button
                variant="accent"
                onClick={handleSaveCity}
                disabled={!cityForm.name_ar}
              >
                {editingCity ? 'حفظ التغييرات' : 'إضافة المدينة'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
