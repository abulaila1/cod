import { useState } from 'react';
import { AuthLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { signUp } = useAuth();

  const handleResend = async () => {
    if (!email) {
      setResendStatus('error');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');

    try {
      await signUp(email, 'temp-password', 'temp-name');
      setResendStatus('success');
    } catch (error) {
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <Mail className="h-10 w-10 text-emerald-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          تحقق من بريدك الإلكتروني
        </h2>

        <p className="text-base text-gray-700 mb-2 leading-relaxed">
          تم إرسال رابط تأكيد إلى بريدك الإلكتروني:
        </p>

        {email && (
          <p className="text-lg font-semibold text-emerald-600 mb-6">
            {email}
          </p>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-right">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 leading-relaxed">
                <strong>ملاحظة مهمة:</strong> افتح الرسالة واضغط على رابط التأكيد لإكمال إنشاء حسابك وتفعيل التجربة المجانية.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? 'جاري الإرسال...' : 'إعادة إرسال رسالة التأكيد'}
          </Button>

          {resendStatus === 'success' && (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>تم إرسال الرسالة بنجاح</span>
            </div>
          )}

          {resendStatus === 'error' && (
            <div className="flex items-center justify-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>فشل إرسال الرسالة</span>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            لم تستلم الرسالة؟ تحقق من مجلد الرسائل غير المرغوب فيها (Spam)
          </p>
          <Link
            to="/auth/login"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            لديك حساب بالفعل؟ تسجيل الدخول
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
