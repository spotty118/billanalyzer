
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/error-boundary';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { MainContent } from './components/layouts/MainContent';
import { PageHeader } from './components/layouts/PageHeader';
import { ContentArea } from './components/layouts/ContentArea';
import { SidebarProvider } from './contexts/SidebarContext';

// Regular imports for main components
import VerizonBillAnalyzer from './components/bill-analyzer/VerizonBillAnalyzer';

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

function App() {
  return (
    <ErrorBoundary>
      <Router basename="/">
        <SidebarProvider>
          <DashboardLayout>
            <MainContent>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      <>
                        <PageHeader 
                          title="Verizon Bill Analyzer" 
                          description="Upload your Verizon bill to find potential savings"
                        />
                        <ContentArea>
                          <VerizonBillAnalyzer />
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
        </SidebarProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
