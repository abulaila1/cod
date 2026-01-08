import { useState, FormEvent } from 'react';
import { AuthLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword, validateName, validatePasswordMatch } from '@/utils/validation';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const translateSupabaseError = (error: any): string => {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (errorMessage.includes('user already registered') || errorMessage.includes('already exists')) {
      return 'هذا البريد مسجل بالفعل';
    }

    if (errorMessage.includes('password') && (errorMessage.includes('weak') || errorMessage.includes('short'))) {
      return 'كلمة المرور ضعيفة جداً';
    }

    if (errorMessage.includes('invalid email')) {
      return 'البريد الإلكتروني غير صالح';
    }

    return 'فشل إنشاء الحساب';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validatePasswordMatch(password, confirmPassword);

    if (nameError || emailError || passwordError || confirmPasswordError) {
      setErrors({
        name: nameError || undefined,
        email: emailError || undefined,
        password: passwordError || undefined,
        confirmPassword: confirmPasswordError || undefined,
      });
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('يجب الموافقة على الشروط والأحكام');
      return;
    }

    setErrors({});
    setErrorMessage('');
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, name);

      if (error) {
        throw error;
      }

      navigate('/auth/check-email', { state: { email } });
    } catch (error) {
      const translatedError = translateSupabaseError(error);
      setErrorMessage(translatedError);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    name &&
    email &&
    password &&
    confirmPassword &&
    agreedToTerms &&
    !errors.name &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword;

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        إنشاء حساب جديد
      </h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        انضم إلى منصة codmeta وابدأ رحلتك الاحترافية
      </p>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="الاسم الكامل"
          type="text"
          placeholder="أحمد محمد"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="ahmed@example.com"
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
          hint="8 أحرف على الأقل"
        />

        <Input
          label="تأكيد كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-emerald-900 leading-relaxed">
              <strong>تجربة مجانية 24 ساعة</strong> - احصل على تجربة مجانية لمدة 24 ساعة تلقائياً بدون بطاقة ائتمان
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            أوافق على{' '}
            <Link to="#" className="text-blue-600 hover:text-blue-700">
              الشروط والأحكام
            </Link>
          </label>
        </div>

        <Button
          variant="primary"
          className="w-full"
          type="submit"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        لديك حساب بالفعل؟{' '}
        <Link
          to="/auth/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          تسجيل الدخول
        </Link>
      </p>
    </AuthLayout>
  );
}
