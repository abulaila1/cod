import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

interface ProtectedRouteProps {
  children: ReactNode;
  skipSuspendedCheck?: boolean;
}

export function ProtectedRoute({ children, skipSuspendedCheck = false }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, needsOnboarding } = useAuth();
  const { currentBusiness, isLoading: businessLoading, isSuspended } = useBusiness();
  const { isSuperAdmin } = useSuperAdmin();

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isAdminRoute && isSuperAdmin) {
    return <>{children}</>;
  }

  if (businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding || !currentBusiness) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isSuspended && !skipSuspendedCheck && !isSuperAdmin) {
    return <Navigate to="/suspended" replace />;
  }

  return <>{children}</>;
}
