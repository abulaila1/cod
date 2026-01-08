import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useToast } from '@/components/ui/Toast';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Package,
  FileText,
  TrendingUp,
  Truck,
  Tag,
  ShoppingBag,
  MapPin,
  Briefcase,
} from 'lucide-react';

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { employee, logout } = useEmployee();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast('success', 'تم تسجيل الخروج بنجاح');
    navigate('/employee/login');
  };

  if (!employee) {
    return null;
  }

  const hasPermission = (permission: string) => {
    return employee.permissions?.includes(permission);
  };

  const navigationItems = [
    {
      name: 'لوحة التحكم',
      icon: LayoutDashboard,
      href: '/employee/dashboard',
      permission: 'dashboard',
    },
    {
      name: 'الطلبات',
      icon: Package,
      href: '/employee/orders',
      permission: 'orders',
    },
    {
      name: 'المنتجات',
      icon: ShoppingBag,
      href: '/employee/products',
      permission: 'products',
    },
    {
      name: 'التقارير',
      icon: FileText,
      href: '/employee/reports',
      permission: 'reports',
    },
    {
      name: 'الحالات',
      icon: Tag,
      href: '/employee/statuses',
      permission: 'statuses',
    },
    {
      name: 'الشركات',
      icon: Truck,
      href: '/employee/carriers',
      permission: 'carriers',
    },
    {
      name: 'الدول',
      icon: MapPin,
      href: '/employee/countries',
      permission: 'countries',
    },
  ].filter((item) => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-white border-l border-slate-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {employee.name_ar}
              </h2>
              <p className="text-xs text-slate-500">موظف</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {employee.name_ar}
                  </p>
                  <p className="text-xs text-slate-500">{employee.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
