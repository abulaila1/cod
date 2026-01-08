import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useToast } from '@/components/ui/Toast';
import { Button, Input } from '@/components/ui';
import { Lock, Mail, Briefcase, Eye, EyeOff } from 'lucide-react';

export function EmployeeLogin() {
  const navigate = useNavigate();
  const { login } = useEmployee();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    businessId: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessId || !formData.email || !formData.password) {
      showToast('warning', 'يرجى ملء جميع الحقول');
      return;
    }

    try {
      setIsLoading(true);
      await login(formData.businessId, formData.email, formData.password);
      showToast('success', 'تم تسجيل الدخول بنجاح');
      navigate('/employee/dashboard');
    } catch (error: any) {
      console.error('Employee login failed:', error);
      showToast('error', error.message || 'فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">تسجيل دخول الموظفين</h1>
            <p className="text-slate-600 mt-2 text-center">
              أدخل بيانات حسابك للوصول إلى لوحة التحكم
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                معرف الوورك سبيس <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                value={formData.businessId}
                onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                placeholder="أدخل معرف الوورك سبيس"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                اطلب المعرف من مدير الحساب
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                البريد الإلكتروني <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@company.com"
                  className="pr-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                كلمة المرور <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10 pl-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              لست موظفاً؟{' '}
              <a
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                تسجيل دخول كمدير
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
