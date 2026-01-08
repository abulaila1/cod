import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { AuthLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { Loader2, AlertCircle } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const { ensureWorkspace, refreshBusinesses } = useBusiness();
  const [status, setStatus] = useState<'loading' | 'provisioning' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
      const errorParam = hashParams.get('error') || queryParams.get('error');
      const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

      if (errorParam) {
        setStatus('error');
        setError(errorDescription || 'حدث خطأ أثناء التحقق');
        return;
      }

      let session;

      if (accessToken && refreshToken) {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setStatus('error');
          setError('فشل تسجيل الدخول');
          return;
        }

        session = data.session;
      } else {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setStatus('error');
          setError('فشل التحقق من الجلسة');
          return;
        }

        session = data.session;
      }

      if (!session) {
        setStatus('error');
        setError('لم يتم العثور على بيانات التحقق');
        return;
      }

      await provisionWorkspace();
    } catch (err) {
      console.error('Error in callback:', err);
      setStatus('error');
      setError('حدث خطأ غير متوقع');
    }
  };

  const provisionWorkspace = async () => {
    try {
      setStatus('provisioning');

      const business = await ensureWorkspace();

      if (!business) {
        throw new Error('فشل إنشاء الوورك سبيس');
      }

      await refreshBusinesses();

      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      console.error('Error provisioning workspace:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'فشل إعداد الوورك سبيس');
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setError(null);
    handleCallback();
  };

  if (status === 'error') {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            فشل التحقق
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleRetry}
            >
              إعادة المحاولة
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/auth/login')}
            >
              العودة لتسجيل الدخول
            </Button>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-right">
            <p className="text-sm text-amber-900 leading-relaxed">
              <strong>نصيحة:</strong> إذا استمرت المشكلة، جرب تسجيل الخروج والدخول من جديد، أو تحقق من صندوق الرسائل لتأكيد البريد الإلكتروني.
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {status === 'loading' ? 'جاري التحقق من حسابك' : 'جاري إعداد وورك سبيس'}
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {status === 'loading'
            ? 'الرجاء الانتظار بينما نقوم بتأكيد بريدك الإلكتروني...'
            : 'جاري إنشاء وورك سبيس الخاص بك مع التجربة المجانية 24 ساعة...'}
        </p>

        {status === 'provisioning' && (
          <div className="mt-6 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
