import { Menu, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BusinessSwitcher } from '@/components/business/BusinessSwitcher';

interface TopbarProps {
  pageTitle: string;
  onMenuClick: () => void;
}

export function Topbar({ pageTitle, onMenuClick }: TopbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-zinc-600 hover:text-zinc-900 transition-smooth focus-ring rounded-lg p-2"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h2 className="text-xl lg:text-2xl font-bold text-zinc-950 tracking-tight">
            {pageTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <BusinessSwitcher />

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-smooth focus-ring"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700">
                <User className="h-5 w-5" />
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-zinc-900">{user?.name || 'المستخدم'}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-soft-lg py-2 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-smooth rounded-lg mx-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
