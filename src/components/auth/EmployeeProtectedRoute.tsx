import { Navigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';

interface EmployeeProtectedRouteProps {
  children: React.ReactNode;
}

export function EmployeeProtectedRoute({ children }: EmployeeProtectedRouteProps) {
  const { employee, isLoading } = useEmployee();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return <Navigate to="/employee/login" replace />;
  }

  if (!employee.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">حساب غير نشط</h2>
          <p className="text-slate-600 mb-6">
            تم تعطيل حسابك. يرجى التواصل مع مدير النظام لمزيد من المعلومات.
          </p>
          <button
            onClick={() => (window.location.href = '/employee/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
