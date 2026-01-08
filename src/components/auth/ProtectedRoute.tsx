import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading, isNoWorkspace } = useAuth();
  const { currentBusiness, isLoading: businessLoading } = useBusiness();

  if (authLoading || businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isNoWorkspace) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!currentBusiness) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
