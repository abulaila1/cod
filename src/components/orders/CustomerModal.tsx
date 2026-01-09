import { useState } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { User, Phone, MapPin, Mail, Loader2 } from 'lucide-react';
import type { City, CustomerCreateInput } from '@/types/domain';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: CustomerCreateInput) => Promise<void>;
  cities: City[];
  initialPhone?: string;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSave,
  cities,
  initialPhone = '',
}: CustomerModalProps) {
  const [form, setForm] = useState<CustomerCreateInput>({
    name: '',
    phone: initialPhone,
    email: '',
    city_id: '',
    address: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('اسم العميل مطلوب');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onSave(form);
      setForm({ name: '', phone: '', email: '', city_id: '', address: '', notes: '' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', phone: initialPhone, email: '', city_id: '', address: '', notes: '' });
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="إضافة عميل جديد"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'إضافة العميل'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            <User className="h-4 w-4 inline ml-1" />
            اسم العميل <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="أدخل اسم العميل"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            <Phone className="h-4 w-4 inline ml-1" />
            رقم الهاتف
          </label>
          <Input
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="05xxxxxxxx"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            <Mail className="h-4 w-4 inline ml-1" />
            البريد الإلكتروني
          </label>
          <Input
            type="email"
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="example@email.com"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            <MapPin className="h-4 w-4 inline ml-1" />
            المدينة
          </label>
          <Select
            value={form.city_id || ''}
            onChange={(e) => setForm({ ...form, city_id: e.target.value })}
          >
            <option value="">اختر المدينة</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name_ar}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            <MapPin className="h-4 w-4 inline ml-1" />
            العنوان التفصيلي
          </label>
          <Textarea
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="أدخل العنوان التفصيلي"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            ملاحظات
          </label>
          <Textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="ملاحظات إضافية عن العميل"
            rows={2}
          />
        </div>
      </div>
    </Modal>
  );
}
