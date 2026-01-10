import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Globe,
  Users,
  BarChart3,
  Settings,
  X,
  Target,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/app/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/app/orders', label: 'الطلبات', icon: ShoppingCart },
  { path: '/app/products', label: 'المنتجات', icon: Package },
  { path: '/app/carriers', label: 'شركات الشحن', icon: Truck },
  { path: '/app/countries', label: 'الدول/المناطق', icon: Globe },
  { path: '/app/employees', label: 'الموظفين', icon: Users },
  { path: '/app/reports', label: 'التقارير', icon: BarChart3 },
  { path: '/app/advertising', label: 'الإعلانات', icon: Target },
  { path: '/app/statuses', label: 'حالات الطلب', icon: Settings },
  { path: '/app/workspace', label: 'الوورك سبيس', icon: Users },
  { path: '/app/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 h-full w-72 bg-white shadow-soft-lg z-50
          transform transition-smooth
          lg:translate-x-0 lg:static lg:z-0 lg:shadow-none
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-8 py-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">codmeta</h1>
              <p className="text-xs text-zinc-500 mt-0.5">سي او دي ميتا</p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-zinc-400 hover:text-zinc-900 transition-smooth focus-ring rounded-lg p-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-2 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth focus-ring text-sm
                        ${isActive
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-zinc-700 hover:bg-zinc-50'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="px-8 py-6">
            <p className="text-xs text-zinc-400 text-center">
              الإصدار 1.0.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
