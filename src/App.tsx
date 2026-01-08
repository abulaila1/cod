import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/contexts/AuthContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { OnboardingRoute } from '@/components/auth/OnboardingRoute';
import { GlobalErrorBoundary } from '@/components/common/GlobalError';

import { AppLayout } from '@/components/layout/AppLayout';
import { Home } from '@/pages/public/Home';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { CheckEmail } from '@/pages/auth/CheckEmail';
import { AuthCallback } from '@/pages/auth/AuthCallback';
import { Onboarding } from '@/pages/auth/Onboarding';

import { Dashboard } from '@/pages/app/Dashboard';
import { Orders } from '@/pages/app/Orders';
import { Products } from '@/pages/app/Products';
import { Carriers } from '@/pages/app/Carriers';
import { Countries } from '@/pages/app/Countries';
import { Employees } from '@/pages/app/Employees';
import { Reports } from '@/pages/app/Reports';
import { Settings } from '@/pages/app/Settings';
import { Workspace } from '@/pages/app/Workspace';
import { Statuses } from '@/pages/app/Statuses';

import { ProductsManagement } from '@/pages/app/settings/ProductsManagement';
import { CountriesManagement } from '@/pages/app/settings/CountriesManagement';
import { CarriersManagement } from '@/pages/app/settings/CarriersManagement';
import { EmployeesManagement } from '@/pages/app/settings/EmployeesManagement';
import { Billing } from '@/pages/app/Billing';

import { InviteAcceptance } from '@/pages/public/InviteAcceptance';
import { NotFound } from '@/pages/NotFound';

import { ConfigurationError } from '@/components/common/ConfigurationError';
import { isSupabaseConfigured } from '@/services/supabase';

function App() {
  if (!isSupabaseConfigured) {
    return <ConfigurationError />;
  }

  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <ToastProvider>
              <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/auth/check-email" element={<CheckEmail />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                <Route path="/invite/:token" element={<InviteAcceptance />} />

                <Route
                  path="/onboarding"
                  element={
                    <OnboardingRoute>
                      <Onboarding />
                    </OnboardingRoute>
                  }
                />

                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="products" element={<Products />} />
                  <Route path="carriers" element={<Carriers />} />
                  <Route path="countries" element={<Countries />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="workspace" element={<Workspace />} />
                  <Route path="statuses" element={<Statuses />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="settings/products" element={<ProductsManagement />} />
                  <Route path="settings/countries" element={<CountriesManagement />} />
                  <Route path="settings/carriers" element={<CarriersManagement />} />
                  <Route path="settings/employees" element={<EmployeesManagement />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ToastProvider>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
