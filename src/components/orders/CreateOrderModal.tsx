import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { CustomersService } from '@/services/customers.service';
import { CountriesService } from '@/services/countries.service';
import { OrdersService } from '@/services/orders.service';
import { ProductSelector, type OrderItemForm } from './ProductSelector';
import { CustomerModal } from './CustomerModal';
import {
  User,
  Phone,
  MapPin,
  Truck,
  Package,
  DollarSign,
  Search,
  Plus,
  Loader2,
  X,
  UserPlus,
  FileText,
} from 'lucide-react';
import type {
  Customer,
  CustomerCreateInput,
  City,
  Product,
  Status,
  Carrier,
  Employee,
} from '@/types/domain';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
  userId: string;
  products: Product[];
  statuses: Status[];
  carriers: Carrier[];
  employees: Employee[];
  currency: string;
}

export function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
  userId,
  products,
  statuses,
  carriers,
  employees,
  currency,
}: CreateOrderModalProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [items, setItems] = useState<OrderItemForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    city_id: '',
    carrier_id: '',
    employee_id: '',
    status_id: '',
    shipping_cost: 0,
    cod_fees: 0,
    notes: '',
    order_source: '',
    order_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen && businessId) {
      loadCities();
    }
  }, [isOpen, businessId]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const loadCities = async () => {
    try {
      const citiesData = await CountriesService.listCities(businessId, { activeOnly: true });
      setCities(citiesData);
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const resetForm = () => {
    setCustomerSearch('');
    setSearchResults([]);
    setSelectedCustomer(null);
    setItems([]);
    setError(null);
    setForm({
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      city_id: '',
      carrier_id: '',
      employee_id: '',
      status_id: '',
      shipping_cost: 0,
      cod_fees: 0,
      notes: '',
      order_source: '',
      order_date: new Date().toISOString().split('T')[0],
    });
  };

  const searchCustomers = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await CustomersService.searchCustomers(businessId, term, 5);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search customers:', err);
    } finally {
      setIsSearching(false);
    }
  }, [businessId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch && !selectedCustomer) {
        searchCustomers(customerSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch, selectedCustomer, searchCustomers]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setSearchResults([]);
    setForm((prev) => ({
      ...prev,
      customer_name: customer.name,
      customer_phone: customer.phone || '',
      customer_address: customer.address || '',
      city_id: customer.city_id || '',
    }));
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setForm((prev) => ({
      ...prev,
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      city_id: '',
    }));
  };

  const handleCreateCustomer = async (input: CustomerCreateInput) => {
    const newCustomer = await CustomersService.createCustomer(businessId, input);
    handleSelectCustomer(newCustomer);
    setShowCustomerModal(false);
  };

  const handleCityChange = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId);
    setForm((prev) => ({
      ...prev,
      city_id: cityId,
      shipping_cost: city?.shipping_cost || prev.shipping_cost,
    }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.customer_name.trim()) {
      setError('اسم العميل مطلوب');
      return;
    }

    if (items.length === 0) {
      setError('يجب إضافة منتج واحد على الأقل');
      return;
    }

    if (!form.status_id) {
      setError('يجب اختيار حالة الطلب');
      return;
    }

    try {
      setIsLoading(true);

      await OrdersService.createOrder(
        businessId,
        {
          order_date: form.order_date,
          customer_id: selectedCustomer?.id,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone || undefined,
          customer_address: form.customer_address || undefined,
          city_id: form.city_id || undefined,
          carrier_id: form.carrier_id || undefined,
          employee_id: form.employee_id || undefined,
          status_id: form.status_id,
          order_source: form.order_source || undefined,
          notes: form.notes || undefined,
          shipping_cost: form.shipping_cost,
          cod_fees: form.cod_fees,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        },
        userId
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);
  const profit = totalRevenue - totalCost - form.shipping_cost - form.cod_fees;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="إنشاء طلب جديد"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'إنشاء الطلب'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                بيانات العميل
              </h3>

              {selectedCustomer ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-blue-900">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && (
                        <p className="text-sm text-blue-700">{selectedCustomer.phone}</p>
                      )}
                      <p className="text-xs text-blue-600 mt-1">
                        {selectedCustomer.total_orders} طلب سابق
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                      <Input
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="ابحث عن عميل بالاسم أو رقم الهاتف..."
                        className="pr-10"
                      />
                      {isSearching && (
                        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary-400" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCustomerModal(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-primary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleSelectCustomer(customer)}
                          className="w-full px-4 py-3 text-right hover:bg-primary-50 border-b border-primary-100 last:border-0"
                        >
                          <p className="font-medium">{customer.name}</p>
                          {customer.phone && (
                            <p className="text-sm text-primary-500">{customer.phone}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    اسم العميل <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    placeholder="اسم العميل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    رقم الهاتف
                  </label>
                  <Input
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  المدينة
                </label>
                <Select
                  value={form.city_id}
                  onChange={(e) => handleCityChange(e.target.value)}
                >
                  <option value="">اختر المدينة</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name_ar} ({city.shipping_cost} {currency})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  العنوان
                </label>
                <Textarea
                  value={form.customer_address}
                  onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                  placeholder="العنوان التفصيلي"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                تفاصيل الطلب
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    تاريخ الطلب
                  </label>
                  <Input
                    type="date"
                    value={form.order_date}
                    onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    حالة الطلب <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.status_id}
                    onChange={(e) => setForm({ ...form, status_id: e.target.value })}
                  >
                    <option value="">اختر الحالة</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name_ar}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    شركة الشحن
                  </label>
                  <Select
                    value={form.carrier_id}
                    onChange={(e) => setForm({ ...form, carrier_id: e.target.value })}
                  >
                    <option value="">اختر شركة الشحن</option>
                    {carriers.filter((c) => c.is_active).map((carrier) => (
                      <option key={carrier.id} value={carrier.id}>
                        {carrier.name_ar}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    الموظف المسؤول
                  </label>
                  <Select
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  >
                    <option value="">اختر الموظف</option>
                    {employees.filter((e) => e.is_active).map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name_ar}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  مصدر الطلب
                </label>
                <Select
                  value={form.order_source}
                  onChange={(e) => setForm({ ...form, order_source: e.target.value })}
                >
                  <option value="">اختر المصدر</option>
                  <option value="website">الموقع الإلكتروني</option>
                  <option value="phone">اتصال هاتفي</option>
                  <option value="whatsapp">واتساب</option>
                  <option value="instagram">انستغرام</option>
                  <option value="facebook">فيسبوك</option>
                  <option value="tiktok">تيك توك</option>
                  <option value="store">المتجر</option>
                  <option value="other">أخرى</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  ملاحظات
                </label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="ملاحظات على الطلب"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-primary-200 pt-6">
            <h3 className="font-semibold text-primary-900 flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" />
              المنتجات
            </h3>
            <ProductSelector
              products={products}
              items={items}
              onChange={setItems}
              currency={currency}
            />
          </div>

          <div className="border-t border-primary-200 pt-6">
            <h3 className="font-semibold text-primary-900 flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5" />
              التكاليف والرسوم
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  تكلفة الشحن
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.shipping_cost}
                  onChange={(e) => setForm({ ...form, shipping_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  رسوم COD
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cod_fees}
                  onChange={(e) => setForm({ ...form, cod_fees: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="bg-primary-50 p-3 rounded-lg">
                <p className="text-sm text-primary-600">إجمالي الإيراد</p>
                <p className="text-lg font-bold text-primary-900">
                  {totalRevenue.toFixed(2)} {currency}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  الربح المتوقع
                </p>
                <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {profit.toFixed(2)} {currency}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={handleCreateCustomer}
        cities={cities}
        initialPhone={customerSearch}
      />
    </>
  );
}
