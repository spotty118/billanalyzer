import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Lazy load components
const Index = React.lazy(() => import("./pages/Index"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const PlanQuotes = React.lazy(() => import("./pages/PlanQuotes"));
const Commissions = React.lazy(() => import("./pages/Commissions"));
const Promotions = React.lazy(() => import("./pages/Promotions"));

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
  </div>
);

const App = () => {
  return (
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <TooltipProvider>
              <SidebarProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <Index />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/quotes"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <PlanQuotes />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/commissions"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <Commissions />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/promotions"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <Promotions />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/admin-login"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <AdminLogin />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/admin-dashboard"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <AdminDashboard />
                      </Suspense>
                    }
                  />
                </Routes>
              </SidebarProvider>
            </TooltipProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

export default App;
