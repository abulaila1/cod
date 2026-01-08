import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/contexts/AuthContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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

              <Route path="/onboarding" element={<Onboarding />} />

              <Route path="/invite/:token" element={<InviteAcceptance />} />

            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/carriers"
              element={
                <ProtectedRoute>
                  <Carriers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/countries"
              element={
                <ProtectedRoute>
                  <Countries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/employees"
              element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workspace"
              element={
                <ProtectedRoute>
                  <Workspace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/statuses"
              element={
                <ProtectedRoute>
                  <Statuses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings/products"
              element={
                <ProtectedRoute>
                  <ProductsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings/countries"
              element={
                <ProtectedRoute>
                  <CountriesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings/carriers"
              element={
                <ProtectedRoute>
                  <CarriersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings/employees"
              element={
                <ProtectedRoute>
                  <EmployeesManagement />
                </ProtectedRoute>
              }
            />

            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </ToastProvider>
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
