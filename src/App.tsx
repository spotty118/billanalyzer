
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppSidebar } from './components/AppSidebar';
import { ErrorBoundary } from './components/ui/error-boundary';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { MainContent } from './components/layouts/MainContent';
import { PageHeader } from './components/layouts/PageHeader';
import { ContentArea } from './components/layouts/ContentArea';

// Regular imports for main components
import { QuoteCalculator } from './components/QuoteCalculator';
import { VerizonBillAnalyzer } from './components/VerizonBillAnalyzer';
import { CommissionCalculator } from './components/CommissionCalculator';
import { PromotionsOverview } from './components/PromotionsOverview';

// Lazy load admin components
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const LoadingFallback = () => (
  <div className="p-4">
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-8 bg-muted rounded"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </div>
  </div>
);

function Dashboard() {
  return (
    <>
      <PageHeader 
        title="Dashboard" 
        description="Welcome to your dashboard. Access all your tools and calculators here."
      />
      <ContentArea>
        <VerizonBillAnalyzer />
      </ContentArea>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router basename="/">
        <DashboardLayout>
          <AppSidebar />
          <MainContent>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route 
                  path="/quotes" 
                  element={
                    <>
                      <PageHeader 
                        title="Quote Calculator" 
                        description="Calculate quotes for different plan combinations"
                      />
                      <ContentArea>
                        <QuoteCalculator />
                      </ContentArea>
                    </>
                  }
                />
                <Route 
                  path="/commissions" 
                  element={
                    <>
                      <PageHeader 
                        title="Commission Calculator" 
                        description="Calculate your commission earnings"
                      />
                      <ContentArea>
                        <CommissionCalculator />
                      </ContentArea>
                    </>
                  }
                />
                <Route 
                  path="/promotions" 
                  element={
                    <>
                      <PageHeader 
                        title="Promotions" 
                        description="View and manage current promotions"
                      />
                      <ContentArea>
                        <PromotionsOverview />
                      </ContentArea>
                    </>
                  }
                />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </MainContent>
        </DashboardLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
