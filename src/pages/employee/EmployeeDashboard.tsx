import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import {
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Calendar,
} from 'lucide-react';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { employee } = useEmployee();

  useEffect(() => {
    if (!employee) {
      navigate('/employee/login');
    }
  }, [employee, navigate]);

  if (!employee) {
    return null;
  }

  return (
    <EmployeeLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">لوحة التحكم</h2>
          <p className="text-slate-600">
            عرض الإحصائيات والوصول السريع للمهام المتاحة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">0</h3>
            <p className="text-sm text-slate-600">إجمالي الطلبات</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">0</h3>
            <p className="text-sm text-slate-600">طلبات مكتملة</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">0</h3>
            <p className="text-sm text-slate-600">قيد المعالجة</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">0%</h3>
            <p className="text-sm text-slate-600">معدل النجاح</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">الصلاحيات المتاحة</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employee.permissions && employee.permissions.length > 0 ? (
              employee.permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-slate-700">{getPermissionLabel(permission)}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 col-span-3">لا توجد صلاحيات متاحة</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">معلومات الحساب</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">الاسم بالعربي</span>
              <span className="text-sm font-medium text-slate-900">{employee.name_ar}</span>
            </div>
            {employee.name_en && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">الاسم بالإنجليزي</span>
                <span className="text-sm font-medium text-slate-900">{employee.name_en}</span>
              </div>
            )}
            {employee.email && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">البريد الإلكتروني</span>
                <span className="text-sm font-medium text-slate-900">{employee.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">الحالة</span>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  employee.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {employee.is_active ? 'نشط' : 'غير نشط'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}

function getPermissionLabel(key: string): string {
  const labels: Record<string, string> = {
    view_orders: 'عرض الطلبات',
    create_orders: 'إنشاء الطلبات',
    edit_orders: 'تعديل الطلبات',
    delete_orders: 'حذف الطلبات',
    view_reports: 'عرض التقارير',
    manage_products: 'إدارة المنتجات',
    manage_customers: 'إدارة العملاء',
  };
  return labels[key] || key;
}
