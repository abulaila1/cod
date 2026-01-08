import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layout';
import { Button, Input, Select } from '@/components/ui';
import { Store, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const CURRENCIES = [
  { value: 'USD', label: '🇺🇸 USD - الدولار الأمريكي' },
  { value: 'EUR', label: '🇪🇺 EUR - اليورو' },
  { value: 'GBP', label: '🇬🇧 GBP - الجنيه الإسترليني' },
  { value: 'SAR', label: '🇸🇦 SAR - الريال السعودي' },
  { value: 'AED', label: '🇦🇪 AED - الدرهم الإماراتي' },
  { value: 'EGP', label: '🇪🇬 EGP - الجنيه المصري' },
  { value: 'KWD', label: '🇰🇼 KWD - الدينار الكويتي' },
  { value: 'QAR', label: '🇶🇦 QAR - الريال القطري' },
  { value: 'BHD', label: '🇧🇭 BHD - الدينار البحريني' },
  { value: 'OMR', label: '🇴🇲 OMR - الريال العماني' },
  { value: 'JOD', label: '🇯🇴 JOD - الدينار الأردني' },
];

const COUNTRIES = [
  { value: 'SA', label: '🇸🇦 المملكة العربية السعودية' },
  { value: 'AE', label: '🇦🇪 الإمارات العربية المتحدة' },
  { value: 'EG', label: '🇪🇬 مصر' },
  { value: 'KW', label: '🇰🇼 الكويت' },
  { value: 'QA', label: '🇶🇦 قطر' },
  { value: 'BH', label: '🇧🇭 البحرين' },
  { value: 'OM', label: '🇴🇲 عمان' },
  { value: 'JO', label: '🇯🇴 الأردن' },
  { value: 'LB', label: '🇱🇧 لبنان' },
  { value: 'IQ', label: '🇮🇶 العراق' },
  { value: 'MA', label: '🇲🇦 المغرب' },
  { value: 'TN', label: '🇹🇳 تونس' },
  { value: 'DZ', label: '🇩🇿 الجزائر' },
  { value: 'US', label: '🇺🇸 الولايات المتحدة' },
  { value: 'GB', label: '🇬🇧 المملكة المتحدة' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { user, checkWorkspaceStatus } = useAuth();
  const [storeName, setStoreName] = useState('متجري');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('SA');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('لم يتم تسجيل الدخول');
      return;
    }

    if (!storeName.trim()) {
      setError('الرجاء إدخال اسم المتجر');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Creating workspace for user:', user.id);

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: storeName.trim(),
          created_by: user.id,
          settings: {
            currency,
            country,
          },
        })
        .select('id')
        .single();

      if (businessError) {
        console.error('Error creating business:', businessError);
        throw new Error(`فشل إنشاء المتجر: ${businessError.message}`);
      }

      if (!business) {
        throw new Error('لم يتم إرجاع معرف المتجر');
      }

      console.log('Business created:', business.id);

      const { error: memberError } = await supabase
        .from('business_members')
        .insert({
          business_id: business.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
          invited_by: user.id,
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('Error creating business member:', memberError);
        throw new Error(`فشل ربط المستخدم بالمتجر: ${memberError.message}`);
      }

      console.log('Business member created');

      const trialEndsAt = new Date();
      trialEndsAt.setHours(trialEndsAt.getHours() + 24);

      const { error: billingError } = await supabase
        .from('business_billing')
        .insert({
          business_id: business.id,
          plan_type: 'trial',
          status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt.toISOString(),
        });

      if (billingError) {
        console.error('Error creating billing:', billingError);
        throw new Error(`فشل إنشاء الفوترة: ${billingError.message}`);
      }

      console.log('Billing created successfully');

      setSuccess(true);

      await checkWorkspaceStatus();

      localStorage.setItem('currentBusinessId', business.id);

      setTimeout(() => {
        navigate('/app/dashboard', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError(err instanceof Error ? err.message : 'فشل إنشاء الوورك سبيس');
      setIsCreating(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          مرحباً بك! لنبدأ بإنشاء متجرك
        </h2>
        <p className="text-gray-600 leading-relaxed">
          املأ المعلومات التالية لإنشاء مساحة العمل الخاصة بك
        </p>
      </div>

      <form onSubmit={handleCreateWorkspace} className="space-y-6">
        <div>
          <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2 text-right">
            اسم المتجر <span className="text-red-500">*</span>
          </label>
          <Input
            id="storeName"
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="مثال: متجر الإلكترونيات"
            disabled={isCreating}
            className="text-right"
            required
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2 text-right">
            العملة الافتراضية <span className="text-red-500">*</span>
          </label>
          <Select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={isCreating}
            className="text-right"
            required
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </Select>
          <p className="mt-2 text-sm text-gray-500 text-right">
            سيتم استخدام هذه العملة في جميع التقارير والفواتير
          </p>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2 text-right">
            الدولة <span className="text-red-500">*</span>
          </label>
          <Select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={isCreating}
            className="text-right"
            required
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-right flex-1">
              <p className="text-sm font-medium text-emerald-900">تم إنشاء المتجر بنجاح!</p>
              <p className="text-sm text-emerald-700 mt-1">جاري تحويلك إلى لوحة التحكم...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 text-right flex-1">{error}</p>
          </div>
        )}

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-right">
          <h3 className="font-semibold text-emerald-900 mb-2">ما ستحصل عليه:</h3>
          <ul className="space-y-1 text-sm text-emerald-800">
            <li>• تجربة مجانية لمدة 24 ساعة</li>
            <li>• إدارة غير محدودة للطلبات</li>
            <li>• تقارير وتحليلات شاملة</li>
            <li>• إدارة الموظفين والصلاحيات</li>
          </ul>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isCreating || success}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              جاري الإنشاء...
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-5 h-5 ml-2" />
              تم الإنشاء بنجاح
            </>
          ) : (
            <>
              <Store className="w-5 h-5 ml-2" />
              إنشاء المتجر والبدء
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          تحتاج مساعدة؟{' '}
          <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
            تواصل مع الدعم
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
