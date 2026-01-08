import { useState, FormEvent } from 'react';
import { AuthLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword } from '@/utils/validation';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
      });
      return;
    }

    setErrors({});
    setErrorMessage('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        throw error;
      }

      navigate('/auth/callback');
    } catch (error: any) {
      const message = error.message?.includes('Invalid login')
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : 'فشل تسجيل الدخول';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email && password && !errors.email && !errors.password;

  return (
    <AuthLayout>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        مرحباً بعودتك
      </h2>
      <p className="text-base text-gray-600 mb-8 text-center">
        سجل دخولك للوصول إلى لوحة التحكم
      </p>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="admin@codmeta.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <Input
          label="كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <div className="flex items-center justify-end text-sm">
          <Link
            to="/auth/forgot-password"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button
          variant="primary"
          className="w-full"
          type="submit"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">أو</span>
        </div>
      </div>

      <p className="text-center text-base text-gray-600">
        ليس لديك حساب؟{' '}
        <Link
          to="/auth/register"
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          إنشاء حساب جديد
        </Link>
      </p>
    </AuthLayout>
  );
}
