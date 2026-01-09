import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useBusiness } from '@/contexts/BusinessContext';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { BillingService } from '@/services/billing.service';
import type { Billing } from '@/types/billing';
import { AlertTriangle, CreditCard } from 'lucide-react';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentBusiness, isLoading: businessLoading } = useBusiness();
  const { isSuperAdmin } = useSuperAdmin();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isBillingPage = location.pathname === '/app/billing';

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentBusiness || businessLoading) {
        setIsCheckingAccess(false);
        return;
      }

      try {
        const billingData = await BillingService.getBilling(currentBusiness.id);
        setBilling(billingData);
      } catch (error) {
        console.error('Error fetching billing:', error);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [currentBusiness, businessLoading]);

  const manualPaymentStatus = (currentBusiness as any)?.manual_payment_status;
  const shouldBlockAccess = billing && BillingService.shouldBlockAccess(billing, manualPaymentStatus);
  const isTrialExpired = billing && BillingService.isTrialExpired(billing);
  const showBlocker = shouldBlockAccess && !isBillingPage && !isCheckingAccess && !businessLoading && !isSuperAdmin;

  if (showBlocker) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="inline-flex p-4 bg-red-100 rounded-full mb-6">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">
            انتهت فترة التجربة المجانية
          </h1>
          <p className="text-zinc-600 mb-8">
            للاستمرار في استخدام النظام، يرجى الاشتراك في إحدى الخطط المتاحة.
            يمكنك الاطلاع على بياناتك الحالية لكن لا يمكنك إضافة طلبات جديدة.
          </p>
          <button
            onClick={() => navigate('/app/billing')}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="h-5 w-5" />
            عرض الخطط والاشتراك
          </button>
          <p className="text-sm text-zinc-400 mt-4">
            ادفع مرة واحدة واحصل على وصول مدى الحياة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
