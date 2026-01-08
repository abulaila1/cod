import { useState, FormEvent, useEffect } from 'react';
import { AuthLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { validatePassword, validatePasswordMatch } from '@/utils/validation';
import { useAuth } from '@/contexts/AuthContext';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const { session, updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/auth/forgot-password');
    } else {
      setHasSession(true);
    }
  }, [session, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    const confirmPasswordError = validatePasswordMatch(password, confirmPassword);

    if (passwordError || confirmPasswordError) {
      setErrors({
        password: passwordError || undefined,
        confirmPassword: confirmPasswordError || undefined,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        throw error;
      }

      navigate('/auth/callback');
    } catch (err) {
      setErrors({ password: 'فشل تحديث كلمة المرور' });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = password && confirmPassword && !errors.password && !errors.confirmPassword;

  if (!hasSession) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-600">جاري التحقق من الرابط...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        إعادة تعيين كلمة المرور
      </h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        أدخل كلمة المرور الجديدة لحسابك
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="كلمة المرور الجديدة"
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

        <Button
          variant="primary"
          className="w-full"
          type="submit"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
        </Button>
      </form>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          بعد تحديث كلمة المرور، سيتم تسجيل دخولك تلقائياً.
        </p>
      </div>
    </AuthLayout>
  );
}
