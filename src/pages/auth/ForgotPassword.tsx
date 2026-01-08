import { useState, FormEvent } from 'react';
import { AuthLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { Link } from 'react-router-dom';
import { validateEmail } from '@/utils/validation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);

    if (emailError) {
      setError(emailError);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError('فشل إرسال البريد');
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            تم الإرسال بنجاح
          </h2>
          <p className="text-gray-600 mb-6">
            تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-right">
            <p className="text-sm text-gray-700 leading-relaxed">
              تحقق من بريدك الإلكتروني وافتح الرسالة من codmeta. انقر على الرابط الموجود في الرسالة لإعادة تعيين كلمة المرور.
            </p>
          </div>

          <Link to="/auth/login" className="block">
            <Button variant="outline" className="w-full">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة إلى تسجيل الدخول
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        نسيت كلمة المرور؟
      </h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        أدخل بريدك الإلكتروني وسنرسل لك رابط استعادة كلمة المرور
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="admin@codmeta.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />

        <Button
          variant="primary"
          className="w-full"
          type="submit"
          disabled={!email || isLoading}
        >
          {isLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة إلى تسجيل الدخول
        </Link>
      </div>
    </AuthLayout>
  );
}
