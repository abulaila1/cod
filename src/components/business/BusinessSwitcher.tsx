import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Check, Plus, Settings } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';

export function BusinessSwitcher() {
  const { currentBusiness, businesses, switchBusiness } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentBusiness) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-smooth focus-ring"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
          {currentBusiness.name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-zinc-900">{currentBusiness.name}</p>
          <p className="text-xs text-zinc-500">وورك سبيس</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-smooth ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-soft-lg border border-zinc-200 py-2 z-50">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-zinc-500 mb-2">الوورك سبيسات</p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => {
                    switchBusiness(business.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-smooth ${
                    business.id === currentBusiness.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 font-bold text-sm shrink-0">
                    {business.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-right truncate font-medium">
                    {business.name}
                  </span>
                  {business.id === currentBusiness.id && (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-200 mt-2 pt-2 px-2">
              <Link
                to="/app/workspace"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-smooth rounded-lg"
              >
                <Settings className="h-4 w-4" />
                <span>إدارة الوورك سبيس</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
