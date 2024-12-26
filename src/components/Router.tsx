import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientsPage } from '@/pages/clients/ClientsPage';
import { LoansPage } from '@/pages/loans/LoansPage';
import { ConfigurationPage } from '@/pages/configuration/ConfigurationPage';
import { CreateLoanPage } from '@/pages/loans/CreateLoanPage';
import { CreatePaymentPage } from '@/pages/payments/CreatePaymentPage';
import { PaymentsListPage } from '@/pages/payments/PaymentsListPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="configuration" element={<ConfigurationPage />} />
          <Route path='loans/create' element={<CreateLoanPage/>}/>
          <Route path="/payments/create" element={<CreatePaymentPage />} />
          <Route path="/payments" element={<PaymentsListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}