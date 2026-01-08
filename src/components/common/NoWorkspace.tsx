import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';

export function NoWorkspace() {
  const navigate = useNavigate();
  const { ensureWorkspace } = useBusiness();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorkspace = async () => {
    setIsCreating(true);
    setError(null);

    const timeout = setTimeout(() => {
      setError('انتهى وقت الانتظار. حاول مرة أخرى.');
      setIsCreating(false);
    }, 15000);

    try {
      if (import.meta.env.DEV) {
        console.log('[NoWorkspace] Starting workspace creation...');
      }

      await ensureWorkspace();

      clearTimeout(timeout);

      if (import.meta.env.DEV) {
        console.log('[NoWorkspace] Workspace created successfully, navigating to dashboard');
      }

      navigate('/app/dashboard');
    } catch (err) {
      clearTimeout(timeout);
      console.error('[NoWorkspace] Failed to create workspace:', err);

      let errorMessage = 'حدث خطأ غير متوقع';

      if (err instanceof Error) {
        if (err.message.includes('duplicate key')) {
          errorMessage = 'يبدو أن لديك وورك سبيس بالفعل. حاول تحديث الصفحة.';
        } else if (err.message.includes('permission') || err.message.includes('violates row-level security')) {
          errorMessage = 'فشل إنشاء وورك سبيس. تحقق من الصلاحيات أو حاول تسجيل الخروج والدخول مرة أخرى.';
        } else if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
          errorMessage = 'خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-blue-600" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-slate-900" dir="rtl">
              لا يوجد وورك سبيس بعد
            </h1>
            <p className="text-slate-600" dir="rtl">
              يبدو أنك بحاجة إلى إنشاء وورك سبيس للبدء في استخدام التطبيق.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4" dir="rtl">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
            onClick={handleCreateWorkspace}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader className="w-4 h-4 ml-2 animate-spin" />
                <span dir="rtl">جاري الإنشاء...</span>
              </>
            ) : (
              <span dir="rtl">إنشاء وورك سبيس الآن</span>
            )}
          </Button>

          <p className="text-sm text-slate-500" dir="rtl">
            سيتم إنشاء وورك سبيس جديد باسم "متجري" مع الإعدادات الافتراضية.
          </p>
        </div>
      </Card>
    </div>
  );
}
