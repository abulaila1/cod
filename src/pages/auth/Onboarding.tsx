import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { Store, Loader2, AlertCircle } from 'lucide-react';

export function Onboarding() {
  const navigate = useNavigate();
  const { ensureWorkspace, refreshBusinesses } = useBusiness();
  const { checkWorkspaceStatus } = useAuth();
  const [businessName, setBusinessName] = useState('متجري');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      setError('الرجاء إدخال اسم المتجر');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const business = await ensureWorkspace();

      if (!business) {
        throw new Error('فشل إنشاء الوورك سبيس');
      }

      await checkWorkspaceStatus();

      await refreshBusinesses();

      navigate('/app/dashboard', { replace: true });
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
          مرحباً! لنبدأ بإنشاء متجرك
        </h2>
        <p className="text-gray-600 leading-relaxed">
          أنت على بُعد خطوة واحدة من إدارة طلباتك بكفاءة
        </p>
      </div>

      <form onSubmit={handleCreateWorkspace} className="space-y-6">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2 text-right">
            اسم المتجر
          </label>
          <Input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="مثال: متجر الإلكترونيات"
            disabled={isCreating}
            className="text-right"
            required
          />
          <p className="mt-2 text-sm text-gray-500 text-right">
            يمكنك تغيير هذا الاسم لاحقاً من الإعدادات
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 text-right flex-1">{error}</p>
          </div>
        )}

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-right">
          <h3 className="font-semibold text-emerald-900 mb-2">✨ ما ستحصل عليه:</h3>
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
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              جاري الإنشاء...
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
