import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { CommissionCalculator } from "@/components/CommissionCalculator";
import { PromotionsOverview } from "@/components/PromotionsOverview";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <h1 className="text-3xl font-bold mb-6">Welcome, Employee</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuoteCalculator />
            <CommissionCalculator />
            <PromotionsOverview />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;