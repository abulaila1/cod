import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/contexts/AuthContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { SuperAdminProvider } from '@/contexts/SuperAdminContext';
import { EmployeeProvider } from '@/contexts/EmployeeContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { OnboardingRoute } from '@/components/auth/OnboardingRoute';
import { EmployeeProtectedRoute } from '@/components/auth/EmployeeProtectedRoute';
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
import { CarrierDetails } from '@/pages/app/CarrierDetails';
import { Countries } from '@/pages/app/Countries';
import { Employees } from '@/pages/app/Employees';
import { EmployeeDetails } from '@/pages/app/EmployeeDetails';
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
import SuperDashboard from '@/pages/admin/SuperDashboard';
import { AccountSuspended } from '@/pages/app/AccountSuspended';

import { EmployeeLogin } from '@/pages/employee/EmployeeLogin';
import { EmployeeDashboard } from '@/pages/employee/EmployeeDashboard';
import { EmployeeOrders } from '@/pages/employee/EmployeeOrders';
import { EmployeeProducts } from '@/pages/employee/EmployeeProducts';
import { EmployeeReports } from '@/pages/employee/EmployeeReports';
import { EmployeeStatuses } from '@/pages/employee/EmployeeStatuses';
import { EmployeeCarriers } from '@/pages/employee/EmployeeCarriers';
import { EmployeeCountries } from '@/pages/employee/EmployeeCountries';

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
          <SuperAdminProvider>
            <BusinessProvider>
              <EmployeeProvider>
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
                  <Route path="carriers/:id" element={<CarrierDetails />} />
                  <Route path="countries" element={<Countries />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="employees/:id" element={<EmployeeDetails />} />
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

                <Route
                  path="/admin/super"
                  element={
                    <ProtectedRoute>
                      <SuperDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="/employee/login" element={<EmployeeLogin />} />
                <Route
                  path="/employee/dashboard"
                  element={
                    <EmployeeProtectedRoute>
                      <EmployeeDashboard />
                    </EmployeeProtectedRoute>
                  }
                />
                <Route
                  path="/employee/orders"
                  element={
                    <EmployeeProtectedRoute>
                      <EmployeeOrders />
                    </EmployeeProtectedRoute>
                  }
                />
                <Route
                  path="/employee/products"
                  element={
                    <EmployeeProtectedRoute>
                      <EmployeeProducts />
                    </EmployeeProtectedRoute>
                  }
                />
                <Route
                  path="/employee/reports"
                  element={
                    <EmployeeProtectedRoute>
                      <EmployeeReports />
                    </EmployeeProtectedRoute>
                  }
                />
                <Route
                  path="/employee/statuses"
                  element={
                    <EmployeeProtectedRoute>
                      <EmployeeStatuses />
                    </EmployeeProtectedRoute>
                  }
                />
                <Route
                  path="/employee/carriers"
                  element={
                    <EmployeeProtectedRoute>
                      <EmployeeCarriers />
                    </EmployeeProtectedRoute>
                  }
                />
                <Route
                  path="/employee/countries"
                  element={
                    <EmployeeProtectedRoute>
                      <EmployeeCountries />
                    </EmployeeProtectedRoute>
                  }
                />

                <Route path="/suspended" element={<AccountSuspended />} />

                <Route path="*" element={<NotFound />} />
                  </Routes>
                </ToastProvider>
              </EmployeeProvider>
            </BusinessProvider>
          </SuperAdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
